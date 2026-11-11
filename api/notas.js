// Función de Vercel: entra a SEDUCA (portal de estudiantes "aula") con las claves guardadas en Vercel
// y devuelve las notas de los 4 bimestres como datos. Las claves viven en SEDUCA_USUARIO y
// SEDUCA_CLAVE y nunca llegan al navegador.

import { readAll } from './_seduca.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  // Siempre 200: el estado real va en el JSON (Vercel trata los 401 como "requiere iniciar sesión").
  try {
    return res.status(200).json({ ok: true, at: new Date().toISOString(), bims: await readAll() });
  } catch (err) {
    return res.status(200).json({ ok: false, error: err.message });
  }
}
