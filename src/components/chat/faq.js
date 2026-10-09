/**
 * Preguntas frecuentes del asistente Kore.
 * Se responden en el navegador, sin gastar peticiones a la API.
 * Mantener en sincronía con supabase/functions/kore-assistant/knowledge.ts
 */
export const FAQ = [
  {
    id: 'book',
    q: { es: '¿Cómo reservo una pista?', en: 'How do I book a court?' },
    a: {
      es: 'Es muy rápido:\n- Entra en [Reservar](/reservar).\n- Elige pista, fecha y una o varias franjas libres.\n- Si quieres, pide material (raquetas, balones…).\n- Confirma y paga con tarjeta. La confirmación es inmediata.',
      en: "It's quick:\n- Go to [Book](/reservar).\n- Pick a court, a date and one or more free slots.\n- Optionally request equipment (rackets, balls…).\n- Confirm and pay by card. Confirmation is instant.",
    },
    keywords: ['reserv', 'reservo', 'reservar', 'apunt', 'book', 'booking', 'alquil', 'coger pista', 'pillar'],
  },
  {
    id: 'price',
    weight: 1.5,
    q: { es: '¿Cuánto cuesta?', en: 'How much does it cost?' },
    a: {
      es: 'Cada franja de **1 hora cuesta 5 €**. Puedes reservar varias franjas seguidas en la misma pista y se pagan juntas.',
      en: 'Each **1-hour slot costs €5**. You can book several consecutive slots on the same court and pay for them together.',
    },
    keywords: ['precio', 'cuesta', 'cuanto', 'tarifa', 'euros', 'coste', 'vale', 'price', 'cost', 'how much', 'fee'],
  },
  {
    id: 'hours',
    weight: 1.5,
    q: { es: '¿Qué horarios hay?', en: 'What are the opening hours?' },
    a: {
      es: 'Hay franjas de 1 hora:\n- **Mañanas:** de 09:00 a 14:00.\n- **Tardes:** de 16:00 a 22:00.\nEn [Reservar](/reservar) verás en tiempo real cuáles están libres.',
      en: 'There are 1-hour slots:\n- **Mornings:** 09:00 to 14:00.\n- **Afternoons:** 16:00 to 22:00.\nYou can see which ones are free in real time on [Book](/reservar).',
    },
    keywords: ['horario', 'hora', 'abre', 'cierra', 'abierto', 'franja', 'mañana', 'tarde', 'hours', 'open', 'close', 'schedule', 'time slot'],
  },
  {
    id: 'pay',
    weight: 1.5,
    q: { es: '¿Cómo funciona el pago?', en: 'How does payment work?' },
    a: {
      es: 'Pagas con tarjeta a través de **Stripe**, de forma segura (no guardamos datos de tu tarjeta).\nSi no completas el pago, la reserva queda **pendiente** y puedes pagarla desde el [Historial](/historial). Las pendientes caducan a las 3 horas (o a los 15 minutos si la reserva empieza antes).',
      en: "You pay by card through **Stripe**, securely (we don't store your card details).\nIf you don't finish paying, the booking stays **pending** and you can pay it from your [History](/historial). Pending bookings expire after 3 hours (or 15 minutes if the booking starts sooner).",
    },
    keywords: ['pago', 'pagar', 'tarjeta', 'stripe', 'cobro', 'pendiente', 'factura', 'pay', 'payment', 'card', 'pending', 'charge'],
  },
  {
    id: 'cancel',
    weight: 1.5,
    q: { es: '¿Puedo cancelar una reserva?', en: 'Can I cancel a booking?' },
    a: {
      es: 'Sí. Puedes cancelarla desde tu [panel](/dashboard) o desde el [Historial](/historial) con el botón de la papelera. Si tienes dudas sobre un cobro, contacta con la instalación.',
      en: 'Yes. Cancel it from your [dashboard](/dashboard) or your [History](/historial) using the bin button. If you have questions about a charge, contact the facility.',
    },
    keywords: ['cancel', 'anular', 'borrar reserva', 'devol', 'reembols', 'refund', 'delete booking'],
  },
  {
    id: 'facilities',
    q: { es: '¿Qué instalaciones hay?', en: 'Which facilities are there?' },
    a: {
      es: 'Las pistas y deportes disponibles los gestiona el ayuntamiento y pueden cambiar. Puedes verlos todos, con su estado (disponible o en mantenimiento), en tu [panel](/dashboard) y al [Reservar](/reservar). Si quieres, pregúntame y te digo qué hay ahora mismo.',
      en: 'Courts and sports are managed by the council and may change. You can see them all, with their status (available or under maintenance), on your [dashboard](/dashboard) and when you [Book](/reservar). Ask me and I\'ll tell you what\'s available right now.',
    },
    keywords: ['instalacion', 'pista', 'padel', 'tenis', 'futbol', 'sala', 'campo', 'deporte', 'facilit', 'court', 'tennis', 'futsal', 'sport', 'pitch'],
  },
  {
    id: 'equipment',
    q: { es: '¿Puedo pedir material?', en: 'Can I request equipment?' },
    a: {
      es: 'Sí. Al reservar, en [Reservar](/reservar) puedes solicitar material deportivo según el stock disponible. El conserje lo deja preparado en la pista.',
      en: 'Yes. When booking on [Book](/reservar) you can request sports equipment depending on stock. The caretaker will have it ready at the court.',
    },
    keywords: ['material', 'raqueta', 'pala', 'balon', 'pelota', 'equip', 'racket', 'ball'],
  },
  {
    id: 'account',
    q: { es: '¿Cómo me registro?', en: 'How do I sign up?' },
    a: {
      es: 'Crea tu cuenta gratis en [Registro](/register). Te pediremos nombre, correo, teléfono, DNI/NIE, fecha de nacimiento (mínimo 14 años) y dirección. Después confirma el correo que te enviamos.',
      en: "Create your free account at [Sign up](/register). We'll ask for your name, email, phone, DNI/NIE, date of birth (minimum age 14) and address. Then confirm the email we send you.",
    },
    keywords: ['registr', 'cuenta', 'alta', 'darme de alta', 'sign up', 'signup', 'register', 'account', 'create account'],
  },
  {
    id: 'password',
    weight: 1.5,
    q: { es: 'He olvidado mi contraseña', en: 'I forgot my password' },
    a: {
      es: 'Ve a [Recuperar contraseña](/forgot-password), escribe tu correo y te llegará un enlace para crear una nueva. Si no lo ves, mira en la carpeta de spam.',
      en: "Go to [Recover password](/forgot-password), enter your email and you'll get a link to set a new one. If you can't see it, check your spam folder.",
    },
    keywords: ['contrasena', 'clave', 'olvid', 'password', 'forgot', 'reset', 'acceder', 'entrar', 'login'],
  },
  {
    id: 'profile',
    q: { es: '¿Cómo cambio mis datos?', en: 'How do I change my details?' },
    a: {
      es: 'En tu [Perfil](/profile) puedes actualizar tus datos y tu foto. La contraseña, el idioma y el tema claro/oscuro se cambian desde el menú de ajustes (icono de engranaje).',
      en: 'On your [Profile](/profile) you can update your details and photo. Password, language and light/dark theme are in the settings menu (gear icon).',
    },
    keywords: ['perfil', 'datos', 'foto', 'avatar', 'telefono', 'direccion', 'idioma', 'tema', 'profile', 'details', 'photo', 'language', 'theme'],
  },
  {
    id: 'levels',
    q: { es: '¿Cómo funcionan los niveles?', en: 'How do levels work?' },
    a: {
      es: 'Subes de nivel según los partidos jugados: Novato (1), En Forma (5), Habitual (10), Veterano (25) y Leyenda (50). Míralo en tus [Estadísticas](/estadisticas).',
      en: 'You level up with games played: Rookie (1), Fit (5), Regular (10), Veteran (25) and Legend (50). Check your [Stats](/estadisticas).',
    },
    keywords: ['nivel', 'logro', 'leyenda', 'veterano', 'estadistic', 'puntos', 'level', 'achievement', 'stats', 'legend'],
  },
  {
    id: 'privacy',
    q: { es: '¿Qué hacéis con mis datos?', en: 'What do you do with my data?' },
    a: {
      es: 'Tus datos solo se usan para gestionar tu cuenta y tus reservas, conforme al RGPD. Tienes todos los detalles en la [Política de privacidad](/legal/privacidad).',
      en: 'Your data is only used to manage your account and bookings, in line with the GDPR. Full details are in the [Privacy policy](/legal/privacidad).',
    },
    keywords: ['datos personales', 'privacidad', 'rgpd', 'gdpr', 'privacy', 'data'],
  },
];

