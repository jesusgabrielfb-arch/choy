// Función de Vercel: guarda (o borra) la suscripción a notificaciones de un teléfono,
// con su usuario de Sleeper y sus ligas, para que /api/avisar sepa a quién avisar y de qué.
import { llaves, leerJSON, guardarJSON, borrar, claveSuscripcion, endpointValido, leerCuerpo, responder } from './_lib/almacen.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { publicKey } = await llaves();
      return responder(res, 200, { publica: publicKey });
    }
    if (req.method !== 'POST') return responder(res, 405, { error: 'Método no permitido' });
    const cuerpo = await leerCuerpo(req);
    const sub = cuerpo.suscripcion;
    if (!sub?.endpoint || !endpointValido(sub.endpoint) || !sub.keys?.p256dh || !sub.keys?.auth) {
      return responder(res, 400, { error: 'Suscripción no válida' });
    }
    const ruta = await claveSuscripcion(sub.endpoint);
    if (cuerpo.borrar) {
      await borrar(ruta);
      return responder(res, 200, { ok: true, borrada: true });
    }
    const usuarioId = String(cuerpo.usuario?.id || '').slice(0, 40);
    if (!/^\d+$/.test(usuarioId)) return responder(res, 400, { error: 'Falta el usuario de Sleeper' });
    const anterior = (await leerJSON(ruta)) || {};
    await guardarJSON(ruta, {
      suscripcion: { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
      usuario: { id: usuarioId, nombre: String(cuerpo.usuario?.nombre || '').slice(0, 40) },
      ligas: (cuerpo.ligas || []).slice(0, 15).map((l) => ({ id: String(l.id).slice(0, 30), nombre: String(l.nombre || '').slice(0, 60) })),
      opciones: { equipo: cuerpo.opciones?.equipo !== false, noticias: cuerpo.opciones?.noticias !== false },
      enviados: anterior.enviados || [],
      creado: anterior.creado || Date.now(),
      actualizado: Date.now(),
    });
    return responder(res, 200, { ok: true });
  } catch (e) {
    return responder(res, 500, { error: 'No se pudo guardar', detalle: e.message });
  }
}
