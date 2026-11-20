// Path tracing progressif de la bague a l'arret, dans le navigateur : three-gpu-pathtracer 0.0.28 (WebGPUPathTracer,
// noyaux de calcul WebGPU), version figee et integree dans site/build/. Charge a la demande par site/viewer.js.
// Le path tracer WebGL du meme paquet a ete mesure beaucoup plus lent sur ce Mac (controle/3d-pathtracing/).
//
// Fidelite a blender/render.py :
//  - deux studios aiguilles comme dans Cycles (Light Path > Is Singular Ray) : un rayon qui sort d'un rebond
//    parfaitement lisse (les pierres, rugosite 0) voit le studio contraste, les autres voient la tente claire.
//    Ajout fait au moment de la construction par site/build/construire.mjs (LogicKernel.js, WaveFrontPathTracer.js) ;
//  - diamant : verre net IOR 2,417, dispersion 0,36 (Abbe 55, convention glTF 20 / Abbe) ;
//  - metal : couleur de base et rugosite de render.py ; gravure : creux mat presque noir ;
//  - etalonnage de composite.py (niveaux 0,10 / 0,97, courbe en S 0,40) applique a l'affichage (meme ajout) ;
//    la clarte locale (0,20) n'est pas reproduite ;
//  - camera, cadrage et studio identiques au visualiseur ; c'est la bague qui tourne (updateTransforms : la BVH
//    n'est construite qu'une fois).
import * as THREE from 'three/webgpu';
import { WebGPUPathTracer, TRANSMISSIVE_BACKGROUND_ENVIRONMENT } from 'three-gpu-pathtracer/webgpu';
import { GenerateMeshBVHWorker } from 'three-mesh-bvh/worker';

export async function webgpuAvailable() {
  if (!navigator.gpu) return false;
  try {
    const a = await navigator.gpu.requestAdapter();
    return !!a && !a.isFallbackAdapter;
  } catch (e) {
    return false;
  }
}

export class RingPathTracer {
  /**
   * @param host      element qui recoit le canvas WebGPU (au-dessus du canvas temps reel)
   * @param template  racine de la bague (glTF, en mm, materiaux marques dans userData.matName)
   * @param opts      { envMetal, envDiam (DataTexture equirect lineaires), pivotY, camera, maxSamples }
   */
  constructor(host, template, opts) {
    this.opts = opts;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'pt';
    this.canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(this.canvas);
    this.renderer = new THREE.WebGPURenderer({ canvas: this.canvas, antialias: false, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.pivot = new THREE.Group();
    this.scene.add(this.pivot);

    this.metal = new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: 0.03 });
    this.engraving = new THREE.MeshPhysicalMaterial({ metalness: 0, roughness: 0.8, specularIntensity: 0 });
    const gem = () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0, transmission: 1, ior: 2.417, thickness: 1, dispersion: 0.36 });
    this.gemC = gem();
    this.gemP = gem();
    const root = template.clone(true);
    root.position.set(0, -opts.pivotY, 0);
    root.traverse((o) => {
      if (!o.isMesh) return;
      const n = o.userData.matName || '';
      o.material = n === 'pave' ? this.gemP : n === 'centre' ? this.gemC : n === 'gravure' ? this.engraving : this.metal;
    });
    this.pivot.add(root);
    this.scene.environment = opts.envMetal;
    this.scene.background = null;
    this.samples = 0;
    this.complete = false;
    this.stage = 'building';
  }

  async init() {
    const t0 = performance.now();
    await this.renderer.init();
    const pt = new WebGPUPathTracer(this.renderer);
    pt.maxBounces = 16;
    pt.adaptiveFrameBudget = false;        // demande des requetes d'horodatage GPU, absentes sur certains appareils
    pt.filterGlossyFactor = 0;               // Cycles : filtre brillant 0, pas de clamp
    pt.minSamples = 1;
    pt.fadeDuration = 1;
    pt.renderDelay = 0;
    pt.dynamicLowRes = false;
    pt.transmissiveBackground = TRANSMISSIVE_BACKGROUND_ENVIRONMENT;
    pt.maxSamples = this.opts.maxSamples;
    pt.setBVHWorker(GenerateMeshBVHWorker);
    pt.addEventListener('progress', (e) => { this.stage = e.stage; if (e.samples) { this.samples = e.samples.min; this.counts = e.samples; } });
    pt.addEventListener('complete', () => { this.complete = true; });
    this.syncCamera();
    await pt.setSceneAsync(this.scene, this.camera);
    pt.setEnvironment2(this.opts.envDiam);
    this.pt = pt;
    return performance.now() - t0;
  }

  syncCamera() {
    const c = this.opts.camera, cam = this.camera;
    cam.fov = c.fov; cam.aspect = c.aspect; cam.near = c.near; cam.far = c.far;
    cam.position.copy(c.position); cam.quaternion.copy(c.quaternion);
    cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  }

  setMetal(base, rough) {
    this.metal.color.setRGB(base[0], base[1], base[2], THREE.LinearSRGBColorSpace);
    this.metal.roughness = rough;
    this.engraving.color.setRGB(base[0] * 0.025, base[1] * 0.025, base[2] * 0.025, THREE.LinearSRGBColorSpace);
    if (this.pt) this.pt.updateMaterials();
  }

  /** nouvelle pose : quaternion de la bague, camera du visualiseur (zoom), taille du canvas */
  begin(q, width, height, dpr) {
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);
    this.pivot.quaternion.copy(q);
    this.pivot.updateMatrixWorld(true);
    this.syncCamera();
    this.pt.updateTransforms();
    this.pt.updateCamera();
    this.pt.reset();
    this.samples = 0;
    this.complete = false;
  }

  /** un pas de rendu ; le resultat etalonne est presente dans le canvas WebGPU */
  step() { this.pt.renderSample(); }

  async sampleCounts() { return this.pt.getSampleCountsAsync(); }

  get compiling() { return !this.pt || this.pt.compiling; }
}
