// Función de Vercel: intermediario para fuentes gratis que no dejan leer directo desde el
// navegador (CORS) y para guardar en caché las respuestas pesadas.
// Solo acepta las direcciones de la lista; no sirve para navegar a cualquier sitio.

const PERMITIDOS = {
  'api.sleeper.app': 600,
  'api.fantasycalc.com': 3600,
  'site.api.espn.com': 120,
  'public.api.bsky.app': 300,
};

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://local');
  const destino = url.searchParams.get('u');
  let objetivo;
  try {
    objetivo = new URL(destino);
  } catch {
    return responder(res, 400, { error: 'Falta la dirección' });
  }
  const cache = PERMITIDOS[objetivo.hostname];
  if (objetivo.protocol !== 'https:' || cache === undefined) {
    return responder(res, 403, { error: 'Dirección no permitida' });
  }
  try {
    const r = await fetch(objetivo, { headers: { 'User-Agent': 'fantasy-gusano/0.1' } });
    const cuerpo = await r.text();
    res.statusCode = r.status;
    res.setHeader('Content-Type', r.headers.get('content-type') || 'application/json');
    res.setHeader('Cache-Control', `public, s-maxage=${cache}, stale-while-revalidate=${cache * 4}`);
    res.end(cuerpo);
  } catch (e) {
    responder(res, 502, { error: `No se pudo leer ${objetivo.hostname}` });
  }
}

function responder(res, estado, datos) {
  res.statusCode = estado;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(datos));
}
