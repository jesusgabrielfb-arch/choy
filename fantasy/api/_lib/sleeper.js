// Versiones livianas de los datos de Sleeper, para que el teléfono descargue mucho menos.
const SLEEPER = 'https://api.sleeper.app';
const POSICIONES = new Set(['QB', 'RB', 'WR', 'TE', 'K', 'DEF']);

async function json(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'fantasy-x-cody/1.0' } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

/** ~5 MB → solo jugadores de fantasy con los campos que usa la app. */
export async function jugadoresLivianos() {
  const todos = await json(`${SLEEPER}/v1/players/nfl`);
  const res = {};
  for (const [id, p] of Object.entries(todos)) {
    if (!POSICIONES.has(p.position)) continue;
    if (!p.team && !p.injury_status && (p.search_rank ?? 9999) > 600) continue;
    res[id] = {
      n: p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' '),
      p: p.position, t: p.team || null, l: p.injury_status || null, b: p.injury_body_part || null,
      o: p.injury_notes || null, pr: p.practice_participation || null, e: p.age || null,
      r: p.search_rank ?? 9999, d: p.depth_chart_order ?? null, a: p.active !== false ? 1 : 0,
    };
  }
  return res;
}

// Estadísticas que no son de puntos (rankings, ADP…) y no hacen falta para calcular nada.
const SOBRA = /^(pts_|rank_|pos_rank|adp_|gp_|gs_)/;

/** Proyecciones o estadísticas de una semana, sin el objeto "player" ni campos que sobran. */
export async function semanaLiviana(tipo, temporada, semana) {
  const pos = [...POSICIONES].map((p) => `position[]=${p}`).join('&');
  const lista = await json(`${SLEEPER}/${tipo === 'proy' ? 'projections' : 'stats'}/nfl/${temporada}/${semana}?season_type=regular&${pos}`);
  const res = [];
  for (const f of Array.isArray(lista) ? lista : []) {
    if (!f.player_id || !f.stats) continue;
    const stats = {};
    for (const [k, v] of Object.entries(f.stats)) if (typeof v === 'number' && v !== 0 && !SOBRA.test(k)) stats[k] = v;
    if (f.stats.gp === 0) stats.gp = 0;
    res.push({ player_id: f.player_id, team: f.team || null, opponent: f.opponent || null, stats });
  }
  return res;
}
