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
    // 2. Leer el body PRIMERO para poder marcar la tarea como error en el catch si algo falla
    const cuerpo = await peticion.json();
    const { id_tarea } = cuerpo;
    if (!id_tarea) throw new Error('Carga útil inválida: Falta id_tarea');
    idTareaGlobal = id_tarea;
    console.log('[Auth] Iniciando verificación JWT para tarea:', id_tarea);

    // 3. Control de Seguridad Estricto
    // IMPORTANTE: En Deno Edge Functions, getUser() SIN token busca sesión local (no existe).
    // Se debe extraer el token raw y pasarlo directamente como parámetro.
    const cabeceraAuth = peticion.headers.get('Authorization');
    console.log('[Auth] Header Authorization presente:', !!cabeceraAuth, '| Longitud:', cabeceraAuth?.length ?? 0);
    if (!cabeceraAuth) throw new Error('Acceso denegado: Faltan credenciales de autorización.');

    const tokenRaw = cabeceraAuth.replace('Bearer ', '').trim();
    const supabaseUsuario = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '');

    const { data: { user }, error: errorAuth } = await supabaseUsuario.auth.getUser(tokenRaw);
    console.log('[Auth] Resultado getUser — user_id:', user?.id ?? 'null', '| error:', errorAuth?.message ?? 'ninguno');
    if (errorAuth || !user) throw new Error(`Acceso denegado: Token JWT inválido o caducado. Detalle: ${errorAuth?.message ?? 'user null'}`);

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
    const endpointVertex = `https://us-central1-aiplatform.googleapis.com/v1/projects/${gcpProject}/locations/us-central1/publishers/google/models/imagen-3.0-capability-001:predict`;

    // REFERENCE_TYPE_SUBJECT + SUBJECT_TYPE_PERSON: preserva las facciones del usuario
    // y aplica el prompt de estilo (Pixar, Cyberpunk, etc.) sobre su cara real.
    // REFERENCE_TYPE_STYLE sólo extrae la calidad fotográfica de la imagen (iluminación,
    // resolución, encuadre) y NO mantiene la identidad visual de la persona.
    const cuerpoVertex = {
      instances: [{
        prompt: `${datosTarea.prompt_estilo}, portrait of person [1]`,
        referenceImages: [{
          referenceType: "REFERENCE_TYPE_SUBJECT",
          referenceId: 1,
          referenceImage: { bytesBase64Encoded: imagenBase64 },
          subjectImageConfig: { subjectType: "SUBJECT_TYPE_PERSON" }
        }]
      }],
      parameters: { sampleCount: 1 }
    };

    console.log('[Vertex AI] Enviando petición al endpoint:', endpointVertex);
    console.log('[Vertex AI] Cuerpo (sin base64):', JSON.stringify({ ...cuerpoVertex, instances: [{ ...cuerpoVertex.instances[0], referenceImages: [{ ...cuerpoVertex.instances[0].referenceImages[0], referenceImage: { bytesBase64Encoded: '[OMITIDO]' } }] }] }));

    const respuestaVertex = await fetch(endpointVertex, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenAcceso.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cuerpoVertex)
    });

    if (!respuestaVertex.ok) {
      const errorTexto = await respuestaVertex.text();
      console.error(`[Vertex AI] HTTP ${respuestaVertex.status}:`, errorTexto);
      throw new Error(`Vertex AI ${respuestaVertex.status}: ${errorTexto}`);
    }

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