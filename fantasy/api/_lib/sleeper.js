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
      o: p.injury_notes || null, pr: p.practice_participation || null, u: p.news_updated || null, e: p.age || null,
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

// Estadísticas que sirven para el registro de juego (snaps, pases, carreras, recepciones, pateador y defensa).
const UTILES = /^(off_snp|tm_off_snp|def_snp|pass_(att|cmp|yd|td|int)|rush_(att|yd|td)|rec(_tgt|_yd|_td)?$|fum_lost|fgm|fga|fgm_lng|xpm|xpa|def_(td|int|fum_rec|sack|safe)|sack|int|fum_rec|pts_allow|yds_allow|bonus_|pass_2pt|rush_2pt|rec_2pt|fgm_|fgmiss|xpmiss|gp$|ff$|safe$|def_st_td|st_td|kr_yd|pr_yd)/;

function recortar(stats = {}) {
  const r = {};
  for (const [k, v] of Object.entries(stats)) if (typeof v === 'number' && v !== 0 && UTILES.test(k)) r[k] = v;
  if (stats.gp === 0) r.gp = 0;
  return r;
}

/** Registro de un jugador semana por semana: lo que hizo y lo que se proyecta. */
export async function registroJugador(id, temporada) {
  const consulta = `season_type=regular&season=${temporada}&grouping=week`;
  const [st, pr] = await Promise.all([
    json(`${SLEEPER}/stats/nfl/player/${encodeURIComponent(id)}?${consulta}`).catch(() => null),
    json(`${SLEEPER}/projections/nfl/player/${encodeURIComponent(id)}?${consulta}`).catch(() => null),
  ]);
  const semanas = {};
  const leer = (datos, campo) => {
    if (!datos || typeof datos !== 'object') return;
    for (const [w, v] of Object.entries(datos)) {
      if (!v || !/^\d+$/.test(w)) continue;
      const fila = (semanas[w] ??= { semana: Number(w) });
      fila[campo] = recortar(v.stats || v);
      if (v.opponent) fila.rival = v.opponent;
      if (v.team) fila.equipo = v.team;
      if (v.date) fila.fecha = v.date;
    }
  };
  leer(st, 'stats');
  leer(pr, 'proy');
  return Object.values(semanas).sort((a, b) => a.semana - b.semana);
}
