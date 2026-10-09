/**
 * Base de conocimiento del asistente Kore (lado servidor).
 * Mantener en sincronía con src/components/chat/faq.js (respuestas rápidas).
 */
export const KNOWLEDGE = `
INSTALACIONES Y CONTACTO
- Complejo Deportivo Municipal de Montijo: Avenida del Progreso s/n, Montijo (Badajoz). Teléfono: 924 45 52 30.
- Piscina Municipal: horario de apertura de 12:00 a 21:00.
- Los deportes y las pistas los gestiona el administrador y pueden cambiar: usa SIEMPRE la lista de INSTALACIONES ACTUALES del contexto, nunca cifras de memoria.
- El estado de cada pista (disponible, mantenimiento, ocupada) se ve en el panel (/dashboard). Las pistas en mantenimiento no se pueden reservar.

HORARIOS Y PRECIO
- Polideportivo Municipal: apertura general de 10:00 a 23:00 (miércoles cierre a las 22:00; domingos cerrado).
- Cuadrante oficial de alquiler de pistas:
  * Lunes y viernes: 18:00 a 20:00 h
  * Martes y jueves: 20:00 h
  * Miércoles: 18:00 a 21:00 h
  * Sábados: 10:00 a 13:00 h y 18:00 a 21:00 h
  * Domingos: cerrado
- Precio de las pistas: 12 € por franja de 1 hora (tarifa oficial municipal del Polideportivo). Se pueden reservar varias franjas seguidas en la misma pista y día; se pagan juntas.

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
