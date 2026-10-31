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

/** Entra al portal de estudiantes (aula): formulario con token CSRF ligado a la sesión. */
export async function login() {
  const user = process.env.SEDUCA_USUARIO, pass = process.env.SEDUCA_CLAVE;
  if (!user || !pass) throw new Error('Faltan SEDUCA_USUARIO o SEDUCA_CLAVE en Vercel');
  const s = new Session();
  // Entrar por /2/aula/ primero: ahí se crea la sesión (cookie) a la que queda atado el token.
  const { res: form } = await s.fetch('/2/aula/');
  const html = await form.text();
  const field = (name) => html.match(new RegExp(`name="${name}"[^>]*value="([^"]*)"`))?.[1]
    ?? html.match(new RegExp(`value="([^"]*)"[^>]*name="${name}"`))?.[1] ?? '';
  const body = new URLSearchParams({
    _username: user.trim(),
    _password: pass,
    _target_path: field('_target_path') || 'gse_template_homepage',
    _csrf_token: field('_csrf_token'),
  });
  const { res, url } = await s.fetch('/2/aula/login_check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const page = await res.text();
  if (/\/login\b/.test(new URL(url).pathname)) {
    const msg = page.match(/class="[^"]*(?:alert|error)[^"]*"[^>]*>([\s\S]{0,200}?)</i)?.[1]?.replace(/\s+/g, ' ').trim();
    throw new Error(`SEDUCA no aceptó el usuario o la contraseña${msg ? ` (${msg})` : ''}`);
  }
  return { session: s, home: url, homeHtml: page };
}

export default async function handler(req, res) {
  const q = Object.fromEntries(new URL(req.url, 'http://x').searchParams);
  req.query = q;
  const pin = process.env.NOTAS_PIN;
  const given = req.headers['x-pin'] || q.pin;
  // Siempre 200: el estado real va en el JSON (Vercel trata los 401 como "requiere iniciar sesión").
  if (!pin || given !== pin) return res.status(200).json({ ok: false, error: pin ? 'PIN incorrecto' : 'Falta NOTAS_PIN en Vercel' });
  try {
    const { session, home } = await login();
    // Modo datos crudos de un bimestre: JSON del portal tal cual (para ajustar el lector).
    if (req.query.pi) {
      const { res: r } = await session.fetch(`/2/aula/grade/json?pi_id=${encodeURIComponent(req.query.pi)}`, {
        method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded' }, body: '',
      });
      const text = await r.text();
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ ok: true, status: r.status, raw: text.slice(0, 120000) });
    }
    // Modo exploración: muestra una página del portal (solo dentro de /2/parent) para ajustar el lector.
    const path = typeof req.query.ver === 'string' && req.query.ver.startsWith('/2/aula') ? req.query.ver : home;
    const { res: page, url } = await session.fetch(path);
    const html = await page.text();
    const links = [...html.matchAll(/<a[^>]+href="([^"#][^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)]
      .map((m) => [m[1], m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()])
      .filter(([h]) => h.includes('/2/aula') || h.startsWith('/'));
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ok: true, url, status: page.status, links, html: req.query.html ? html.slice(0, 60000) : undefined });
  } catch (err) {
    return res.status(200).json({ ok: false, error: err.message });
  }
}
