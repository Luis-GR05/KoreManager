import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { JWT } from "npm:google-auth-library@9.0.0";
import { encode as codificarBase64, decode as decodificarBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const cabecerasCors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (peticion) => {
  // 1. Bypass del Preflight (CORS) - Permitimos que el navegador verifique la conexión
  if (peticion.method === 'OPTIONS') return new Response('ok', { headers: cabecerasCors });

  let idTareaGlobal = null;
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

  try {
    // 2. Control de Seguridad Estricto (Sustituye al portero automático de Supabase)
    const cabeceraAuth = peticion.headers.get('Authorization');
    if (!cabeceraAuth) throw new Error('Acceso denegado: Faltan credenciales de autorización.');

    const supabaseUsuario = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: cabeceraAuth } }
    });

    const { data: { user }, error: errorAuth } = await supabaseUsuario.auth.getUser();
    if (errorAuth || !user) throw new Error('Acceso denegado: Token JWT manipulado o caducado.');

    // 3. Ejecución de lógica de negocio
    const { id_tarea } = await peticion.json();
    if (!id_tarea) throw new Error('Carga útil inválida: Falta id_tarea');
    idTareaGlobal = id_tarea;

    await supabaseAdmin.from('tareas_ia').update({ estado: 'procesando' }).eq('id', id_tarea);

    const { data: datosTarea, error: errorTarea } = await supabaseAdmin
      .from('tareas_ia').select('*').eq('id', id_tarea).single();

    if (errorTarea || !datosTarea) throw new Error('Tarea fantasma o no encontrada');

    // Validar que el usuario que hace la petición es el dueño de la tarea
    if (datosTarea.id_usuario !== user.id) throw new Error('Brecha de seguridad: Intento de manipular la tarea de otro usuario');

    const { data: datosImagenBase, error: errorDescarga } = await supabaseAdmin
      .storage.from('avatars').download(datosTarea.ruta_imagen_base);

    if (errorDescarga || !datosImagenBase) throw new Error('Fallo crítico al descargar imagen de origen');

    const bufferImagen = await datosImagenBase.arrayBuffer();
    const imagenBase64 = codificarBase64(bufferImagen);

    const credenciales = JSON.parse(Deno.env.get('GCP_SERVICE_ACCOUNT_KEY') ?? '{}');
    const clienteJwt = new JWT({
      email: credenciales.client_email,
      key: credenciales.private_key,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const tokenAcceso = await clienteJwt.getAccessToken();
    const gcpProject = credenciales.project_id;
    const endpointVertex = `https://us-central1-aiplatform.googleapis.com/v1/projects/${gcpProject}/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict`;

    const respuestaVertex = await fetch(endpointVertex, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenAcceso.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instances: [{
          prompt: `${datosTarea.prompt_estilo} usando la imagen [1]`,
          referenceImages: [{
            referenceType: "REFERENCE_TYPE_SUBJECT",
            referenceId: 1,
            referenceImage: { bytesBase64Encoded: imagenBase64 }
          }]
        }],
        parameters: { sampleCount: 1, outputOptions: { mimeType: "image/png" } }
      })
    });

    if (!respuestaVertex.ok) throw new Error(await respuestaVertex.text());

    const datosVertex = await respuestaVertex.json();
    const avatarGeneradoBase64 = datosVertex.predictions?.[0]?.bytesBase64Encoded;
    if (!avatarGeneradoBase64) throw new Error('Respuesta vacía de Vertex AI (Posible bloqueo por Safety Filters)');

    const bytesAvatar = decodificarBase64(avatarGeneradoBase64);
    const nuevaRutaAvatar = `${datosTarea.id_usuario}/avatar_ia_${Date.now()}.png`;

    await supabaseAdmin.storage.from('avatars').upload(nuevaRutaAvatar, bytesAvatar.buffer, { contentType: 'image/png', upsert: true });

    await supabaseAdmin.from('tareas_ia').update({ estado: 'completado', ruta_resultado: nuevaRutaAvatar }).eq('id', id_tarea);

    return new Response(JSON.stringify({ exito: true }), { headers: { ...cabecerasCors, 'Content-Type': 'application/json' } });

  } catch (excepcion) {
    if (idTareaGlobal) {
      await supabaseAdmin.from('tareas_ia').update({
        estado: 'error',
        mensaje_error: excepcion instanceof Error ? excepcion.message : 'Fallo en cascada desconocido'
      }).eq('id', idTareaGlobal);
    }
    return new Response(JSON.stringify({ error: excepcion instanceof Error ? excepcion.message : 'Operación abortada', stack: excepcion instanceof Error ? excepcion.stack : '' }), { headers: cabecerasCors, status: 500 });
  }
});