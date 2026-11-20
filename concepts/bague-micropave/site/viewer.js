// Visualiseur temps reel de la bague (three.js r187, servi en local).
// Modele : site/3d/bague.glb, exporte de blender/build_ring.py par blender/export_web.py.
// Studios : les deux environnements procéduraux de blender/render.py (metal : tente claire ; pierres : studio contraste).
// Diamants : lancer de rayon exact dans le polyedre de chaque taille (plans des facettes de site/3d/pierres.json),
// refraction IOR 2,417, Fresnel exact, reflexions totales internes, dispersion a la sortie.
// Rendu a la demande : aucune image n'est calculee quand rien ne bouge.
// La page charge site/build/viewer.js (three r187, three-gpu-pathtracer 0.0.28, three-mesh-bvh 0.9.18 et ces sources,
// minifies ; le path tracing est un morceau separe charge a la demande). Reconstruction : site/build/construire.mjs
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';

const ASSETS = 'site/3d/';
const DRACO_PATH = 'site/vendor/three/examples/jsm/libs/draco/gltf/';

// couleurs de base lineaires et rugosite : memes valeurs que blender/render.py
export const METALS = {
  blanc: { base: [0.790, 0.820, 0.885], rough: 0.020 },   // or blanc rhodie : argent froid (photo Liori)
  platine: { base: [0.700, 0.690, 0.665], rough: 0.045 },
  jaune: { base: [0.960, 0.700, 0.390], rough: 0.035 },
  rose: { base: [0.950, 0.610, 0.505], rough: 0.035 },
};

// cadrage du turntable Cycles : objectif 135 mm (capteur 24 mm), cadre de 33 mm, cible a 4,6 mm, elevation 16 degres
const FRAME_MM = 33.0;
const VFOV = 2 * Math.atan(12 / 135) * 180 / Math.PI;
const PIVOT_Z = 4.6;                   // centre de rotation (mm, axe vertical du modele)
const ELEV = THREE.MathUtils.degToRad(16);
const GROUND = -(9.4 + PIVOT_Z) - 0.05; // sous le bas de l'anneau (R_OUT = 9,4 mm), et sous toute orientation (rayon englobant 14,1 mm)

const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
// orientations de la bague (camera fixe, c'est la bague qui tourne)
const CAM_DIR = new THREE.Vector3(0, Math.sin(ELEV), Math.cos(ELEV));
function cameraBasis(z, rollDeg) {
  const y = Y.clone().sub(z.clone().multiplyScalar(z.dot(Y))).normalize();
  const x = y.clone().cross(z).normalize();
  if (rollDeg) {
    const r = THREE.MathUtils.degToRad(rollDeg), c = Math.cos(r), s = Math.sin(r);
    const x2 = x.clone().multiplyScalar(c).addScaledVector(y, s), y2 = y.clone().multiplyScalar(c).addScaledVector(x, -s);
    return [x2, y2, z];
  }
  return [x, y, z];
}
// orientation qui montre la bague comme une camera Cycles de blender/render.py (direction cible -> camera en repere
// Blender, roulis en degres, ou angle de la tete dans l'image comme VIEW_HEADANG)
function fromCycles(dirB, rollDeg = 0, headAngDeg = null) {
  const z = new THREE.Vector3(dirB[0], dirB[2], -dirB[1]).normalize();
  let roll = rollDeg;
  if (headAngDeg !== null) {
    const [x0, y0] = cameraBasis(z, 0);
    roll = THREE.MathUtils.radToDeg(Math.atan2(Y.dot(y0), Y.dot(x0))) - headAngDeg;
  }
  const [xc, yc, zc] = cameraBasis(z, roll);
  const [xm, ym, zm] = cameraBasis(CAM_DIR, 0);
  const Bc = new THREE.Matrix4().makeBasis(xc, yc, zc), Bm = new THREE.Matrix4().makeBasis(xm, ym, zm);
  return new THREE.Quaternion().setFromRotationMatrix(Bm.multiply(Bc.transpose()));
}
const qa = (axis, deg) => new THREE.Quaternion().setFromAxisAngle(axis, THREE.MathUtils.degToRad(deg));
// Pose de la photo produit du site Liori (references/render-1.jpg, 1100 px) : point de depart de la camera Cycles
// "dessus" de render.py (direction, roulis 180, cible, cadre de 19,6 mm), puis ajustement fin par superposition
// des silhouettes (controle/photo-site/ajuste.js) : petites rotations (degres), zoom, decalage de cadre (mm).
export const PHOTOS = {
  // Front : references/render-1.jpg ; ajustement controle/photo-site/ajuste.js (IoU des silhouettes 0,904 -> 0,936)
  front: {
    src: 'references/render-1.jpg', dir: [0, 0.36, 0.933], roll: 180, target: [0, 0.6, 11.2], frame: 19.6,
    fit: { yaw: -0.875, pitch: -2.625, roll: -0.0625, zoom: 1.0394, sx: 0.1875, sy: -0.3375 },
  },
  // Profile : references/render-3.jpg (camera "face" de render.py)
  profile: {
    src: 'references/render-3.jpg', dir: [0, -0.985, 0.17], roll: 0, target: [0, 0, 4.5], frame: 29.5,
    // controle/photo-site/ajuste.js profile render-3.jpg : IoU des silhouettes 0,899 -> 0,955
    fit: { yaw: 10.625, pitch: 6.125, roll: 4, zoom: 1.03, sx: 0.3, sy: 0 },
  },
};
export const PHOTO = PHOTOS.front;
export function photoPose(fit, key = 'front') {
  const P = PHOTOS[key];
  fit = fit || P.fit;
  const q = fromCycles(P.dir, P.roll);
  q.premultiply(qa(Y, fit.yaw)).premultiply(qa(X, fit.pitch)).premultiply(qa(CAM_DIR, fit.roll));
  const t = new THREE.Vector3(P.target[0], P.target[2] - PIVOT_Z, -P.target[1]).applyQuaternion(q);
  const up = Y.clone().sub(CAM_DIR.clone().multiplyScalar(CAM_DIR.y)).normalize();
  t.addScaledVector(X, fit.sx).addScaledVector(up, fit.sy);
  // la composante de la cible le long de l'axe de visee est reportee sur la distance (camera identique) : la cible
  // reste dans le plan du pivot, et le recentrage pendant l'interaction ne fait que glisser l'image, sans changer sa taille
  const K = (FRAME_MM / 2) / Math.tan(THREE.MathUtils.degToRad(VFOV / 2));
  const zoom = FRAME_MM / P.frame * fit.zoom;
  const d = t.dot(CAM_DIR);
  t.addScaledVector(CAM_DIR, -d);
  return { q, zoom: K / (K / zoom + d), target: t };
}
export const VIEWS = {
  face: new THREE.Quaternion(),                                        // axe du doigt vers l'objectif (turntable, rendu 3)
  profil: qa(Y, 90),                                                   // de cote : la tete et les lames de profil
  dessus: fromCycles([0, 0.36, 0.933], 180),                           // vue "dessus" de render.py (rendu 1) : table, gravure lisible
  dos: fromCycles([-0.70, 0.58, -0.30], 0, 25),                        // vue "dos" de render.py (rendu 4) : de dessous et de l'arriere
  dessous: qa(X, -90 - 16),
  top: fromCycles([0, 0.0001, 1], 180),                               // vue de dessus, a la verticale (table vers l'objectif)                                            // le dessous de l'anneau face a l'objectif
  biais: qa(Y, -38).multiply(qa(X, 8)),                                // trois quarts (proche de premier-rendu.jpg)
};

