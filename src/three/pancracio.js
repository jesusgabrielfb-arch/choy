// Pancracio: el pan medio quemado que vive en la cocina.
// Respira, parpadea, sigue el puntero con los ojos, salta al tocarlo y se tuesta según tus notas.
import * as THREE from 'three';
import { crustTexture, softDotTexture } from './textures.js';

const MOODS = ['happy', 'worried', 'scared', 'proud'];

export function createPancracio() {
  const root = new THREE.Group();
  root.name = 'pancracio';
  const body = new THREE.Group(); // se aplasta y estira al respirar/saltar
  root.add(body);

  // --- Cuerpo: una hogaza gordita con la base plana ---
  const loafGeo = new THREE.SphereGeometry(0.62, 64, 40);
  const pos = loafGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let y = pos.getY(i);
    if (y < -0.22) y = -0.22 + (y + 0.22) * 0.18; // base plana para pararse
    pos.setY(i, y);
  }
  loafGeo.computeVertexNormals();
  let burn = 0.45;
  const crust = new THREE.MeshStandardMaterial({ map: crustTexture(burn), roughness: 0.78, metalness: 0 });
  const loaf = new THREE.Mesh(loafGeo, crust);
  loaf.scale.set(1.25, 0.92, 0.95);
  loaf.rotation.y = -0.35; // el lado quemado mira un poco hacia el horno
  loaf.castShadow = true;
  loaf.receiveShadow = true;
  body.add(loaf);

  // Cortes del greñado (más claros, la miga asomando).
  const cutMat = new THREE.MeshStandardMaterial({ color: '#f5d9a0', roughness: 0.9 });
  for (let i = 0; i < 3; i++) {
    const cut = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.34, 6, 12), cutMat);
    cut.position.set(-0.3 + i * 0.3, 0.5 - Math.abs(i - 1) * 0.04, -0.05);
    cut.rotation.set(Math.PI / 2 - 0.25, 0, 0.75);
    cut.scale.set(1, 1, 0.5);
    body.add(cut);
  }

  // --- Cara ---
  const face = new THREE.Group();
  face.position.set(0, 0.06, 0.55);
  body.add(face);

  const white = new THREE.MeshStandardMaterial({ color: '#fffaf0', roughness: 0.35 });
  const black = new THREE.MeshStandardMaterial({ color: '#1b0f0a', roughness: 0.25 });
  const shine = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const eyes = [-1, 1].map((side) => {
    const eye = new THREE.Group();
    eye.position.set(side * 0.21, 0.07, 0.02);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.135, 32, 24), white);
    ball.scale.set(1, 1.12, 0.6);
    const pupil = new THREE.Group();
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 16), black);
    iris.scale.set(1, 1.1, 0.5);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 8), shine);
    glint.position.set(0.025, 0.035, 0.035);
    pupil.add(iris, glint);
    pupil.position.z = 0.07;
    eye.add(ball, pupil);
    face.add(eye);
    return { eye, pupil };
  });

  // Cejas: dicen mucho del estado de ánimo.
  const browMat = new THREE.MeshStandardMaterial({ color: '#3b1d0c', roughness: 0.8 });
  const brows = [-1, 1].map((side) => {
    const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.12, 4, 8), browMat);
    b.rotation.z = Math.PI / 2;
    b.position.set(side * 0.21, 0.27, 0.06);
    face.add(b);
    return b;
  });

  // Bocas para cada ánimo.
  const mouthMat = new THREE.MeshStandardMaterial({ color: '#4a1d0e', roughness: 0.6 });
  // Cada boca se centra en su geometría para que al hablar se abra sobre sí misma.
  const tube = (points) => {
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, 0.022, 8, false);
    geo.computeBoundingBox();
    const c = geo.boundingBox.getCenter(new THREE.Vector3());
    geo.translate(-c.x, -c.y, -c.z);
    const mesh = new THREE.Mesh(geo, mouthMat);
    mesh.position.copy(c);
    return mesh;
  };
  const mouths = {
    happy: tube([new THREE.Vector3(-0.11, -0.13, 0.07), new THREE.Vector3(0, -0.2, 0.09), new THREE.Vector3(0.11, -0.13, 0.07)]),
    proud: tube([new THREE.Vector3(-0.14, -0.12, 0.06), new THREE.Vector3(0, -0.22, 0.09), new THREE.Vector3(0.14, -0.12, 0.06)]),
    worried: tube([new THREE.Vector3(-0.1, -0.18, 0.07), new THREE.Vector3(0, -0.15, 0.09), new THREE.Vector3(0.1, -0.19, 0.07)]),
    scared: new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.02, 10, 24), mouthMat),
  };
  mouths.scared.position.set(0, -0.17, 0.08);
  mouths.scared.scale.set(1, 1.3, 1);
  for (const m of Object.values(mouths)) face.add(m);
  // Boca abierta para cuando habla: un óvalo oscuro con lengüita que se abre y cierra.
  const talkMouth = new THREE.Group();
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.06, 28), new THREE.MeshBasicMaterial({ color: '#3a120a' }));
  const tongue = new THREE.Mesh(new THREE.CircleGeometry(0.035, 20), new THREE.MeshBasicMaterial({ color: '#e0705a' }));
  tongue.position.set(0, -0.025, 0.001);
  talkMouth.add(hole, tongue);
  talkMouth.position.set(0, -0.165, 0.085);
  talkMouth.rotation.x = -0.25;
  talkMouth.visible = false;
  face.add(talkMouth);

  // Cachetes.
  const cheekMat = new THREE.MeshBasicMaterial({ color: '#ff8a7a', transparent: true, opacity: 0.38, depthWrite: false });
  for (const side of [-1, 1]) {
    const ch = new THREE.Mesh(new THREE.CircleGeometry(0.07, 24), cheekMat);
    ch.position.set(side * 0.36, -0.08, 0.0);
    ch.rotation.y = side * 0.55;
    ch.scale.set(1.3, 0.8, 1);
    face.add(ch);
  }

  // --- Bracitos y patitas ---
  const limbMat = new THREE.MeshStandardMaterial({ color: '#d99449', roughness: 0.7 });
  const arms = [-1, 1].map((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.72, -0.02, 0.05);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.2, 6, 12), limbMat);
    arm.position.set(side * 0.08, -0.1, 0);
    arm.rotation.z = side * 0.6;
    arm.castShadow = true;
    pivot.add(arm);
    body.add(pivot);
    return pivot;
  });
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.08, 6, 12), limbMat);
    leg.position.set(side * 0.22, -0.24, 0.12);
    leg.castShadow = true;
    root.add(leg);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), limbMat);
    foot.scale.set(1.1, 0.55, 1.4);
    foot.position.set(side * 0.22, -0.3, 0.18);
    foot.castShadow = true;
    root.add(foot);
  }

  // --- Humito del lado quemado ---
  const dot = softDotTexture();
  const smoke = [];
  const smokeGroup = new THREE.Group();
  root.add(smokeGroup);
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: '#6b5a52', transparent: true, opacity: 0, depthWrite: false }));
    s.userData = { t: Math.random(), speed: 0.18 + Math.random() * 0.14, x: 0.15 + Math.random() * 0.35, drift: (Math.random() - 0.5) * 0.3 };
    smokeGroup.add(s);
    smoke.push(s);
  }

  // --- Estado ---
  let mood = 'happy';
  const look = new THREE.Vector2(0, 0); // hacia dónde mira (-1..1)
  const lookTarget = new THREE.Vector2(0, 0);
  let blinkAt = 1.5, blinking = 0;
  let jumpT = -1;
  let wave = 0;
  let talkT = 0;   // segundos que le quedan hablando (mueve la boca)
  let danceT = -1; // celebración: giro con saltitos y brazos arriba
  const browPose = {
    happy: { y: 0.27, rot: 0 },
    proud: { y: 0.29, rot: -0.12 },
    worried: { y: 0.28, rot: 0.32 },
    scared: { y: 0.31, rot: 0.45 },
  };

  function setMood(m) {
    if (!MOODS.includes(m)) return;
    mood = m;
    for (const [k, mesh] of Object.entries(mouths)) mesh.visible = k === m;
  }
  setMood('happy');

  function setBurn(b) {
    const next = Math.max(0, Math.min(1, b));
    if (Math.abs(next - burn) < 0.04) return;
    burn = next;
    const old = crust.map;
    crust.map = crustTexture(burn);
    crust.needsUpdate = true;
    old.dispose();
  }

  function jump() { jumpT = 0; }
  function waveHello() { wave = 1.6; }
  function talk(seconds = 2) { talkT = Math.max(talkT, seconds); }
  function celebrate() { danceT = 0; jumpT = 0; }

  function update(t, dt) {
    // Respirar.
    const breath = Math.sin(t * 2.1);
    let sx = 1 + breath * 0.012, sy = 1 - breath * 0.018, y = 0;
    // Salto con aplastamiento y estiramiento.
    if (jumpT >= 0) {
      jumpT += dt;
      const p = jumpT / 0.75;
      if (p < 0.15) { sy *= 1 - p * 1.4; sx *= 1 + p * 1.2; }
      else if (p < 1) {
        const k = (p - 0.15) / 0.85;
        y = Math.sin(k * Math.PI) * 0.45;
        sy *= 1 + Math.sin(k * Math.PI) * 0.12;
        sx *= 1 - Math.sin(k * Math.PI) * 0.06;
      } else if (p < 1.25) {
        const k = (p - 1) / 0.25;
        sy *= 1 - Math.sin(k * Math.PI) * 0.12;
        sx *= 1 + Math.sin(k * Math.PI) * 0.08;
      } else jumpT = -1;
    }
    // Celebración: una vuelta completa con dos saltitos.
    let spin = 0;
    if (danceT >= 0) {
      danceT += dt;
      const p = Math.min(1, danceT / 1.6);
      spin = (1 - Math.cos(p * Math.PI)) * Math.PI; // 0 → 2π con suavizado
      if (danceT > 0.8 && danceT - dt <= 0.8) jumpT = 0;
      if (danceT > 1.9) danceT = -1;
    }
    body.scale.set(sx, sy, sx);
    body.position.y = y + (1 - sy) * -0.3;
    root.rotation.y = spin;
    root.rotation.z = Math.sin(t * 0.9) * 0.025 + (mood === 'scared' ? Math.sin(t * 38) * 0.012 : 0);
    root.rotation.x = mood === 'worried' ? Math.sin(t * 1.3) * 0.03 : 0;

    // Hablar: cambia a la boca abierta, que se abre y cierra como sílabas.
    talkT = Math.max(0, talkT - dt);
    const talking = talkT > 0;
    talkMouth.visible = talking;
    for (const [k, m] of Object.entries(mouths)) m.visible = !talking && k === mood;
    if (talking) talkMouth.scale.set(1.25, 0.25 + Math.abs(Math.sin(t * 13)) * 0.75, 1);

    // Ojos que siguen al puntero.
    look.lerp(lookTarget, Math.min(1, dt * 6));
    for (const { pupil } of eyes) pupil.position.set(look.x * 0.045, look.y * 0.04, 0.07);
    face.rotation.y = look.x * 0.12;
    face.rotation.x = -look.y * 0.08;

    // Parpadeo.
    blinkAt -= dt;
    if (blinkAt <= 0) { blinking = 0.16; blinkAt = 2.2 + Math.random() * 3.5; }
    if (blinking > 0) blinking -= dt;
    const lid = blinking > 0 ? Math.abs(Math.cos((blinking / 0.16) * Math.PI)) * 0.9 + 0.1 : 1;
    const wide = mood === 'scared' ? 1.18 : 1;
    for (const { eye } of eyes) eye.scale.set(wide, lid * wide, 1);

    // Cejas.
    const bp = browPose[mood];
    brows.forEach((b, i) => {
      const side = i === 0 ? -1 : 1;
      b.position.y += (bp.y - b.position.y) * Math.min(1, dt * 8);
      const target = Math.PI / 2 + side * bp.rot;
      b.rotation.z += (target - b.rotation.z) * Math.min(1, dt * 8);
    });

    // Brazos: balanceo; saludo cuando toca.
    wave = Math.max(0, wave - dt);
    arms.forEach((a, i) => {
      const side = i === 0 ? -1 : 1;
      const greet = i === 1 && wave > 0 ? Math.sin(t * 16) * 0.5 - 1.2 : 0;
      const cheer = danceT >= 0 ? side * -(1.9 + Math.sin(t * 20) * 0.25) : 0;
      const nervous = mood === 'scared' ? Math.sin(t * 30 + i) * 0.08 : 0;
      a.rotation.z = side * (Math.sin(t * 2.1 + i) * 0.12) + greet * -1 + cheer + nervous;
    });

    // Humo: más denso cuanto más quemado.
    const active = Math.round(burn * smoke.length);
    smoke.forEach((s, i) => {
      const u = s.userData;
      u.t += dt * u.speed;
      if (u.t > 1) { u.t -= 1; u.x = 0.1 + Math.random() * 0.4; }
      const k = u.t;
      s.position.set(u.x + Math.sin(k * 6 + i) * 0.05 + u.drift * k, 0.48 + k * 1.1, -0.1 + k * 0.1);
      const size = 0.12 + k * 0.42;
      s.scale.set(size, size, 1);
      s.material.opacity = i < active ? Math.sin(k * Math.PI) * 0.32 : 0;
    });
  }

  return {
    object: root,
    hitTarget: loaf,
    setMood,
    setBurn,
    jump,
    wave: waveHello,
    talk,
    celebrate,
    lookAt(x, y) { lookTarget.set(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y))); },
    update,
    get mood() { return mood; },
  };
}
