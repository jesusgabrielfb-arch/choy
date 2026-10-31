// Pancracio: una rebanada de pan de molde medio quemada, con volumen, corteza y miga.
// Respira, parpadea, gira para mirarte, habla, salta, celebra, se asusta y sale del horno.
import * as THREE from 'three';
import { crumbTexture, crustSideTexture, softDotTexture } from './textures.js';
import { toastColors } from '../grades/toast.js';

export const MOODS = ['happy', 'proud', 'worried', 'scared', 'dead'];

// Silueta de la rebanada: base recta con esquinas redondeadas y copa abombada de dos lóbulos.
export function sliceShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.4, -0.56);
  s.lineTo(0.4, -0.56);
  s.quadraticCurveTo(0.5, -0.56, 0.5, -0.46);
  s.lineTo(0.5, 0.2);
  s.bezierCurveTo(0.68, 0.24, 0.7, 0.56, 0.42, 0.63);
  s.bezierCurveTo(0.25, 0.69, 0.1, 0.63, 0, 0.6);
  s.bezierCurveTo(-0.1, 0.63, -0.25, 0.69, -0.42, 0.63);
  s.bezierCurveTo(-0.7, 0.56, -0.68, 0.24, -0.5, 0.2);
  s.lineTo(-0.5, -0.46);
  s.quadraticCurveTo(-0.5, -0.56, -0.4, -0.56);
  return s;
}

const DEPTH = 0.16, BEVEL_T = 0.06, BEVEL_S = 0.045;
export const SLICE_FRONT = DEPTH / 2 + BEVEL_T; // z de la cara delantera
const LIFT = 0.56; // la rebanada se sube para que su base quede en y = 0

function buildSlice(burn) {
  const shape = sliceShape();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: DEPTH, bevelEnabled: true, bevelThickness: BEVEL_T, bevelSize: BEVEL_S, bevelSegments: 5, curveSegments: 36,
  });
  geo.translate(0, LIFT, -DEPTH / 2);
  // UV de las caras (miga) normalizadas a la caja de la silueta para que la textura calce exacto.
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  const cap = geo.groups[0];
  for (let v = cap.start; v < cap.start + cap.count; v++) {
    uv.setXY(v, (pos.getX(v) - bb.min.x) / (bb.max.x - bb.min.x), (pos.getY(v) - bb.min.y) / (bb.max.y - bb.min.y));
  }
  uv.needsUpdate = true;
  const outline = shape.getPoints(96).map((p) => new THREE.Vector2(p.x, p.y + LIFT));
  const box = { minX: bb.min.x, maxX: bb.max.x, minY: bb.min.y, maxY: bb.max.y };
  const crumb = crumbTexture(outline, box, burn);
  const crumbMat = new THREE.MeshStandardMaterial({ map: crumb.map, bumpMap: crumb.bump, bumpScale: 1.6, roughness: 0.92, metalness: 0 });
  const crustMat = new THREE.MeshStandardMaterial({ map: crustSideTexture(burn), roughness: 0.72, metalness: 0 });
  const mesh = new THREE.Mesh(geo, [crumbMat, crustMat]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return { mesh, crumbMat, crustMat, outline, box };
}

const ease = {
  out: (k) => 1 - Math.pow(1 - k, 3),
  inOut: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  back: (k) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
};

