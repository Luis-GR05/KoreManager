/**
 * Validaciones de formularios (registro, perfil, contraseñas).
 * Devuelven `null` si el valor es válido o `{ key, vars? }` con la clave i18n
 * del error (namespace `validation.*`). Las mismas reglas se aplican en la base
 * de datos (trigger guard_profile_write), así que el cliente solo adelanta el aviso.
 */

export const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
export const MIN_AGE = 14; // LOPDGDD art. 7: consentimiento propio desde los 14 años
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72; // límite de bcrypt

/** Provincias por los dos primeros dígitos del código postal. */
export const PROVINCES = {
  '01': 'Araba/Álava', '02': 'Albacete', '03': 'Alicante/Alacant', '04': 'Almería', '05': 'Ávila',
  '06': 'Badajoz', '07': 'Illes Balears', '08': 'Barcelona', '09': 'Burgos', '10': 'Cáceres',
  '11': 'Cádiz', '12': 'Castellón/Castelló', '13': 'Ciudad Real', '14': 'Córdoba', '15': 'A Coruña',
  '16': 'Cuenca', '17': 'Girona', '18': 'Granada', '19': 'Guadalajara', '20': 'Gipuzkoa',
  '21': 'Huelva', '22': 'Huesca', '23': 'Jaén', '24': 'León', '25': 'Lleida',
  '26': 'La Rioja', '27': 'Lugo', '28': 'Madrid', '29': 'Málaga', '30': 'Murcia',
  '31': 'Navarra', '32': 'Ourense', '33': 'Asturias', '34': 'Palencia', '35': 'Las Palmas',
  '36': 'Pontevedra', '37': 'Salamanca', '38': 'Santa Cruz de Tenerife', '39': 'Cantabria', '40': 'Segovia',
  '41': 'Sevilla', '42': 'Soria', '43': 'Tarragona', '44': 'Teruel', '45': 'Toledo',
  '46': 'Valencia/València', '47': 'Valladolid', '48': 'Bizkaia', '49': 'Zamora', '50': 'Zaragoza',
  '51': 'Ceuta', '52': 'Melilla',
};
export const PROVINCE_LIST = Object.values(PROVINCES).sort((a, b) => a.localeCompare(b, 'es'));

const err = (key, vars) => ({ key, vars });
const LETTERS = /^[\p{L}][\p{L}'’\- ]*$/u;

/* ───────────── Normalizadores ───────────── */
export const normalizeSpaces = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
export const normalizeDni = (v) => String(v ?? '').toUpperCase().replace(/[\s.-]/g, '');
export const normalizeEmail = (v) => String(v ?? '').trim().toLowerCase();

/** "+34 600-12 34 56" → "+34600123456"; "0034…" → "+34…" */
export function normalizePhone(v) {
  let p = String(v ?? '').replace(/[\s().-]/g, '');
  if (p.startsWith('00')) p = `+${p.slice(2)}`;
  return p;
}

/* ───────────── Nombre ───────────── */
export function validateName(v) {
  const s = normalizeSpaces(v);
  if (!s) return err('required');
  if (s.length > 80) return err('nameLong');
  if (!LETTERS.test(s)) return err('nameChars');
  if (s.split(' ').filter((w) => w.length >= 2).length < 2) return err('nameShort');
  return null;
}

/* ───────────── Email ───────────── */
const POPULAR_DOMAINS = [
  'gmail.com', 'hotmail.com', 'hotmail.es', 'outlook.com', 'outlook.es', 'yahoo.com', 'yahoo.es',
  'icloud.com', 'live.com', 'msn.com', 'protonmail.com', 'proton.me', 'telefonica.net', 'me.com',
];
const DISPOSABLE = new Set([
  'mailinator.com', '10minutemail.com', 'guerrillamail.com', 'tempmail.com', 'temp-mail.org',
  'yopmail.com', 'trashmail.com', 'getnada.com', 'sharklasers.com', 'dispostable.com',
  'maildrop.cc', 'throwawaymail.com', 'fakeinbox.com', 'mohmal.com', 'emailondeck.com', 'tempmailo.com',
]);

function distance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[a.length][b.length];
}

