/**
 * Fotografías de libre uso (Licencia Unsplash: uso comercial gratuito, sin
 * atribución obligatoria; la incluimos igualmente en el footer).
 *
 * Se sirven desde el CDN de Unsplash (imgix), que las recorta y las entrega
 * en AVIF/WebP según el navegador (`auto=format`), así que no engordan el repo.
 * https://unsplash.com/license
 */
const BASE = 'https://images.unsplash.com/';

export const PHOTOS = {
  heroPadel: { src: 'photo-1646649851800-48dba35edc76', author: 'Vincenzo Morelli', user: 'vincenzomorelli', alt: 'Jugador de pádel preparando un golpe en una pista azul' },
  heroFutsal: { src: 'photo-1676444920926-c8a084ec4003', author: 'Attareza Naufal', user: 'naufattar', alt: 'Jóvenes jugando un partido de fútbol sala' },
  heroTennis: { src: 'photo-1554068865-24cecd4e34b8', author: 'Moises Alex', user: 'arnok', alt: 'Tenista sacando en una pista de tierra batida vista desde arriba' },
  scrollPadel: { src: 'photo-1646649852046-b758d2d573f3', author: 'Vincenzo Morelli', user: 'vincenzomorelli', alt: 'Jugadora de pádel en la pista' },
  scrollFutsal: { src: 'photo-1630420598913-44208d36f9af', author: 'Falaq Lazuardi', user: 'falaqkun', alt: 'Partido de fútbol sala visto a través de la red' },
  scrollTennis: { src: 'photo-1516742720271-6ae39cbc5bd1', author: 'flou gaupr', user: 'superflou', alt: 'Tenista en una pista dura azul' },
  how: { src: 'photo-1658491830143-72808ca237e3', author: 'Oskar Hagberg', user: 'knosk', alt: '' },
  team: { src: 'photo-1646649852033-7e0f3d679f8b', author: 'Vincenzo Morelli', user: 'vincenzomorelli', alt: 'Dos jugadores de pádel se dan la mano tras el partido' },
  final: { src: 'photo-1790599313607-e8a1e9d4a5e8', author: 'daniil kazorin', user: 'dani4ka', alt: 'Equipo reunido en la pista durante un partido' },
  auth: { src: 'photo-1715333155413-45f4aafe57b3', author: 'Gabriel Martin', user: 'diseniatica', alt: 'Jugadora con su pala en la pista' },
};

/**
 * URL optimizada de una foto.
 * @param {keyof PHOTOS} key
 * @param {{ w: number, h?: number, q?: number, crop?: string }} opts
 */
export function photoUrl(key, { w, h, q = 70, crop = 'entropy' }) {
  const p = PHOTOS[key];
  const params = new URLSearchParams({ auto: 'format', fit: 'crop', crop, w: String(w), q: String(q) });
  if (h) params.set('h', String(h));
  return `${BASE}${p.src}?${params.toString()}`;
}

/**
 * srcset responsive manteniendo la proporción `ratio` (alto/ancho).
 * @param {keyof PHOTOS} key
 * @param {number[]} widths
 * @param {number} [ratio]
 */
export function photoSrcSet(key, widths, ratio) {
  return widths
    .map((w) => `${photoUrl(key, { w, h: ratio ? Math.round(w * ratio) : undefined })} ${w}w`)
    .join(', ');
}

/** Lista única de autores para los créditos. */
export const PHOTO_CREDITS = Object.values(
  Object.values(PHOTOS).reduce((acc, p) => ({ ...acc, [p.user]: { author: p.author, user: p.user } }), {}),
);
