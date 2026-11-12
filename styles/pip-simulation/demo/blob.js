// Pip, the style's character. An instanced crowd: hundreds of Pips = one InstancedMesh per part.
// Local space: feet at y = 0, face towards +z, about 0.9 tall (times scale).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ———————— palette: only from palette.js ————————
import { PALETTE, RAMP_STOPS } from './palette.js';
export const PAL = { board: PALETTE.board, ink: PALETTE.ink, ...PALETTE.team, mint: PALETTE.mint };
// speed gene → colour: cobalt (slow) → violet → rose → tomato → butter (fast), interpolated in OKLab, lightness rising
const toLab = c => { // linear sRGB → OKLab
  const l = .4122214708 * c.r + .5363325363 * c.g + .0514459929 * c.b, m = .2119034982 * c.r + .6806995451 * c.g + .1073969566 * c.b, s = .0883024619 * c.r + .2817188376 * c.g + .6299787005 * c.b;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  return [.2104542553 * l_ + .793617785 * m_ - .0040720468 * s_, 1.9779984951 * l_ - 2.428592205 * m_ + .4505937099 * s_, .0259040371 * l_ + .7827717662 * m_ - .808675766 * s_];
};
const fromLab = ([L, a, b]) => {
  const l_ = L + .3963377774 * a + .2158037573 * b, m_ = L - .1055613458 * a - .0638541728 * b, s_ = L - .0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return new THREE.Color(4.0767416621 * l - 3.3077115913 * m + .2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s, -.0041960863 * l - .7034186147 * m + 1.707614701 * s);
};
const RAMP = RAMP_STOPS.map(([v, h]) => [v, toLab(new THREE.Color(h))]);
export function geneColor(s) {
  if (s <= RAMP[0][0]) return fromLab(RAMP[0][1]);
  for (let i = 1; i < RAMP.length; i++) if (s <= RAMP[i][0]) {
    const u = (s - RAMP[i - 1][0]) / (RAMP[i][0] - RAMP[i - 1][0]);
    return fromLab(RAMP[i - 1][1].map((x, k) => x + (RAMP[i][1][k] - x) * u));
  }
  return fromLab(RAMP[RAMP.length - 1][1]);
}

// ———————— body profile: a wide-based, round-bellied, domed mochi ————————
const PROF = [[0, 0], [.34, 0], [.45, .022], [.51, .085], [.535, .2], [.525, .35], [.48, .52], [.39, .69], [.24, .83], [.1, .89], [0, .9]];
const prof = new THREE.SplineCurve(PROF.map(p => new THREE.Vector2(...p))).getSpacedPoints(90);
prof[0].set(0, 0); prof[prof.length - 1].x = 0;
const side = prof.filter(p => p.y > .03);
export function rAt(y) {
  for (let i = 1; i < side.length; i++) if (side[i].y >= y) { const a = side[i - 1], b = side[i], u = (y - a.y) / (b.y - a.y || 1); return a.x + (b.x - a.x) * u; }
  return 0;
}
// a point on the body: height y, angle a from straight ahead (right positive) → position + normal
export function surf(y, a, out = 0) {
  const r = rAt(y), dr = (rAt(y + .005) - rAt(y - .005)) / .01;
  const n = new THREE.Vector3(Math.sin(a), -dr, Math.cos(a)); n.x *= 1; n.z *= 1;
  const nr = 1 / Math.hypot(1, dr); const N = new THREE.Vector3(Math.sin(a) * nr, -dr * nr, Math.cos(a) * nr).normalize();
  const P = new THREE.Vector3(r * Math.sin(a), y, r * Math.cos(a)).addScaledVector(N, out);
  return { P, N };
}
// a local matrix with the normal as z (so parts sit on the body)
const _up = new THREE.Vector3(0, 1, 0);
function onSurf(y, a, out, sx, sy, sz, roll = 0) {
  const { P, N } = surf(y, a, out);
  const z = N.clone(), x = new THREE.Vector3().crossVectors(_up, z).normalize(), yy = new THREE.Vector3().crossVectors(z, x);
  const m = new THREE.Matrix4().makeBasis(x, yy, z);
  if (roll) m.multiply(new THREE.Matrix4().makeRotationZ(roll));
  return m.scale(new THREE.Vector3(sx, sy, sz)).setPosition(P);
}