/** Sugiere la corrección de un dominio mal escrito (gmial.com → gmail.com). */
export function suggestEmail(v) {
  const email = normalizeEmail(v);
  const at = email.lastIndexOf('@');
  if (at < 1) return null;
  const domain = email.slice(at + 1);
  if (!domain || POPULAR_DOMAINS.includes(domain)) return null;
  let best = null;
  for (const d of POPULAR_DOMAINS) {
    const dist = distance(domain, d);
    if (dist > 0 && dist <= 2 && (!best || dist < best.dist)) best = { d, dist };
  }
  return best ? `${email.slice(0, at)}@${best.d}` : null;
}

export function validateEmail(v) {
  const s = normalizeEmail(v);
  if (!s) return err('required');
  // RFC 5322 simplificado: local@dominio.tld, sin espacios ni puntos dobles
  const re = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/;
  if (s.length > 254 || !re.test(s) || s.includes('..')) return err('email');
  if (DISPOSABLE.has(s.split('@')[1])) return err('emailDisposable');
  return null;
}

/* ───────────── Teléfono ───────────── */
export function validatePhone(v) {
  const p = normalizePhone(v);
  if (!p) return err('required');
  const spanish = /^(\+34)?[6789]\d{8}$/;
  const international = /^\+(?!34)[1-9]\d{7,14}$/;
  return spanish.test(p) || international.test(p) ? null : err('phone');
}

/* ───────────── DNI / NIE ───────────── */
export function dniLetterOk(v) {
  const d = normalizeDni(v);
  if (!/^([0-9]{8}|[XYZ][0-9]{7})[A-Z]$/.test(d)) return false;
  const num = Number(d.slice(0, 8).replace('X', '0').replace('Y', '1').replace('Z', '2'));
  return DNI_LETTERS[num % 23] === d.slice(-1);
}

/**
 * Letra de control de un DNI (8 números) o NIE (X/Y/Z + 7 números).
 * @param {string} num  parte numérica, p. ej. "12345678" o "X1234567"
 * @returns {string|null}  la letra, o null si el número aún está incompleto
 */
export function dniLetterFor(num) {
  const n = String(num ?? '').toUpperCase();
  if (!/^([0-9]{8}|[XYZ][0-9]{7})$/.test(n)) return null;
  const value = Number(n.replace('X', '0').replace('Y', '1').replace('Z', '2'));
  return DNI_LETTERS[value % 23];
}

/**
 * Limpia lo que escribe el usuario en el campo DNI/NIE: solo números (y X/Y/Z
 * al principio para NIE), máximo 8 caracteres. Si pega un DNI completo con
 * letra, se descarta su letra porque la calculamos nosotros.
 * @param {string} raw
 */
export function cleanDniNumber(raw) {
  let s = String(raw ?? '').toUpperCase().replace(/[^0-9XYZA-Z]/g, '');
  if (/^([0-9]{8}|[XYZ][0-9]{7})[A-Z]$/.test(s)) s = s.slice(0, -1);
  const first = /^[XYZ]/.test(s) ? s[0] : '';
  const digits = s.slice(first ? 1 : 0).replace(/\D/g, '');
  return (first + digits).slice(0, 8);
}

export function validateDni(v) {
  const d = normalizeDni(v);
  if (!d) return err('required');
  if (!/^([0-9]{8}|[XYZ][0-9]{7})[A-Z]$/.test(d)) return err('dniFormat');
  return dniLetterOk(d) ? null : err('dniLetter');
}

/* ───────────── Fecha de nacimiento ───────────── */
export function ageFrom(isoDate, today = new Date()) {
  const [y, m, d] = String(isoDate).split('-').map(Number);
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age -= 1;
  return age;
}

