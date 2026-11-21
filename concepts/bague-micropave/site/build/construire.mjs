// Reconstruit site/build/ depuis site/viewer.js et site/pathtrace.js (esbuild, decoupage en morceaux, minifie).
// Versions figees : three 0.187.0, three-gpu-pathtracer 0.0.28, three-mesh-bvh 0.9.18 (licences dans site/vendor/).
//   NODE_PATH=<node_modules contenant ces trois paquets et esbuild> node site/build/construire.mjs
//
// Ajouts appliques au path tracer WebGPU pendant la construction (rien n'est modifie dans node_modules) :
//  1. deuxieme studio, comme l'aiguillage "Is Singular Ray" de blender/render.py : un rayon qui sort apres un
//     rebond parfaitement lisse (densite de probabilite > 1e8, c'est-a-dire les pierres de rugosite 0) prend le
//     studio contraste des pierres ; les autres (metal rugosite 0,03, sol) gardent la tente claire ;
//  2. etalonnage de blender/composite.py a l'affichage (niveaux 0,10 / 0,97 puis courbe en S 0,40, en sRGB).
import { createRequire } from 'module';
import { readFileSync, rmSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(path.join(process.env.NODE_PATH.split(':')[0], 'x.js'));
const esbuild = require('esbuild');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const pkg = (p) => require.resolve(p);
const NM = process.env.NODE_PATH.split(':')[0];
const ptDir = path.join(NM, 'three-gpu-pathtracer');
const versions = ['three', 'three-gpu-pathtracer', 'three-mesh-bvh'].map((n) => n + ' ' + JSON.parse(readFileSync(path.join(NM, n, 'package.json'), 'utf8')).version);
const WANT = ['three 0.187.0', 'three-gpu-pathtracer 0.0.28', 'three-mesh-bvh 0.9.18'];
if (versions.join() !== WANT.join()) throw new Error('versions attendues ' + WANT.join(', ') + ', trouvees ' + versions.join(', '));

// remplacement insensible aux espaces ; echoue si le motif n'est pas trouve exactement une fois
function rep(src, a, b, file) {
  const re = new RegExp(a.trim().split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*'), 'g');
  const n = (src.match(re) || []).length;
  if (n !== 1) throw new Error(`${file} : motif trouve ${n} fois : ${a.slice(0, 70)}`);
  return src.replace(re, () => b);
}
const PATCHES = {
  'src/webgpu/EquirectHdrInfoNode.js': (s, f) => {
    s = rep(s, 'constructor() { super();', 'constructor( fnSuffix = \'\' ) { super(); this.fnSuffix = fnSuffix;', f);
    s = rep(s, 'fn sampleEnv( direction: vec3f ) -> vec4f {', 'fn sampleEnv${ this.fnSuffix }( direction: vec3f ) -> vec4f {', f);
    return s;
  },
  'src/webgpu/WaveFrontPathTracer.js': (s, f) => {
    s = rep(s, 'this.envInfo = new EquirectHdrInfoNode();', 'this.envInfo = new EquirectHdrInfoNode(); this.env2Info = new EquirectHdrInfoNode( \'Pierres\' );', f);
    s = rep(s, 'this.logicKernel.envInfo = this.envInfo;', 'this.logicKernel.envInfo = this.envInfo; this.logicKernel.env2Info = this.env2Info;', f);
    s = rep(s, 'setEnvironment( envMap ) {', 'setEnvironment2( envMap ) { this.env2Info.updateFrom( envMap ); this.reset(); }\n\n\tsetEnvironment( envMap ) {', f);
    s = rep(s, 'envInfo.intensityNode.value = envMapIntensity;', 'envInfo.intensityNode.value = envMapIntensity; this.env2Info.rotationNode.value.setFromMatrix4( rotationMatrix );', f);
    s = rep(s, 'this.envInfo.dispose();', 'this.envInfo.dispose(); this.env2Info.dispose();', f);
    return s;
  },
  'src/webgpu/WebGPUPathTracer.js': (s, f) => rep(s, 'setDenoiser( denoiser ) {', 'setEnvironment2( envMap ) { this._pathTracer.setEnvironment2( envMap ); }\n\n\tsetDenoiser( denoiser ) {', f),
  'src/webgpu/compute/wavefront/LogicKernel.js': (s, f) => {
    s = rep(s, 'envInfo: { value: null },', 'envInfo: { value: null }, env2Info: { value: null },', f);
    s = rep(s, "const sampleEnvColor = proxy( 'envInfo.value.sampleColor', params );", "const sampleEnvColor = proxy( 'envInfo.value.sampleColor', params ); const sampleEnv2Color = proxy( 'env2Info.value.sampleColor', params );", f);
    s = rep(s, 'let environment = ${ sampleEnvColor }( input.direction ).rgb * throughputColor * misWeight;',
      'let singularRay = input.scatterPdf > 1e8; let environment = select( ${ sampleEnvColor }( input.direction ).rgb, ${ sampleEnv2Color }( input.direction ).rgb, singularRay ) * throughputColor * misWeight;', f);
    s = rep(s, 'let env = ${ sampleEnvColor }( input.direction );', 'let env = ${ sampleEnv2Color }( input.direction );', f);
    return s;
  },
  'src/webgpu/materials/RenderToScreenMaterial.js': (s, f) => {
    s = rep(s, 'this.colorNode = vec4( toneMappingNode.rgb, toneMappingNode.a );', `const lioriGradeFn = wgslFn( /* wgsl */\`
			fn lioriGrade( c: vec4f ) -> vec4f {
				let a = c.a;
				if ( a <= 0.0 ) { return c; }
				var x = clamp( c.rgb / a, vec3f( 0.0 ), vec3f( 1.0 ) );
				x = select( 1.055 * pow( x, vec3f( 1.0 / 2.4 ) ) - 0.055, x * 12.92, x <= vec3f( 0.0031308 ) );
				x = clamp( ( x - 0.10 ) / 0.87, vec3f( 0.0 ), vec3f( 1.0 ) );
				x = clamp( x + 0.40 * sin( 3.14159265 * x ) * ( x - 0.55 ) * 1.2, vec3f( 0.0 ), vec3f( 1.0 ) );
				x = select( pow( ( x + 0.055 ) / 1.055, vec3f( 2.4 ) ), x / 12.92, x <= vec3f( 0.04045 ) );
				return vec4f( x * a, a );
			}\` );
		this.colorNode = lioriGradeFn( vec4( toneMappingNode.rgb, toneMappingNode.a ) );`, f);
    return s;
  },
};
const patchPlugin = {
  name: 'liori-pathtracer',
  setup(build) {
    build.onLoad({ filter: /three-gpu-pathtracer[\\/]src[\\/]webgpu[\\/].*\.js$/ }, (args) => {
      const rel = path.relative(ptDir, args.path).split(path.sep).join('/');
      const fn = PATCHES[rel];
      if (!fn) return undefined;
      PATCHES[rel].done = true;
      return { contents: fn(readFileSync(args.path, 'utf8'), rel), loader: 'js' };
    });
  },
};

const out = path.join(root, 'site/build');
for (const f of readdirSync(out)) if (f.endsWith('.js')) rmSync(path.join(out, f));
const worker = path.join(path.dirname(pkg('three-mesh-bvh/worker')), 'generateMeshBVH.worker.js');
await esbuild.build({
  entryPoints: [path.join(root, 'site/viewer.js'), worker],
  bundle: true, splitting: true, format: 'esm', minify: true, target: ['es2022', 'safari16'],
  legalComments: 'eof', outdir: out, entryNames: '[name]', chunkNames: 'morceau-[hash]',
  nodePaths: process.env.NODE_PATH.split(':'), plugins: [patchPlugin], logLevel: 'warning',
});
const missing = Object.keys(PATCHES).filter((k) => !PATCHES[k].done);
if (missing.length) throw new Error('ajouts non appliques : ' + missing.join(', '));
console.log(versions.join(', '));
for (const f of readdirSync(out)) console.log(f);
