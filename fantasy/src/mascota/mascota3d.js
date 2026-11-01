// La mascota en 3D: carga mascota.glb, cambia de ánimo y "habla" con un globito.
const SOLO_UNA_VEZ = new Set(['Sorpresa', 'Saludar', 'Celebrar']);

export async function crearMascota(contenedor, { compacta = false } = {}) {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  contenedor.appendChild(renderer.domElement);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(compacta ? 30 : 32, 1, 0.1, 50);
  camara.position.set(compacta ? 0.6 : 0.9, 1.45, compacta ? 5.4 : 6.0);
  camara.lookAt(0, 1.05, 0);
  escena.add(new THREE.HemisphereLight('#e8f0ff', '#1b2030', 1.6));
  const sol = new THREE.DirectionalLight('#fff3df', 2.4);
  sol.position.set(-2, 4, 4);
  escena.add(sol);
  const contra = new THREE.DirectionalLight('#7fb6ff', 1.6);
  contra.position.set(2, 3, -3);
  escena.add(contra);

  const gltf = await new GLTFLoader().loadAsync('/mascota.glb');
  const modelo = gltf.scene;
  modelo.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
  escena.add(modelo);
  const materiales = {};
  modelo.traverse((o) => {
    if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => (materiales[m.name] = m));
  });

  const mezclador = new THREE.AnimationMixer(modelo);
  const acciones = Object.fromEntries(gltf.animations.map((c) => [c.name, mezclador.clipAction(c)]));
  let actual = null;
  let animoBase = 'Reposo';

  function reproducir(nombre, { volver = true } = {}) {
    const sig = acciones[nombre] || acciones.Reposo;
    if (!sig || sig === actual) return;
    sig.reset();
    if (SOLO_UNA_VEZ.has(nombre)) {
      sig.setLoop(THREE.LoopOnce, 1);
      sig.clampWhenFinished = true;
    }
    sig.fadeIn(0.3).play();
    actual?.fadeOut(0.3);
    actual = sig;
    if (SOLO_UNA_VEZ.has(nombre) && volver) {
      const fin = (e) => {
        if (e.action !== sig) return;
        mezclador.removeEventListener('finished', fin);
        reproducir(animoBase);
      };
      mezclador.addEventListener('finished', fin);
    }
  }

  const tam = () => {
    const w = contenedor.clientWidth || 200;
    const h = contenedor.clientHeight || 200;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
  };
  tam();
  const obs = new ResizeObserver(tam);
  obs.observe(contenedor);

  const reloj = new THREE.Clock();
  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(contenedor);
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    mezclador.update(reducido ? 0 : reloj.getDelta());
    renderer.render(escena, camara);
  });

  renderer.domElement.addEventListener('click', () => reproducir('Saludar'));
  reproducir('Saludar');

  let hablando = null;
  return {
    animo(nombre) {
      animoBase = nombre === 'Hablar' ? 'Reposo' : nombre;
      reproducir(nombre);
    },
    /** Pone a hablar a la mascota el tiempo que dura el texto. */
    hablar(texto, animoFinal = 'Reposo') {
      clearTimeout(hablando);
      animoBase = animoFinal;
      reproducir('Hablar');
      hablando = setTimeout(() => reproducir(animoFinal), Math.min(6000, 900 + texto.length * 45));
    },
    vestir({ camiseta, ribete, numero = '#ffffff', borde }) {
      materiales.Camiseta?.color.set(camiseta);
      materiales.Camiseta_Ribete?.color.set(ribete);
      materiales.Numero?.color.set(numero);
      materiales.Numero_Borde?.color.set(borde || ribete);
    },
    destruir() {
      renderer.setAnimationLoop(null);
      obs.disconnect();
      io.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
