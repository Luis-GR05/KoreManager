/**
 * Catálogo visual de deportes.
 *
 * Los deportes y las pistas los gestiona el administrador en la tabla
 * `instalaciones` (columna `tipo`), así que la landing NO tiene cifras ni
 * deportes fijos: lee el resumen de la BD y usa este catálogo solo para la
 * parte visual (nombre traducido, foto, plano reglamentario). Un `tipo` nuevo
 * que no esté aquí se muestra igualmente con nombre y foto genéricos.
 */

const PRESETS = [
  { id: 'padel', match: /^p[aá]del/, photo: 'scrollPadel', court: 'padel' },
  { id: 'futsal', match: /^(f[uú]tbol|futsal|f[uú]tbol[ -]?sala|futbol ?7|soccer)/, photo: 'heroFutsal', court: 'futsal' },
  { id: 'tennis', match: /^(tenis|tennis)/, photo: 'heroTennis', court: 'tennis' },
  { id: 'basketball', match: /^(baloncesto|basket|basketball)/, photo: 'final', court: 'basketball' },
];

/** "tenis de mesa" → "Tenis de mesa" */
const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * Enriquece una fila del resumen ({ tipo, pistas, disponibles }) con lo visual.
 * @param {{ tipo: string, pistas: number, disponibles: number }} row
 * @param {(key: string, opts?: any) => string} t  función i18n
 */
export function describeSport(row, t) {
  const tipo = String(row.tipo ?? '').toLowerCase().trim();
  const preset = PRESETS.find((p) => p.match.test(tipo));
  const key = preset?.id;
  const known = key && t(`sportsCatalog.${key}.name`, { defaultValue: '' });
  return {
    tipo,
    id: key ?? tipo.replace(/[^a-z0-9]+/g, '-'),
    name: known || capitalize(tipo),
    desc: key ? t(`sportsCatalog.${key}.desc`) : t('sportsCatalog.generic.desc', { sport: capitalize(tipo) }),
    size: key ? t(`sportsCatalog.${key}.size`, { defaultValue: '' }) : '',
    surface: key ? t(`sportsCatalog.${key}.surface`, { defaultValue: '' }) : '',
    photo: preset?.photo ?? 'team',
    court: preset?.court ?? null,
    pistas: Number(row.pistas) || 0,
    disponibles: Number(row.disponibles) || 0,
  };
}
