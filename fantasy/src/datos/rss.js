// Lector de RSS/Atom muy pequeño (sin dependencias). Funciona en Node y en el navegador.

const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function limpiarTexto(s = '') {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
      if (e[0] === '#') {
        const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : m;
      }
      return ENTIDADES[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

function etiqueta(bloque, nombre) {
  const m = bloque.match(new RegExp(`<${nombre}(?:\\s[^>]*)?>([\\s\\S]*?)</${nombre}>`, 'i'));
  return m ? m[1] : '';
}

function enlaceAtom(bloque) {
  const m = bloque.match(/<link[^>]*href="([^"]+)"[^>]*\/?>/i);
  return m ? m[1] : '';
}

/** Convierte un feed RSS o Atom en [{titulo, enlace, fecha, resumen}]. */
export function leerFeed(xml, fuente = '') {
  const items = [];
  const bloques = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const b of bloques) {
    const titulo = limpiarTexto(etiqueta(b, 'title'));
    if (!titulo) continue;
    const enlace = limpiarTexto(etiqueta(b, 'link')) || enlaceAtom(b);
    const fechaTxt = etiqueta(b, 'pubDate') || etiqueta(b, 'updated') || etiqueta(b, 'published') ||
      etiqueta(b, 'dc:date');
    const fecha = Date.parse(limpiarTexto(fechaTxt)) || 0;
    const resumen = limpiarTexto(etiqueta(b, 'description') || etiqueta(b, 'summary')).slice(0, 400);
    items.push({ titulo, enlace, fecha, resumen, fuente });
  }
  return items;
}