// ———————— geometry ————————
export const GEO = {};
GEO.body = new THREE.LatheGeometry(prof, 96, Math.PI, Math.PI * 2);   // seam turned to the back
GEO.sph = new THREE.SphereGeometry(1, 40, 28);
GEO.sphLo = new THREE.SphereGeometry(1, 20, 14);
{ // the tuft: a soft curl on top, like a pinch of dough pulled up; thick root, thin tip, round end
  const curve = new THREE.CubicBezierCurve3(new THREE.Vector3(0, -.03, 0), new THREE.Vector3(0, .16, -.02), new THREE.Vector3(0, .2, .12), new THREE.Vector3(0, .11, .1));
  const tube = new THREE.TubeGeometry(curve, 40, 1, 20, false), pos = tube.attributes.position, segs = 40, rad = 20;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, c = curve.getPointAt(t), r = .062 * Math.pow(1 - t, .8) + .02;
    for (let j = 0; j <= rad; j++) { const k = i * (rad + 1) + j, v = new THREE.Vector3().fromBufferAttribute(pos, k).sub(c).normalize().multiplyScalar(r).add(c); pos.setXYZ(k, v.x, v.y, v.z); }
  }
  tube.computeVertexNormals();
  const cap = new THREE.SphereGeometry(.02, 16, 12); cap.translate(...curve.getPointAt(1).toArray());
  GEO.tuft = mergeGeometries([tube.toNonIndexed(), cap.toNonIndexed()]);
}
{ // arcs (^ eyes, mouths): a half torus, open side down = ∩
  GEO.arc = new THREE.TorusGeometry(1, .26, 14, 40, Math.PI);
}

// ———————— materials (C, flock, is the style; A and B are kept for comparison) ————————
function noiseNormal(size, octaves, seed, sharp = 1) { // tileable value noise → normal map
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const h = new Float32Array(size * size);
  for (const [freq, amp] of octaves) {
    const g = new Float32Array(freq * freq).map(() => rnd());
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const fx = x / size * freq, fy = y / size * freq, x0 = Math.floor(fx), y0 = Math.floor(fy), u = fx - x0, v = fy - y0;
      const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
      const G = (i, j) => g[((j % freq) * freq) + (i % freq)];
      const a = G(x0, y0), b = G(x0 + 1, y0), c = G(x0, y0 + 1), d = G(x0 + 1, y0 + 1);
      h[y * size + x] += amp * (a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv);
    }
  }
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const H = (i, j) => h[((j + size) % size) * size + ((i + size) % size)];
    const dx = (H(x + 1, y) - H(x - 1, y)) * sharp, dy = (H(x, y + 1) - H(x, y - 1)) * sharp;
    const n = new THREE.Vector3(-dx, -dy, 1).normalize(), k = (y * size + x) * 4;
    data[k] = (n.x * .5 + .5) * 255; data[k + 1] = (n.y * .5 + .5) * 255; data[k + 2] = (n.z * .5 + .5) * 255; data[k + 3] = 255;
  }
  const t = new THREE.DataTexture(data, size, size); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 8; t.needsUpdate = true;
  return t;
}
let NM = null;
function maps() {
  if (NM) return NM;
  NM = {
    fiber: noiseNormal(1024, [[512, 1], [256, .5]], 11, 3),     // flock: very fine fibre grain
    clay: noiseNormal(512, [[6, 1], [12, .45], [96, .05]], 5, 9),  // clay: small hand-pressed undulations
  };
  return NM;
}
// the flock sheen is tinted by each Pip's colour: edges glow in a lighter shade of the same colour
function patch(mat, { sheenTint = 0, fuzz = 0 } = {}) {
  mat.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('material.sheenColor = sheenColor;',
      `material.sheenColor = sheenColor;\n#if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )\n material.sheenColor *= mix(vec3(1.0), clamp(vColor.rgb * 1.35 + 0.12, 0.0, 1.0), ${sheenTint.toFixed(3)});\n#endif`);
    // fibre edge glow: brighter and paler towards the silhouette (the most recognisable trait of flock and peach skin)
    if (fuzz) sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `{
      float fv = 1.0 - saturate(dot(normalize(normal), normalize(vViewPosition)));
      float fz = pow(fv, 2.6) * ${fuzz.toFixed(3)};
      vec3 tint = mix(diffuseColor.rgb, vec3(1.0), 0.35);
      outgoingLight = mix(outgoingLight, tint * 0.95, fz);
    }
    #include <opaque_fragment>`);
  };
  mat.customProgramCacheKey = () => 'pip-sheen' + sheenTint + '-' + fuzz;
  return mat;
}
// mode: A soft vinyl / B matte clay / C flock
export function makeMats(mode = 'C') {
  const M = maps();
  let body;
  if (mode === 'A') body = new THREE.MeshPhysicalMaterial({ roughness: .36, metalness: 0, clearcoat: .55, clearcoatRoughness: .3, specularIntensity: .6 });
  else if (mode === 'B') body = new THREE.MeshPhysicalMaterial({ roughness: .62, metalness: 0, normalMap: M.clay, normalScale: new THREE.Vector2(.34, .34), specularIntensity: .35, sheen: .25, sheenRoughness: .8, sheenColor: new THREE.Color(PALETTE.glint) });
  else body = patch(new THREE.MeshPhysicalMaterial({ roughness: .9, metalness: 0, normalMap: M.fiber, normalScale: new THREE.Vector2(.22, .22), specularIntensity: .1, sheen: 1, sheenRoughness: .35, sheenColor: new THREE.Color(PALETTE.glint) }), { sheenTint: .75, fuzz: .6 });
  body.normalMap && body.normalMap.repeat.set(mode === 'C' ? 6 : 2, mode === 'C' ? 3 : 1);
  const ink = new THREE.MeshPhysicalMaterial({ color: PAL.ink, roughness: .22, clearcoat: 1, clearcoatRoughness: .08, side: THREE.DoubleSide });
  const inkMatte = new THREE.MeshStandardMaterial({ color: PAL.ink, roughness: .7, side: THREE.DoubleSide });
  const glint = new THREE.MeshBasicMaterial({ color: PALETTE.glint, toneMapped: false });
  return { body, ink, inkMatte, glint, mode };
}

