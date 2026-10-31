// Función de Vercel: entra a SEDUCA (portal de estudiantes "aula") con las claves guardadas en Vercel
// y devuelve las notas de los 4 bimestres como datos. Las claves viven en SEDUCA_USUARIO y
// SEDUCA_CLAVE y nunca llegan al navegador. NOTAS_PIN evita que otra persona pida tus notas.

const BASE = 'https://csa.gsepty.com';
// Tipos de nota del portal → componentes de la calculadora.
const TYPES = { 3: 'dig', 4: 'apr', 6: 'bim' };
const ROMAN = { I: 1, II: 2, III: 3, IV: 4 };

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

/** Entra al portal de estudiantes: formulario con token CSRF ligado a la sesión. */
async function login() {
  const user = process.env.SEDUCA_USUARIO, pass = process.env.SEDUCA_CLAVE;
  if (!user || !pass) throw new Error('Faltan SEDUCA_USUARIO o SEDUCA_CLAVE en Vercel');
  const s = new Session();
  // Entrar por /2/aula/ primero: ahí se crea la sesión (cookie) a la que queda atado el token.
  const { res: form } = await s.fetch('/2/aula/');
  const html = await form.text();
  const field = (name) => html.match(new RegExp(`name="${name}"[^>]*value="([^"]*)"`))?.[1]
    ?? html.match(new RegExp(`value="([^"]*)"[^>]*name="${name}"`))?.[1] ?? '';
  const { res, url } = await s.fetch('/2/aula/login_check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      _username: user.trim(),
      _password: pass,
      _target_path: field('_target_path') || 'gse_template_homepage',
      _csrf_token: field('_csrf_token'),
    }),
  });
  const page = await res.text();
  if (/\/login\b/.test(new URL(url).pathname)) {
    const msg = page.match(/class="[^"]*(?:alert|error)[^"]*"[^>]*>([\s\S]{0,200}?)</i)?.[1]?.replace(/\s+/g, ' ').trim();
    throw new Error(`SEDUCA no aceptó el usuario o la contraseña${msg ? ` (${msg})` : ''}`);
  }
  return s;
}

/** Nota del portal → texto de la calculadora: "4.40" → "4.4", sin nota → "X", sin calificar → "-". */
function cell(a) {
  if (!a.calificada) return '-';
  if (a.score === false || a.score == null || a.score === '') return 'X';
  const n = Number(a.score);
  return Number.isFinite(n) ? n.toFixed(1) : '-';
}

async function readPeriods(s) {
  const { res } = await s.fetch('/2/aula/grade');
  const html = await res.text();
  const select = html.match(/<select[^>]*id="piis"[^>]*>([\s\S]*?)<\/select>/i)?.[1] || '';
  return [...select.matchAll(/value="(\d+)"[^>]*>\s*([IVX]+)\s*Bimestre/gi)]
    .map((m) => ({ id: m[1], bim: ROMAN[m[2].toUpperCase()] }))
    .filter((p) => p.bim);
}

async function readPeriod(s, piId) {
  const { res } = await s.fetch(`/2/aula/grade/json?pi_id=${piId}`, {
    method: 'POST',
    headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: '',
  });
  const json = await res.json();
  return (json.subjects || []).map((subj) => {
    const out = { name: String(subj.name).replace(/^\*\s*/, '').trim(), starred: /^\*/.test(subj.name), dig: [], apr: [], bim: [], items: [] };
    for (const [typeId, group] of Object.entries(subj.scores || {})) {
      const comp = TYPES[typeId];
      if (!comp) continue;
      for (const a of Object.values(group.scores || {})) {
        const v = cell(a);
        out[comp].push(v);
        out.items.push({ id: a.id, comp, name: String(a.nombre || '').trim(), date: a.fecha, value: v });
      }
    }
    return out;
  });
}

export default async function handler(req, res) {
  const q = Object.fromEntries(new URL(req.url, 'http://x').searchParams);
  const pin = process.env.NOTAS_PIN;
  const given = req.headers['x-pin'] || q.pin;
  res.setHeader('Cache-Control', 'no-store');
  // Siempre 200: el estado real va en el JSON (Vercel trata los 401 como "requiere iniciar sesión").
  if (!pin || given !== pin) return res.status(200).json({ ok: false, error: pin ? 'PIN incorrecto' : 'Falta NOTAS_PIN en Vercel' });
  try {
    const s = await login();
    const periods = await readPeriods(s);
    const bims = [];
    for (const p of periods) bims.push({ bim: p.bim, subjects: await readPeriod(s, p.id) });
    return res.status(200).json({ ok: true, at: new Date().toISOString(), bims });
  } catch (err) {
    return res.status(200).json({ ok: false, error: err.message });
  }
}