/* ------------------------------------------------------------------ shader diamant */
const DIAMOND_VS = /* glsl */`
  varying vec3 vPos;
  varying vec3 vCam;
  void main() {
    vPos = position;
    vCam = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }`;
const DIAMOND_FS = /* glsl */`
  #define MAXP 128
  uniform mat4 modelMatrix;
  uniform samplerCube uEnv;
  uniform vec4 uPlanes[MAXP];
  uniform int uCount;          // facettes (couronne, table, pavillon)
  uniform float uGirdleR;      // rondiste : cylindre d'axe Y (ses facettes de polissage sont trop etroites pour se voir)
  uniform float uIor, uSpread, uBright, uLod, uPavDim;
  uniform vec3 uPavTint;
  uniform int uBounces;
  varying vec3 vPos;
  varying vec3 vCam;

  vec3 envW(vec3 d) { return textureLod(uEnv, normalize(mat3(modelMatrix) * d), uLod).rgb; }

  // Fresnel dielectrique exact ; eta = n(transmis) / n(incident)
  float fresnel(float ci, float eta) {
    float st2 = (1.0 - ci * ci) / (eta * eta);
    if (st2 >= 1.0) return 1.0;
    float ct = sqrt(1.0 - st2);
    float rs = (ci - eta * ct) / (ci + eta * ct);
    float rp = (eta * ci - ct) / (eta * ci + ct);
    return 0.5 * (rs * rs + rp * rp);
  }

  void main() {
    vec3 V = normalize(vPos - vCam);
    // facette touchee : le plan le plus proche du point (normale exacte, sans derivees d'ecran)
    vec3 N = vec3(0.0, 1.0, 0.0);
    float best = abs(length(vPos.xz) - uGirdleR);
    if (vPos.x * V.x + vPos.z * V.z < 0.0) N = normalize(vec3(vPos.x, 0.0, vPos.z)); else best = 1e9;
    for (int i = 0; i < MAXP; i++) {
      if (i >= uCount) break;
      vec4 P = uPlanes[i];
      float e = abs(dot(P.xyz, vPos) - P.w);
      if (e < best && dot(P.xyz, V) < 0.0) { best = e; N = P.xyz; }
    }
    float ci = clamp(-dot(V, N), 0.0, 1.0);
    float Fe = fresnel(ci, uIor);
    vec3 col = envW(reflect(V, N)) * Fe;

    vec3 iors = vec3(uIor - 0.35 * uSpread, uIor, uIor + 0.65 * uSpread);   // C / d / F (Abbe ~ 55, ecart amplifie)
    vec3 o = vPos;
    vec3 d = refract(V, N, 1.0 / uIor);
    float w = 1.0 - Fe;
    for (int b = 0; b < 8; b++) {
      if (b >= uBounces) break;
      // sortie d'un polyedre convexe : premier plan franchi vers l'exterieur
      // rondiste : sortie du cylindre (depuis l'interieur, racine positive)
      float a = dot(d.xz, d.xz), bq = dot(o.xz, d.xz), cq = dot(o.xz, o.xz) - uGirdleR * uGirdleR;
      float tmin = a > 1e-8 ? (-bq + sqrt(max(bq * bq - a * cq, 0.0))) / a : 1e9;
      int k = -2;
      for (int i = 0; i < MAXP; i++) {
        if (i >= uCount) break;
        vec4 P = uPlanes[i];
        float dn = dot(P.xyz, d);
        if (dn > 1e-5) {
          float t = (P.w - dot(P.xyz, o)) / dn;
          if (t < tmin) { tmin = t; k = i; }
        }
      }
      o += d * max(tmin, 0.0);
      vec3 n = k >= 0 ? uPlanes[k].xyz : normalize(vec3(o.x, 0.0, o.z));
      float c = dot(d, n);
      float F = fresnel(c, 1.0 / uIor);
      if (F < 1.0) {
        vec3 add = vec3(0.0);
        vec3 e = refract(d, -n, iors.r); if (dot(e, e) > 0.0) add.r = envW(e).r;
        e = refract(d, -n, iors.g);      if (dot(e, e) > 0.0) add.g = envW(e).g;
        e = refract(d, -n, iors.b);      if (dot(e, e) > 0.0) add.b = envW(e).b;
        if (n.y < -0.1) add *= uPavDim * uPavTint;            // sortie par le pavillon : vers le metal du siege
        col += w * (1.0 - F) * add * uBright;
      }
      w *= F;
      d = reflect(d, n);
      if (w < 0.01) break;
    }
    col += w * envW(d) * 0.4 * uBright;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

function diamondMaterial(allPlanes, env, opts) {
  // facettes d'abord ; les facettes du rondiste (normale horizontale) sont remplacees par un cylindre
  const girdle = allPlanes.filter((p) => Math.abs(p[1]) < 1e-3);
  const planes = allPlanes.filter((p) => Math.abs(p[1]) >= 1e-3);
  const girdleR = girdle.reduce((s, p) => s + p[3], 0) / Math.max(1, girdle.length);
  const arr = [];
  for (let i = 0; i < 128; i++) {
    const p = planes[i] || [0, 1, 0, 1e6];
    arr.push(new THREE.Vector4(p[0], p[1], p[2], p[3]));
  }
  return new THREE.ShaderMaterial({
    name: opts.name,
    uniforms: {
      uEnv: { value: env },
      uPlanes: { value: arr },
      uCount: { value: Math.min(128, planes.length) },
      uGirdleR: { value: girdleR },
      uIor: { value: 2.417 },
      uSpread: { value: opts.spread },
      uBright: { value: opts.bright },
      uLod: { value: opts.lod },
      uPavDim: { value: opts.pavDim },
      uPavTint: { value: new THREE.Color(1, 1, 1) },
      uBounces: { value: opts.bounces },
    },
    vertexShader: DIAMOND_VS,
    fragmentShader: DIAMOND_FS,
  });
}

/* ------------------------------------------------------------------ ombre de contact (rendue seulement quand la bague tourne) */
function contactShadow(renderer, subject) {
  const SIZE = 60, RES = 512, HEIGHT = 3, DARK = 0.18;   // tres legere et courte, comme le turntable Cycles
  const mk = () => { const t = new THREE.WebGLRenderTarget(RES, RES, { type: THREE.HalfFloatType }); t.texture.generateMipmaps = false; return t; };
  const rtA = mk(), rtB = mk();
  const cam = new THREE.OrthographicCamera(-SIZE / 2, SIZE / 2, SIZE / 2, -SIZE / 2, 0, HEIGHT);
  cam.position.set(0, GROUND, 0);
  cam.rotation.x = Math.PI / 2;                // regarde vers le haut
  cam.updateMatrixWorld();
  const depthMat = new THREE.ShaderMaterial({
    uniforms: { uGround: { value: GROUND }, uH: { value: HEIGHT }, uDark: { value: DARK } },
    vertexShader: 'uniform float uGround; varying float vH; void main(){ vec4 w = modelMatrix * vec4(position,1.); vH = w.y - uGround; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: 'uniform float uH; uniform float uDark; varying float vH; void main(){ float a = clamp(1.0 - vH / uH, 0.0, 1.0); gl_FragColor = vec4(0.0, 0.0, 0.0, a * a * a * uDark); }',
    side: THREE.DoubleSide,
  });
  const blurMat = new THREE.ShaderMaterial({
    uniforms: { tMap: { value: null }, uDir: { value: new THREE.Vector2() } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `uniform sampler2D tMap; uniform vec2 uDir; varying vec2 vUv;
      void main(){
        vec4 s = texture2D(tMap, vUv) * 0.1964825501511404;
        s += (texture2D(tMap, vUv + uDir * 1.411764705882353) + texture2D(tMap, vUv - uDir * 1.411764705882353)) * 0.2969069646728344;
        s += (texture2D(tMap, vUv + uDir * 3.2941176470588234) + texture2D(tMap, vUv - uDir * 3.2941176470588234)) * 0.09447039785044732;
        s += (texture2D(tMap, vUv + uDir * 5.176470588235294) + texture2D(tMap, vUv - uDir * 5.176470588235294)) * 0.010381362401148057;
        gl_FragColor = s;
      }`,
    depthTest: false, depthWrite: false,
  });
  const quadScene = new THREE.Scene();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blurMat);
  quad.frustumCulled = false;
  quadScene.add(quad);
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const tmpScene = new THREE.Scene();
  tmpScene.overrideMaterial = depthMat;

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(SIZE, SIZE),
    new THREE.MeshBasicMaterial({ map: rtA.texture, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
  );
  plane.rotation.x = -Math.PI / 2;
  plane.scale.y = -1;                         // le haut de l'image de la camera d'ombre = +Z du monde
  plane.position.y = GROUND;
  plane.renderOrder = -1;

  function blur(px) {
    const s = px / RES;
    blurMat.uniforms.tMap.value = rtA.texture; blurMat.uniforms.uDir.value.set(s, 0);
    renderer.setRenderTarget(rtB); renderer.render(quadScene, quadCam);
    blurMat.uniforms.tMap.value = rtB.texture; blurMat.uniforms.uDir.value.set(0, s);
    renderer.setRenderTarget(rtA); renderer.render(quadScene, quadCam);
  }
  function update() {
    const parent = subject.parent;
    tmpScene.add(subject);
    const cc = renderer.getClearColor(new THREE.Color()), ca = renderer.getClearAlpha();
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(rtA);
    renderer.clear();
    renderer.render(tmpScene, cam);
    blur(1.4); blur(1.0); blur(0.6);
    renderer.setRenderTarget(null);
    renderer.setClearColor(cc, ca);
    parent.add(subject);
  }
  return { plane, update };
}

/* ------------------------------------------------------------------ visualiseur */
// A l'arret, trois etats :
//  - "cycles" : la pose est droite (bascule < 6 degres, sans zoom) : la bague se cale sur l'angle du turntable
//    Cycles le plus proche (pas de 5 degres) et l'image Cycles exacte apparait en fondu de 200 ms ;
//  - "pt" puis "pt-fini" : ailleurs, path tracing progressif WebGPU (site/pathtrace.js) qui s'arrete une fois converge ;
//  - "repos" : temps reel seul (path tracing desactive, pas de WebGPU, appareil trop lent, image indisponible).
// Le path tracing est desactive par defaut (version stable) : option pathTracing, ou ?pt=1 sur la page.
// Au moindre geste : retour immediat au temps reel ("direct"). 8 s apres le dernier geste : retour a la vue de depart.
const SNAP_TILT = THREE.MathUtils.degToRad(6);
const TT_FRAMES = 72, TT_STEP = 5;
const HOME_DELAY = 8000;
const PT_TARGET = 128;            // echantillons par pixel (minimum sur l'image) avant arret
const PT_SHOW = 8;                // premier affichage, en fondu
const PT_MAX_SECONDS = 90;        // au-dela (estime apres 4 s de rendu), l'appareil est juge trop lent

export function createViewer({ canvas, overlay = null, base = '', fill = 1, pathTracing = false, cyclesFrames = false, shadow: withShadow = false, onProgress = () => {}, onReady = () => {}, onError = () => {}, onFirstInteraction = () => {}, onViewChange = () => {}, onMode = () => {} }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    onError(e);
    return null;
  }
  const DPR_MAX = Math.min(window.devicePixelRatio || 1, 3);
  let dpr = DPR_MAX;
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;            // vue "Standard" de Cycles : sRGB sans courbe

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(VFOV, 1, 50, 600);
  const pivot = new THREE.Group();                       // c'est lui qui tourne
  scene.add(pivot);

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HOME = photoPose(null, 'front');
  const POSES = { front: HOME, profile: photoPose(null, 'profile'), top: { q: VIEWS.top.clone(), zoom: 1.25, target: new THREE.Vector3() } };
  const state = {
    q: HOME.q.clone(),
    target: HOME.target.clone(),          // point vise par la camera (le pivot, ou le cadrage de la photo)
    vel: new THREE.Vector2(),          // vitesse angulaire (rad/s) : x autour de la verticale, y autour de l'horizontale
    zoom: HOME.zoom,
    tween: null,
    dirty: true,
    shadowDirty: true,
    raf: 0,
    interacted: false,
    dragging: false,
    mode: overlay ? 'photo' : 'direct',    // la photo du site est deja affichee par la page
    frame: 0,
  };
  pivot.quaternion.copy(state.q);
  let last = 0, frames = 0, token = 0, homeDelay = HOME_DELAY;
  const frameTimes = [];
  const stats = { ptBuildMs: null, ptCompileMs: null, ptConvergeMs: null, ptMsPerSample: null, ptAbort: null, cyclesShown: 0 };
  function setMode(m) { if (state.mode !== m) { state.mode = m; onMode(m); } }

  /* ---- materiaux */
  // envMapIntensity 1,2 : calee sur le turntable Cycles (mediane du metal 226 contre 228, p90 249 contre 247, vue face)
  const metal = new THREE.MeshStandardMaterial({ name: 'Metal', metalness: 1, roughness: METALS.blanc.rough, envMapIntensity: 1.2 });
  const engraving = new THREE.MeshStandardMaterial({ name: 'Gravure', metalness: 0, roughness: 0.8 });
  let diamondC = null, diamondP = null;
  let currentMetal = 'blanc';
  function applyMetal(name) {
    const m = METALS[name] || METALS.blanc;
    currentMetal = METALS[name] ? name : 'blanc';
    metal.color.setRGB(m.base[0], m.base[1], m.base[2], THREE.LinearSRGBColorSpace);
    metal.roughness = m.rough;
    engraving.color.setRGB(m.base[0] * 0.025, m.base[1] * 0.025, m.base[2] * 0.025, THREE.LinearSRGBColorSpace);
    // le pave reflete le metal de son siege (dans Cycles, il prend la couleur de l'or)
    const tint = new THREE.Color().setRGB(m.base[0], m.base[1], m.base[2], THREE.LinearSRGBColorSpace);
    tint.multiplyScalar(1 / Math.max(m.base[0], m.base[1], m.base[2]));
    if (diamondP) diamondP.uniforms.uPavTint.value.copy(tint);
    if (diamondC) diamondC.uniforms.uPavTint.value.copy(tint).lerp(new THREE.Color(1, 1, 1), 0.6);
    invalidate();
  }
  applyMetal('blanc');

  /* ---- chargement */
  const progress = { glb: 0, env: 0 };
  const report = () => onProgress(0.7 * progress.glb + 0.3 * progress.env);
  const exr = new EXRLoader();
  const loadEXR = (url) => new Promise((res, rej) => exr.load(url, res, (e) => { if (e.total) { progress.env = Math.max(progress.env, e.loaded / e.total * 0.5); report(); } }, rej));
  const draco = new DRACOLoader().setDecoderPath(base + DRACO_PATH);
  const gltfLoader = new GLTFLoader().setDRACOLoader(draco);
  const loadGLB = () => new Promise((res, rej) => gltfLoader.load(base + ASSETS + 'bague.glb', res, (e) => { if (e.total) { progress.glb = e.loaded / e.total; report(); } }, rej));
  const loadJSON = () => fetch(base + ASSETS + 'pierres.json').then((r) => { if (!r.ok) throw new Error('pierres.json ' + r.status); return r.json(); });

  let shadow = null, ringRoot = null, envData = null;
  Promise.all([loadGLB(), loadEXR(base + ASSETS + 'studio-metal.exr'), loadEXR(base + ASSETS + 'studio-diamant.exr'), loadJSON(), loadEXR(base + ASSETS + 'studio-argent.exr')])
    .then(([gltf, texMetal, texDiam, stones, texArgent]) => {
      // studio du metal : prefiltre (PMREM) ; les donnees equirect restent pour le path tracing
      texMetal.mapping = THREE.EquirectangularReflectionMapping;
      const pmrem = new THREE.PMREMGenerator(renderer);
      // metal temps reel : studio argent (blender/studio_argent.py), reflets sombres et bandes nettes comme la photo Liori
      texArgent.mapping = THREE.EquirectangularReflectionMapping;
      const envMetal = pmrem.fromEquirectangular(texArgent).texture;
      pmrem.dispose();
      metal.envMap = envMetal;
      engraving.envMap = envMetal;
      // studio des pierres : cube net 1024 px par face, mipmaps pour le pave
      texDiam.mapping = THREE.EquirectangularReflectionMapping;
      const cube = new THREE.WebGLCubeRenderTarget(1024, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
      cube.fromEquirectangularTexture(renderer, texDiam);
      envData = { texMetal, texDiam };

      diamondC = diamondMaterial(stones.centre.planes, cube.texture, { name: 'DiamantCentre', spread: 0.06, bright: 1.45, lod: 0.0, pavDim: 0.9, bounces: 6 });
      diamondP = diamondMaterial(stones.pave.planes, cube.texture, { name: 'DiamantPave', spread: 0.06, bright: 1.6, lod: 1.0, pavDim: 1.0, bounces: 4 });
      applyMetal(currentMetal);

      const root = gltf.scene;
      const ring = root.getObjectByName('BagueLiori') || root;
      ring.scale.setScalar(1);                 // le glb est en metres ; la scene est en millimetres
      root.traverse((o) => {
        if (!o.isMesh) return;
        const n = (o.material && o.material.name) || '';
        if (n.startsWith('DiamantPave')) { o.material = diamondP; o.renderOrder = 1; o.userData.matName = 'pave'; }   // apres le metal : les parties
        else if (n.startsWith('Diamant')) { o.material = diamondC; o.renderOrder = 1; o.userData.matName = 'centre'; } // cachees sont rejetees avant le shader
        else if (n.startsWith('Gravure')) { o.material = engraving; o.userData.matName = 'gravure'; }
        else { o.material = metal; o.userData.matName = 'metal'; }
      });
      root.position.y = -PIVOT_Z;
      pivot.add(root);
      ringRoot = root;
      if (withShadow) {                       // le studio blanc de la photo n'a pas d'ombre portee visible
        shadow = contactShadow(renderer, pivot);
        scene.add(shadow.plane);
      }
      progress.glb = 1; progress.env = 1; report();
      state.shadowDirty = true;
      renderer.compile(scene, camera);         // compilation des shaders avant la premiere image
      invalidate();
      requestAnimationFrame(() => { onReady(); window.__ringReady = true; });
    })
    .catch((err) => { console.error(err); onError(err); });

  /* ---- cadrage */
  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    const sizeChanged = Math.round(w * dpr) !== renderer.domElement.width || Math.round(h * dpr) !== renderer.domElement.height;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    placeCamera();
    if (sizeChanged && (state.mode === 'pt' || state.mode === 'pt-fini')) { leaveRest(); }
    invalidate();
  }
  function placeCamera() {
    const half = FRAME_MM / 2;
    const dist = half / Math.tan(THREE.MathUtils.degToRad(VFOV / 2)) / Math.min(1, camera.aspect) / state.zoom / fill;   // fill : part du petit cote occupee par le cadre
    camera.position.copy(state.target).addScaledVector(CAM_DIR, dist);
    camera.lookAt(state.target);
  }
  new ResizeObserver(resize).observe(canvas);

  /* ---- boucle a la demande */
  function invalidate() {
    state.dirty = true;
    if (!state.raf) { last = performance.now(); state.raf = requestAnimationFrame(tick); }
  }
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const tmpQ = new THREE.Quaternion();
  const camRight = new THREE.Vector3();
  function rotateBy(yaw, pitch, roll) {
    // glisser horizontal : autour de la verticale du monde ; vertical : autour de l'horizontale de l'ecran ;
    // torsion a deux doigts : autour de l'axe de visee
    camRight.set(1, 0, 0);
    if (yaw) state.q.premultiply(tmpQ.setFromAxisAngle(Y, yaw));
    if (pitch) state.q.premultiply(tmpQ.setFromAxisAngle(camRight, pitch));
    if (roll) state.q.premultiply(tmpQ.setFromAxisAngle(CAM_DIR, roll));
    state.q.normalize();
    state.shadowDirty = true;
  }
  function tick(now) {
    state.raf = 0;
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    let moving = false;
    if (state.tween) {
      const tw = state.tween;
      if (tw.start === undefined) tw.start = now;
      tw.t = Math.min(1, (now - tw.start) / 1000 / tw.dur);   // duree reelle, meme si les images sont lentes
      state.q.slerpQuaternions(tw.from, tw.to, ease(tw.t));
      state.zoom = tw.z0 + (tw.z1 - tw.z0) * ease(tw.t);
      state.target.lerpVectors(tw.p0 || state.target, tw.p1 || state.target, ease(tw.t));
      placeCamera();
      if (tw.t >= 1) { state.q.copy(tw.to); state.zoom = tw.z1; if (tw.p1) state.target.copy(tw.p1); placeCamera(); state.tween = null; }
      state.shadowDirty = true;
      moving = true;
    }
    // hors de la pose photo, la camera revient doucement sur le pivot (rotation autour du centre de la bague)
    if (!state.tween && (state.dragging || state.vel.lengthSq() > 1e-6) && state.target.lengthSq() > 1e-6) {
      state.target.multiplyScalar(Math.exp(-dt * 2.5));
      if (state.target.lengthSq() < 1e-4) state.target.set(0, 0, 0);
      placeCamera();
      moving = true;
    }
    if (state.tween) {
      // deja traite
    } else if (!state.dragging && state.vel.lengthSq() > 1e-6) {
      rotateBy(state.vel.x * dt, state.vel.y * dt, 0);
      state.vel.multiplyScalar(Math.exp(-dt * 3.2));
      if (state.vel.lengthSq() < 4e-4) state.vel.set(0, 0);
      moving = true;
    }
    if (moving || state.wasMoving) state.dirty = true;     // une derniere image complete a l'arret
    state.wasMoving = moving;
    if (state.dirty) {
      if (diamondC) { diamondC.uniforms.uBounces.value = moving ? 3 : 6; diamondP.uniforms.uBounces.value = moving ? 2 : 4; }
      pivot.quaternion.copy(state.q);
      pivot.updateMatrixWorld();
      if (shadow && state.shadowDirty) { shadow.update(); state.shadowDirty = false; }
      renderer.render(scene, camera);
      frames++;
      frameTimes.push(now);
      if (frameTimes.length > 30) frameTimes.shift();
      adaptQuality(moving);
    }
    state.dirty = false;
    if (moving) state.raf = requestAnimationFrame(tick);
    else if (state.mode === 'direct' && !state.dragging && ringRoot) scheduleRest();
  }

  // densite : pleine densite de l'ecran a l'arret ; si une machine faible n'arrive pas a suivre pendant le mouvement
  // (moins de ~42 images/s), la densite baisse par pas de 0,5 seulement pendant le mouvement, puis l'image nette
  // est recalculee a pleine densite 0,2 s apres l'arret.
  let dprTimer = 0, slowFrames = 0;
  function adaptQuality(moving) {
    if (moving && frameTimes.length >= 2) {
      const gap = frameTimes[frameTimes.length - 1] - frameTimes[frameTimes.length - 2];
      slowFrames = gap > 60 ? slowFrames + 4 : gap > 24 ? slowFrames + 1 : Math.max(0, slowFrames - 1);   // moins de ~42 images/s
      if (frames > 5 && slowFrames > 8 && dpr > 1) { dpr = Math.max(1, dpr - 0.5); slowFrames = 0; resize(); }
    }
    clearTimeout(dprTimer);
    if (dpr < DPR_MAX) {
      dprTimer = setTimeout(() => { if (!isMoving()) { dpr = DPR_MAX; resize(); } }, 200);
    }
  }
  const isMoving = () => !!(state.tween || state.dragging || state.vel.lengthSq() > 0);

  /* ---- repos : image Cycles exacte ou path tracing */
  let restTimer = 0;
  function scheduleRest() {
    clearTimeout(restTimer);
    restTimer = setTimeout(decideRest, 120);
  }
  function leaveRest() {
    clearTimeout(restTimer);
    token++;
    if (overlay) {
      overlay.style.transition = state.mode === 'photo' && !reduceMotion ? 'opacity 250ms linear' : 'none';
      overlay.style.opacity = '0';
    }
    hidePT();
    setMode('direct');
    invalidate();
  }
  const ttYaw = (f) => -TT_STEP * f;                            // image f du turntable : rotation de -5 f degres
  const atPose = (P) => state.q.angleTo(P.q) < 1e-5 && Math.abs(state.zoom - P.zoom) < 1e-6 && state.target.distanceTo(P.target) < 1e-6;
  const atPhotoPose = () => atPose(HOME);
  function decideRest() {
    if (state.mode !== 'direct' || isMoving() || !ringRoot) return;
    if (dpr !== DPR_MAX) { scheduleRest(); return; }
    if (overlay && atPhotoPose()) { showPhoto('front'); return; }
    if (overlay && atPose(POSES.profile)) { showPhoto('profile'); return; }
    const up = Y.clone().applyQuaternion(state.q);
    const tilt = up.angleTo(Y);
    if (overlay && cyclesFrames && tilt < SNAP_TILT && Math.abs(state.zoom - 1) < 0.02 && state.target.lengthSq() < 1e-6) {
      const fwd = Z.clone().applyQuaternion(state.q);
      const yaw = THREE.MathUtils.radToDeg(Math.atan2(fwd.x, fwd.z));
      const f = (((Math.round(-yaw / TT_STEP)) % TT_FRAMES) + TT_FRAMES) % TT_FRAMES;
      const target = qa(Y, ttYaw(f));
      if (state.q.angleTo(target) > 1e-5 || state.zoom !== 1) {
        // calage doux sur l'angle du turntable
        const dur = reduceMotion ? 0.001 : 0.18 + 0.12 * Math.min(1, state.q.angleTo(target) / THREE.MathUtils.degToRad(6));
        state.tween = { t: 0, dur, from: state.q.clone(), to: target, z0: state.zoom, z1: 1, p0: state.target.clone(), p1: new THREE.Vector3() };
        invalidate();
        return;
      }
      showCycles(f);
    } else {
      startPT();
    }
  }
  function frameURL(f) {
    const w = renderer.domElement.width;
    const size = w > 1100 ? 1600 : 1080;
    return base + 'site/tt/' + currentMetal + '/' + size + '/' + String(f).padStart(3, '0') + '.webp';
  }
  function showOverlay(url, mode) {
    const tok = ++token;
    setMode(mode);
    const im = new Image();
    im.src = url;
    im.decode().then(() => {
      if (tok !== token) return;
      overlay.removeAttribute('srcset');
      if (overlay.getAttribute('src') !== url || +getComputedStyle(overlay).opacity < 1) {
        overlay.style.transition = 'none';
        overlay.style.opacity = '0';
        overlay.src = url;
        void overlay.offsetWidth;
        overlay.style.transition = reduceMotion ? 'none' : 'opacity 300ms linear';
        overlay.style.opacity = '1';
      }
    }).catch(() => { if (tok === token) setMode('repos'); });
  }
  function showPhoto(key) { stats.photoShown = (stats.photoShown || 0) + 1; state.photo = key; showOverlay(base + PHOTOS[key].src, 'photo'); }
  function showCycles(f) {
    const tok = ++token;
    setMode('cycles');
    state.frame = f;
    const url = frameURL(f);
    const im = new Image();
    im.src = url;
    im.decode().then(() => {
      if (tok !== token) return;
      overlay.removeAttribute('srcset');
      overlay.style.transition = 'none';
      overlay.style.opacity = '0';
      overlay.src = url;
      void overlay.offsetWidth;
      overlay.style.transition = reduceMotion ? 'none' : 'opacity 200ms linear';
      overlay.style.opacity = '1';
      stats.cyclesShown++;
    }).catch(() => { if (tok === token) setMode('repos'); });
  }

  /* ---- path tracing WebGPU (charge a la demande, canvas a part au-dessus du temps reel) */
  let pt = null, ptPromise = null, ptTooSlow = false;
  let ptSupported = typeof navigator !== 'undefined' && !!navigator.gpu;
  function ensurePT() {
    if (ptPromise) return ptPromise;
    ptPromise = import('./pathtrace.js').then(async ({ RingPathTracer, webgpuAvailable }) => {
      if (!(await webgpuAvailable())) { stats.ptAbort = 'WebGPU indisponible'; return false; }
      pt = new RingPathTracer(canvas.parentElement, ringRoot, {
        envMetal: envData.texMetal, envDiam: envData.texDiam, pivotY: PIVOT_Z, camera, maxSamples: PT_TARGET,
      });
      stats.ptBuildMs = Math.round(await pt.init());
      return true;
    }).catch((e) => { console.error(e); stats.ptAbort = 'erreur : ' + e.message; return false; });
    return ptPromise;
  }
  function hidePT() {
    if (pt) { pt.canvas.style.transition = 'none'; pt.canvas.style.opacity = '0'; }
  }
  let ptT0 = 0, ptTRender = 0, ptAvg0 = 0, ptShown = false, ptChecked = false;
  function startPT() {
    if (!pathTracing || !ptSupported || ptTooSlow || !envData) { setMode('repos'); return; }
    const tok = ++token;
    setMode('pt');
    const tAsk = performance.now();
    ensurePT().then((ok) => {
      if (!ok) { ptSupported = false; if (tok === token) setMode('repos'); return; }
      if (tok !== token) return;
      const m = METALS[currentMetal];
      pt.setMetal(m.base, m.rough);
      pt.begin(state.q, canvas.clientWidth, canvas.clientHeight, dpr);
      ptT0 = tAsk; ptTRender = 0; ptShown = false; ptChecked = false;
      requestAnimationFrame((t) => ptLoop(t, tok));
    });
  }
  function ptLoop(now, tok) {
    if (tok !== token || state.mode !== 'pt') return;
    pt.step();
    if (!ptTRender && pt.counts && pt.counts.avg > 0) { ptTRender = now; ptAvg0 = pt.counts.avg; }
    if (!ptShown && pt.samples >= PT_SHOW) {
      ptShown = true;
      pt.canvas.style.transition = reduceMotion ? 'none' : 'opacity 300ms linear';
      pt.canvas.style.opacity = '1';
    }
    // appareil trop lent : vitesse mesuree pendant 4 s des les premiers echantillons (ou rien au bout de 60 s)
    const tooSlow = (why) => {
      ptTooSlow = true;
      stats.ptAbort = why;
      hidePT();
      setMode('repos');
    };
    if (!ptTRender && now - ptT0 > 60000) { tooSlow('aucun echantillon apres 60 s'); return; }
    if (ptTRender && !ptChecked && now - ptTRender > 4000) {
      ptChecked = true;
      pt.sampleCounts().then((c) => {
        if (tok !== token || state.mode !== 'pt') return;
        const rate = (c.avg - ptAvg0) / ((performance.now() - ptTRender) / 1000);
        stats.ptSamplesPerSecond = +rate.toFixed(2);
        const est = rate > 0 ? (PT_TARGET - c.avg) / rate : Infinity;
        stats.ptEstimatedSeconds = Math.round(est);
        if (est > PT_MAX_SECONDS) tooSlow('trop lent : ' + rate.toFixed(2) + ' echantillons/s, ' + Math.round(est) + ' s estimees');
      });
    }
    if (pt.complete || pt.samples >= PT_TARGET) {
      stats.ptConvergeMs = Math.round(performance.now() - ptT0);
      stats.ptRenderMs = Math.round(performance.now() - ptTRender);
      if (!ptShown) { pt.canvas.style.transition = 'none'; pt.canvas.style.opacity = '1'; }
      setMode('pt-fini');
      return;
    }
    requestAnimationFrame((t) => ptLoop(t, tok));
  }

  /* ---- retour a la vue de depart 8 s apres le dernier geste */
  let homeTimer = 0;
  function armHome() { clearTimeout(homeTimer); homeTimer = setTimeout(goHome, homeDelay); }
  function goHome() {
    if (state.dragging) { armHome(); return; }
    onViewChange('front');
    if (atPhotoPose() && state.mode !== 'direct') return;
    leaveRest();
    state.vel.set(0, 0);
    if (atPhotoPose()) return;
    state.tween = { t: 0, dur: reduceMotion ? 0.001 : 1.0, from: state.q.clone(), to: HOME.q.clone(), z0: state.zoom, z1: HOME.zoom, p0: state.target.clone(), p1: HOME.target.clone() };
    invalidate();
  }

  /* ---- gestes */
  const pointers = new Map();
  let lastMove = 0, gesture = null;
  canvas.style.touchAction = 'none';
  function userGesture(view = null, keepView = false) {
    if (!state.interacted) { state.interacted = true; onFirstInteraction(); }
    if (!keepView) onViewChange(view);
    state.tween = null;
    leaveRest();
    armHome();
  }
  canvas.addEventListener('pointerdown', (e) => {
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* pointeur synthetique */ }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    state.dragging = true;
    userGesture();
    state.vel.set(0, 0);
    lastMove = performance.now();
    gesture = null;
    canvas.classList.add('is-drag');
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const now = performance.now();
    const dtm = Math.max(1, now - lastMove) / 1000;
    const size = Math.min(canvas.clientWidth, canvas.clientHeight);
    const k = 3.4 / size;                                   // un glisser sur toute la largeur : environ 195 degres
    if (pointers.size === 1) {
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      rotateBy(dx * k, dy * k, 0);
      const vx = dx * k / dtm, vy = dy * k / dtm;
      state.vel.set(0.6 * state.vel.x + 0.4 * vx, 0.6 * state.vel.y + 0.4 * vy);
    } else if (pointers.size === 2) {
      p.x = e.clientX; p.y = e.clientY;
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y), ang = Math.atan2(b.y - a.y, b.x - a.x);
      if (gesture) {
        state.zoom = THREE.MathUtils.clamp(state.zoom * dist / gesture.dist, 1, 3.2);
        let da = ang - gesture.ang;
        if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
        rotateBy(0, 0, -da);
        placeCamera();
      }
      gesture = { dist, ang };
      state.vel.set(0, 0);
    }
    lastMove = now;
    invalidate();
  });
  const up = (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    gesture = null;
    if (pointers.size === 0) {
      state.dragging = false;
      canvas.classList.remove('is-drag');
      if (performance.now() - lastMove > 90) state.vel.set(0, 0);    // relache sans elan
      const vmax = 9;
      if (state.vel.length() > vmax) state.vel.setLength(vmax);
      armHome();
      invalidate();
    }
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  // zoom : pincement du pave tactile (ctrl + molette) ; la molette seule laisse defiler la page
  canvas.addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    userGesture();
    state.zoom = THREE.MathUtils.clamp(state.zoom * Math.exp(-e.deltaY * 0.01), 1, 3.2);
    placeCamera();
    invalidate();
  }, { passive: false });
  canvas.addEventListener('keydown', (e) => {
    const s = THREE.MathUtils.degToRad(10);
    const map = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] };
    if (map[e.key]) { userGesture(); rotateBy(map[e.key][0], map[e.key][1], 0); }
    else if (e.key === '+' || e.key === '=') { userGesture(); state.zoom = Math.min(3.2, state.zoom * 1.15); placeCamera(); }
    else if (e.key === '-') { userGesture(); state.zoom = Math.max(1, state.zoom / 1.15); placeCamera(); }
    else return;
    e.preventDefault();
    invalidate();
  });

  function setView(name, instant = false) {
    const P = POSES[name] || (VIEWS[name] && { q: VIEWS[name], zoom: 1, target: new THREE.Vector3() });
    if (!P) return;
    userGesture(name);
    state.vel.set(0, 0);
    if (instant || reduceMotion) { state.q.copy(P.q); state.zoom = P.zoom; state.target.copy(P.target); placeCamera(); state.shadowDirty = true; invalidate(); return; }
    state.tween = { t: 0, dur: 0.95, from: state.q.clone(), to: P.q.clone(), z0: state.zoom, z1: P.zoom, p0: state.target.clone(), p1: P.target.clone() };
    invalidate();
  }
  function setMetal(m) {
    if (m === currentMetal) return;
    userGesture(null, true);
    applyMetal(m);
  }

  resize();
  const api = {
    setMetal,
    setView,
    // controles automatises (captures de verification)
    debug: {
      THREE, renderer, scene, camera, state, VIEWS, stats,
      setQuat: (x, y, z, w) => { userGesture(); state.q.set(x, y, z, w).normalize(); state.shadowDirty = true; invalidate(); },
      rotate: (yawDeg, pitchDeg, rollDeg = 0) => { userGesture(); rotateBy(THREE.MathUtils.degToRad(yawDeg), THREE.MathUtils.degToRad(pitchDeg), THREE.MathUtils.degToRad(rollDeg)); invalidate(); },
      setZoom: (z) => { userGesture(); state.zoom = z; placeCamera(); invalidate(); },
      // pose figee sans repos automatique (captures du temps reel seul)
      hold: (on = true) => { if (on) { clearTimeout(homeTimer); token++; clearTimeout(restTimer); setMode('maintien'); if (overlay) { overlay.style.transition = 'none'; overlay.style.opacity = '0'; } state.dirty = true; invalidate(); } else { setMode('direct'); invalidate(); } },
      setHomeDelay: (ms) => { homeDelay = ms; },
      setGems: (on) => { scene.traverse((o) => { if (o.isMesh && (o.material === diamondC || o.material === diamondP)) o.visible = on; }); invalidate(); },
      HOME, POSES, photoPose,
      // pose de la photo avec un ajustement donne, rendu immediat, masque alpha sous-echantillonne (pas = step px)
      fitRender: (fit, step = 4, key = 'front') => {
        const P = photoPose(fit, key);
        state.q.copy(P.q); state.zoom = P.zoom; state.target.copy(P.target); placeCamera();
        pivot.quaternion.copy(state.q); pivot.updateMatrixWorld();
        renderer.render(scene, camera);
        const gl = renderer.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
        const px = new Uint8Array(w * h * 4);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
        const W = Math.floor(w / step), H = Math.floor(h / step), m = new Uint8Array(W * H);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) m[y * W + x] = px[((h - 1 - y * step) * w + x * step) * 4 + 3] > 127 ? 1 : 0;
        return { W, H, m };
      },
      setHome: (fit) => { const P = photoPose(fit); HOME.q.copy(P.q); HOME.zoom = P.zoom; HOME.target.copy(P.target); },
      frames: () => frames,
      dpr: () => dpr,
      idle: () => !state.raf,
      mode: () => state.mode,
      ptSamples: () => (pt ? pt.samples : 0),
      ptCounts: () => (pt ? pt.counts : null),
      ptStage: () => (pt ? pt.stage : null),
      setPtTarget: (n) => { if (pt) pt.pt.maxSamples = n; },
      pt: () => pt,
      ensurePT: () => ensurePT(),
      materials: () => ({ diamondC, diamondP, metal }),
      shadowUpdate: () => shadow && shadow.update(),
    },
  };
  window.__ring = api;
  return api;
}