// ———————— expressions ————————
// each expression = a set of parts: {k: 'ink'|'arc'|'glint'|'cheek', m: local matrix}
const EY = .52, EA = .3;          // eye height, angle from the centre line
const MY = .375;                  // mouth height
function eyes(kind, big = 1) {
  const out = [];
  for (const sgn of [-1, 1]) {
    const a = sgn * EA * (big > 1.1 ? 1.06 : 1);
    if (kind === 'oval' || kind === 'round' || kind === 'small') {
      const sx = (kind === 'round' ? .078 : kind === 'small' ? .055 : .062) * big, sy = (kind === 'round' ? .088 : kind === 'small' ? .075 : .094) * big;
      out.push({ k: 'ink', m: onSurf(EY, a, -.012, sx, sy, .045) });
      out.push({ k: 'glint', m: onSurf(EY + sy * .42, a + sgn * .035 - .045, .028, sx * .32, sx * .32, .012) });
      out.push({ k: 'glint', m: onSurf(EY - sy * .35, a + .05, .025, sx * .14, sx * .14, .01) });
    } else if (kind === 'happy') {          // ^ ^
      out.push({ k: 'arc', m: onSurf(EY - .025, a, .0, .052, .058, .045) });
    } else if (kind === 'line') {           // — — (asleep / tired)
      out.push({ k: 'arc', m: onSurf(EY - .01, a, .0, .05, -.026, .04) });
    }
  }
  return out;
}
export const EXPR = {
  neutral: () => [...eyes('oval'), { k: 'arc', m: onSurf(MY + .005, 0, -.003, .042, -.032, .04) }],
  happy: () => [...eyes('happy'), { k: 'arc', m: onSurf(MY + .005, 0, -.004, .05, -.04, .04) }],
  eat: () => [...eyes('happy'), { k: 'ink', m: onSurf(MY - .01, 0, -.006, .045, .045, .03) }],
  sleepy: () => [...eyes('line'), { k: 'ink', m: onSurf(MY - .01, 0, -.006, .02, .02, .02) }],
  surprised: (big) => [...eyes('round', big), { k: 'ink', m: onSurf(MY - .02, 0, -.006, .032, .042, .03) }],
  keen: (big) => [...eyes('oval', big), { k: 'arc', m: onSurf(MY - .01, 0, 0, .035, -.026, .035) }],
  sad: () => [...eyes('small'), { k: 'arc', m: onSurf(MY - .03, 0, 0, .04, .028, .035) },
    { k: 'ink', m: onSurf(EY + .1, -EA, .0, .05, .013, .02, .38) }, { k: 'ink', m: onSurf(EY + .1, EA, .0, .05, .013, .02, -.38) }],
  determined: () => [...eyes('oval'), { k: 'arc', m: onSurf(MY, 0, 0, .036, -.022, .035) },
    { k: 'ink', m: onSurf(EY + .095, -EA, .0, .058, .015, .02, -.36) }, { k: 'ink', m: onSurf(EY + .095, EA, .0, .058, .015, .02, .36) }],
};
const CHEEKS = [-1, 1].map(s => onSurf(MY + .02, s * .58, -.012, .068, .04, .02));
const FEET = [-1, 1].map(s => new THREE.Matrix4().compose(new THREE.Vector3(s * .2, .04, .37), new THREE.Quaternion(), new THREE.Vector3(.12, .07, .13)));
const TUFT = new THREE.Matrix4().compose(new THREE.Vector3(.0, .87, .02), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, .5, .12)), new THREE.Vector3(1, 1, 1));

