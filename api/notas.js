// Función de Vercel: entra a SEDUCA con las claves guardadas en Vercel y trae las calificaciones.
// Las claves viven en las variables SEDUCA_USUARIO y SEDUCA_CLAVE; nunca llegan al navegador.
// Protegida con NOTAS_PIN para que solo tú puedas pedir tus notas.

const BASE = 'https://csa.gsepty.com';

class Session {
  constructor() { this.cookies = new Map(); }
  store(res) {
    for (const c of res.headers.getSetCookie?.() || []) {
      const [pair] = c.split(';');
      const i = pair.indexOf('=');
      this.cookies.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
    }
  }
  header() { return [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; '); }
  async fetch(path, opts = {}) {
    let url = new URL(path, BASE).href;
    for (let hop = 0; hop < 6; hop++) {
      const res = await fetch(url, {
        ...opts,
        redirect: 'manual',
        headers: { 'User-Agent': 'Mozilla/5.0 (iPad) horno-notas', Cookie: this.header(), ...(opts.headers || {}) },
      });
      this.store(res);
      const loc = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && loc) {
        url = new URL(loc.replace(/^http:/, 'https:'), url).href;
        opts = { method: 'GET' };
        continue;
      }
      return { res, url };
    }
    throw new Error('Demasiadas redirecciones');
  }
}

export async function login() {
  const user = process.env.SEDUCA_USUARIO, pass = process.env.SEDUCA_CLAVE;
  if (!user || !pass) throw Object.assign(new Error('Faltan SEDUCA_USUARIO o SEDUCA_CLAVE en Vercel'), { status: 500 });
  const s = new Session();
  await s.fetch('/2/parent/login');
  const { res } = await s.fetch('/2/parent/login_manual_check', {
    method: 'POST',
    headers: { 'Content-type': 'application/json' },
    body: JSON.stringify({ _username: user, _password: pass, _out_referer: '/2/parent/' }),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.path) throw Object.assign(new Error('SEDUCA no aceptó el usuario o la contraseña'), { status: 401 });
  return { session: s, home: data.path };
}

export default async function handler(req, res) {
  const pin = process.env.NOTAS_PIN;
  const given = req.headers['x-pin'] || req.query.pin;
  if (!pin || given !== pin) return res.status(401).json({ error: 'PIN incorrecto' });
  try {
    const { session, home } = await login();
    // Modo exploración: muestra una página del portal (solo dentro de /2/parent) para ajustar el lector.
    const path = typeof req.query.ver === 'string' && req.query.ver.startsWith('/2/parent') ? req.query.ver : home;
    const { res: page, url } = await session.fetch(path);
    const html = await page.text();
    const links = [...html.matchAll(/<a[^>]+href="([^"#][^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)]
      .map((m) => [m[1], m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()])
      .filter(([h]) => h.includes('/2/parent'));
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ url, status: page.status, links, html: req.query.html ? html.slice(0, 60000) : undefined });
  } catch (err) {
    return res.status(err.status || 502).json({ error: err.message });
  }
}