export function validateBirthDate(v) {
  if (!v) return err('required');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(new Date(`${v}T00:00:00`).getTime())) return err('birthDate');
  if (new Date(`${v}T00:00:00`) > new Date()) return err('birthFuture');
  const age = ageFrom(v);
  if (age < MIN_AGE) return err('minAge', { age: MIN_AGE });
  if (age > 120) return err('maxAge');
  return null;
}

/* ───────────── Dirección ───────────── */
export function validateAddress(v) {
  const s = normalizeSpaces(v);
  if (!s) return err('required');
  if (s.length < 5 || s.length > 120 || !/\p{L}/u.test(s)) return err('address');
  return null;
}

export function validatePostalCode(v) {
  const s = String(v ?? '').trim();
  if (!s) return err('required');
  return /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/.test(s) ? null : err('postalCode');
}

export const provinceFromPostalCode = (cp) => PROVINCES[String(cp ?? '').trim().slice(0, 2)] ?? null;

export function validateCity(v) {
  const s = normalizeSpaces(v);
  if (!s) return err('required');
  if (s.length < 2 || s.length > 60 || !LETTERS.test(s)) return err('city');
  return null;
}

export function validateProvince(v, cp) {
  if (!v) return err('province');
  const expected = provinceFromPostalCode(cp);
  if (expected && expected !== v) return err('provinceMismatch', { province: expected });
  return null;
}

/* ───────────── Contraseña ───────────── */
const COMMON = new Set([
  '12345678', '123456789', '1234567890', 'password', 'password1', 'password123', 'qwerty123', 'qwertyui',
  '11111111', '00000000', 'iloveyou', 'admin123', 'contraseña', 'contrasena', 'contraseña1', '12345678a',
  'abc12345', 'futbol123', 'padel123', 'tenis123', 'realmadrid', 'barcelona', 'kore1234', 'koremanager',
  '1q2w3e4r', '1q2w3e4r5t', 'sevilla1', 'madrid123', 'passw0rd', 'p@ssw0rd', 'welcome1', 'qwerty12',
]);

export function passwordRules(pw) {
  const s = String(pw ?? '');
  return {
    length: s.length >= PASSWORD_MIN,
    lower: /\p{Ll}/u.test(s),
    upper: /\p{Lu}/u.test(s),
    number: /\d/.test(s),
    symbol: /[^\p{L}\d]/u.test(s),
  };
}

function isPersonal(pw, personal = []) {
  const p = pw.toLowerCase();
  return personal
    .flatMap((x) => String(x ?? '').toLowerCase().split(/[\s@._-]+/))
    .filter((w) => w.length >= 4)
    .some((w) => p.includes(w));
}

/** Puntuación 0–4 para el medidor de seguridad. */
export function passwordScore(pw, personal = []) {
  const s = String(pw ?? '');
  if (!s) return 0;
  if (COMMON.has(s.toLowerCase()) || isPersonal(s, personal)) return 0;
  const r = passwordRules(s);
  const classes = [r.lower, r.upper, r.number, r.symbol].filter(Boolean).length;
  let score = 0;
  if (s.length >= PASSWORD_MIN) score += 1;
  if (s.length >= 12) score += 1;
  if (classes >= 3) score += 1;
  if (classes === 4 || s.length >= 16) score += 1;
  if (/(.)\1{3,}/.test(s)) score -= 1; // aaaa, 1111…
  return Math.max(0, Math.min(4, score));
}

export function validatePassword(pw, personal = []) {
  const s = String(pw ?? '');
  if (!s) return err('required');
  if (s.length < PASSWORD_MIN) return err('passwordLength', { min: PASSWORD_MIN });
  if (s.length > PASSWORD_MAX) return err('passwordMax');
  if (COMMON.has(s.toLowerCase())) return err('passwordCommon');
  if (isPersonal(s, personal)) return err('passwordPersonal');
  const r = passwordRules(s);
  if ([r.lower, r.upper, r.number, r.symbol].filter(Boolean).length < 3) return err('passwordWeak');
  return null;
}

export function validatePasswordMatch(pw, confirm) {
  if (!confirm) return err('required');
  return pw === confirm ? null : err('passwordMatch');
}