// ———————— the crowd ————————
export class Crowd {
  constructor(scene, mats, cap = 800) {
    this.scene = scene; this.mats = mats; this.cap = cap; this.n = 0;
    const mk = (geo, mat, c, shadow = true) => { const im = new THREE.InstancedMesh(geo, mat, c); im.count = 0; im.castShadow = shadow; im.receiveShadow = true; im.frustumCulled = false; scene.add(im); return im; };
    this.P = {
      body: mk(GEO.body, mats.body, cap), foot: mk(GEO.sph, mats.body, cap * 2), tuft: mk(GEO.tuft, mats.body, cap),
      cheek: mk(GEO.sphLo, mats.body, cap * 2, false),
      ink: mk(GEO.sph, mats.ink, cap * 6, false), arc: mk(GEO.arc, mats.inkMatte, cap * 4, false), glint: mk(GEO.sphLo, mats.glint, cap * 6, false),
    };
    // contact shadow under each Pip (a clean radial gradient instead of noisy screen-space AO)
    // (multiply blending: the board is bright in linear space and plain alpha cannot darken it)
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256);
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    for (let i = 0; i <= 20; i++) { const u = i / 20, k = Math.min(1, Math.max(0, (u - .5) / .5)), sm = k * k * (3 - 2 * k), d = Math.pow(1 - sm, 1.7) * .5;
      gr.addColorStop(u, `rgb(${Math.round(255 * (1 - d * .95))},${Math.round(255 * (1 - d))},${Math.round(255 * (1 - d * 1.08))})`); }
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const pg = new THREE.PlaneGeometry(1, 1); pg.rotateX(-Math.PI / 2);
    this.P.contact = new THREE.InstancedMesh(pg, new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.MultiplyBlending, premultipliedAlpha: true, depthWrite: false, toneMapped: false, fog: false, polygonOffset: true, polygonOffsetFactor: -4 }), cap);
    this.P.contact.count = 0; this.P.contact.renderOrder = 2; this.P.contact.frustumCulled = false; scene.add(this.P.contact);
    this.list = [];
  }
  _push(k, m, col) { const im = this.P[k]; const i = im.count++; im.setMatrixAt(i, m); if (col) im.setColorAt(i, col); }
  // p: {x, z, yaw, s, color, expr, big, lean, hop, squash, tilt, cheek}
  add(p) {
    const s = p.s ?? 1, sq = p.squash ?? 1;
    const M = new THREE.Matrix4().compose(new THREE.Vector3(p.x, (p.y ?? 0) + (p.hop ?? 0), p.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, p.yaw ?? 0, 0)), new THREE.Vector3(1, 1, 1));
    M.multiply(new THREE.Matrix4().makeRotationX(p.lean ?? 0)).multiply(new THREE.Matrix4().makeRotationZ(p.tilt ?? 0));
    M.multiply(new THREE.Matrix4().makeScale(s / Math.sqrt(sq), s * sq, s / Math.sqrt(sq)));
    const col = p.color.clone(), dark = col.clone().multiplyScalar(.8);
    const cheek = col.clone().lerp(new THREE.Color(PALETTE.cheek), .3).offsetHSL(0, -.05, .06);
    const W = m => new THREE.Matrix4().multiplyMatrices(M, m);
    { const r = 1.55 * s * (1 - Math.min(.5, (p.hop ?? 0) * 1.2)); this._push('contact', new THREE.Matrix4().compose(new THREE.Vector3(p.x, (p.y ?? 0) + .004, p.z), new THREE.Quaternion(), new THREE.Vector3(r * 1.05, 1, r))); }
    this._push('body', M, col);
    if (!p.noFeet) for (const f of FEET) this._push('foot', W(f), dark);
    if (!p.noTuft) this._push('tuft', W(TUFT), col);
    if (p.cheek !== false) for (const c of CHEEKS) this._push('cheek', W(c), cheek);
    // faceK: blink factor (1 = open, → 0 = closed); expressions change through a blink, never a one-frame jump
    const fk = p.faceK ?? 1, FK = fk === 1 ? null : new THREE.Matrix4().makeScale(1, Math.max(.06, fk), 1);
    for (const part of (EXPR[p.expr || 'neutral'])(p.big || 1)) {
      if (FK && part.k === 'glint' && fk < .45) continue;
      this._push(part.k, FK ? W(part.m).multiply(FK) : W(part.m), null);
    }
    this.list.push({ ...p, M });
    return M;
  }
  // clear and re-place every frame (instance capacity unchanged)
  reset() { for (const im of Object.values(this.P)) im.count = 0; this.list.length = 0; }
  done() { for (const im of Object.values(this.P)) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; } }
}
