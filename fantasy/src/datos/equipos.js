// Colores de los 32 equipos (solo colores y nombres, sin logos).
// camiseta/ribete/numero visten a Cody; acento es el color de la app (legible sobre fondo oscuro).

export const EQUIPOS = {
  ARI: { nombre: 'Arizona Cardinals', camiseta: '#97233F', ribete: '#FFB612', numero: '#FFFFFF', acento: '#E0475F' },
  ATL: { nombre: 'Atlanta Falcons', camiseta: '#A71930', ribete: '#000000', numero: '#FFFFFF', acento: '#E8475A' },
  BAL: { nombre: 'Baltimore Ravens', camiseta: '#241773', ribete: '#9E7C0C', numero: '#FFFFFF', acento: '#9B8CFF' },
  BUF: { nombre: 'Buffalo Bills', camiseta: '#00338D', ribete: '#C60C30', numero: '#FFFFFF', acento: '#4C8DFF' },
  CAR: { nombre: 'Carolina Panthers', camiseta: '#101820', ribete: '#0085CA', numero: '#FFFFFF', acento: '#2EA8F0' },
  CHI: { nombre: 'Chicago Bears', camiseta: '#0B162A', ribete: '#C83803', numero: '#FFFFFF', acento: '#F2672E' },
  CIN: { nombre: 'Cincinnati Bengals', camiseta: '#FB4F14', ribete: '#000000', numero: '#FFFFFF', acento: '#FF7A3D' },
  CLE: { nombre: 'Cleveland Browns', camiseta: '#311D00', ribete: '#FF3C00', numero: '#FFFFFF', acento: '#FF6A33' },
  DAL: { nombre: 'Dallas Cowboys', camiseta: '#041E42', ribete: '#869397', numero: '#FFFFFF', acento: '#5B8FE8' },
  DEN: { nombre: 'Denver Broncos', camiseta: '#FB4F14', ribete: '#002244', numero: '#FFFFFF', acento: '#FF7A3D' },
  DET: { nombre: 'Detroit Lions', camiseta: '#0076B6', ribete: '#B0B7BC', numero: '#FFFFFF', acento: '#2E9FE6' },
  GB: { nombre: 'Green Bay Packers', camiseta: '#203731', ribete: '#FFB612', numero: '#FFB612', acento: '#FFC233' },
  HOU: { nombre: 'Houston Texans', camiseta: '#03202F', ribete: '#A71930', numero: '#FFFFFF', acento: '#E8475A' },
  IND: { nombre: 'Indianapolis Colts', camiseta: '#002C5F', ribete: '#A2AAAD', numero: '#FFFFFF', acento: '#4C8DFF' },
  JAX: { nombre: 'Jacksonville Jaguars', camiseta: '#006778', ribete: '#D7A22A', numero: '#FFFFFF', acento: '#1FB5C9' },
  KC: { nombre: 'Kansas City Chiefs', camiseta: '#E31837', ribete: '#FFB81C', numero: '#FFFFFF', acento: '#FF4560' },
  LV: { nombre: 'Las Vegas Raiders', camiseta: '#000000', ribete: '#A5ACAF', numero: '#FFFFFF', acento: '#C4CBD0' },
  LAC: { nombre: 'Los Angeles Chargers', camiseta: '#0080C6', ribete: '#FFC20E', numero: '#FFFFFF', acento: '#2EA8F0' },
  LAR: { nombre: 'Los Angeles Rams', camiseta: '#003594', ribete: '#FFA300', numero: '#FFFFFF', acento: '#FFB533' },
  MIA: { nombre: 'Miami Dolphins', camiseta: '#008E97', ribete: '#FC4C02', numero: '#FFFFFF', acento: '#1FC2CC' },
  MIN: { nombre: 'Minnesota Vikings', camiseta: '#4F2683', ribete: '#FFC62F', numero: '#FFFFFF', acento: '#A57CFF' },
  NE: { nombre: 'New England Patriots', camiseta: '#002244', ribete: '#C60C30', numero: '#FFFFFF', acento: '#E8475A' },
  NO: { nombre: 'New Orleans Saints', camiseta: '#101820', ribete: '#D3BC8D', numero: '#D3BC8D', acento: '#D9C496' },
  NYG: { nombre: 'New York Giants', camiseta: '#0B2265', ribete: '#A71930', numero: '#FFFFFF', acento: '#4C7DFF' },
  NYJ: { nombre: 'New York Jets', camiseta: '#125740', ribete: '#FFFFFF', numero: '#FFFFFF', acento: '#2FBF86' },
  PHI: { nombre: 'Philadelphia Eagles', camiseta: '#004C54', ribete: '#A5ACAF', numero: '#FFFFFF', acento: '#2BB3A3' },
  PIT: { nombre: 'Pittsburgh Steelers', camiseta: '#101820', ribete: '#FFB612', numero: '#FFB612', acento: '#FFC233' },
  SF: { nombre: 'San Francisco 49ers', camiseta: '#AA0000', ribete: '#B3995D', numero: '#FFFFFF', acento: '#E8473B' },
  SEA: { nombre: 'Seattle Seahawks', camiseta: '#002244', ribete: '#69BE28', numero: '#FFFFFF', acento: '#7ED643' },
  TB: { nombre: 'Tampa Bay Buccaneers', camiseta: '#D50A0A', ribete: '#34302B', numero: '#FFFFFF', acento: '#FF4136' },
  TEN: { nombre: 'Tennessee Titans', camiseta: '#0C2340', ribete: '#4B92DB', numero: '#FFFFFF', acento: '#5BA6F0' },
  WAS: { nombre: 'Washington Commanders', camiseta: '#5A1414', ribete: '#FFB612', numero: '#FFFFFF', acento: '#FFC233' },
};

export const EQUIPO_DEFECTO = 'CAR';

function hexARgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Texto negro o blanco según qué se lee mejor encima del color. */
export function textoSobre(hex) {
  const [r, g, b] = hexARgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.32 ? '#10130b' : '#ffffff';
}

/** Pone los colores del equipo en toda la página. */
export function aplicarTema(abr) {
  const e = EQUIPOS[abr] || EQUIPOS[EQUIPO_DEFECTO];
  const raiz = document.documentElement.style;
  const [r, g, b] = hexARgb(e.acento);
  const [cr, cg, cb] = hexARgb(e.camiseta);
  raiz.setProperty('--acento', e.acento);
  raiz.setProperty('--acento-rgb', `${r} ${g} ${b}`);
  raiz.setProperty('--acento-texto', textoSobre(e.acento));
  raiz.setProperty('--equipo', e.camiseta);
  raiz.setProperty('--equipo-rgb', `${cr} ${cg} ${cb}`);
  raiz.setProperty('--ribete', e.ribete);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0d1017');
  return e;
}
