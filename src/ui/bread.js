// Pancracio en pequeño (logo, tarjetas, tutorial): dibujo SVG de la misma rebanada del modelo 3D. Se tuesta según la nota y cambia de cara según el riesgo.

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

// Silueta de la rebanada (misma forma que el modelo 3D).
const SLICE = 'M28 104h64q8 0 8-8V52c13-3 15-26-6-32-14-4-24 1-34 2-10-1-20-6-34-2-21 6-19 29-6 32v44q0 8 8 8z';

export function breadSVG({ burn = 0.3, mood = 'happy', smoke = burn > 0.55, label = '' } = {}) {
  return drawSVG({ burn, mood, smoke, label });
}

function drawSVG({ burn, mood, smoke, label }) {
  const id = `b${uid++}`;
  const crust = mix('#b4682b', '#2a1209', Math.min(1, burn * 1.1));
  const crumbIn = mix('#fbecc6', '#d9a866', burn * 0.5);
  const crumbOut = mix('#e2b46a', '#7a3d1c', burn * 0.8);
  const char = Math.min(0.9, 0.2 + burn * 0.8);

  const eyes = {
    happy: `<ellipse cx="47" cy="60" rx="7.5" ry="8.5" fill="#fffaf0"/><ellipse cx="73" cy="60" rx="7.5" ry="8.5" fill="#fffaf0"/>
            <circle class="pupil" cx="48" cy="61" r="4.2" fill="#1b0f0a"/><circle class="pupil" cx="74" cy="61" r="4.2" fill="#1b0f0a"/>
            <circle cx="49.6" cy="59" r="1.4" fill="#fff"/><circle cx="75.6" cy="59" r="1.4" fill="#fff"/>`,
    proud: `<path d="M40 61q7-8 14 0M66 61q7-8 14 0" stroke="#1b0f0a" stroke-width="3.4" fill="none" stroke-linecap="round"/>`,
    scared: `<ellipse cx="47" cy="59" rx="9" ry="10.5" fill="#fffaf0"/><ellipse cx="73" cy="59" rx="9" ry="10.5" fill="#fffaf0"/>
             <circle class="pupil" cx="47" cy="60" r="3.4" fill="#1b0f0a"/><circle class="pupil" cx="73" cy="60" r="3.4" fill="#1b0f0a"/>
             <path d="M37 45l13 4M83 45l-13 4" stroke="#3b1a0a" stroke-width="3" stroke-linecap="round"/>`,
    dead: `<path d="M41 54l12 12M53 54L41 66M67 54l12 12M79 54L67 66" stroke="#120804" stroke-width="3.6" stroke-linecap="round"/>`,
  }[mood] || '';
  const mouth = {
    happy: `<path d="M53 76q7 7 14 0" stroke="#3a160a" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    proud: `<path d="M50 74q10 13 20 0z" fill="#5a1f0e"/><path d="M55 78q5 3 10 0" stroke="#e8735a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
    scared: `<ellipse cx="60" cy="80" rx="5" ry="6.5" fill="#3a160a"/>`,
    dead: `<path d="M51 80q4-4 9 0t9 0" stroke="#120804" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  }[mood] || '';
  const smokeSvg = smoke
    ? `<g class="smoke" fill="none" stroke="rgba(120,104,96,.55)" stroke-width="4" stroke-linecap="round">
         <path d="M86 18c-6-6 6-10 0-16"/><path d="M98 24c-5-6 5-9 0-15" style="animation-delay:.6s"/><path d="M74 16c-5-5 5-9 0-14" style="animation-delay:1.2s"/>
       </g>`
    : '';

  return `<svg class="bread mood-${mood}" viewBox="0 0 120 120" role="img" aria-label="${label || 'Pancracio'}">
    <defs>
      <radialGradient id="${id}m" cx=".45" cy=".55" r=".6">
        <stop offset="0" stop-color="${crumbIn}"/><stop offset=".7" stop-color="${mix('#f2d79f', '#b07a40', burn * 0.6)}"/><stop offset="1" stop-color="${crumbOut}"/>
      </radialGradient>
      <linearGradient id="${id}q" x1="0" y1="0" x2="1" y2="0">
        <stop offset=".45" stop-color="#160904" stop-opacity="0"/><stop offset="1" stop-color="#160904" stop-opacity="${char}"/>
      </linearGradient>
      <pattern id="${id}p" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
        <ellipse cx="3" cy="3" rx="1.4" ry="0.9" fill="#9a6028" opacity=".35"/><ellipse cx="7" cy="7" rx="0.9" ry="0.6" fill="#9a6028" opacity=".3"/>
      </pattern>
      <clipPath id="${id}c"><path d="${SLICE}"/></clipPath>
    </defs>
    ${smokeSvg}
    <ellipse cx="60" cy="113" rx="40" ry="5" fill="rgba(0,0,0,.22)"/>
    <g class="bread-body">
      <path d="${SLICE}" transform="translate(3 3)" fill="${mix('#8a4a1c', '#1a0a05', burn)}"/>
      <path d="${SLICE}" fill="url(#${id}m)" stroke="${crust}" stroke-width="7" stroke-linejoin="round"/>
      <g clip-path="url(#${id}c)">
        <rect width="120" height="120" fill="url(#${id}p)"/>
        ${burn > 0.15 ? `<path d="M10 116L50 10M38 116L78 10M66 116L106 10" stroke="#8a4a18" stroke-width="7" opacity="${Math.min(0.28, burn * 0.35)}"/>` : ''}
        <rect width="120" height="120" fill="url(#${id}q)"/>
      </g>
      <g class="face">${eyes}${mouth}
        <ellipse cx="35" cy="73" rx="7" ry="4" fill="#ff8a7a" opacity=".4"/><ellipse cx="85" cy="73" rx="7" ry="4" fill="#ff8a7a" opacity=".4"/>
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
