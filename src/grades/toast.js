// Fases de tostado del pan según las notas: 0 = pan blanco (vas muy bien) … 1 = carbón (vas muy mal).
// Lo usan el pan 3D y el dibujo SVG para que siempre se vean igual.

const STOPS = [
  // [nivel, miga centro, miga borde, corteza]
  [0.0, '#fffdf6', '#f6ecd6', '#e8cf9c'], // pan blanco
  [0.25, '#fff1cc', '#f3d496', '#d4a057'], // apenas dorado
  [0.45, '#f8dca0', '#e3a85a', '#b4682b'], // tostado dorado
  [0.65, '#d9a05a', '#a8642a', '#7a3a14'], // bien tostado
  [0.85, '#7a4420', '#4a2410', '#2c140a'], // quemado
  [1.0, '#3a2014', '#1d0d06', '#120804'], // carbón
];

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lerp = (a, b, t) => {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
};

/** Colores de miga (centro y borde) y corteza para un nivel de quemado 0..1. */
export function toastColors(burn) {
  const b = Math.max(0, Math.min(1, burn));
  let i = 0;
  while (i < STOPS.length - 2 && b > STOPS[i + 1][0]) i++;
  const [b0, ...c0] = STOPS[i], [b1, ...c1] = STOPS[i + 1];
  const t = (b - b0) / (b1 - b0);
  return { center: lerp(c0[0], c1[0], t), edge: lerp(c0[1], c1[1], t), crust: lerp(c0[2], c1[2], t) };
}

/** Nombre de la fase, para mostrarla. */
export function toastName(burn) {
  if (burn < 0.1) return 'Pan blanco';
  if (burn < 0.25) return 'Doradito';
  if (burn < 0.42) return 'Tostado';
  if (burn < 0.62) return 'Muy tostado';
  if (burn < 0.75) return 'A punto de quemarse';
  if (burn < 0.95) return 'Quemado';
  return 'Carbón';
}
