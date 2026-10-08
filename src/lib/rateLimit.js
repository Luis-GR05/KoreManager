/**
 * Limitador de intentos en el navegador (login, registro, recuperación).
 *
 * Es una primera barrera de UX: frena los reintentos automáticos y avisa al
 * usuario con una cuenta atrás. La protección real está en el servidor
 * (límites de Supabase Auth + tabla rate_limits), porque el almacenamiento
 * local se puede borrar.
 */

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* modo privado */ }
};

/**
 * @param {string} name
 * @param {{ max: number, windowMs: number, lockMs: number, maxLockMs?: number }} opts
 *   max: fallos permitidos dentro de la ventana; tras superarlos se bloquea
 *   lockMs, y cada bloqueo sucesivo dobla la espera (hasta maxLockMs).
 */
export function createLimiter(name, { max, windowMs, lockMs, maxLockMs = 15 * 60 * 1000 }) {
  const key = `kore_rl_${name}`;

  const state = () => {
    const s = read(key) ?? { hits: [], lockedUntil: 0, locks: 0 };
    const now = Date.now();
    s.hits = (s.hits ?? []).filter((t) => now - t < windowMs);
    return s;
  };

  return {
    /** Milisegundos que faltan para poder reintentar (0 = permitido). */
    retryIn() {
      const s = state();
      return Math.max(0, (s.lockedUntil ?? 0) - Date.now());
    },
    /** Registra un intento (fallido o, para formularios sin fallo, cualquiera). */
    hit() {
      const s = state();
      s.hits.push(Date.now());
      if (s.hits.length >= max) {
        const wait = Math.min(maxLockMs, lockMs * 2 ** (s.locks ?? 0));
        s.lockedUntil = Date.now() + wait;
        s.locks = (s.locks ?? 0) + 1;
        s.hits = [];
      }
      write(key, s);
      return Math.max(0, s.lockedUntil - Date.now());
    },
    /** Tras un éxito se olvidan los fallos previos. */
    reset() {
      write(key, { hits: [], lockedUntil: 0, locks: 0 });
    },
  };
}

export const loginLimiter = createLimiter('login', { max: 5, windowMs: 15 * 60 * 1000, lockMs: 30 * 1000 });
export const registerLimiter = createLimiter('register', { max: 3, windowMs: 10 * 60 * 1000, lockMs: 60 * 1000 });
export const forgotLimiter = createLimiter('forgot', { max: 1, windowMs: 60 * 1000, lockMs: 60 * 1000, maxLockMs: 10 * 60 * 1000 });
export const resetLimiter = createLimiter('reset', { max: 5, windowMs: 10 * 60 * 1000, lockMs: 60 * 1000 });

/**
 * Traduce los errores de Supabase Auth a claves i18n sin filtrar detalles
 * internos (y sin revelar si un correo está registrado).
 * @param {any} error
 * @returns {string} clave i18n
 */
export function authErrorKey(error) {
  const status = error?.status;
  const code = String(error?.code ?? '').toLowerCase();
  const msg = String(error?.message ?? '').toLowerCase();
  if (status === 429 || code.includes('rate_limit') || msg.includes('rate limit') || msg.includes('too many')) return 'auth.rateLimited';
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) return 'auth.emailNotConfirmed';
  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) return 'landing.login.errorCreds';
  if (msg.includes('failed to fetch') || msg.includes('network')) return 'auth.network';
  if (code === 'weak_password' || msg.includes('password should')) return 'validation.passwordWeak';
  return '';
}
