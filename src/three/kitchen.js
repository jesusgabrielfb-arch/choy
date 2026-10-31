// La cocina 3D de la portada: pared de azulejos, mesón de madera, horno retro y Pancracio.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { tilesTexture, woodTexture, cabinetTexture, ovenGlassTexture, labelTexture, softDotTexture } from './textures.js';
import { createPancracio } from './pancracio.js';

const COUNTER_Y = 1.0;

export function createKitchen(canvas, { onPancracio = () => {}, reducedMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#10272a');
  scene.fog = new THREE.Fog('#10272a', 9, 18);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  const lookAt = new THREE.Vector3(0.35, 1.45, 0);

  // --- Luces ---
  scene.add(new THREE.HemisphereLight('#ffe9c7', '#14322f', 0.85));
  const key = new THREE.DirectionalLight('#fff1db', 1.9);
  key.position.set(-3.5, 5.5, 4.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -5; key.shadow.camera.right = 5;
  key.shadow.camera.top = 4; key.shadow.camera.bottom = -2;
  key.shadow.bias = -0.0005;
  key.shadow.radius = 4;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#7fd6c8', 0.6);
  rim.position.set(4, 3, -2);
  scene.add(rim);

  // --- Pared y mesón ---
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshStandardMaterial({ map: tilesTexture(), roughness: 0.35 }));
  wall.position.set(0, 3.2, -1.7);
  wall.receiveShadow = true;
  scene.add(wall);

  const counterTop = new THREE.Mesh(
    new RoundedBoxGeometry(14, 0.12, 2.5, 3, 0.04),
    new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.55 }),
  );
  counterTop.position.set(0, COUNTER_Y - 0.06, -0.45);
  counterTop.receiveShadow = true;
  counterTop.castShadow = true;
  scene.add(counterTop);

  const cabinets = new THREE.Mesh(
    new THREE.BoxGeometry(13.8, 1.6, 2.3),
    new THREE.MeshStandardMaterial({ map: cabinetTexture(), roughness: 0.6 }),
  );
  cabinets.material.map.repeat.set(3.5, 1);
  cabinets.position.set(0, COUNTER_Y - 0.92, -0.5);
  scene.add(cabinets);

  const brass = new THREE.MeshStandardMaterial({ color: '#c9974d', metalness: 0.85, roughness: 0.3 });
  for (let i = -6; i <= 6; i++) {
    const h = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.22, 4, 8), brass);
    h.rotation.z = Math.PI / 2;
    h.position.set(i * 0.98 + 0.49, COUNTER_Y - 0.32, 0.66);
    scene.add(h);
  }

  // --- Horno retro ---
  const oven = new THREE.Group();
  oven.position.set(2.25, COUNTER_Y, -0.55);
  scene.add(oven);
  const cream = new THREE.MeshStandardMaterial({ color: '#efe1c6', roughness: 0.45 });
  const chrome = new THREE.MeshStandardMaterial({ color: '#d9dde0', metalness: 1, roughness: 0.22 });
  const dark = new THREE.MeshStandardMaterial({ color: '#2a1d18', roughness: 0.6 });
  const ovenBody = new THREE.Mesh(new RoundedBoxGeometry(2.1, 1.45, 1.35, 5, 0.16), cream);
  ovenBody.position.y = 0.78;
  ovenBody.castShadow = true;
  ovenBody.receiveShadow = true;
  oven.add(ovenBody);
  // Patas
  for (const x of [-0.85, 0.85]) for (const z of [-0.5, 0.5]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.035, 0.08, 12), chrome);
    leg.position.set(x, 0.04, z);
    oven.add(leg);
  }
  // Puerta con bisagra abajo.
  const door = new THREE.Group();
  door.position.set(-0.27, 0.2, 0.68);
  oven.add(door);
  const doorPanel = new THREE.Mesh(new RoundedBoxGeometry(1.4, 1.08, 0.08, 4, 0.05), cream);
  doorPanel.position.y = 0.54;
  doorPanel.castShadow = true;
  door.add(doorPanel);
  const glassMat = new THREE.MeshStandardMaterial({ map: ovenGlassTexture(), emissive: '#ff7a1f', emissiveIntensity: 0.55, emissiveMap: ovenGlassTexture(), roughness: 0.15 });
  const glass = new THREE.Mesh(new RoundedBoxGeometry(1.08, 0.62, 0.04, 3, 0.04), glassMat);
  glass.position.set(0, 0.5, 0.04);
  door.add(glass);
  const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 1.0, 6, 12), chrome);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0, 0.95, 0.14);
  door.add(handle);
  for (const x of [-0.5, 0.5]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 10), chrome);
    post.rotation.x = Math.PI / 2;
    post.position.set(x, 0.95, 0.08);
    door.add(post);
  }
  // Panel de perillas.
  const panel = new THREE.Mesh(new RoundedBoxGeometry(0.42, 1.1, 0.06, 3, 0.03), dark);
  panel.position.set(0.76, 0.78, 0.68);
  oven.add(panel);
  const knobs = [0, 1, 2].map((i) => {
    const k = new THREE.Group();
    k.position.set(0.76, 1.12 - i * 0.3, 0.73);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.07, 28), chrome);
    base.rotation.x = Math.PI / 2;
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.17, 0.06), cream);
    grip.position.z = 0.05;
    k.add(base, grip);
    oven.add(k);
    return k;
  });
  // Termómetro en la parte de arriba: la aguja marca el "calor" de tus notas.
  const dial = new THREE.Group();
  dial.position.set(-0.27, 1.38, 0.69);
  oven.add(dial);
  const dialFace = new THREE.Mesh(new THREE.CircleGeometry(0.13, 32), new THREE.MeshStandardMaterial({ color: '#fbf4e4', roughness: 0.4 }));
  const dialRing = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.018, 10, 40), chrome);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.11, 0.01), new THREE.MeshBasicMaterial({ color: '#c0391b' }));
  needle.geometry.translate(0, 0.045, 0);
  needle.position.z = 0.01;
  dial.add(dialFace, dialRing, needle);
  dial.scale.setScalar(1.2);

  const ovenLight = new THREE.PointLight('#ff8a3d', 2.2, 4.5, 1.6);
  ovenLight.position.set(-0.27, 0.75, 1.0);
  oven.add(ovenLight);

  // --- Utilería ---
  const glassJar = new THREE.MeshStandardMaterial({ color: '#e8f4f2', roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.32, depthWrite: false });
  const jar = new THREE.Group();
  jar.position.set(-2.55, COUNTER_Y, -0.75);
  const jarBody = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.86, 40, 1, true), glassJar);
  jarBody.position.y = 0.43;
  const flour = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.58, 40), new THREE.MeshStandardMaterial({ color: '#f8f3e8', roughness: 1 }));
  flour.position.y = 0.3;
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.3, 0.16, 32), new THREE.MeshStandardMaterial({ color: '#b98754', roughness: 0.8 }));
  lid.position.y = 0.93;
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.345, 0.345, 0.3, 40, 1, true, -0.75, 1.5),
    new THREE.MeshStandardMaterial({ map: labelTexture('HARINA'), roughness: 0.9, side: THREE.DoubleSide }),
  );
  label.position.y = 0.5;
  jar.add(jarBody, flour, lid, label);
  jar.traverse((o) => { o.castShadow = true; });
  scene.add(jar);

  const board = new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.08, 1.15, 3, 0.03), new THREE.MeshStandardMaterial({ map: woodTexture({ base: '#c8955e', dark: '#9b6a3b', seed: 9, strips: 1 }), roughness: 0.65 }));
  board.position.set(0.05, COUNTER_Y + 0.04, 0.05);
  board.receiveShadow = true;
  board.castShadow = true;
  scene.add(board);

  const pin = new THREE.Group();
  const pinWood = new THREE.MeshStandardMaterial({ color: '#d6a46a', roughness: 0.55 });
  const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.1, 28), pinWood);
  roller.rotation.z = Math.PI / 2;
  pin.add(roller);
  for (const s of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.22, 6, 12), pinWood);
    h.rotation.z = Math.PI / 2;
    h.position.x = s * 0.72;
    pin.add(h);
  }
  pin.position.set(-1.75, COUNTER_Y + 0.11, 0.45);
  pin.rotation.y = 0.35;
  pin.traverse((o) => { o.castShadow = true; });
  scene.add(pin);

  // Maceta de albahaca.
  const pot = new THREE.Group();
  pot.position.set(-3.75, COUNTER_Y, -0.9);
  const clay = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.48, 28), new THREE.MeshStandardMaterial({ color: '#c0623a', roughness: 0.85 }));
  clay.position.y = 0.24;
  pot.add(clay);
  const leafMat = new THREE.MeshStandardMaterial({ color: '#4f8a3c', roughness: 0.6 });
  for (let i = 0; i < 16; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), leafMat);
    const a = (i / 16) * Math.PI * 2, rr = 0.12 + (i % 3) * 0.07;
    leaf.position.set(Math.cos(a) * rr, 0.55 + (i % 4) * 0.08, Math.sin(a) * rr);
    leaf.scale.set(1, 0.45, 0.7);
    leaf.rotation.set(Math.random(), a, Math.random() * 0.6);
    leaf.castShadow = true;
    pot.add(leaf);
  }
  scene.add(pot);

  // Repisa con frascos.
  const shelf = new THREE.Mesh(new RoundedBoxGeometry(3.4, 0.08, 0.5, 2, 0.02), new THREE.MeshStandardMaterial({ map: woodTexture({ seed: 4 }), roughness: 0.6 }));
  shelf.position.set(-2.4, 3.05, -1.42);
  shelf.castShadow = true;
  scene.add(shelf);
  const jarColors = ['#e9b44c', '#9bc1bc', '#e4572e', '#f4f1bb'];
  jarColors.forEach((c, i) => {
    const j = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.5 - (i % 2) * 0.12, 0.34, 3, 0.08), new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 }));
    j.position.set(-3.6 + i * 0.75, 3.09 + (0.5 - (i % 2) * 0.12) / 2, -1.42);
    j.castShadow = true;
    scene.add(j);
  });

  // Lámpara colgante: cuelga de un pivote en el techo y se mece apenas.
  const lampPivot = new THREE.Group();
  lampPivot.position.set(0.1, 5.4, -0.2);
  scene.add(lampPivot);
  const lamp = new THREE.Group();
  lamp.position.y = -1.3;
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.6, 6), dark);
  cord.position.y = 0.8;
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.36, 40, 1, true), new THREE.MeshStandardMaterial({ color: '#e4572e', roughness: 0.5, side: THREE.DoubleSide }));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshBasicMaterial({ color: '#fff3c4' }));
  bulb.position.y = -0.14;
  lamp.add(cord, shade, bulb);
  lampPivot.add(lamp);

  // Reloj de pared con la hora real (el año escolar no se detiene).
  const clockGroup = new THREE.Group();
  clockGroup.position.set(2.3, 3.4, -1.64);
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.42, 48), new THREE.MeshStandardMaterial({ color: '#fbf4e4', roughness: 0.5 }));
  const clockRing = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.045, 12, 48), new THREE.MeshStandardMaterial({ color: '#c9974d', metalness: 0.8, roughness: 0.3 }));
  clockGroup.add(clockFace, clockRing);
  for (let i = 0; i < 12; i++) {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.02, i % 3 ? 0.04 : 0.08, 0.01), dark);
    const a = (i / 12) * Math.PI * 2;
    tick.position.set(Math.sin(a) * 0.34, Math.cos(a) * 0.34, 0.01);
    tick.rotation.z = -a;
    clockGroup.add(tick);
  }
  const hand = (len, w, color) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.012), new THREE.MeshBasicMaterial({ color }));
    m.geometry.translate(0, len / 2 - 0.03, 0);
    m.position.z = 0.02;
    clockGroup.add(m);
    return m;
  };
  const hourHand = hand(0.2, 0.035, '#2a1d18');
  const minuteHand = hand(0.29, 0.024, '#2a1d18');
  const secondHand = hand(0.32, 0.01, '#c0391b');
  scene.add(clockGroup);

  const lampLight = new THREE.SpotLight('#ffd9a0', 9, 7, 0.75, 0.6, 1.4);
  lampLight.position.set(0.1, 3.9, -0.2);
  lampLight.target.position.set(0.1, COUNTER_Y, 0);
  scene.add(lampLight, lampLight.target);

  // --- Pancracio ---
  const pan = createPancracio();
  const panHome = new THREE.Vector3(0.05, COUNTER_Y + 0.08, 0.05);
  pan.object.position.copy(panHome);
  scene.add(pan.object);

  // --- Polvo de harina flotando en la luz de la lámpara ---
  const dustCount = 140;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  const dustSeed = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 2.6;
    dustPos[i * 3 + 1] = COUNTER_Y + 0.3 + Math.random() * 2.6;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
    dustSeed[i] = Math.random() * 100;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    map: softDotTexture(), color: '#fff1d0', size: 0.05, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(dust);

  // --- Vapor del horno ---
  const dot = softDotTexture();
  const steam = Array.from({ length: 10 }, () => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: '#fff6ea', transparent: true, opacity: 0, depthWrite: false }));
    s.userData = { t: Math.random(), speed: 0.12 + Math.random() * 0.1, x: (Math.random() - 0.5) * 0.9 };
    scene.add(s);
    return s;
  });

  // --- Interacción ---
  const pointer = new THREE.Vector2(0, 0);
  const smooth = new THREE.Vector2(0, 0);
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function onPointerMove(e) {
    const r = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
  }
  function onPointerDown(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.intersectObject(pan.object, true).length) {
      pan.jump();
      onPancracio('poke');
    } else if (raycaster.intersectObject(oven, true).length) {
      onPancracio('oven');
    }
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  canvas.addEventListener('pointerdown', onPointerDown);

  // --- Tamaño: encuadre que funciona en iPad horizontal y en celular vertical ---
  let baseZ = 9;
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Que siempre quepan Pancracio y el horno. En pantallas anchas el texto va a la izquierda,
    // así que la cámara mira a la izquierda para que la escena quede en la mitad derecha.
    const wide = w / h >= 1 && w > 900;
    const needW = wide ? 9.4 : 5.4;
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    baseZ = Math.max(6.2, needW / 2 / Math.tan(hfov / 2));
    lookAt.x = wide ? -1.25 : 1.05;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // --- Estado expuesto ---
  let heat = 0.35, heatTarget = 0.35;
  let doorOpen = 0, doorTarget = 0;
  let needle01 = 0.3, needleTarget = 0.3;

  let busy = false, frame = 0, intro = reducedMotion ? 1 : 0;
  const timer = new THREE.Timer();
  timer.connect?.(document);
  let visible = true, raf = 0;
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) { timer.update(); loop(); }
  });
  io.observe(canvas);

  function loop() {
    raf = 0;
    if (!visible || document.hidden) return;
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.05);
    const t = timer.getElapsed();

    smooth.lerp(pointer, Math.min(1, dt * 3));
    const drift = reducedMotion ? 0 : 1;
    const dolly = (1 - (1 - Math.pow(1 - intro, 3))) * 2.2 * drift;
    camera.position.set(lookAt.x + smooth.x * 0.45 * drift + Math.sin(t * 0.3) * 0.08 * drift, 2.15 + smooth.y * 0.25 * drift + dolly * 0.25, baseZ + dolly);
    camera.lookAt(lookAt);

    // Los ojos de Pancracio siguen el puntero (proyectado desde su posición en pantalla).
    const p = pan.object.position.clone().add(new THREE.Vector3(0, 0.75, 0)).project(camera);
    pan.lookAt((pointer.x - p.x) * 1.4, (pointer.y - p.y) * 1.4);
    pan.update(t, dt);

    // Entrada de cámara, lámpara que se mece, polvo y reloj.
    intro = Math.min(1, intro + dt / 2.4);
    lampPivot.rotation.z = Math.sin(t * 0.55) * 0.035 * drift;
    lampPivot.rotation.x = Math.sin(t * 0.43 + 1) * 0.02 * drift;
    const dp = dustGeo.attributes.position.array;
    for (let i = 0; i < dustCount; i++) {
      dp[i * 3 + 1] += dt * 0.05 * Math.sin(t * 0.3 + dustSeed[i]);
      dp[i * 3] += dt * 0.04 * Math.cos(t * 0.25 + dustSeed[i]);
      if (dp[i * 3 + 1] > COUNTER_Y + 3) dp[i * 3 + 1] = COUNTER_Y + 0.3;
    }
    dustGeo.attributes.position.needsUpdate = true;
    const now = new Date();
    const sec = now.getSeconds() + now.getMilliseconds() / 1000;
    secondHand.rotation.z = -(sec / 60) * Math.PI * 2;
    minuteHand.rotation.z = -((now.getMinutes() + sec / 60) / 60) * Math.PI * 2;
    hourHand.rotation.z = -(((now.getHours() % 12) + now.getMinutes() / 60) / 12) * Math.PI * 2;

    heat += (heatTarget - heat) * Math.min(1, dt * 2);
    const flicker = 0.85 + Math.sin(t * 9) * 0.05 + Math.sin(t * 23.7) * 0.04;
    ovenLight.intensity = (1.2 + heat * 4.5) * flicker;
    glassMat.emissiveIntensity = (0.25 + heat * 1.1) * flicker;

    doorOpen += (doorTarget - doorOpen) * Math.min(1, dt * 3.5);
    door.rotation.x = doorOpen * 1.15;

    needle01 += (needleTarget - needle01) * Math.min(1, dt * 2.5);
    needle.rotation.z = THREE.MathUtils.lerp(2.2, -2.2, needle01) + Math.sin(t * 13) * 0.02 * heat;
    knobs[0].rotation.z = -needle01 * 2.4;

    steam.forEach((s, i) => {
      const u = s.userData;
      u.t += dt * u.speed * (0.6 + heat);
      if (u.t > 1) { u.t -= 1; u.x = (Math.random() - 0.5) * 0.9; }
      s.position.set(oven.position.x - 0.27 + u.x + Math.sin(u.t * 5 + i) * 0.08, oven.position.y + 1.55 + u.t * 1.4, oven.position.z + 0.1);
      const size = 0.25 + u.t * 0.7;
      s.scale.set(size, size, 1);
      s.material.opacity = Math.sin(u.t * Math.PI) * (0.05 + heat * 0.25 + doorOpen * 0.3);
    });

    // Mientras se leen capturas se dibuja 1 de cada 3 cuadros para dejarle el procesador al OCR.
    if (!busy || frame++ % 3 === 0) renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  // Pancracio sale del horno al cargar la página.
  let entered;
  const enteredPromise = new Promise((res) => { entered = res; });
  if (reducedMotion) entered();
  else {
    doorTarget = 1;
    // Compilar todos los materiales antes de esconder a Pancracio: así no hay tirón cuando aparece.
    renderer.compile(scene, camera);
    pan.object.visible = false;
    setTimeout(() => {
      pan.object.visible = true;
      const from = new THREE.Vector3(oven.position.x - 0.27, COUNTER_Y + 0.45, oven.position.z + 0.85);
      pan.enter(from, panHome, () => {
        doorTarget = 0;
        pan.wave();
        entered();
      });
    }, 700);
  }

  const onVis = () => { if (!document.hidden && visible && !raf) { timer.update(); loop(); } };
  document.addEventListener('visibilitychange', onVis);
  loop();

  return {
    pancracio: pan,
    entered: enteredPromise,
    /** 0 = horno tibio, 1 = horno a todo dar (mientras lee las capturas). */
    setHeat(v) { heatTarget = Math.max(0, Math.min(1, v)); },
    /** 0..1: posición de la aguja del termómetro (riesgo general). */
    setGauge(v) { needleTarget = Math.max(0, Math.min(1, v)); },
    openDoor(open) { doorTarget = open ? 1 : 0; },
    setBusy(v) { busy = !!v; renderer.shadowMap.autoUpdate = !busy; },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('visibilitychange', onVis);
      renderer.dispose();
    },
  };
}
