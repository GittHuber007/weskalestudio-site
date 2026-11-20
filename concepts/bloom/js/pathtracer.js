import * as THREE from 'three';
import { WebGLPathTracer } from 'three-gpu-pathtracer';
import { MeshBVH } from 'three-mesh-bvh';

/* Rendu final par lancer de rayons (path tracing) quand la piece est immobile sur une pose qui n'a pas
   d'image Cycles (bascule, dessus, angles intermediaires, zoom).
   Meme camera, meme studio (assets/studio-cycles.hdr), memes matieres que Cycles : les reflets entre les
   boules, les creux sombres et les pierres sont calcules, pas imites. Le fond est transparent : la page et
   l'ombre de contact du temps reel restent dessous.
   La scene reste fixe dans le repere du bijou : c'est la camera et le studio qui tournent autour. Ainsi la
   structure d'acceleration (BVH) n'est construite qu'une fois, dans un worker, et ne bouge plus. */

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/+esm';
const BVH_URL = 'https://cdn.jsdelivr.net/npm/three-mesh-bvh@0.7.8/+esm';

// Construction de la BVH hors du fil principal : la page reste reactive pendant ce calcul.
function createBVHWorker() {
  const src = `
    import { BufferGeometry, BufferAttribute } from '${THREE_URL}';
    import { MeshBVH } from '${BVH_URL}';
    onmessage = ({ data }) => {
      try {
        const g = new BufferGeometry();
        g.setAttribute('position', new BufferAttribute(data.position, 3));
        if (data.index) g.setIndex(new BufferAttribute(data.index, 1));
        for (const gr of data.groups) g.addGroup(gr.start, gr.count, gr.materialIndex);
        const bvh = new MeshBVH(g, data.options);
        const s = MeshBVH.serialize(bvh, { cloneBuffers: false });
        const transfer = [...s.roots];
        if (s.index) transfer.push(s.index.buffer);
        if (s.indirectBuffer) transfer.push(s.indirectBuffer.buffer);
        postMessage({ serialized: s }, transfer);
      } catch (e) { postMessage({ error: String(e && e.message || e) }); }
    };`;
  const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
  const worker = new Worker(url, { type: 'module' });
  return {
    generate(geometry, options = {}) {
      return new Promise((resolve, reject) => {
        worker.onmessage = ({ data }) => {
          if (data.error) { reject(new Error(data.error)); return; }
          const bvh = MeshBVH.deserialize(data.serialized, geometry, { setIndex: true });
          resolve(bvh);
        };
        worker.onerror = (e) => reject(new Error(e.message || 'worker'));
        const { onProgress, ...opts } = options;
        worker.postMessage({
          position: geometry.attributes.position.array.slice(),
          index: geometry.index ? geometry.index.array.slice() : null,
          groups: geometry.groups.map((g) => ({ ...g })),
          options: opts,
        });
      });
    },
    dispose() { worker.terminate(); URL.revokeObjectURL(url); },
  };
}