/** Preguntas que se muestran como respuestas rápidas al abrir el chat. */
export const QUICK_IDS = ['book', 'price', 'hours', 'cancel', 'pay', 'facilities'];

const normalize = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Preguntas sobre los datos propios: mejor que las responda la IA con contexto
const PERSONAL = /\b((mi|mis) (proxim\w*|reserva\w*|pago\w*|partido\w*|nivel|cuenta|perfil|estadistic\w*|historial)|tengo (alguna?|reserva\w*|pago\w*|pendiente\w*)|cuando (juego|me toca)|my (next|booking\w*|payment\w*|level|account|stats|history)|do i have|when do i play|am i)\b/;

/**
 * Busca la FAQ que mejor responde a un texto libre.
 * @param {string} text
 * @returns {{ item: typeof FAQ[number], score: number, personal: boolean } | null}
 */
export function matchFaq(text) {
  const n = ` ${normalize(text)} `;
  const words = n.trim().split(' ').filter(Boolean);
  const personal = PERSONAL.test(n);
  let best = null;
  for (const item of FAQ) {
    let score = 0;
    for (const k of item.keywords) {
      if (n.includes(normalize(k))) score += (k.includes(' ') ? 2 : 1) * (item.weight ?? 1);
    }
    if (score > 0 && (!best || score > best.score)) best = { item, score, personal };
  }
  if (!best) return null;
  // Confianza: varias coincidencias, o una sola en una pregunta corta
  const confident = best.score >= 1.8 || words.length <= 5;
  return confident ? best : { ...best, score: 0 };
}
