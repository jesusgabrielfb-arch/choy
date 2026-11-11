// Conexión con SEDUCA: la página le pide las notas a /api/notas (función de Vercel).
import { applyReading } from '../grades/store.js';

const SEEN_KEY = 'horno-vistos';

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };


/**
 * Trae las notas de SEDUCA y las guarda. Devuelve { ok, error, nuevas: [{ materia, nombre, nota }], primera }.
 * "nuevas" son las notas con calificación que no estaban la última vez.
 */
export async function syncNow() {
  let data;
  try {
    const res = await fetch('/api/notas', { cache: 'no-store' });
    data = await res.json();
  } catch {
    return { ok: false, error: 'No pude conectar con SEDUCA desde aquí.' };
  }
  if (!data.ok) return { ok: false, error: data.error || 'SEDUCA no respondió' };

  let seen = null;
  try { seen = new Set(JSON.parse(read(SEEN_KEY) || 'null')); } catch { seen = null; }
  const primera = !seen;
  const now = new Set();
  const nuevas = [];
  for (const b of data.bims) {
    const subjects = b.subjects.map((s) => ({
      ...s,
      portal: {},
      cells: [],
      labels: Object.fromEntries(['dig', 'apr', 'bim'].map((c) => [c, s.items.filter((i) => i.comp === c).map((i) => i.name || '')])),
    }));
    applyReading(b.bim - 1, { subjects }, { name: 'SEDUCA', readAt: Date.now() });
    for (const s of b.subjects) {
      for (const it of s.items) {
        if (!/^\d\.\d$/.test(it.value)) continue;
        const key = `${it.id}:${it.value}`;
        now.add(key);
        if (seen && !seen.has(key)) nuevas.push({ materia: s.name, nombre: it.name, nota: it.value, bim: b.bim });
      }
    }
  }
  write(SEEN_KEY, JSON.stringify([...now]));
  return { ok: true, nuevas, primera, at: data.at };
}
