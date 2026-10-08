/**
 * Geometría reglamentaria de cada pista, en metros, convertida a trazados SVG.
 * Todas comparten el mismo viewBox (VIEW_W × VIEW_H) para poder superponerse.
 *
 * Cada trazo usa `pathLength="1"`: así la animación de "dibujado" se reduce a
 * mover `stroke-dashoffset` de 1 a 0, sea cual sea la longitud real.
 */

export const VIEW_W = 480;
export const VIEW_H = 300;
const DRAW_W = 392; // ancho útil para la pista dentro del viewBox

/**
 * Crea un conversor metros → coordenadas SVG centrado en el viewBox.
 * @param {number} length largo de la pista (m)
 * @param {number} width ancho de la pista (m)
 */
function makeScale(length, width) {
  const s = DRAW_W / length;
  const x0 = (VIEW_W - length * s) / 2;
  const y0 = (VIEW_H - width * s) / 2 + 6;
  const X = (m) => +(x0 + m * s).toFixed(2);
  const Y = (m) => +(y0 + m * s).toFixed(2);
  return { s, X, Y, x0, y0, w: length * s, h: width * s };
}

const line = (X, Y, x1, y1, x2, y2) => `M${X(x1)} ${Y(y1)}L${X(x2)} ${Y(y2)}`;
const rect = (X, Y, x1, y1, x2, y2) =>
  `M${X(x1)} ${Y(y1)}H${X(x2)}V${Y(y2)}H${X(x1)}Z`;

/* ───────────── PÁDEL · 20 × 10 m ───────────── */
function padel() {
  const L = 20, W = 10;
  const { X, Y, s, ...box } = makeScale(L, W);
  const r = s * 0.12;
  return {
    id: 'padel',
    length: L,
    width: W,
    box,
    lines: [
      { d: rect(X, Y, 0, 0, L, W), weight: 'main' },
      { d: line(X, Y, 3.05, 0, 3.05, W) },
      { d: line(X, Y, L - 3.05, 0, L - 3.05, W) },
      { d: line(X, Y, 3.05, W / 2, L - 3.05, W / 2) },
      { d: line(X, Y, L / 2, -0.6, L / 2, W + 0.6), weight: 'net' },
    ],
    // Cerramientos: fondo de cristal + 4 m laterales de cristal (púrpura)
    walls: [
      `M${X(4)} ${Y(-0.35)}H${X(-0.35)}V${Y(W + 0.35)}H${X(4)}`,
      `M${X(L - 4)} ${Y(-0.35)}H${X(L + 0.35)}V${Y(W + 0.35)}H${X(L - 4)}`,
    ],
    dots: [],
    ball: { from: [2.2, 7.6], to: [17.4, 2.6], arc: 0.9, r },
  };
}

/* ───────────── FÚTBOL SALA · 40 × 20 m ───────────── */
function futsal() {
  const L = 40, W = 20;
  const { X, Y, s, ...box } = makeScale(L, W);
  const R = 6 * s; // radio del área (6 m desde cada poste)
  const c = 3 * s; // radio del círculo central
  const area = (side) => {
    const x = side === 'l' ? 0 : L;
    const dir = side === 'l' ? 1 : -1;
    const sweep = side === 'l' ? 1 : 0;
    return `M${X(x)} ${Y(2.5)}A${R} ${R} 0 0 ${sweep} ${X(x + dir * 6)} ${Y(8.5)}`
      + `L${X(x + dir * 6)} ${Y(11.5)}A${R} ${R} 0 0 ${sweep} ${X(x)} ${Y(17.5)}`;
  };
  const r = s * 0.24;
  return {
    id: 'futsal',
    length: L,
    width: W,
    box,
    lines: [
      { d: rect(X, Y, 0, 0, L, W), weight: 'main' },
      { d: line(X, Y, L / 2, 0, L / 2, W) },
      { d: `M${X(L / 2 + 3)} ${Y(W / 2)}A${c} ${c} 0 1 1 ${X(L / 2 - 3)} ${Y(W / 2)}A${c} ${c} 0 1 1 ${X(L / 2 + 3)} ${Y(W / 2)}` },
      { d: area('l') },
      { d: area('r') },
    ],
    walls: [
      rect(X, Y, -1, 8.5, 0, 11.5),
      rect(X, Y, L, 8.5, L + 1, 11.5),
    ],
    dots: [
      [L / 2, W / 2], [6, W / 2], [L - 6, W / 2], [10, W / 2], [L - 10, W / 2],
    ].map(([mx, my]) => ({ cx: X(mx), cy: Y(my), r: s * 0.18 })),
    ball: { from: [8, 14], to: [36.2, 10], arc: 1.6, r },
  };
}

/* ───────────── TENIS · 23,77 × 10,97 m ───────────── */
function tennis() {
  const L = 23.77, W = 10.97;
  const { X, Y, s, ...box } = makeScale(L, W);
  const a = 1.37; // pasillo de dobles
  const sv = 6.4; // línea de saque desde la red
  const mid = L / 2;
  const r = s * 0.12;
  return {
    id: 'tennis',
    length: L,
    width: W,
    box,
    lines: [
      { d: rect(X, Y, 0, 0, L, W), weight: 'main' },
      { d: line(X, Y, 0, a, L, a) },
      { d: line(X, Y, 0, W - a, L, W - a) },
      { d: line(X, Y, mid - sv, a, mid - sv, W - a) },
      { d: line(X, Y, mid + sv, a, mid + sv, W - a) },
      { d: line(X, Y, mid - sv, W / 2, mid + sv, W / 2) },
      { d: line(X, Y, 0, W / 2, 0.25, W / 2) },
      { d: line(X, Y, L, W / 2, L - 0.25, W / 2) },
      { d: line(X, Y, mid, -0.9, mid, W + 0.9), weight: 'net' },
    ],
    walls: [],
    dots: [],
    ball: { from: [1.2, 3.2], to: [20.6, 8.4], arc: 1.1, r },
  };
}

export const COURTS = [padel(), futsal(), tennis()];

/**
 * Posición de la pelota para un progreso t ∈ [0,1] (trayectoria parabólica
 * aparente: se separa de su sombra en el centro del recorrido).
 * @param {{from:number[], to:number[], arc:number}} ball
 * @param {(m:number)=>number} _X
 */
export function ballAt(court, t) {
  const { length: L, width: W, box, ball } = court;
  const sx = box.w / L;
  const x = box.x0 + (ball.from[0] + (ball.to[0] - ball.from[0]) * t) * sx;
  const y = box.y0 + (ball.from[1] + (ball.to[1] - ball.from[1]) * t) * sx;
  const lift = Math.sin(Math.PI * t) * ball.arc * sx * (W / 10);
  return { x, y, lift };
}
