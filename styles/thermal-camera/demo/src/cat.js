// A sleeping orange tabby on the warm bonnet. The body is a signed-distance field (smooth union of round cones and
// ellipsoids: curled spine, haunch, shoulders, head, muzzle, ears, paws, tail) meshed with marching cubes for each frame
// from the pose at t. Fur is shells over that mesh (picture only). The thermal pass sees fur surface temperature,
// a warmer face and ears, and the eyes as the hottest points once they open.
import * as THREE from 'three';
import { edgeTable, triTable } from 'three/addons/objects/MarchingCubes.js';
import { TMC, add } from './thermal.js';
import { patch } from './photo.js';
import { clamp, lerp, seg, ss, sst } from './util.js';

const SHELLS = 10, FUR = .0095;
// ---------------------------------------------------------------- pose from film time
export function catPose(t) {
  const g = (x, c, w) => Math.exp(-(((x - c) / w) ** 2));
  const breathe = Math.sin(t * 2 * Math.PI / 2.3);
  const lift = sst(t, 26.25, 26.85) * (1 - sst(t, 28.55, 29.3));
  const look = sst(t, 26.7, 27.15) * (1 - sst(t, 28.5, 28.95));
  const eye = sst(t, 26.5, 26.68) * (1 - g(t, 27.55, .05)) * (1 - sst(t, 28.85, 29.0));
  const turn = sst(t, 28.6, 29.45);
  const ear = Math.max(sst(t, 26.2, 26.5) * (1 - sst(t, 28.4, 28.9)), .5 * g(t, 24.75, .08) + .5 * g(t, 29.3, .07));
  const meow = g(t, 26.95, .14);
  const flick = Math.sin((t - 29.0) * 9) * g(t, 29.2, .25) + .6 * Math.sin((t - 24.3) * 8) * g(t, 24.4, .2);
  return { breathe, lift, look, eye, turn, ear, meow, flick };
}

// ---------------------------------------------------------------- SDF primitives (flat arrays for speed)
// kind 0: round cone a->b radii r0->r1 ; kind 1: ellipsoid centre c, radii R, rotation (row-major 3x3 inverse)
class Prims {
  constructor() { this.n = 0; this.d = new Float32Array(64 * 24); this.part = []; this.u0 = []; this.u1 = []; this.grp = []; }
  reset() { this.n = 0; this.part.length = this.u0.length = this.u1.length = this.grp.length = 0; }
  cone(a, b, r0, r1, part, u0 = 0, u1 = 0, grp = 0) {
    const o = this.n * 24, D = this.d; D[o] = 0; D.set(a, o + 1); D.set(b, o + 4); D[o + 7] = r0; D[o + 8] = r1;
    const r = Math.max(r0, r1); D.set([Math.min(a[0], b[0]) - r, Math.min(a[1], b[1]) - r, Math.min(a[2], b[2]) - r, Math.max(a[0], b[0]) + r, Math.max(a[1], b[1]) + r, Math.max(a[2], b[2]) + r], o + 18);
    this.part.push(part); this.u0.push(u0); this.u1.push(u1); this.grp.push(grp); this.n++;
  }
  ell(c, R, m, part, grp = 0) {   // m: THREE.Matrix3 world->local rotation
    const o = this.n * 24, D = this.d; D[o] = 1; D.set(c, o + 1); D.set(R, o + 4); const e = m.elements;  // column-major
    D.set([e[0], e[3], e[6], e[1], e[4], e[7], e[2], e[5], e[8]], o + 9);
    const r = Math.max(...R); D.set([c[0] - r, c[1] - r, c[2] - r, c[0] + r, c[1] + r, c[2] + r], o + 18);
    this.part.push(part); this.u0.push(0); this.u1.push(0); this.grp.push(grp); this.n++;
  }
}
function primDist(D, o, x, y, z, out) {
  if (D[o] === 0) {
    const ax = D[o + 1], ay = D[o + 2], az = D[o + 3], bx = D[o + 4] - ax, by = D[o + 5] - ay, bz = D[o + 6] - az;
    const px = x - ax, py = y - ay, pz = z - az;
    const h = Math.max(0, Math.min(1, (px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz)));
    const qx = px - bx * h, qy = py - by * h, qz = pz - bz * h;
    if (out) out.h = h;
    return Math.sqrt(qx * qx + qy * qy + qz * qz) - (D[o + 7] + (D[o + 8] - D[o + 7]) * h);
  }
  const px = x - D[o + 1], py = y - D[o + 2], pz = z - D[o + 3];
  const lx = D[o + 9] * px + D[o + 10] * py + D[o + 11] * pz, ly = D[o + 12] * px + D[o + 13] * py + D[o + 14] * pz, lz = D[o + 15] * px + D[o + 16] * py + D[o + 17] * pz;
  const rx = D[o + 4], ry = D[o + 5], rz = D[o + 6];
  const k0 = Math.sqrt((lx / rx) ** 2 + (ly / ry) ** 2 + (lz / rz) ** 2), k1 = Math.sqrt((lx / rx / rx) ** 2 + (ly / ry / ry) ** 2 + (lz / rz / rz) ** 2);
  return k0 * (k0 - 1) / Math.max(k1, 1e-6);
}
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * .25; };
const KG = [.022, .008];   // blend radius per group: 0 body/head, 1 tail

