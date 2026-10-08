/**
 * Base de conocimiento del asistente Kore (lado servidor).
 * Mantener en sincronía con src/components/chat/faq.js (respuestas rápidas).
 */
export const KNOWLEDGE = `
INSTALACIONES
- Pádel: 6 pistas (20 × 10 m), cubiertas y descubiertas, iluminación LED, cerramiento de cristal y malla.
- Fútbol sala: 3 campos (40 × 20 m) de resina con marcaje oficial.
- Tenis: 4 pistas (23,77 × 10,97 m) de tierra batida y pista dura.
- El estado de cada pista (disponible, mantenimiento, ocupada) se ve en el panel (/dashboard). Las pistas en mantenimiento no se pueden reservar.

HORARIOS Y PRECIO
- Franjas de 1 hora: mañanas de 09:00 a 14:00 (inicio de 09:00 a 13:00) y tardes de 16:00 a 22:00 (inicio de 16:00 a 21:00).
- Precio: 5 € por franja de 1 hora. Se pueden reservar varias franjas seguidas en la misma pista y día; se pagan juntas.

CÓMO RESERVAR
1. Iniciar sesión y entrar en Reservar (/reservar).
2. Elegir pista, fecha (calendario) y una o varias franjas libres.
3. Opcional: solicitar material deportivo (raquetas, balones...) según stock; lo prepara el conserje.
4. Confirmar y pagar con tarjeta (Stripe). La confirmación es inmediata.
- Solo se puede tener una reserva pendiente de pago a la vez: hay que pagarla antes de hacer otra.
- Las reservas pendientes sin pagar caducan a las 3 horas (o a los 15 minutos si la reserva empieza en menos de 3 horas) y la franja se libera.
- No se puede reservar en fechas u horas pasadas. Para el mismo día, solo se ofrecen franjas que empiezan dentro de más de 3 horas.
- La disponibilidad se consulta en tiempo real en /reservar (las franjas ocupadas aparecen marcadas).

PAGOS
- Pago seguro con tarjeta a través de Stripe; KoreManager no guarda datos de tarjeta.
- Si el pago se cancela, la reserva queda pendiente y se puede pagar desde el Historial (/historial) antes de que caduque.

CANCELACIONES
- Se cancela desde el panel (/dashboard) o desde el Historial (/historial).
- Las condiciones de reembolso dependen de la instalación; si hay dudas sobre un cobro, contactar con la instalación.

CUENTA Y PERFIL
- Registro gratuito en /register con nombre, correo, teléfono, DNI/NIE, fecha de nacimiento (mínimo 14 años) y dirección. Hay que confirmar el correo.
- Recuperar contraseña: /forgot-password (llega un enlace por correo).
- Cambiar datos o foto de perfil: /profile. Cambiar contraseña: menú de ajustes (icono de engranaje).
- Idioma (español/inglés) y tema claro/oscuro: menú de ajustes.

NIVELES Y ESTADÍSTICAS
- Niveles según partidos jugados: Nuevo (0), Novato (1), En Forma (5), Habitual (10), Veterano (25), Leyenda (50).
- Meta mensual orientativa: 5 partidos. Estadísticas completas en /estadisticas.

ROLES
- Ciudadano: reserva y gestiona sus reservas.
- Conserje: además gestiona el inventario de material.
- Administrador: gestiona usuarios, instalaciones y avisos.

PRIVACIDAD
- Datos tratados conforme al RGPD; detalles en /legal/privacidad. Términos en /legal/terminos.
`.trim();
