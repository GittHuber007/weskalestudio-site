import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';

const THREE_VERSION = '0.170.0';
const MODEL_URL = 'assets/bracelet-bloom-serti.glb';
// Studio de la rotation Cycles (voute, boites a lumiere, drapeaux noirs, sol), calcule par blender/bake_env.py
const ENV_URL = 'assets/studio-cycles.hdr';
const FLOOR_OCCLUSION = 0.85;

/* Vue principale : le bracelet en 3D temps reel. La piece tourne librement (glisser horizontal, vertical,
   rotation a deux doigts), la camera reste celle du packshot Cycles (107,6 mm, 19,5 degres au dessus),
   le studio reste fixe comme dans les images Cycles. Rendu seulement quand quelque chose bouge. */
export function startViewer({ onProgress, onReady, onError }) {
  const canvas = document.getElementById('scene');
  const hintEl = document.querySelector('.hint');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------ rendu */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    onError('nogl');
    return null;
  }
  // nettete : densite de pixels de l'ecran, jusqu'a 3 (iPhone) ; on ne descend que si l'appareil peine vraiment
  let maxDpr = Math.min(window.devicePixelRatio || 1, 3);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // meme transformation de vue que Cycles (AgX, exposition +0,3), puis le meme etalonnage leger que les
  // images Cycles de la page (blender/compose_frames.py : saturation 1,2, luminosite 1,06)
  THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace(
    'vec3 CustomToneMapping( vec3 color ) { return color; }',
    `vec3 CustomToneMapping( vec3 color ) {
      vec3 c = AgXToneMapping( color );
      float l = dot( c, vec3( 0.2126, 0.7152, 0.0722 ) );
      return clamp( mix( vec3( l ), c, GRADE_SAT ) * GRADE_GAIN, 0.0, 1.0 );
    }`,
  ).replace('vec3 CustomToneMapping', '#define GRADE_SAT 1.16\n#define GRADE_GAIN 1.12\nvec3 CustomToneMapping');
  renderer.toneMapping = THREE.CustomToneMapping;
  renderer.toneMappingExposure = Math.pow(2, 0.3);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(20, 1, 40, 1500);
  // camera du packshot Cycles (blender/render_turntable.py), convertie en axes three.js (Y en haut, mm)
  const CAM_TARGET = new THREE.Vector3(0, -8, -2);
  const CAM_EL = THREE.MathUtils.degToRad(19.5);
  camera.position.copy(CAM_TARGET).add(new THREE.Vector3(0, Math.sin(CAM_EL), Math.cos(CAM_EL)).multiplyScalar(300));
  camera.lookAt(CAM_TARGET);
  camera.updateMatrixWorld();
  const LENS_RATIO = 107.6 / 36;                          // focale / largeur du capteur

  /* ------------------------------------------------------------------ studio pour les pierres */
  // Studio procedural tres noir avec beaucoup de petites sources : chaque facette passe du noir au blanc
  // quand la piece tourne (scintillement). Il sert seulement au trace dans les diamants.
  function softMaterial(value, edge) {
    return new THREE.ShaderMaterial({
      side: THREE.DoubleSide, transparent: true, depthWrite: false,
      uniforms: { uV: { value }, uE: { value: edge } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader: `uniform float uV; uniform float uE; varying vec2 vUv;
        void main(){
          vec2 d = min(vUv, 1.0 - vUv);
          float a = smoothstep(0.0, uE, d.x) * smoothstep(0.0, uE, d.y);
          gl_FragColor = vec4(vec3(uV), a);
        }`,
    });
  }
  function buildStoneStudio() {
    const s = new THREE.Scene();
    s.add(new THREE.Mesh(
      new THREE.SphereGeometry(100, 64, 32),
      new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false,
        vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
        fragmentShader: `varying vec3 vD;
          void main(){
            float y = vD.y;
            vec3 c = mix(vec3(0.30), vec3(0.008), smoothstep(-0.10, -0.035, y));
            c = mix(c, vec3(0.06), smoothstep(0.12, 0.32, y));
            c = mix(c, vec3(0.12), smoothstep(0.55, 1.0, y));
            gl_FragColor = vec4(c, 1.);
          }`,
      }),
    ));
    const panel = (w, h, v, pos, edge = 0.12) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), softMaterial(v, edge));
      m.position.copy(pos); m.lookAt(0, 0, 0); s.add(m);
    };
    panel(46, 46, 6.4, new THREE.Vector3(0, 85, 6));
    panel(62, 16, 6.7, new THREE.Vector3(0, 46, 70));
    panel(7, 64, 11, new THREE.Vector3(-72, 20, 30));
    panel(7, 64, 11, new THREE.Vector3(72, 20, 30));
    panel(5, 50, 8, new THREE.Vector3(-40, 22, 70));
    panel(5, 50, 8, new THREE.Vector3(40, 22, 70));
    panel(70, 6, 4.8, new THREE.Vector3(0, 26, -85));
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 70; i++) {
      const az = rnd() * Math.PI * 2;
      const el = -0.1 + rnd() * 1.4;
      const p = new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).multiplyScalar(85);
      panel(2.2 + rnd() * 2.5, 2.2 + rnd() * 2.5, 6 + rnd() * 10, p);
    }
    return s;
  }
  const stoneCube = new THREE.WebGLCubeRenderTarget(512, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
  new THREE.CubeCamera(0.5, 300, stoneCube).update(renderer, buildStoneStudio());

  /* ------------------------------------------------------------------ matieres (valeurs Cycles) */
  const roseGold = new THREE.MeshPhysicalMaterial({ name: 'OrRose', color: new THREE.Color('#f6b47c'), metalness: 1, roughness: 0.09 });
  const whiteGold = new THREE.MeshPhysicalMaterial({ name: 'OrBlanc', color: new THREE.Color('#e6e6e9'), metalness: 1, roughness: 0.07 });
  const seatGold = new THREE.MeshPhysicalMaterial({ name: 'OrBlancSiege', color: new THREE.Color('#6b6b70'), metalness: 1, roughness: 0.4 });

  // Diamant taille brillant, trace dans l'espace de la maille : refraction a l'entree (IOR 2,42),
  // deux reflexions totales sur les 8 facettes du pavillon, sortie par la table ou la couronne,
  // un trajet par canal RVB pour la dispersion (le feu). Geometrie identique a blender/build_bloom.py.
  const STONE = { count: 5, pitch: 1.3, girdleX: 3.88, depth: (0.03 + 0.431) * 1.25, cone: 0.625 / (0.431 * 1.25), table: 0.56 * 0.625 };
  const diamond = new THREE.ShaderMaterial({
    name: 'Diamant',
    uniforms: {
      uEnv: { value: stoneCube.texture },
      uIor: { value: 2.42 },
      uDisp: { value: 0.035 },
      uBright: { value: 3.6 },
      uPitch: { value: STONE.pitch },
      uCount: { value: STONE.count },
      uGirdleX: { value: STONE.girdleX },
      uDepth: { value: STONE.depth },
      uCone: { value: STONE.cone },
      uTable: { value: STONE.table },
    },
    vertexShader: `
      varying vec3 vObj; varying vec3 vCam;
      void main(){
        vObj = position;
        vCam = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform mat4 modelMatrix;
      uniform samplerCube uEnv;
      uniform float uIor, uDisp, uBright, uPitch, uCount, uGirdleX, uDepth, uCone, uTable;
      varying vec3 vObj; varying vec3 vCam;
      const float SECTOR = 0.78539816;
      vec3 envW(vec3 d){ return textureCube(uEnv, normalize(mat3(modelMatrix) * d)).rgb; }
      float hitCone(vec3 o, vec3 d){
        float t2 = uCone * uCone;
        float a = dot(d.yz, d.yz) - t2 * d.x * d.x;
        float b = 2.0 * (dot(o.yz, d.yz) - t2 * o.x * d.x);
        float c = dot(o.yz, o.yz) - t2 * o.x * o.x;
        float disc = b * b - 4.0 * a * c;
        if (disc < 0.0 || abs(a) < 1e-6) return -1.0;
        float sq = sqrt(disc);
        float s1 = (-b - sq) / (2.0 * a), s2 = (-b + sq) / (2.0 * a);
        float s = 1e9;
        if (s1 > 1e-3 && o.x + s1 * d.x > 0.0) s = s1;
        if (s2 > 1e-3 && o.x + s2 * d.x > 0.0) s = min(s, s2);
        return s > 1e8 ? -1.0 : s;
      }
      vec3 facetRadial(vec3 p){
        float q = (floor(atan(p.z, p.y) / SECTOR) + 0.5) * SECTOR;
        return vec3(0.0, cos(q), sin(q));
      }
      float trace(vec3 o, vec3 d, float ior, int ch){
        float s = hitCone(o, d);
        if (s < 0.0) return envW(d)[ch] * 0.35;
        vec3 p = o + s * d;
        d = reflect(d, normalize(facetRadial(p) - uCone * vec3(1.0, 0.0, 0.0)));
        float s2 = hitCone(p, d);
        if (s2 > 0.0) { p += s2 * d; d = reflect(d, normalize(facetRadial(p) - uCone * vec3(1.0, 0.0, 0.0))); }
        if (d.x <= 0.02) return envW(d)[ch] * 0.3;
        vec3 pe = p + d * ((uDepth - p.x) / d.x);
        vec3 nOut = length(pe.yz) < uTable ? vec3(1.0, 0.0, 0.0) : normalize(vec3(0.824, 0.0, 0.0) + 0.566 * facetRadial(pe));
        vec3 e = refract(d, -nOut, ior);
        if (dot(e, e) < 1e-4) return envW(reflect(d, -nOut))[ch] * 0.2;
        return envW(e)[ch];
      }
      void main(){
        float k = clamp(floor(vObj.y / uPitch + uCount * 0.5), 0.0, uCount - 1.0);
        vec3 culet = vec3(uGirdleX - uDepth, (k - (uCount - 1.0) * 0.5) * uPitch, 0.0);
        vec3 N = normalize(cross(dFdx(vObj), dFdy(vObj)));
        vec3 V = normalize(vObj - vCam);
        if (dot(N, V) > 0.0) N = -N;
        float c = clamp(dot(-V, N), 0.0, 1.0);
        float F = 0.172 + 0.828 * pow(1.0 - c, 5.0);
        vec3 refl = envW(reflect(V, N));
        vec3 inner;
        for (int ch = 0; ch < 3; ch++) {
          float ior = uIor + (float(ch) - 1.0) * uDisp;
          inner[ch] = trace(vObj - culet, refract(V, N, 1.0 / ior), ior, ch);
        }
        inner = pow(inner, vec3(1.45));
        vec3 col = refl * F + inner * (1.0 - F) * uBright;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });

  /* ------------------------------------------------------------------ piece et orientation */
  const pivot = new THREE.Group();          // la piece tourne autour de son centre (axe de la rotation Cycles)
  pivot.position.y = -1.45;                 // hauteur de pose de la rotation Cycles (bijou sur le sol)
  scene.add(pivot);
  const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
  const qAxis = (axis, deg) => new THREE.Quaternion().setFromAxisAngle(axis, THREE.MathUtils.degToRad(deg));
  // pose du packshot : posee a plat, legere bascule de 2,7 degres pour reposer sur 4 boules (comme dans Cycles)
  const BASE = qAxis(X, -2.7);
  const VIEWS = {
    front: BASE.clone(),
    side: qAxis(Y, 90).multiply(BASE),
    top: qAxis(X, 70.5).multiply(BASE),   // 70,5 + 19,5 = la camera regarde le dessus de face
  };
  pivot.quaternion.copy(VIEWS.front);

  /* ------------------------------------------------------------------ cadrage (identique a la page precedente) */
  // L'image Cycles carree (19 degres de champ) occupait un carre de cote min(largeur / 0,9, hauteur x 1,3),
  // centre et remonte de 2 % de la hauteur. On reprend exactement la meme focale en pixels.
  let cw = 1, ch = 1, focalPx = 1;
  const SAFE = { top: 84, bottom: 128, side: 14 };
  function layout() {
    cw = canvas.clientWidth; ch = canvas.clientHeight;
    const square = Math.min(cw / 0.9, ch * 1.3);
    focalPx = square * LENS_RATIO;
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan((ch / 2) / focalPx));
    camera.aspect = cw / ch;
    applyOffset();
    SAFE.top = cw < 560 ? 76 : 84;
    SAFE.bottom = cw < 560 ? 150 : 128;
    applyPixelRatio();
    camera.updateProjectionMatrix();
    requestRender();
  }
  // decalage de cadrage quand on zoome vers un point (molette, pincement) ; nul a zoom 1
  const pan = { x: 0, y: 0 };
  function applyOffset() {
    camera.setViewOffset(cw, ch, pan.x, 0.02 * ch + pan.y, cw, ch);
  }
  function applyPixelRatio() {
    renderer.setPixelRatio(maxDpr);
    renderer.setSize(cw, ch, false);
  }

  /* ------------------------------------------------------------------ points de controle de la piece */
  // spheres (boules) et coins des cadres : pour garder la piece entiere a l'ecran et poser l'ombre sous son point le plus bas
  const probes = [];   // { p: Vector3 (repere du pivot), r }
  const tmpV = new THREE.Vector3();
  function collectProbes(root) {
    root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(pivot.matrixWorld).invert();
    root.traverse((o) => {
      if (!o.isMesh) return;
      const g = o.geometry;
      const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
      const scale = new THREE.Vector3().setFromMatrixScale(m);
      const mat = (o.material && o.material.name) || '';
      if (/^Ame/.test(o.name) || /^Ame/.test(o.parent && o.parent.name)) return;   // fil interieur, cache dans les boules
      if (mat === 'OrRose') {
        g.computeBoundingSphere();
        probes.push({ p: g.boundingSphere.center.clone().applyMatrix4(m), r: g.boundingSphere.radius * Math.max(scale.x, scale.y, scale.z) });
      } else {
        g.computeBoundingBox();
        const b = g.boundingBox;
        for (let i = 0; i < 8; i++) {
          probes.push({ p: new THREE.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(m), r: 0 });
        }
      }
    });
  }
  // point le plus bas et zoom qui garde la piece dans la zone utile
  function measure(q) {
    let minY = Infinity;
    let l = Infinity, r = -Infinity, t = Infinity, b = -Infinity;
    const ax = cw / 2, ay = 0.48 * ch;
    const view = camera.matrixWorldInverse;
    for (const pr of probes) {
      tmpV.copy(pr.p).applyQuaternion(q);
      minY = Math.min(minY, tmpV.y - pr.r);
      tmpV.applyMatrix4(view);
      const d = -tmpV.z;
      const sx = ax + focalPx * tmpV.x / d, sy = ay - focalPx * tmpV.y / d, sr = focalPx * pr.r / d;
      l = Math.min(l, sx - sr); r = Math.max(r, sx + sr); t = Math.min(t, sy - sr); b = Math.max(b, sy + sr);
    }
    let fit = 1;
    if (l < ax) fit = Math.min(fit, (ax - SAFE.side) / (ax - l));
    if (r > ax) fit = Math.min(fit, (cw - SAFE.side - ax) / (r - ax));
    if (t < ay) fit = Math.min(fit, (ay - SAFE.top) / (ay - t));
    if (b > ay) fit = Math.min(fit, (ch - SAFE.bottom - ay) / (b - ay));
    return { minY, fit: Math.max(0.35, fit) };
  }

  /* ------------------------------------------------------------------ ombre de contact (suit la rotation, reste au sol) */
  const SH = { size: 150, height: 24, res: 256, darkness: 2.2, opacity: 0.92, blur: 1.5 };
  const shadowGroup = new THREE.Group();
  scene.add(shadowGroup);
  const rtShadow = new THREE.WebGLRenderTarget(SH.res, SH.res);
  rtShadow.texture.generateMipmaps = false;
  const rtBlur = new THREE.WebGLRenderTarget(SH.res, SH.res);
  rtBlur.texture.generateMipmaps = false;
  const planeGeo = new THREE.PlaneGeometry(SH.size, SH.size).rotateX(Math.PI / 2);
  const shadowPlane = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({
    map: rtShadow.texture, opacity: SH.opacity, transparent: true, depthWrite: false, toneMapped: false,
  }));
  shadowPlane.renderOrder = -1;
  shadowPlane.scale.y = -1;
  shadowGroup.add(shadowPlane);
  const blurPlane = new THREE.Mesh(planeGeo);
  blurPlane.visible = false;
  shadowGroup.add(blurPlane);
  const shadowCam = new THREE.OrthographicCamera(-SH.size / 2, SH.size / 2, SH.size / 2, -SH.size / 2, 0, SH.height);
  shadowCam.rotation.x = Math.PI / 2;      // regarde vers le haut, depuis le sol
  shadowGroup.add(shadowCam);
  const depthMat = new THREE.MeshDepthMaterial();
  depthMat.onBeforeCompile = (shader) => {
    shader.uniforms.darkness = { get value() { return SH.darkness; } };
    shader.fragmentShader = `uniform float darkness;\n${shader.fragmentShader.replace(
      'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
      // plus la surface est proche du sol, plus l'ombre est dense
      'float k = 1.0 - fragCoordZ; gl_FragColor = vec4( vec3( 0.0 ), k * k * darkness );',
    )}`;
  };
  depthMat.depthTest = false;
  depthMat.depthWrite = false;
  const hBlur = new THREE.ShaderMaterial(HorizontalBlurShader); hBlur.depthTest = false;
  const vBlur = new THREE.ShaderMaterial(VerticalBlurShader); vBlur.depthTest = false;
  function blurShadow(amount) {
    blurPlane.visible = true;
    blurPlane.material = hBlur;
    hBlur.uniforms.tDiffuse.value = rtShadow.texture;
    hBlur.uniforms.h.value = amount / 256;
    renderer.setRenderTarget(rtBlur);
    renderer.render(blurPlane, shadowCam);
    blurPlane.material = vBlur;
    vBlur.uniforms.tDiffuse.value = rtBlur.texture;
    vBlur.uniforms.v.value = amount / 256;
    renderer.setRenderTarget(rtShadow);
    renderer.render(blurPlane, shadowCam);
    blurPlane.visible = false;
  }
  function renderShadow() {
    shadowPlane.visible = false;
    scene.overrideMaterial = depthMat;
    renderer.setRenderTarget(rtShadow);
    renderer.render(scene, shadowCam);
    scene.overrideMaterial = null;
    blurShadow(SH.blur);
    blurShadow(SH.blur * 0.45);
    renderer.setRenderTarget(null);
    shadowPlane.visible = true;
  }

  /* ------------------------------------------------------------------ interaction : rotation libre avec inertie */
  // glisser horizontal : autour de la verticale ; glisser vertical : bascule vers soi ou vers l'arriere ;
  // deux doigts : rotation dans le plan de l'ecran (inclinaison) et pincement pour le zoom.
  const omega = new THREE.Vector3();        // vitesse angulaire (rad/s) autour de X, Y, Z du monde
  const RAD_PER_PX = () => Math.PI / Math.max(360, Math.min(cw, ch) * 0.9);
  const pointers = new Map();
  let dragging = false, lastT = 0, userZoom = 1, fitNow = 1, idleSince = performance.now(), autoSpeed = 0;
  let tween = null, twoFinger = null, hintHidden = false;

  function hideHint() {
    if (hintHidden) return;
    hintHidden = true;
    hintEl.classList.add('is-off');
  }
  function rotateBy(ax, ay, az) {
    if (ax) pivot.quaternion.premultiply(qAxis(X, THREE.MathUtils.radToDeg(ax)));
    if (ay) pivot.quaternion.premultiply(qAxis(Y, THREE.MathUtils.radToDeg(ay)));
    if (az) pivot.quaternion.premultiply(qAxis(Z, THREE.MathUtils.radToDeg(az)));
    pivot.quaternion.normalize();
  }
  function setPressed(name) {
    document.querySelectorAll('.views button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === name)));
  }
  function interrupt() {
    tween = null; autoSpeed = 0; setPressed(null); hideHint();
  }

  canvas.addEventListener('pointerdown', (e) => {
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* pointeur deja relache */ }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    interrupt();
    omega.set(0, 0, 0);
    dragging = true; lastT = e.timeStamp;
    if (pointers.size === 2) twoFinger = gesture();
    requestRender();
  });
  function gesture() {
    const [a, b] = [...pointers.values()];
    return { angle: Math.atan2(b.y - a.y, b.x - a.x), dist: Math.hypot(b.x - a.x, b.y - a.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
  }
  canvas.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dt = Math.max(1, e.timeStamp - lastT) / 1000;
    lastT = e.timeStamp;
    if (pointers.size === 1) {
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      const k = RAD_PER_PX();
      rotateBy(dy * k, dx * k, 0);
      // vitesse lissee pour l'inertie au lacher
      omega.lerp(new THREE.Vector3(dy * k / dt, dx * k / dt, 0), 0.35);
    } else if (pointers.size === 2 && twoFinger) {
      p.x = e.clientX; p.y = e.clientY;
      const g = gesture();
      let da = g.angle - twoFinger.angle;
      if (da > Math.PI) da -= 2 * Math.PI; else if (da < -Math.PI) da += 2 * Math.PI;
      const k = RAD_PER_PX();
      rotateBy((g.cy - twoFinger.cy) * k, (g.cx - twoFinger.cx) * k, -da);
      omega.lerp(new THREE.Vector3(0, 0, -da / dt), 0.35);
      if (twoFinger.dist > 0) zoomAt(g.dist / twoFinger.dist, g.cx, g.cy);
      twoFinger = g;
    }
    requestRender();
  });
  const endPointer = (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    twoFinger = pointers.size === 2 ? gesture() : null;
    if (pointers.size === 0) {
      dragging = false;
      // pas d'elan si le doigt s'est arrete avant de lacher
      if (e.timeStamp - lastT > 80) omega.set(0, 0, 0);
      idleSince = performance.now();
    }
    requestRender();
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomAt(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0015)), e.clientX, e.clientY);
    interrupt(); idleSince = performance.now();
    requestRender();
  }, { passive: false });
  canvas.addEventListener('dblclick', () => { userZoom = 1; pan.x = pan.y = 0; requestRender(); });
  // zoom vers le point vise : ce qui est sous le curseur (ou entre les deux doigts) reste en place
  function zoomAt(factor, clientX, clientY) {
    const z1 = userZoom;
    const z2 = THREE.MathUtils.clamp(z1 * factor, 1, 3.2);
    if (z2 === z1) return;
    const rect = canvas.getBoundingClientRect();
    const cx = clientX - rect.left - cw / 2, cy = clientY - rect.top - 0.48 * ch;
    const r = z2 / z1;
    pan.x = (cx + pan.x) * r - cx;
    pan.y = (cy + pan.y) * r - cy;
    userZoom = z2;
    clampPan();
  }
  function clampPan() {
    if (userZoom <= 1.0001) { pan.x = pan.y = 0; return; }
    const mx = (userZoom - 1) * cw * 0.55, my = (userZoom - 1) * ch * 0.55;
    pan.x = THREE.MathUtils.clamp(pan.x, -mx, mx);
    pan.y = THREE.MathUtils.clamp(pan.y, -my, my);
  }
  canvas.addEventListener('keydown', (e) => {
    const s = Math.PI / 12;
    if (e.key === 'ArrowLeft') rotateBy(0, -s, 0);
    else if (e.key === 'ArrowRight') rotateBy(0, s, 0);
    else if (e.key === 'ArrowUp') rotateBy(-s, 0, 0);
    else if (e.key === 'ArrowDown') rotateBy(s, 0, 0);
    else if (e.key === '+' || e.key === '=') { userZoom = Math.min(3.2, userZoom * 1.15); clampPan(); }
    else if (e.key === '-') { userZoom = Math.max(1, userZoom / 1.15); clampPan(); }
    else return;
    e.preventDefault();
    interrupt(); omega.set(0, 0, 0); idleSince = performance.now();
    requestRender();
  });

  function goTo(name) {
    hideHint();
    omega.set(0, 0, 0); autoSpeed = 0; userZoom = 1; pan.x = pan.y = 0;
    setPressed(name);
    const to = VIEWS[name];
    if (reduceMotion) { pivot.quaternion.copy(to); tween = null; requestRender(); return; }
    tween = { t: 0, dur: 1.1, from: pivot.quaternion.clone(), to };
    idleSince = performance.now();
    requestRender();
  }
  document.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => goTo(b.dataset.view)));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* ------------------------------------------------------------------ boucle (rendu a la demande) */
  let ready = false, frameQueued = false, dirty = true, wakeTimer = 0, last = performance.now();
  let slowFrames = 0, measuredFrames = 0, frameIdx = 0, shadowStale = false, halfRateShadow = false;
  const AUTO_DELAY = 6000, AUTO_SPEED = THREE.MathUtils.degToRad(12);   // rotation lente au repos, comme avant
  function schedule() {
    if (frameQueued) return;
    frameQueued = true;
    requestAnimationFrame(frame);
  }
  function requestRender() { dirty = true; schedule(); }
  function frame(now) {
    frameQueued = false;
    const dt = Math.min(0.05, (now - last) / 1000);
    const frameMs = now - last;
    last = now;
    let moving = dragging;

    if (tween) {
      tween.t = Math.min(1, tween.t + dt / tween.dur);
      pivot.quaternion.slerpQuaternions(tween.from, tween.to, ease(tween.t));
      if (tween.t >= 1) tween = null;
      moving = true;
    } else if (!dragging) {
      if (omega.lengthSq() > 4e-4) {
        rotateBy(omega.x * dt, omega.y * dt, omega.z * dt);
        omega.multiplyScalar(Math.exp(-dt * 3.0));
        idleSince = now;
        moving = true;
      } else {
        omega.set(0, 0, 0);
        if (!reduceMotion && ready && !window.__bloomFreeze && now - idleSince > AUTO_DELAY && document.visibilityState === 'visible') {
          autoSpeed = Math.min(AUTO_SPEED, autoSpeed + dt * AUTO_SPEED * 0.6);
          rotateBy(0, autoSpeed * dt, 0);
          moving = true;
        }
      }
    }

    // zoom : celui de l'utilisateur, reduit si besoin pour garder la piece entiere a l'ecran
    const m = probes.length ? measure(pivot.quaternion) : { minY: -6, fit: 1 };
    const df = m.fit - fitNow;
    fitNow = Math.abs(df) < 1e-4 ? m.fit : fitNow + df * Math.min(1, dt * 9);
    if (Math.abs(m.fit - fitNow) > 1e-4) moving = true;
    camera.zoom = fitNow * userZoom;
    applyOffset();
    camera.updateProjectionMatrix();

    if (moving || dirty || shadowStale) {
      if (ready) {
        // appareil lent : pendant le mouvement, l'ombre (tres floue) se recalcule une image sur deux
        if (!moving || !halfRateShadow || (frameIdx++ & 1) === 0) {
          shadowGroup.position.y = m.minY - 0.05;
          renderShadow();
          shadowStale = false;
        } else shadowStale = true;
      }
      renderer.render(scene, camera);
      dirty = false;
      window.__bloomFrames = (window.__bloomFrames || 0) + 1;
    }

    // garde-fou : si l'appareil n'arrive pas a suivre pendant le mouvement, on allege d'abord l'ombre,
    // puis seulement la densite de pixels au dela de 2 (jamais en dessous : la piece reste nette)
    if (moving && frameMs < 200) {
      measuredFrames++;
      if (frameMs > 20) slowFrames++;
      if (measuredFrames >= 60) {
        if (slowFrames > 20) {
          if (!halfRateShadow) halfRateShadow = true;
          else if (maxDpr > 2) { maxDpr = 2; applyPixelRatio(); }
        }
        measuredFrames = 0; slowFrames = 0;
      }
    }
    // au repos : plus aucune image calculee ; un seul reveil programme pour la rotation lente
    clearTimeout(wakeTimer);
    if (moving || !ready || shadowStale) schedule();
    else if (!reduceMotion && !window.__bloomFreeze) wakeTimer = setTimeout(schedule, Math.max(50, AUTO_DELAY - (now - idleSince) + 20));
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { last = performance.now(); requestRender(); } });

  window.addEventListener('resize', layout);
  matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`).addEventListener?.('change', () => { maxDpr = Math.min(window.devicePixelRatio || 1, 3); layout(); });
  layout();

  /* ------------------------------------------------------------------ chargement */
  let pModel = 0, pEnv = 0;
  const progress = () => onProgress(Math.round((pModel * 0.6 + pEnv * 0.4) * 100));
  const draco = new DRACOLoader().setDecoderPath(`https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/examples/jsm/libs/draco/gltf/`);
  const gltfLoader = new GLTFLoader().setDRACOLoader(draco);

  const envP = new Promise((resolve, reject) => {
    new RGBELoader().setDataType(THREE.FloatType).load(ENV_URL, (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      // sol vu dans les reflets : sous la piece il est dans son ombre (comme dans Cycles), plus sombre vers le bas
      const { data, width, height } = tex.image;
      for (let yRow = 0; yRow < height; yRow++) {
        const el = (0.5 - (yRow + 0.5) / height) * Math.PI;      // flipY : la premiere ligne est le haut
        if (el >= 0) continue;
        const k = 1 - FLOOR_OCCLUSION * Math.pow(Math.min(1, -el / (Math.PI / 2)), 0.35);
        for (let i = yRow * width * 4, e = i + width * 4; i < e; i += 4) { data[i] *= k; data[i + 1] *= k; data[i + 2] *= k; }
      }
      tex.needsUpdate = true;
      const pmrem = new THREE.PMREMGenerator(renderer);
      const rt = pmrem.fromEquirectangular(tex);
      pmrem.dispose(); tex.dispose();
      scene.environment = rt.texture;
      // l'avant du studio Cycles (boite a lumiere face a la piece) se place du cote de la camera
      scene.environmentRotation.set(0, Math.PI / 2, 0);
      pEnv = 1; progress();
      resolve();
    }, (ev) => { if (ev.total) { pEnv = ev.loaded / ev.total; progress(); } }, reject);
  });
  const modelP = new Promise((resolve, reject) => {
    gltfLoader.load(MODEL_URL, (gltf) => {
      const root = gltf.scene;
      root.scale.setScalar(1000);                 // glb en metres, scene en millimetres
      root.traverse((o) => {
        if (!o.isMesh) return;
        const n = (o.material && o.material.name) || '';
        if (n.startsWith('Diamant')) o.material = diamond;
        else if (n.startsWith('OrBlancSiege')) o.material = seatGold;
        else if (n.startsWith('OrBlanc')) o.material = whiteGold;
        else o.material = roseGold;
      });
      pivot.add(root);
      pModel = 1; progress();
      resolve(root);
    }, (ev) => { if (ev.total) { pModel = ev.loaded / ev.total; progress(); } }, reject);
  });
  Promise.all([modelP, envP]).then(([root]) => {
    const q = pivot.quaternion.clone();
    pivot.quaternion.identity();
    pivot.updateMatrixWorld(true);
    collectProbes(root);
    pivot.quaternion.copy(q);
    renderer.compile(scene, camera);
    ready = true;
    fitNow = measure(pivot.quaternion).fit;
    idleSince = performance.now();
    requestRender();
    onReady();
    window.__bloomReady = true;
  }).catch((err) => {
    console.error(err);
    onError('load');
  });

  // acces pour les controles automatises (captures de verification)
  window.__bloom = {
    THREE, renderer, camera, pivot, goTo,
    setOrientation(xDeg, yDeg, zDeg) {
      tween = null; omega.set(0, 0, 0); autoSpeed = 0;
      pivot.quaternion.copy(BASE);
      rotateBy(THREE.MathUtils.degToRad(xDeg), THREE.MathUtils.degToRad(yDeg), THREE.MathUtils.degToRad(zDeg || 0));
      fitNow = measure(pivot.quaternion).fit;
      idleSince = performance.now();
      requestRender();
    },
    zoom(z, x, y) { zoomAt(z / userZoom, x ?? cw / 2, y ?? 0.48 * ch); requestRender(); },
    tune: { SH, shadowPlane, depthMat, roseGold, whiteGold, diamond },
    spin(wx, wy, wz) { tween = null; omega.set(wx, wy, wz); requestRender(); },
    render: requestRender,
    get dpr() { return renderer.getPixelRatio(); },
    get halfRateShadow() { return halfRateShadow; },
  };
  return { requestRender };
}