// ---------------------------------------------------------------- mesher
const BX = [-.28, .28], BY = [-.004, .26], BZ = [-.28, .28], CELL = .0068;
const NX = Math.ceil((BX[1] - BX[0]) / CELL) + 1, NY = Math.ceil((BY[1] - BY[0]) / CELL) + 1, NZ = Math.ceil((BZ[1] - BZ[0]) / CELL) + 1;
const MAXV = 90000;

export function buildCat(parent) {
  const G = new THREE.Group(); parent.add(G);
  const body = new THREE.Group(); G.add(body);
  const P = new Prims();
  const field = new Float32Array(NX * NY * NZ);
  const geo = new THREE.BufferGeometry();
  const aPos = new THREE.BufferAttribute(new Float32Array(MAXV * 3), 3), aNor = new THREE.BufferAttribute(new Float32Array(MAXV * 3), 3);
  const aPart = new THREE.BufferAttribute(new Float32Array(MAXV * 2), 2);   // part id, stripe coordinate
  for (const a of [aPos, aNor, aPart]) a.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', aPos); geo.setAttribute('normal', aNor); geo.setAttribute('aCat', aPart);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, .1, 0), .45);

  function evalAt(x, y, z) {
    const D = P.d; let d0 = 1e9, d1 = 1e9;
    for (let i = 0; i < P.n; i++) {
      const o = i * 24; const g = P.grp[i]; const k = KG[g];
      if (x < D[o + 18] - k || y < D[o + 19] - k || z < D[o + 20] - k || x > D[o + 21] + k || y > D[o + 22] + k || z > D[o + 23] + k) continue;
      const d = primDist(D, o, x, y, z);
      if (g === 0) d0 = d0 > 1e8 ? d : smin(d0, d, k); else d1 = d1 > 1e8 ? d : smin(d1, d, k);
    }
    let d = smin(d0, d1, .006);
    d = Math.max(d, -(y - .0) - .0);   // sits on the bonnet
    return Math.min(d, 1);
  }
  const OUT = { h: 0 };
  function partAt(x, y, z) {
    const D = P.d; let best = 1e9, bi = 0, bh = 0;
    for (let i = 0; i < P.n; i++) { const d = primDist(D, i * 24, x, y, z, OUT); if (d < best) { best = d; bi = i; bh = OUT.h; } }
    return [P.part[bi], P.u0[bi] + (P.u1[bi] - P.u0[bi]) * bh];
  }
  function mesh() {
    // sample
    for (let k = 0; k < NZ; k++) { const z = BZ[0] + k * CELL; for (let j = 0; j < NY; j++) { const y = BY[0] + j * CELL; const row = (k * NY + j) * NX; for (let i = 0; i < NX; i++) field[row + i] = evalAt(BX[0] + i * CELL, y, z); } }
    const F = (i, j, k) => field[(k * NY + j) * NX + i];
    const grad = (i, j, k, out) => {
      const i0 = Math.max(0, i - 1), i1 = Math.min(NX - 1, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(NY - 1, j + 1), k0 = Math.max(0, k - 1), k1 = Math.min(NZ - 1, k + 1);
      out[0] = F(i1, j, k) - F(i0, j, k); out[1] = F(i, j1, k) - F(i, j0, k); out[2] = F(i, j, k1) - F(i, j, k0);
    };
    const CO = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
    const ED = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    const vp = new Float32Array(36), vn = new Float32Array(36), val = new Float32Array(8), gA = [0, 0, 0], gB = [0, 0, 0];
    const pos = aPos.array, nor = aNor.array, pa = aPart.array; let nv = 0;
    for (let k = 0; k < NZ - 1; k++) for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++) {
      let ci = 0;
      for (let c = 0; c < 8; c++) { val[c] = F(i + CO[c][0], j + CO[c][1], k + CO[c][2]); if (val[c] < 0) ci |= 1 << c; }
      const em = edgeTable[ci]; if (!em) continue;
      for (let e = 0; e < 12; e++) {
        if (!(em & (1 << e))) continue;
        const [a, b] = ED[e]; const va = val[a], vb = val[b]; const mu = Math.abs(vb - va) < 1e-9 ? .5 : (0 - va) / (vb - va);
        const A = CO[a], Bc = CO[b];
        for (let q = 0; q < 3; q++) vp[e * 3 + q] = [BX, BY, BZ][q][0] + ([i, j, k][q] + A[q] + (Bc[q] - A[q]) * mu) * CELL;
        grad(i + A[0], j + A[1], k + A[2], gA); grad(i + Bc[0], j + Bc[1], k + Bc[2], gB);
        let nx = gA[0] + (gB[0] - gA[0]) * mu, ny = gA[1] + (gB[1] - gA[1]) * mu, nz = gA[2] + (gB[2] - gA[2]) * mu; const L = Math.hypot(nx, ny, nz) || 1;
        vn[e * 3] = nx / L; vn[e * 3 + 1] = ny / L; vn[e * 3 + 2] = nz / L;
      }
      const t0 = ci * 16;
      for (let q = 0; triTable[t0 + q] !== -1 && nv < MAXV - 3; q += 3) {
        let e0 = triTable[t0 + q], e1 = triTable[t0 + q + 1], e2 = triTable[t0 + q + 2];
        // keep the winding consistent with the field gradient (outward)
        const ux = vp[e1 * 3] - vp[e0 * 3], uy = vp[e1 * 3 + 1] - vp[e0 * 3 + 1], uz = vp[e1 * 3 + 2] - vp[e0 * 3 + 2];
        const wx = vp[e2 * 3] - vp[e0 * 3], wy = vp[e2 * 3 + 1] - vp[e0 * 3 + 1], wz = vp[e2 * 3 + 2] - vp[e0 * 3 + 2];
        const cx = uy * wz - uz * wy, cy = uz * wx - ux * wz, cz = ux * wy - uy * wx;
        if (cx * vn[e0 * 3] + cy * vn[e0 * 3 + 1] + cz * vn[e0 * 3 + 2] < 0) { const s = e1; e1 = e2; e2 = s; }
        for (const e of [e0, e1, e2]) { pos.set(vp.subarray(e * 3, e * 3 + 3), nv * 3); nor.set(vn.subarray(e * 3, e * 3 + 3), nv * 3); nv++; }
      }
    }
    // parts / stripe coordinate per vertex
    for (let v = 0; v < nv; v++) { const r = partAt(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]); pa[v * 2] = r[0]; pa[v * 2 + 1] = r[1]; }
    geo.setDrawRange(0, nv); aPos.needsUpdate = aNor.needsUpdate = aPart.needsUpdate = true;
    aPos.clearUpdateRanges(); aNor.clearUpdateRanges(); aPart.clearUpdateRanges();
    aPos.addUpdateRange(0, nv * 3); aNor.addUpdateRange(0, nv * 3); aPart.addUpdateRange(0, nv * 2);
    return nv;
  }

  // ---------------------------------------------------------------- materials
  const headInv = { value: new THREE.Matrix4() };
  const FURG = `
uniform float uShell; uniform mat4 uHeadInv;
varying vec2 vCat; varying vec3 vBase;
vec3 tabby(float part, float u, vec3 lp){
  vec3 base=vec3(.80,.47,.19), dark=vec3(.56,.27,.08), cream=vec3(.93,.83,.66);
  float st=0., white=0.;
  float w=vn2(lp.xz*24.+lp.y*9.);
  if(part<.5){
    float top=smoothstep(.05,.11,lp.y);
    st=smoothstep(.6,.92,sin(u*80.+4.*w)*.5+.5)*smoothstep(.03,.08,lp.y)*.5*smoothstep(.25,.6,vn2(lp.xz*40.+u*3.));
    st=max(st,top*.55*smoothstep(.4,.7,w));          // darker saddle along the back
    white=smoothstep(.03,.0,lp.y)*.7; }
  else if(part<1.5){ st=smoothstep(.6,.88,sin(u*44.)*.5+.5)*.8; }
  else if(part<2.5){
    vec3 h=(uHeadInv*vec4(lp,1.)).xyz;
    // forehead 'M' and cheek stripes, cream muzzle and chin
    float fore=smoothstep(.0,.02,h.y)*smoothstep(-.01,.03,h.z);
    st=fore*smoothstep(.55,.9,sin(h.x*190.)*.5+.5)*.9;
    st=max(st,smoothstep(.02,.035,abs(h.x))*smoothstep(.0,-.01,h.y)*smoothstep(.6,.9,sin(h.y*320.+h.z*60.)*.5+.5)*.7);
    st=max(st,smoothstep(-.01,-.04,h.z)*smoothstep(.6,.9,sin(h.y*260.)*.5+.5)*.6);
    white=smoothstep(.028,.05,h.z)*smoothstep(.002,-.012,h.y)+smoothstep(-.03,-.045,h.y)*.8; }
  else if(part<3.5){ vec3 h=(uHeadInv*vec4(lp,1.)).xyz; return mix(vec3(.66,.35,.15),vec3(.80,.52,.45),smoothstep(-.005,.006,h.z)*smoothstep(.07,.04,h.y)); }
  else { white=.85; }
  vec3 c=mix(base,dark,st*.85); c=mix(c,cream,clamp(white,0.,1.));
  return c*(.86+.28*vn2(lp.xz*90.+lp.y*50.));
}`;
  function furMat(layer) {
    const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .85, alphaTest: layer > 0 ? .5 : 0 });
    return patch(m, {
      key: 'catsdf' + (layer > 0 ? 's' : 'b'),
      uniforms: { uShell: { value: layer / SHELLS }, uHeadInv: headInv },
      vhead: 'attribute vec2 aCat; varying vec2 vCat; varying vec3 vBase; uniform float uShell; uniform mat4 uHeadInv;',
      vbegin: `vBase=transformed; vCat=aCat; float fl=aCat.x>2.5&&aCat.x<3.5 ? .25 : aCat.x>3.5 ? .4 : 1.; if(aCat.x>1.5&&aCat.x<2.5){ vec3 hh=(uHeadInv*vec4(transformed,1.)).xyz; fl=mix(.85,.22,smoothstep(.0,.035,hh.z)); } transformed+=objectNormal*uShell*${FUR.toFixed(4)}*fl; transformed.y-=uShell*uShell*.003;`,
      head: FURG,
      albedo: `{ float part=floor(vCat.x+.5);
  vec3 c=tabby(part,vCat.y,vBase);
  vec3 cell=floor(vBase*vec3(700.,700.,700.));
  float h=h31(cell+part*7.);
  float a=uShell<.01 ? 1. : step(uShell,h*.95);
  c*=mix(.5,1.,uShell)*(.85+.3*h);
  diffuseColor=vec4(c,a); }` });
  }
  const eyeM = patch(new THREE.MeshPhysicalMaterial({ color: 0x5a6a14, roughness: .04, clearcoat: 1, clearcoatRoughness: .02 }), {
    albedo: `{ float r=length(vLP.xy); float pupil=1.-smoothstep(.5,.56,r); diffuseColor.rgb=mix(vec3(.78,.70,.18),vec3(.005),pupil); }`,
    emis: 'gEmis+=vec3(.35,.75,.25)*.9*(1.-smoothstep(.45,.6,length(vLP.xy)))*smoothstep(.2,.9,vLP.z);' });
  const noseM = new THREE.MeshStandardMaterial({ color: 0xa8645c, roughness: .4 });
  const hoodY = { value: 0 }, eyeT = { value: 29 };
  const catT = TMC(`
  float part=floor(vCat.x+.5); float up=smoothstep(-.1,.9,N.y);
  if(part<.5){ T=mix(21.,15.6,up); T+=1.8*(1.-smoothstep(.0,.05,vL.y)); }
  else if(part<1.5){ T=mix(17.,14.,up); }
  else if(part<2.5){ vec3 h=(uHeadInv*vec4(vL,1.)).xyz; T=mix(26.,23.2,up)+2.2*smoothstep(.0,.04,h.z); }
  else if(part<3.5){ T=27.; }
  else { T=22.; }
  T+=(vn3(vL*90.)-.5)*.6;
  eps=.97;`, { uHeadInv: { glsl: 'mat4', ref: headInv } }, THREE.FrontSide, { vhead: 'attribute vec2 aCat; varying vec2 vCat;', vbody: 'vCat=aCat;', fhead: 'varying vec2 vCat;' });
  const eyeTh = TMC(`T=uEyeT; eps=.98;`, { uEyeT: { glsl: 'float', ref: eyeT } });
  const noseTh = TMC(`T=27.5; eps=.97;`);

  const base = add(body, geo, furMat(0), catT, { cast: true });
  base.frustumCulled = false;
  for (let l = 1; l <= SHELLS; l++) { const m = add(body, geo, furMat(l), null, { cast: false, recv: true }); m.userData.photoOnly = true; m.frustumCulled = false; }
  const headG = new THREE.Group(); body.add(headG);
  const eyes = [1, -1].map(s => { const e = add(headG, new THREE.SphereGeometry(1, 16, 10), eyeM, eyeTh, { cast: false }); e.userData.side = s; return e; });
  const nose = add(headG, new THREE.SphereGeometry(.0068, 10, 8).scale(1.35, .75, 1), noseM, noseTh, { cast: false });

  // ---------------------------------------------------------------- pose -> primitives
  const RAD = u => .041 + .031 * Math.sin(Math.PI * clamp(u * .92 + .06, 0, 1)) ** .55 + .012 * Math.exp(-(((u - .13) / .1) ** 2)) - .012 * ss(seg(u, .86, 1));
  const tmpM4 = new THREE.Matrix4(), tmpM3 = new THREE.Matrix3(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler();
  function update(t, hoodWorldY, camWorld) {
    const Pz = catPose(t);
    hoodY.value = hoodWorldY;
    body.rotation.y = -Pz.turn * .7;
    body.updateMatrixWorld(true);
    P.reset();
    const br = 1 + .028 * Pz.breathe;
    // spine on an ellipse
    const ax = lerp(.098, .09, Pz.turn), az = lerp(.084, .078, Pz.turn), phi = 4.25, th0 = -1.2;
    const S = (u) => { const a = th0 + phi * u; const lift = Pz.lift * ss(seg(u, .74, 1)); return [Math.cos(a) * ax * (1 - .12 * lift), RAD(u) * .74 + lift * .072, Math.sin(a) * az * (1 - .12 * lift), a]; };
    const NS = 12;
    for (let i = 0; i < NS; i++) {
      const u0 = i / NS, u1 = (i + 1) / NS; const a = S(u0), b = S(u1);
      const r0 = RAD(u0) * (u0 > .2 && u0 < .8 ? br : 1), r1 = RAD(u1) * (u1 > .2 && u1 < .8 ? br : 1);
      P.cone([a[0], a[1], a[2]], [b[0], b[1], b[2]], r0, r1, 0, u0, u1, 0);
    }
    // haunch on the outside of the rump, a shoulder
    { const h = S(.12); const rad = [Math.cos(h[3]), 0, Math.sin(h[3])]; tmpM3.identity(); P.ell([h[0] + rad[0] * .03, .055, h[2] + rad[2] * .03], [.062, .052, .07], tmpM3, 0); }
    // head: rest on the body near its end; lift and turn to the camera when awake
    const E = S(1), E1 = S(.95);
    const fwd = new THREE.Vector3(E[0] - E1[0], 0, E[2] - E1[2]).normalize();
    const inward = new THREE.Vector3(-Math.cos(E[3]), 0, -Math.sin(E[3]));
    const hp = new THREE.Vector3(E[0], 0, E[2]).addScaledVector(fwd, .03 + .014 * Pz.lift).addScaledVector(inward, .016 - .02 * Pz.lift);
    hp.y = lerp(.078, .15, Pz.lift) + .003 * Pz.breathe;
    const yaw0 = Math.atan2(fwd.x, fwd.z) - .7;
    let camYaw = yaw0;
    if (camWorld) { const lc = body.worldToLocal(camWorld.clone()); camYaw = Math.atan2(lc.x - hp.x, lc.z - hp.z); }
    let dy = camYaw - yaw0; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    const yaw = yaw0 + dy * Pz.look * .9;
    headG.position.copy(hp); headG.rotation.set(0, 0, 0); headG.rotateY(yaw); headG.rotateX(lerp(.36, -.1, Pz.lift) - Pz.meow * .1); headG.rotateZ(lerp(.42, .03, Pz.lift));
    headG.updateMatrix();
    const HM = headG.matrix; headInv.value.copy(HM).invert(); const HR = tmpM3.setFromMatrix4(HM).transpose();   // world(body)->head rotation
    const hpt = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(HM).toArray();
    P.ell(hpt(0, 0, 0), [.056, .048, .052], HR, 2);                          // skull
    P.ell(hpt(0, -.018, .042), [.027, .019, .022], HR, 2);                     // muzzle
    P.ell(hpt(.027, -.013, .02), [.029, .026, .028], HR, 2);                 // cheeks
    P.ell(hpt(-.027, -.013, .02), [.029, .026, .028], HR, 2);
    // ears: flattened cones, pricked when awake
    for (const s of [1, -1]) {
      const perk = Pz.ear; const tilt = lerp(-.55, -.15, perk);
      const b0 = hpt(s * .03, .032, -.004); const tip = hpt(s * (.043 + .007 * (1 - perk)), .032 + .041 * Math.cos(tilt), -.004 + .041 * Math.sin(tilt) * .4);
      P.cone(b0, tip, .019, .004, 3, 0, 0, 0);
    }
    // neck bridge
    P.cone([E1[0], E1[1], E1[2]], hpt(0, -.012, -.028), RAD(.95) * .9, .034, 0, .95, 1, 0);
    // front paws tucked under the chin
    for (const s of [1, -1]) {
      const pb = S(.84), side = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
      const a = new THREE.Vector3(pb[0], .018, pb[2]).addScaledVector(side, s * .022).addScaledVector(inward, .02);
      const b = a.clone().addScaledVector(fwd, .07 + .02 * Pz.lift).addScaledVector(inward, .01);
      P.cone(a.toArray(), b.toArray(), .017, .015, 4, 0, 0, 0);
    }
    // tail: round the outside from the rump toward the nose
    { const R0 = Math.max(ax, az) + .085; let prev = null; const NT = 9;
      for (let i = 0; i <= NT; i++) {
        const u = i / NT; const a = th0 - .05 - u * 1.9 - Pz.flick * .25 * u * u;
        const rr = R0 - .018 * u; const p = [Math.cos(a) * rr * (ax / Math.max(ax, az)), .021 + .006 * Math.sin(u * 3.1), Math.sin(a) * rr];
        if (prev) P.cone(prev, p, lerp(.02, .0145, (i - 1) / NT), lerp(.02, .0145, i / NT) * (i === NT ? .7 : 1), 1, (i - 1) / NT, i / NT, 1);
        prev = p;
      }
    }
    mesh();
    // eyes and nose on the face
    for (const e of eyes) { const s = e.userData.side; e.position.set(s * .0235, .011, .05); e.scale.set(.0125, .0105 * Math.max(.06, Pz.eye), .0072); e.rotation.set(-.1, s * .42, s * -.15); }
    eyeM.userData.u && 0;
    eyeT.value = lerp(28.8, 35.2, Pz.eye);
    nose.position.set(0, -.009, .064);
  }
  return { group: G, update, eyeT, head: headG };
}
