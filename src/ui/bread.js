// Pancracio en 2D (SVG) para las tarjetas: se tuesta según la nota y cambia de cara según el riesgo.

let uid = 0;

const mix = (a, b, t) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};

/** Nivel de quemado 0..1 a partir de una nota en décimas (5.0 = dorado perfecto). */
export function burnFor(t) {
  if (t == null) return 0.15;
  const g = t / 10;
  if (g >= 4.5) return 0.05;
  if (g >= 3) return 0.05 + ((4.5 - g) / 1.5) * 0.5;
  return Math.min(1, 0.6 + ((3 - g) / 2) * 0.4);
}

/** Cara según el estado de la materia. */
export function moodFor(kind, risky) {
  if (kind === 'lost' || kind === 'failed') return 'dead';
  if (kind === 'passed' || kind === 'safe') return 'proud';
  if (risky) return 'scared';
  return 'happy';
}

export function breadSVG({ burn = 0.3, mood = 'happy', smoke = burn > 0.55, label = '' } = {}) {
  const id = `b${uid++}`;
  const top = mix('#c9772f', '#24110a', burn);
  const mid = mix('#e9a94b', '#4a2412', burn);
  const low = mix('#f4d58d', '#7a3d1c', burn * 0.9);
  const cut = mix('#fbe7b8', '#a0623a', burn * 0.8);
  const patch = Math.min(0.85, burn * 1.1);

  const eyes = {
    happy: `<ellipse cx="44" cy="58" rx="7" ry="8" fill="#fffaf0"/><ellipse cx="76" cy="58" rx="7" ry="8" fill="#fffaf0"/>
            <circle class="pupil" cx="45" cy="59" r="4" fill="#1b0f0a"/><circle class="pupil" cx="77" cy="59" r="4" fill="#1b0f0a"/>
            <circle cx="46.5" cy="57" r="1.3" fill="#fff"/><circle cx="78.5" cy="57" r="1.3" fill="#fff"/>`,
    proud: `<path d="M37 59q7-8 14 0M69 59q7-8 14 0" stroke="#1b0f0a" stroke-width="3.2" fill="none" stroke-linecap="round"/>`,
    scared: `<ellipse cx="44" cy="57" rx="8.5" ry="10" fill="#fffaf0"/><ellipse cx="76" cy="57" rx="8.5" ry="10" fill="#fffaf0"/>
             <circle class="pupil" cx="44" cy="58" r="3.4" fill="#1b0f0a"/><circle class="pupil" cx="76" cy="58" r="3.4" fill="#1b0f0a"/>
             <path d="M34 43l14 4M86 43l-14 4" stroke="#2b140a" stroke-width="3" stroke-linecap="round"/>`,
    dead: `<path d="M38 52l12 12M50 52L38 64M70 52l12 12M82 52L70 64" stroke="#120804" stroke-width="3.4" stroke-linecap="round"/>`,
  }[mood];
  const mouth = {
    happy: `<path d="M53 72q7 7 14 0" stroke="#3a160a" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    proud: `<path d="M50 70q10 12 20 0z" fill="#5a1f0e"/><path d="M55 74q5 3 10 0" stroke="#e8735a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
    scared: `<ellipse cx="60" cy="76" rx="5" ry="6.5" fill="#3a160a"/>`,
    dead: `<path d="M51 76q4-4 9 0t9 0" stroke="#120804" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  }[mood];
  const smokeSvg = smoke
    ? `<g class="smoke" fill="none" stroke="rgba(120,104,96,.55)" stroke-width="4" stroke-linecap="round">
         <path d="M78 22c-6-6 6-10 0-16"/><path d="M90 26c-5-6 5-9 0-15" style="animation-delay:.6s"/><path d="M66 24c-5-5 5-9 0-14" style="animation-delay:1.2s"/>
       </g>`
    : '';

  return `<svg class="bread mood-${mood}" viewBox="0 0 120 112" role="img" aria-label="${label || 'Pan'}">
    <defs>
      <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${top}"/><stop offset=".55" stop-color="${mid}"/><stop offset="1" stop-color="${low}"/>
      </linearGradient>
      <radialGradient id="${id}r" cx=".78" cy=".22" r=".6">
        <stop offset="0" stop-color="#140904" stop-opacity="${patch}"/><stop offset="1" stop-color="#140904" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="${id}h" cx=".32" cy=".25" r=".5">
        <stop offset="0" stop-color="#fff6dc" stop-opacity=".55"/><stop offset="1" stop-color="#fff6dc" stop-opacity="0"/>
      </radialGradient>
    </defs>
    ${smokeSvg}
    <ellipse cx="60" cy="104" rx="44" ry="5" fill="rgba(0,0,0,.22)"/>
    <g class="bread-body">
      <path d="M10 92c-4-30 14-62 50-62s54 32 50 62c-1 7-6 10-14 10H24c-8 0-13-3-14-10z" fill="url(#${id}g)"/>
      <path d="M10 92c-4-30 14-62 50-62s54 32 50 62c-1 7-6 10-14 10H24c-8 0-13-3-14-10z" fill="url(#${id}r)"/>
      <path d="M10 92c-4-30 14-62 50-62s54 32 50 62c-1 7-6 10-14 10H24c-8 0-13-3-14-10z" fill="url(#${id}h)"/>
      <path d="M33 41l12-9M54 36l12-8M75 38l11-7" stroke="${cut}" stroke-width="5" stroke-linecap="round"/>
      <g class="face">${eyes}${mouth}
        <ellipse cx="31" cy="72" rx="7" ry="4" fill="#ff8a7a" opacity=".35"/><ellipse cx="89" cy="72" rx="7" ry="4" fill="#ff8a7a" opacity=".35"/>
      </g>
    </g>
  </svg>`;
}

/** Pinta panes en los elementos marcados con data-bread (logo, pie de página). */
export function paintStaticBreads(root = document) {
  for (const el of root.querySelectorAll('[data-bread]')) {
    const kind = el.dataset.bread;
    el.innerHTML = breadSVG({ burn: kind === 'hero' ? 0.5 : 0.42, mood: 'happy', smoke: kind === 'hero', label: 'Pancracio' });
  }
}
