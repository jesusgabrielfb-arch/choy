// Qué notificaciones mandarle a cada persona: lo urgente de su equipo y las noticias de sus jugadores.
// Cada aviso tiene una "clave" para no repetirlo nunca.

const NO_JUEGA = ['Out', 'IR', 'PUP', 'Sus', 'NA'];

/**
 * ligas: [{ id, nombre, titulares: [ids], plantel: [ids] }]
 * jugadores: { id: { nombre, equipo, lesion, parte } }
 * byes / byesSig: Set de equipos en bye esta semana / la que viene
 * noticias: [{ titulo, enlace, fecha }] ; desde: solo noticias más nuevas que esto (ms)
 */
export function generarAvisos({ ligas, jugadores: J, semana, byes = new Set(), byesSig = new Set(), noticias = [],
  enviados = new Set(), opciones = { equipo: true, noticias: true }, desde = 0, maxNoticias = 3 }) {
  const avisos = [];
  const agregar = (a) => { if (!enviados.has(a.clave)) avisos.push(a); };
  const n = (id) => J[id]?.nombre || id;

  if (opciones.equipo) {
    for (const l of ligas) {
      const url = `/#/liga/${l.id}/inicio`;
      const titulares = (l.titulares || []).filter((id) => id && id !== '0');
      for (const id of titulares) {
        const j = J[id];
        if (!j) continue;
        if (byes.has(j.equipo)) {
          agregar({ clave: `bye:${l.id}:${id}:${semana}`, urgente: true, url,
            titulo: `😴 ${n(id)} está de bye`, cuerpo: `Lo tienes de titular en ${l.nombre}. Cámbialo antes del partido.` });
        } else if (NO_JUEGA.includes(j.lesion) || j.lesion === 'Doubtful') {
          agregar({ clave: `les:${l.id}:${id}:${j.lesion}:${semana}`, urgente: true, url,
            titulo: `🚨 ${n(id)} ${j.lesion === 'Doubtful' ? 'casi seguro no juega' : 'no juega'}`,
            cuerpo: `Está de titular en ${l.nombre}${j.parte ? ` (${j.parte})` : ''}. Cody ya tiene el cambio listo.` });
        } else if (j.lesion === 'Questionable') {
          agregar({ clave: `duda:${l.id}:${id}:${semana}`, urgente: false, url,
            titulo: `⚠️ ${n(id)} está en duda`, cuerpo: `Titular en ${l.nombre}. Revisa el reporte antes del partido.` });
        }
      }
      const vacios = (l.titulares || []).filter((id) => !id || id === '0').length;
      if (vacios) {
        agregar({ clave: `vacio:${l.id}:${semana}`, urgente: true, url,
          titulo: `🕳️ Tienes ${vacios} puesto${vacios > 1 ? 's' : ''} vacío${vacios > 1 ? 's' : ''}`, cuerpo: `En ${l.nombre}. ¡Puntos regalados! Llénalo ya.` });
      }
      const seVan = titulares.filter((id) => byesSig.has(J[id]?.equipo));
      if (seVan.length) {
        agregar({ clave: `byesig:${l.id}:${semana + 1}`, urgente: false, url: `/#/liga/${l.id}/jugadores`,
          titulo: `📅 Semana ${semana + 1}: ${seVan.length} titular${seVan.length > 1 ? 'es' : ''} de bye`,
          cuerpo: `${seVan.map(n).join(', ')} (${l.nombre}). Pide reemplazo en waivers antes que los demás.` });
      }
    }
  }

  if (opciones.noticias) {
    const mios = new Map();
    for (const l of ligas) for (const id of l.plantel || []) if (J[id]?.nombre?.length > 6) mios.set(J[id].nombre, id);
    let cuenta = 0;
    for (const not of [...noticias].sort((a, b) => b.fecha - a.fecha)) {
      if (cuenta >= maxNoticias || (not.fecha && not.fecha < desde)) break;
      const nombre = [...mios.keys()].find((x) => not.titulo.includes(x));
      if (!nombre) continue;
      const a = { clave: `not:${not.enlace || not.titulo}`, urgente: false, url: not.enlace || '/#/noticias',
        titulo: `📰 ${nombre}`, cuerpo: not.titulo };
      if (!enviados.has(a.clave)) { avisos.push(a); cuenta++; }
    }
  }
  return avisos;
}