export function createPancracio({ burn: startBurn = 0.45 } = {}) {
  const root = new THREE.Group();
  root.name = 'pancracio';
  const body = new THREE.Group(); // pivota en la base: se aplasta y estira sin despegar los pies
  body.position.y = 0.17;
  root.add(body);
  const turn = new THREE.Group(); // giro para mirar (muestra el grosor de la rebanada)
  body.add(turn);

  let burn = startBurn;
  const slice = buildSlice(burn);
  turn.add(slice.mesh);

  // --- Cara ---
  const face = new THREE.Group();
  face.position.set(0, 0.06 + LIFT, SLICE_FRONT);
  turn.add(face);

  const eyeWhite = new THREE.MeshStandardMaterial({ color: '#fffaf2', roughness: 0.12 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: '#160b06', roughness: 0.1 });
  const glintMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const lidMat = new THREE.MeshStandardMaterial({ color: toastColors(startBurn).center, roughness: 0.9 });
  const darkMat = new THREE.MeshStandardMaterial({ color: '#3a1a0b', roughness: 0.7 });

  const eyes = [-1, 1].map((side) => {
    const eye = new THREE.Group();
    eye.position.set(side * 0.2, 0.08, 0.0);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.125, 28, 20), eyeWhite);
    ball.scale.set(1, 1.15, 0.55);
    const pupil = new THREE.Group();
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.068, 20, 14), pupilMat);
    iris.scale.set(1, 1.12, 0.45);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.021, 10, 8), glintMat);
    glint.position.set(0.024, 0.032, 0.03);
    const glint2 = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), glintMat);
    glint2.position.set(-0.02, -0.022, 0.03);
    pupil.add(iris, glint, glint2);
    pupil.position.z = 0.058;
    // Párpado superior: media esfera color miga. -π/2 = escondido atrás (abierto), +π/2 = tapa el ojo.
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.132, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), lidMat);
    lid.scale.set(1, 1.15, 0.6);
    const lidPivot = new THREE.Group();
    lidPivot.add(lid);
    // Ojos en X para cuando el pan ya se quemó.
    const x = new THREE.Group();
    for (const r of [0.8, -0.8]) {
      const bar = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.16, 4, 8), darkMat);
      bar.rotation.z = r;
      x.add(bar);
    }
    x.position.z = 0.02;
    x.visible = false;
    eye.add(ball, pupil, lidPivot, x);
    face.add(eye);
    return { eye, ball, pupil, lidPivot, x };
  });

  const browMat = new THREE.MeshStandardMaterial({ color: '#4a220d', roughness: 0.8 });
  const brows = [-1, 1].map((side) => {
    const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.11, 4, 8), browMat);
    b.rotation.z = Math.PI / 2;
    b.position.set(side * 0.2, 0.29, 0.02);
    face.add(b);
    return b;
  });

  const mouthMat = new THREE.MeshStandardMaterial({ color: '#4a1a0b', roughness: 0.6 });
  const tube = (points, r = 0.021) => {
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, r, 8, false);
    geo.computeBoundingBox();
    const c = geo.boundingBox.getCenter(new THREE.Vector3());
    geo.translate(-c.x, -c.y, -c.z);
    const m = new THREE.Mesh(geo, mouthMat);
    m.position.copy(c);
    return m;
  };
  const V = (x, y, z = 0.02) => new THREE.Vector3(x, y, z);
  const mouthDark = new THREE.MeshBasicMaterial({ color: '#4a140a' });
  const tongueMat = new THREE.MeshBasicMaterial({ color: '#e46d58' });
  // Sonrisota abierta (orgulloso).
  const grin = new THREE.Group();
  const grinShape = new THREE.Shape();
  grinShape.moveTo(-0.13, 0);
  grinShape.quadraticCurveTo(0, -0.17, 0.13, 0);
  grinShape.quadraticCurveTo(0, -0.04, -0.13, 0);
  const tongueShape = new THREE.Shape();
  tongueShape.absarc(0, -0.085, 0.045, 0, Math.PI * 2);
  const tongue = new THREE.Mesh(new THREE.ShapeGeometry(tongueShape, 20), tongueMat);
  tongue.position.z = 0.001;
  tongue.scale.set(1, 0.6, 1);
  grin.add(new THREE.Mesh(new THREE.ShapeGeometry(grinShape, 24), mouthDark), tongue);
  grin.position.set(0, -0.1, 0.004);
  const mouths = {
    happy: tube([V(-0.1, -0.13), V(0, -0.19), V(0.1, -0.13)]),
    proud: grin,
    worried: tube([V(-0.1, -0.17), V(-0.035, -0.14), V(0.035, -0.18), V(0.1, -0.15)]),
    scared: new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.02, 10, 24), mouthMat),
    dead: tube([V(-0.1, -0.16), V(-0.05, -0.13), V(0, -0.17), V(0.05, -0.13), V(0.1, -0.16)]),
  };
  mouths.scared.position.set(0, -0.16, 0.02);
  mouths.scared.scale.set(1, 1.35, 1);
  for (const m of Object.values(mouths)) face.add(m);
  // Boca para hablar: se abre y cierra.
  const talkMouth = new THREE.Group();
  const holeShape = new THREE.Shape();
  holeShape.absellipse(0, 0, 0.065, 0.06, 0, Math.PI * 2);
  talkMouth.add(new THREE.Mesh(new THREE.ShapeGeometry(holeShape, 24), new THREE.MeshBasicMaterial({ color: '#3a0f07' })));
  const tt = new THREE.Mesh(new THREE.ShapeGeometry(tongueShape, 20), tongueMat);
  tt.position.set(0, 0.06, 0.001);
  tt.scale.set(0.9, 0.55, 1);
  talkMouth.add(tt);
  talkMouth.position.set(0, -0.15, 0.004);
  talkMouth.visible = false;
  face.add(talkMouth);

  const cheekMat = new THREE.MeshBasicMaterial({ color: '#ff7f6e', transparent: true, opacity: 0.42, depthWrite: false });
  for (const side of [-1, 1]) {
    const ch = new THREE.Mesh(new THREE.CircleGeometry(0.065, 24), cheekMat);
    ch.position.set(side * 0.33, -0.06, 0.003);
    ch.scale.set(1.35, 0.8, 1);
    face.add(ch);
  }

  // Gota de sudor (cuando está asustado o preocupado).
  const sweat = new THREE.Mesh(new THREE.SphereGeometry(0.035, 14, 10), new THREE.MeshStandardMaterial({ color: '#bfe6ff', roughness: 0.05, transparent: true, opacity: 0.85 }));
  sweat.scale.set(0.8, 1.2, 0.8);
  sweat.visible = false;
  turn.add(sweat);

  // --- Bracitos con guantes de cocina y patitas con zapatos ---
  const armMat = new THREE.MeshStandardMaterial({ color: '#c8843f', roughness: 0.65 });
  const mittMat = new THREE.MeshStandardMaterial({ color: '#f2efe6', roughness: 0.8 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: '#3d2416', roughness: 0.55 });
  const arms = [-1, 1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.52, 0.5, 0);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.2, 6, 12), armMat);
    upper.position.set(side * 0.06, -0.11, 0);
    upper.rotation.z = side * 0.5;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 18, 12), mittMat);
    hand.position.set(side * 0.13, -0.23, 0.02);
    hand.scale.set(1, 0.9, 0.8);
    const thumb = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), mittMat);
    thumb.position.set(side * 0.09, -0.2, 0.06);
    shoulder.add(upper, hand, thumb);
    shoulder.traverse((o) => { o.castShadow = true; });
    turn.add(shoulder);
    return shoulder;
  });
  const legs = [-1, 1].map((side) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.2, 0.17, 0);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.1, 6, 12), armMat);
    leg.position.y = -0.09;
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.085, 18, 12), shoeMat);
    shoe.scale.set(1.05, 0.62, 1.55);
    shoe.position.set(0, -0.155, 0.04);
    hip.add(leg, shoe);
    hip.traverse((o) => { o.castShadow = true; });
    root.add(hip);
    return hip;
  });

  // --- Humo del lado quemado y migas para celebrar ---
  const dot = softDotTexture();
  const smoke = Array.from({ length: 16 }, () => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: '#5e504a', transparent: true, opacity: 0, depthWrite: false }));
    s.userData = { t: Math.random(), speed: 0.16 + Math.random() * 0.14, x: 0.25 + Math.random() * 0.3, drift: (Math.random() - 0.3) * 0.35 };
    turn.add(s);
    return s;
  });
  const crumbMat = new THREE.MeshStandardMaterial({ color: '#d99a52', roughness: 0.9 });
  const crumbGeo = new THREE.BoxGeometry(0.035, 0.03, 0.03);
  const crumbs = Array.from({ length: 28 }, () => {
    const c = new THREE.Mesh(crumbGeo, crumbMat);
    c.visible = false;
    c.userData = { v: new THREE.Vector3(), life: 0 };
    root.add(c);
    return c;
  });

  // --- Estado ---
  let mood = 'happy';
  const look = new THREE.Vector2(), lookTarget = new THREE.Vector2(), lookTmp = new THREE.Vector2();
  let blinkAt = 1.2, blink = 0;
  let talkT = 0;
  let action = null; // { name, t, dur }
  let idleIn = 4 + Math.random() * 3;
  let entrance = null;
  const LID = { happy: 0.25, proud: 0.55, worried: 0.45, scared: 0, dead: 0 };
  const BROW = {
    happy: { y: 0.29, rot: 0 },
    proud: { y: 0.31, rot: -0.15 },
    worried: { y: 0.3, rot: 0.38 },
    scared: { y: 0.33, rot: 0.5 },
    dead: { y: 0.27, rot: -0.3 },
  };

  function applyMood() {
    for (const [k, m] of Object.entries(mouths)) m.visible = k === mood && talkT <= 0;
    for (const e of eyes) {
      const dead = mood === 'dead';
      e.ball.visible = !dead;
      e.pupil.visible = !dead;
      e.lidPivot.visible = !dead;
      e.x.visible = dead;
    }
  }
  function setMood(m) { if (MOODS.includes(m)) { mood = m; applyMood(); } }

  function setBurn(b) {
    const next = Math.max(0, Math.min(1, b));
    if (Math.abs(next - burn) < 0.04) return;
    burn = next;
    const crumb = crumbTexture(slice.outline, slice.box, burn);
    slice.crumbMat.map.dispose();
    slice.crumbMat.bumpMap.dispose();
    slice.crumbMat.map = crumb.map;
    slice.crumbMat.bumpMap = crumb.bump;
    slice.crustMat.map.dispose();
    slice.crustMat.map = crustSideTexture(burn);
    lidMat.color.set(toastColors(burn).center);
  }

  const play = (name, dur) => { action = { name, t: 0, dur }; };
  function burstCrumbs() {
    for (const c of crumbs) {
      c.visible = true;
      c.position.set((Math.random() - 0.5) * 0.6, 0.9 + Math.random() * 0.5, (Math.random() - 0.5) * 0.2);
      c.userData.v.set((Math.random() - 0.5) * 2.4, 1.2 + Math.random() * 1.8, (Math.random() - 0.2) * 1.2);
      c.userData.life = 1.6;
    }
  }

  /** Salir del horno: un salto en arco desde `from` hasta `to` (coordenadas del padre). */
  function enter(from, to, onLand) {
    entrance = { from: from.clone(), to: to.clone(), t: 0, dur: 1.15, onLand };
    root.position.copy(from);
    root.scale.setScalar(0.35);
  }

  function pose(name, k) {
    const s = Math.sin(k * Math.PI);
    switch (name) {
      case 'land': return { squash: s };
      case 'hop': return { y: s * 0.32, squash: k < 0.12 ? k / 0.12 : k > 0.88 ? (1 - k) / 0.12 : 0, armsUp: s * 0.6 };
      case 'jump': return { y: s * 0.55, spin: ease.inOut(k) * Math.PI * 2, squash: k < 0.1 ? k / 0.1 : k > 0.9 ? (1 - k) / 0.1 : 0, armsUp: s * 1.4 };
      case 'celebrate': return { y: Math.abs(Math.sin(k * Math.PI * 3)) * 0.35, spin: ease.inOut(Math.min(1, k * 1.4)) * Math.PI * 2, armsUp: 2.4, wiggle: Math.sin(k * 40) * 0.1 };
      case 'stretch': return { stretch: s * 0.08, armsUp: s * 2.6, eyesClosed: s };
      case 'wave': return { wave: s > 0.05 ? 1 : 0 };
      case 'lookOven': return { lookX: s * 1.1, worry: s };
      case 'wipe': return { wipe: s };
      case 'shiver': return { shiver: s };
      default: return {};
    }
  }

  function update(t, dt) {
    // Salida del horno.
    if (entrance) {
      entrance.t += dt;
      const k = Math.min(1, entrance.t / entrance.dur);
      root.position.lerpVectors(entrance.from, entrance.to, ease.out(k));
      root.position.y += Math.sin(k * Math.PI) * 1.1;
      root.scale.setScalar(0.35 + 0.65 * ease.back(Math.min(1, k * 1.3)));
      root.rotation.y = (1 - ease.out(k)) * -Math.PI * 2;
      if (k >= 1) {
        const cb = entrance.onLand;
        entrance = null;
        root.rotation.y = 0;
        root.scale.setScalar(1);
        play('land', 0.45);
        cb?.();
      }
    }

    // Acciones al azar cuando está tranquilo.
    if (!action && !entrance) {
      idleIn -= dt;
      if (idleIn <= 0) {
        const options = mood === 'scared' || mood === 'worried'
          ? ['lookOven', 'wipe', 'shiver', 'lookOven']
          : mood === 'dead' ? ['shiver'] : ['hop', 'stretch', 'wave', 'lookOven', 'hop'];
        const name = options[Math.floor(Math.random() * options.length)];
        play(name, { hop: 0.7, stretch: 1.6, wave: 1.5, lookOven: 2.2, wipe: 1.6, shiver: 1.2 }[name]);
        idleIn = 5 + Math.random() * 5;
      }
    }
    let p = {};
    if (action) {
      action.t += dt;
      const k = Math.min(1, action.t / action.dur);
      p = pose(action.name, k);
      if (k >= 1) action = null;
    }

    // Respiración + aplastar/estirar.
    const breath = Math.sin(t * 2.2);
    const squash = (p.squash || 0) * 0.22;
    const sy = 1 + breath * 0.015 + (p.stretch || 0) - squash;
    const sx = 1 - breath * 0.008 + squash * 0.7;
    body.scale.set(sx, sy, sx);
    body.position.y = 0.17 + (p.y || 0);
    for (const l of legs) l.position.y = 0.17 + (p.y || 0) * 0.92;

    // Hacia dónde mira: gira la rebanada (se ve su grosor) y mueve las pupilas.
    const lx = p.lookX != null ? Math.max(lookTarget.x, p.lookX) : lookTarget.x;
    look.lerp(lookTmp.set(lx, lookTarget.y), Math.min(1, dt * 5));
    turn.rotation.y = look.x * 0.42 + (p.spin || 0) + (p.wiggle || 0);
    turn.rotation.x = -look.y * 0.12;
    const shiver = (mood === 'scared' ? 1 : 0) + (p.shiver || 0);
    root.rotation.z = Math.sin(t * 1.1) * 0.03 + Math.sin(t * 41) * 0.012 * shiver;
    for (const e of eyes) e.pupil.position.set(look.x * 0.04, look.y * 0.035, 0.058);

    // Párpados: ánimo + parpadeo.
    blinkAt -= dt;
    if (blinkAt <= 0) { blink = 0.18; blinkAt = 2 + Math.random() * 3.5; }
    blink = Math.max(0, blink - dt);
    const closed = Math.max(blink > 0 ? Math.sin((blink / 0.18) * Math.PI) : 0, p.eyesClosed || 0);
    const base = Math.min(1, LID[mood] + (p.worry || 0) * 0.15);
    const c = Math.min(1, base + closed * (1 - base));
    const wide = mood === 'scared' ? 1.15 : 1;
    for (const e of eyes) {
      e.lidPivot.rotation.x = -Math.PI / 2 + c * Math.PI;
      e.ball.scale.set(wide, 1.15 * wide, 0.55);
    }

    // Cejas.
    const bp = BROW[mood];
    brows.forEach((b, i) => {
      const side = i === 0 ? -1 : 1;
      const worry = (p.worry || 0) * 0.3;
      b.position.y += (bp.y + (p.stretch ? 0.02 : 0) - b.position.y) * Math.min(1, dt * 8);
      const target = Math.PI / 2 + side * (bp.rot + worry);
      b.rotation.z += (target - b.rotation.z) * Math.min(1, dt * 8);
    });

    // Boca: hablando se abre y cierra.
    talkT = Math.max(0, talkT - dt);
    const talking = talkT > 0;
    talkMouth.visible = talking && mood !== 'dead';
    for (const [k, m] of Object.entries(mouths)) m.visible = k === mood && !talkMouth.visible;
    if (talking) {
      talkMouth.scale.set(1, 0.3 + Math.abs(Math.sin(t * 12.5)) * 0.8, 1);
      body.position.y += Math.abs(Math.sin(t * 12.5)) * 0.012;
    }

    // Brazos.
    arms.forEach((a, i) => {
      const side = i === 0 ? -1 : 1;
      let z = side * Math.sin(t * 2.2 + i) * 0.1;
      let x = 0;
      if (p.armsUp) z += -side * p.armsUp;
      if (p.wave && i === 1) z = -side * (2.3 + Math.sin(t * 15) * 0.35);
      if (p.wipe && i === 0) { z = -side * 2.2 * p.wipe; x = -0.5 * p.wipe; }
      if (talking && i === 1 && !p.wave) z += -side * (0.5 + Math.sin(t * 6) * 0.35);
      if (mood === 'scared' && !p.armsUp) { z += -side * 0.5; x = -0.4; }
      if (mood === 'proud' && !p.armsUp && !talking) z += side * 0.25;
      a.rotation.z += (z - a.rotation.z) * Math.min(1, dt * 12);
      a.rotation.x += (x - a.rotation.x) * Math.min(1, dt * 10);
    });

    // Gota de sudor.
    sweat.visible = mood === 'scared' || (p.wipe || 0) > 0 || (p.worry || 0) > 0.3;
    if (sweat.visible) {
      const k = (t * 0.7) % 1;
      sweat.position.set(-0.47, 1.0 - k * 0.35, SLICE_FRONT - 0.02);
      sweat.material.opacity = 0.9 * Math.sin(k * Math.PI);
    }

    // Humo según lo quemado.
    // Solo echa humo desde "muy tostado" hacia arriba.
    const active = Math.round(Math.max(0, (burn - 0.5) / 0.5) * smoke.length * (mood === 'dead' ? 1.4 : 1));
    smoke.forEach((s, i) => {
      const u = s.userData;
      u.t += dt * u.speed;
      if (u.t > 1) { u.t -= 1; u.x = 0.25 + Math.random() * 0.3; }
      const k = u.t;
      s.position.set(u.x + Math.sin(k * 6 + i) * 0.05 + u.drift * k, 1.12 + k * 1.15, 0.0);
      const size = 0.1 + k * 0.45;
      s.scale.set(size, size, 1);
      s.material.opacity = i < active ? Math.sin(k * Math.PI) * 0.34 : 0;
    });

    // Migas que caen y rebotan.
    for (const cr of crumbs) {
      const u = cr.userData;
      if (u.life <= 0) { cr.visible = false; continue; }
      u.life -= dt;
      u.v.y -= 6 * dt;
      cr.position.addScaledVector(u.v, dt);
      if (cr.position.y < 0.02) { cr.position.y = 0.02; u.v.set(u.v.x * 0.4, -u.v.y * 0.25, u.v.z * 0.4); }
      cr.rotation.x += dt * 8;
      cr.rotation.y += dt * 6;
    }
  }

  applyMood();

  return {
    object: root,
    setMood,
    setBurn,
    jump() { play('jump', 0.9); },
    wave() { play('wave', 1.6); },
    talk(seconds = 2) { talkT = Math.max(talkT, seconds); },
    celebrate() { play('celebrate', 1.9); burstCrumbs(); },
    enter,
    lookAt(x, y) { lookTarget.set(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y))); },
    update,
    get mood() { return mood; },
  };
}
