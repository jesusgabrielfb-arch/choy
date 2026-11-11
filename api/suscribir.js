// Guarda la suscripción de notificaciones de este dispositivo (protegido con el PIN).
import { checkPin } from './_seduca.js';
import { getSubs, saveSubs, notifyAll } from './_avisos.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ ok: true, publicKey: process.env.VAPID_PUBLIC_KEY || null });
  if (!checkPin(req).ok) return res.status(200).json({ ok: false, error: 'PIN incorrecto' });
  const sub = req.body?.subscription;
  if (!sub?.endpoint || !sub?.keys?.p256dh) return res.status(200).json({ ok: false, error: 'Suscripción no válida' });
  try {
    const subs = (await getSubs()).filter((s) => s.endpoint !== sub.endpoint);
    subs.push({ endpoint: sub.endpoint, keys: sub.keys });
    await saveSubs(subs);
    await notifyAll({ title: '¡Avisos activados! 🍞', body: 'Pancracio revisará SEDUCA cada hora y te avisará cuando salga una nota nueva.' });
    return res.status(200).json({ ok: true, devices: subs.length });
  } catch (err) {
    return res.status(200).json({ ok: false, error: err.message });
  }
}