export function createPathTracer({ renderer, camera, model, pivotPosition, envTex, envRotation, rasterize, rasterizeShadow }) {
  const gl = renderer.getContext();
  if (!(gl instanceof WebGL2RenderingContext) || !renderer.extensions.has('EXT_color_buffer_float')) return null;

  /* ------------------------------------------------------------------ scene du rendu final (repere du bijou) */
  const scene = new THREE.Scene();
  scene.environment = envTex;
  const envQuat = new THREE.Quaternion().setFromEuler(envRotation);
  scene.background = null;           // fond transparent : la page et l'ombre de contact restent visibles dessous

  const holder = new THREE.Group();
  holder.position.copy(pivotPosition);
  scene.add(holder);
  // matieres Cycles (blender/render_turntable.py) : metal, rugosites identiques, diamant IOR 2,42
  const MATS = {
    OrRose: new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#f6b47c'), metalness: 1, roughness: 0.09 }),
    OrBlanc: new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#e6e6e9'), metalness: 1, roughness: 0.07 }),
    OrBlancSiege: new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#e6e6e9'), metalness: 1, roughness: 0.3 }),
    Diamant: new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0, transmission: 1, ior: 2.42, thickness: 1 }),
  };
  // boules : sphere lisse de 64 x 32 facettes (ecart au vrai cercle sous le demi pixel), deux fois moins de triangles
  const ball = new THREE.SphereGeometry(1, 64, 32);
  ball.deleteAttribute('uv');
  const copy = model.clone(true);
  copy.traverse((o) => {
    if (!o.isMesh) return;
    const n = (o.material && o.material.name) || '';
    o.material = n.startsWith('Diamant') ? MATS.Diamant : n.startsWith('OrBlancSiege') ? MATS.OrBlancSiege : n.startsWith('OrBlanc') ? MATS.OrBlanc : MATS.OrRose;
    if (/^Boule_/.test(o.name)) {
      o.geometry.computeBoundingSphere();
      if (Math.abs(o.geometry.boundingSphere.radius - 1) < 0.02) o.geometry = ball;
    }
  });
  holder.add(copy);
  const ptCamera = camera.clone();
  ptCamera.matrixAutoUpdate = false;

  /* ------------------------------------------------------------------ moteur */
  const pt = new WebGLPathTracer(renderer);
  pt.setBVHWorker(createBVHWorker());
  pt.renderDelay = 0;
  pt.minSamples = 3;                 // fondu des que quelques echantillons sont calcules
  pt.fadeDuration = 300;
  pt.dynamicLowRes = false;
  pt.rasterizeScene = true;
  pt.rasterizeSceneCallback = () => rasterize();
  // image finale : ombre de contact du temps reel, puis le bijou calcule par-dessus
  pt.renderToCanvasCallback = (target, r, quad) => {
    const autoClear = r.autoClear;
    if (quad.material.opacity >= 1) rasterizeShadow();      // pendant le fondu, le temps reel complet est deja dessous
    r.autoClear = false;
    quad.material.blending = THREE.NormalBlending;
    quad.material.transparent = true;
    quad.render(r);
    r.autoClear = autoClear;
  };
  pt.bounces = 5;
  pt.transmissiveBounces = 8;
  pt.filterGlossyFactor = 0.35;      // limite les points blancs isoles sur l'or poli
  pt.multipleImportanceSampling = true;


  const state = { ready: false, active: false, done: false, key: '', disabled: false, samples: 0, buildMs: 0 };
  let maxSamples = 64, sampleMarks = [], lastStepAt = 0, slowSteps = 0;

  // pose du monde -> repere du bijou : M = T(p) . R(q)^-1 . T(-p)
  const M = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpM = new THREE.Matrix4();
  function applyPose(pose) {
    const p = pivotPosition;
    tmpQ.copy(pose.quaternion).invert();
    M.makeTranslation(p.x, p.y, p.z).multiply(tmpM.makeRotationFromQuaternion(tmpQ)).multiply(new THREE.Matrix4().makeTranslation(-p.x, -p.y, -p.z));
    // camera : memes reglages (champ, zoom, decalage de cadrage), placee dans le repere du bijou
    ptCamera.copy(camera, false);
    ptCamera.matrixAutoUpdate = false;
    camera.updateMatrixWorld();
    ptCamera.matrix.multiplyMatrices(M, camera.matrixWorld);
    ptCamera.matrixWorld.copy(ptCamera.matrix);
    ptCamera.matrixWorldInverse.copy(ptCamera.matrixWorld).invert();
    ptCamera.projectionMatrix.copy(camera.projectionMatrix);
    ptCamera.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    // studio : meme rotation
    scene.environmentRotation.setFromQuaternion(tmpQ.clone().multiply(envQuat));
  }

  // premiere construction dans le worker, des la creation (la page affiche alors l'image Cycles)
  const t0 = performance.now();
  applyPose({ quaternion: new THREE.Quaternion(), floorY: -6 });
  const readyP = pt.setSceneAsync(scene, ptCamera).then(() => {
    state.ready = true;
    state.buildMs = performance.now() - t0;
    // compilation du shader en arriere-plan des maintenant (compilation parallele du navigateur),
    // pour qu'elle soit finie quand la piece s'arretera sur une pose sans image Cycles
    const core = pt._pathTracer;
    const tc = performance.now();
    const p = core.compileMaterial();
    core._compilePromise = p;
    p.then(() => { if (core._compilePromise === p) core._compilePromise = null; state.compileMs = performance.now() - tc; });
  }).catch((e) => { state.disabled = true; console.warn('Lancer de rayons indisponible.', e); });

  function tilesFor(pixels) {
    // un morceau d'image par trame pour garder la page reactive au moindre geste
    const n = Math.max(1, Math.ceil(Math.sqrt(pixels / 600000)));
    pt.tiles.set(n, n);
  }

  return {
    readyP, engine: pt, scene,
    get samples() { return pt.samples; },
    get state() { return state; },
    set maxSamples(v) { maxSamples = v; },
    get maxSamples() { return maxSamples; },
    start(pose) {
      if (state.disabled || !state.ready) return;
      applyPose(pose);
      const size = renderer.getDrawingBufferSize(new THREE.Vector2());
      tilesFor(size.x * size.y);
      const t = performance.now();
      pt.setScene(scene, ptCamera);          // seul le sol a bouge : simple reajustement de la BVH
      state.updateMs = performance.now() - t;
      state.active = true; state.done = false; state.key = pose.key;
      state.startedAt = performance.now(); state.convergedMs = 0; sampleMarks = []; lastStepAt = 0; slowSteps = 0;
    },
    stop() { state.active = false; state.done = false; state.key = ''; },
    // une trame : true tant qu'il reste du calcul
    step() {
      if (!state.active || state.done) return false;
      const now = performance.now();
      if (pt.isCompiling) {
        // shader encore en compilation (il demarre des le chargement) : le temps reel reste affiche
        state.startedAt = now; lastStepAt = 0;
        return 'wait';
      }
      // trames trop longues (appareil lent) : la page ne doit jamais devenir lourde, on reste en temps reel
      if (lastStepAt && now - lastStepAt > 350) slowSteps++; else slowSteps = Math.max(0, slowSteps - 1);
      lastStepAt = now;
      if (slowSteps >= 3 && !window.__ptForce) { state.disabled = true; state.active = false; state.reason = 'trames lentes'; rasterize(); return false; }
      pt.renderSample();
      const s = Math.floor(pt.samples);
      if (s > sampleMarks.length) {
        sampleMarks.push(now);
        if (s === 1) state.firstSampleMs = now - state.startedAt;
        // duree d'un echantillon complet (hors compilation) : appareil trop lent -> temps reel seul
        if (s === 2) {
          state.sampleMs = sampleMarks[1] - sampleMarks[0];
          if (state.sampleMs > 1500 && !window.__ptForce) { state.disabled = true; state.active = false; state.reason = 'echantillon lent'; rasterize(); return false; }
        }
      }
      state.samples = pt.samples;
      if (pt.samples >= maxSamples) {
        state.done = true;
        state.convergedMs = now - state.startedAt;
        return false;
      }
      return true;
    },
  };
}
