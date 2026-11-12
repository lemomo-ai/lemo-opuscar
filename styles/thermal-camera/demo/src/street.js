// The street in front of the building: snow, paths, curb, parking strip, road; lamps; bare trees; parked cars;
// neighbouring blocks; the sky; falling snow.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { B, BAYS } from './layout.js';
import { TM, TMC, add, U } from './thermal.js';
import { patch, snowy } from './photo.js';
import { NOISE } from './glsl.js';
import { mulberry, clamp, lerp, ss } from './util.js';

const bx = (x0, y0, z0, x1, y1, z1) => new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
export const STREET = { curb: 6.7, park0: 6.85, park1: 9.3, road1: 16.6 };
export const CARS = [
  { x: -15.6, z: 8.05, color: [.62, .63, .64], snow: 1, rot: 0.01 },
  { x: -10.4, z: 8.1, color: [.06, .065, .07], snow: 1, rot: -0.015 },
  { x: -4.9, z: 8.0, color: [.78, .78, .76], snow: 1, rot: 0.01 },
  { x: 5.2, z: 8.05, color: [.22, .05, .05], snow: 1, rot: 0.02 },
  { x: 10.7, z: 8.0, color: [.52, .54, .56], snow: 1.15, hero: true, rot: -0.01 },
  { x: 16.2, z: 8.1, color: [.10, .16, .28], snow: 1, rot: 0.0 },
];
export const GHOST = { x: 0.2, z: 8.05 };          // an empty space a car left twenty minutes ago
export const LAMPS = [{ x: -8.2, z: 6.35 }, { x: 13.4, z: 6.35 }];
export const LAMP_H = 6.4;

// ------------------------------------------------------------------ ground
function ground(G) {
  const geo = new THREE.PlaneGeometry(420, 420, 1, 1).rotateX(-Math.PI / 2);
  const cx = BAYS.map(b => (b.x0 + b.x1) / 2)[2];
  const GROUND = `
const float CURB=${STREET.curb.toFixed(2)}, P0=${STREET.park0.toFixed(2)}, P1=${STREET.park1.toFixed(2)}, RD1=${STREET.road1.toFixed(2)};
uniform vec4 uCars[6]; uniform vec2 uGhost;
// zones: 0 snow, 1 shovelled path (wet concrete), 2 road track, 3 dry under a car, 4 apron
float pathMask(vec2 p){
  float m=0.;
  for(int u=0;u<3;u++){ float x=${B.X0.toFixed(2)}+float(u)*${B.UW.toFixed(2)}+${cx.toFixed(2)}; float w=.55+.05*vn2(vec2(p.y*2.,float(u))); m=max(m,(1.-smoothstep(w-.12,w+.08,abs(p.x-x+.15*sin(p.y*.8))))*step(0.,p.y)*step(p.y,CURB)); }
  m=max(m,(1.-smoothstep(.45,.65,abs(p.y-(CURB-.9))))*step(${B.X0.toFixed(2)},p.x)*step(p.x,${B.X1.toFixed(2)})*.0);
  return m;
}
float trackMask(vec2 p){
  if(p.y<P1||p.y>RD1) return 0.;
  float m=0.;
  for(int k=0;k<4;k++){ float zc=P1+1.35+float(k)*1.62+.18*sin(p.x*.06+float(k)*1.7)+.05*sin(p.x*.9+float(k)); float w=.11+.05*vn2(vec2(p.x*.7,float(k)*3.1)); m=max(m,(1.-smoothstep(w-.05,w+.07,abs(p.y-zc)))*(.55+.45*vn2(vec2(p.x*1.3,float(k))))); }
  return m*.75;
}
float underCar(vec2 p, out float hero){
  hero=0.; float m=0.;
  for(int i=0;i<6;i++){ vec4 c=uCars[i]; vec2 d=abs(p-c.xy)-vec2(2.15,.82); float k=1.-smoothstep(-.15,.25,max(d.x,d.y)); if(c.z>.5){ hero=max(hero,k); } else m=max(m,k); }
  return m;
}`;
  const photo = patch(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .85 }), {
    uniforms: { uCars: { value: CARS.map(c => new THREE.Vector4(c.x, c.z, c.hero ? 1 : 0, 0)) }, uGhost: { value: new THREE.Vector2(GHOST.x, GHOST.z) } },
    head: GROUND,
    albedo: `{
  vec2 p=vWP.xz;
  float fw=fwidth(p.x);
  float n=fbm2(p*.7), n2=vn2(p*9.), n3=vn2(p*35.);
  vec3 snow=SNOWC*(.86+.12*n+.06*n2);
  // drifts and footprints of the wind
  snow*=1.-.06*smoothstep(.5,.8,fbm2(p*vec2(.25,1.3)+3.));
  vec3 c=snow; float rough=.82;
  vec3 wet=vec3(.055,.055,.058)*(.8+.4*n2); vec3 slush=vec3(.32,.33,.35)*(.8+.3*n2);
  float pm=pathMask(p);
  float edge=pm*(1.-pm)*4.;
  c=mix(c,wet,smoothstep(.35,.8,pm)); c=mix(c,slush,clamp(edge*(.5+.5*n3),0.,1.)*.8);
  float tm=trackMask(p); c=mix(c,mix(slush,wet,.6),tm*(.75+.25*n2)); rough=mix(rough,.35,tm*.7+smoothstep(.35,.8,pm)*.6);
  if(p.y>P1&&p.y<RD1){ c=mix(c,slush*.9,.25); }
  float hero; float uc=underCar(p,hero); c=mix(c,vec3(.09,.09,.095)*(.8+.4*n2),uc*.9); c=mix(c,wet*1.2,hero*.35);
  vec2 gd=abs(p-uGhost)-vec2(2.1,.8); float gh=1.-smoothstep(-.1,.3,max(gd.x,gd.y)); c=mix(c,mix(slush,wet,.5),gh*.85*(.7+.3*n3)); rough=mix(rough,.4,gh*.6);
  if(p.y>-.02&&p.y<.9&&p.x>${(B.X0 - .5).toFixed(2)}&&p.x<${(B.X1 + .5).toFixed(2)}) c=mix(c,vec3(.28,.28,.29)*(.8+.4*n2),.55*(1.-smoothstep(.5,.9,p.y)));
  c*=1.-.25*(1.-smoothstep(0.,.35,abs(p.y-CURB)))*0.;
  diffuseColor.rgb=c; gRough=rough; gHgt=n3*.6+n2*.4;
}`, bump: '0.004' });
  const therm = TMC(`
  vec2 p=vW.xz;
  float pm=pathMask(p), tm=trackMask(p); float hero; float uc=underCar(p,hero);
  vec2 gd=abs(p-uGhost)-vec2(2.1,.8); float gh=1.-smoothstep(-.1,.3,max(gd.x,gd.y));
  T=-8.3+(fbm2(p*.6)-.5)*.5;
  T=mix(T,-5.6,smoothstep(.35,.8,pm));
  T=mix(T,-6.4,tm);
  T=mix(T,-4.6,uc);
  T=mix(T,-4.9+(1.-uAfter)*0.,gh);
  vec2 hd=p-vec2(uCars[4].x-1.55,uCars[4].y); T+=hero*(2.5+6.*exp(-dot(hd,hd)/.5));
  T+=3.2*exp(-max(p.y,0.)/.6)*step(${(B.X0 - .4).toFixed(2)},p.x)*step(p.x,${(B.X1 + .4).toFixed(2)})*step(-.05,p.y)*mix(1.,.4,uAfter);
  T+=(vn2(p*6.)-.5)*.25;
  eps=.96;`, { uCars: { glsl: 'vec4 uCars[6]', value: CARS.map(c => new THREE.Vector4(c.x, c.z, c.hero ? 1 : 0, 0)) }, uGhost: { glsl: 'vec2', value: new THREE.Vector2(GHOST.x, GHOST.z) } }, THREE.FrontSide, { fhead: GROUND.replace('uniform vec4 uCars[6]; uniform vec2 uGhost;', '') });
  add(G, geo, photo, therm, { cast: false });
  // curbs and the low snow bank along them
  const curbs = [bx(-210, 0, STREET.curb - .12, 210, .16, STREET.curb), bx(-210, 0, STREET.road1, 210, .16, STREET.road1 + .14)];
  add(G, mergeGeometries(curbs), snowy({ color: 0x8a8984, roughness: .9 }, { cover: 1.4, thr: .4 }), TM({ T: -6.8, top: -1.6, world: true, noise: .3, ns: 2 }));
  const bank = new THREE.PlaneGeometry(420, .7, 400, 3).rotateX(-Math.PI / 2); const bp = bank.attributes.position;
  for (let i = 0; i < bp.count; i++) { const x = bp.getX(i), z = bp.getZ(i); bp.setY(i, .02 + .14 * Math.cos(z / .7 * Math.PI) ** 2 * (0.6 + 0.4 * Math.sin(x * .7) * Math.sin(x * .23))); }
  bank.translate(0, 0, STREET.road1 + .5); bank.computeVertexNormals();
  add(G, bank, snowy({ color: 0xd8dde6, roughness: .85 }, { cover: 2 }), TM({ T: -8.4, world: true, noise: .3, ns: 2 }), { cast: false });
}

// ------------------------------------------------------------------ street lamps
function lamps(G, scene) {
  const poleM = snowy({ color: 0x2b2e30, roughness: .45, metalness: .7 }, { cover: .8 });
  const lights = [];
  for (const L of LAMPS) {
    const g = new THREE.Group(); g.position.set(L.x, 0, L.z); G.add(g);
    add(g, new THREE.CylinderGeometry(.06, .1, LAMP_H, 14).translate(0, LAMP_H / 2, 0), poleM, TM({ T: -7, eps: .6 }));
    add(g, new THREE.CylinderGeometry(.16, .2, .5, 14).translate(0, .25, 0), poleM, TM({ T: -7, eps: .6 }));
    const arm = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, LAMP_H - .2, 0), new THREE.Vector3(0, LAMP_H + .15, .4), new THREE.Vector3(0, LAMP_H + .2, 1.2)]), 16, .04, 8);
    add(g, arm, poleM, TM({ T: -7, eps: .6 }));
    add(g, bx(-.16, LAMP_H + .1, 1.0, .16, LAMP_H + .26, 1.75), poleM, TM({ T: 16, eps: .7, hot: [[0, LAMP_H + .1, 1.4, .3, 22]], world: false }));
    const lens = new THREE.MeshStandardMaterial({ color: 0, emissive: 0xffa04a, emissiveIntensity: 22 });
    add(g, new THREE.PlaneGeometry(.28, .65).rotateX(Math.PI / 2).translate(0, LAMP_H + .095, 1.38), lens, TM({ T: 48, eps: .9 }), { cast: false });
    const sp = new THREE.SpotLight(0xff9c48, 95, 40, 1.0, .6, 2);
    sp.position.set(L.x, LAMP_H + .05, L.z + 1.38); sp.target.position.set(L.x, 0, L.z + 2.4);
    sp.castShadow = true; sp.shadow.mapSize.set(2048, 2048); sp.shadow.bias = -.0004; sp.shadow.normalBias = .03; sp.shadow.radius = 4; sp.shadow.blurSamples = 12;
    sp.shadow.camera.near = .5; sp.shadow.camera.far = 40;
    scene.add(sp, sp.target); lights.push(sp);
  }
  return lights;
}

// ------------------------------------------------------------------ bare trees
function tree(seed, h) {
  const R = mulberry(seed); const segs = [];
  function grow(p, dir, len, rad, depth) {
    const n = Math.max(2, Math.round(len / .35)); let cur = p.clone(); let d = dir.clone();
    for (let i = 0; i < n; i++) {
      d.add(new THREE.Vector3((R() - .5) * .35, (R() - .3) * .2, (R() - .5) * .35)).normalize();
      if (depth > 1) d.y += .04;
      const nxt = cur.clone().addScaledVector(d, len / n);
      const r0 = rad * (1 - i / n * .35), r1 = rad * (1 - (i + 1) / n * .35);
      segs.push([cur.clone(), nxt.clone(), r0, r1]);
      cur = nxt;
      if (depth < 5 && i > 0 && R() < (depth === 0 ? .55 : .42)) {
        const side = new THREE.Vector3((R() - .5) * 2, .4 + R() * .7, (R() - .5) * 2).normalize();
        grow(cur, side.lerp(d, .25).normalize(), len * (.5 + R() * .25), r1 * .62, depth + 1);
      }
    }
    if (depth < 5) for (let k = 0; k < 2 + (depth > 1 ? 1 : 0); k++) {
      const side = new THREE.Vector3((R() - .5) * 2, .5 + R() * .6, (R() - .5) * 2).normalize();
      grow(cur, side.lerp(d, .35).normalize(), len * (.45 + R() * .25), rad * .5, depth + 1);
    }
  }
  grow(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), h * .42, .2, 0);
  const geos = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (const [a, b, r0, r1] of segs) {
    if (r1 < .006) continue;
    const L = a.distanceTo(b); const sides = r0 > .06 ? 8 : r0 > .02 ? 5 : 3;
    const g = new THREE.CylinderGeometry(Math.max(r1, .004), Math.max(r0, .005), L * 1.04, sides, 1, true);
    const q = new THREE.Quaternion().setFromUnitVectors(up, b.clone().sub(a).normalize());
    g.applyQuaternion(q); g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    geos.push(g);
  }
  return mergeGeometries(geos);
}
function trees(G) {
  const bark = snowy({ color: 0x3a3631, roughness: .95 }, { cover: .45, thr: .35, albedo: 'diffuseColor.rgb*=.7+.5*vn2(vec2(atan(vLP.x,vLP.z)*3.,vLP.y*9.));' });
  const T = [{ x: -12.6, z: 4.6, h: 11, s: 3 }, { x: 8.6, z: 4.3, h: 10, s: 8 }, { x: 18.7, z: 4.9, h: 9.5, s: 12 }, { x: -24.5, z: 5.2, h: 10.5, s: 21 }];
  for (const t of T) {
    const m = add(G, tree(t.s, t.h), bark, TM({ T: -6.7, eps: .95, noise: .2, ns: 3, top: -.6 }), {});
    m.position.set(t.x, 0, t.z); m.rotation.y = t.s;
  }
  return T;
}

// ------------------------------------------------------------------ cars (lofted bodies)
function carGeometry(L = 4.6, W = 1.8) {
  const NS = 72, belt = s => .93 + .05 * s, roof = 1.46;
  const yb = s => .2 + .1 * (1 - clamp(s / .08, 0, 1)) ** 2 + .1 * clamp((s - .9) / .1, 0, 1) ** 2;
  const hood = s => s < .07 ? lerp(.62, .84, Math.sin(s / .07 * Math.PI / 2)) : s < .31 ? lerp(.84, .93, (s - .07) / .24) : s < .86 ? belt(s) : s < .97 ? lerp(1.0, .98, (s - .86) / .11) : lerp(.98, .74, Math.sin((s - .97) / .03 * Math.PI / 2));
  const top = s => s < .31 ? hood(s) : s < .47 ? lerp(.94, roof, Math.sin((s - .31) / .16 * Math.PI / 2)) : s < .7 ? roof - .02 * ((s - .58) / .12) ** 2 : s < .86 ? lerp(roof - .02, 1.0, ((s - .7) / .16) ** 1.3) : hood(s);
  const cab = s => ss(clamp((s - .305) / .045, 0, 1)) * (1 - ss(clamp((s - .815) / .045, 0, 1)));
  const hw = s => W / 2 * (1 - .22 * (1 - clamp(s / .1, 0, 1)) ** 2 - .14 * clamp((s - .9) / .1, 0, 1) ** 2);
  // ring (right half, bottom centre -> top centre): returns [x(across), y, zone]  zone: 0 body, 1 side glass, 2 roof strip
  function ring(s) {
    const w = hw(s), b = yb(s), h = s < .31 || s > .86 ? hood(s) : belt(s), c = cab(s), t = Math.max(top(s), h + .06);
    const crown = (s < .31 || s > .86) ? .015 : 0;
    return [[0, b], [w * .8, b], [w, b + .1], [w * 1.0, (b + h) * .5], [w * .985, h - .04], [w * .95, h],
      [lerp(w * .9, w - .1, c), lerp(h + .005, h + .03, c)], [lerp(w * .85, w - .3, c), lerp(h + .01, t - .05, c)], [lerp(w * .8, w - .37, c), lerp(h + .012, t, c)], [0, lerp(h + crown, t + .012, c)]];
  }
  const SUB = 3;
  const smoothRing = (r) => { const out = []; const n = r.length;
    for (let k = 0; k < n - 1; k++) { const p0 = r[Math.max(0, k - 1)], p1 = r[k], p2 = r[k + 1], p3 = r[Math.min(n - 1, k + 2)];
      for (let j = 0; j < SUB; j++) { const f = j / SUB; out.push([0, 1].map(q => .5 * (2 * p1[q] + (-p0[q] + p2[q]) * f + (2 * p0[q] - 5 * p1[q] + 4 * p2[q] - p3[q]) * f * f + (-p0[q] + 3 * p1[q] - 3 * p2[q] + p3[q]) * f * f * f))); } }
    out.push(r[n - 1].slice(0, 2)); out[0][0] = 0; out[out.length - 1][0] = 0; return out; };
  const rings = []; for (let i = 0; i <= NS; i++) { const s = i / NS; rings.push(smoothRing(ring(s)).map(([x, y]) => [Math.max(0, x), y, s])); }
  // build three strips: body (ring idx 0..6), side glass (6..8), roof (8..9)
  function strip(i0, i1) {
    const pos = [], idx = [], sv = [];
    const K = i1 - i0 + 1; const cols = [];
    for (const side of [1, -1]) {
      const base = pos.length / 3;
      for (let i = 0; i <= NS; i++) for (let k = i0; k <= i1; k++) { const [x, y, s] = rings[i][k]; pos.push((s - .5) * L * -1, y, x * side); sv.push(s); }
      for (let i = 0; i < NS; i++) for (let k = 0; k < K - 1; k++) {
        const a = base + i * K + k, b = a + K, c = a + 1, d = b + 1;
        if (side > 0) idx.push(a, c, b, c, d, b); else idx.push(a, b, c, c, b, d);
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(sv, 1));
    g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  // end caps: a fan over the whole end ring (body points, then the top centre), both windings
  function cap(i) {
    const r = rings[i]; const pts = [];
    for (let k = 0; k <= 6 * SUB; k++) pts.push([r[k][0], r[k][1]]);
    pts.push([0, r[9 * SUB][1]]);
    for (let k = 6 * SUB; k >= 0; k--) pts.push([-r[k][0], r[k][1]]);
    const x = (r[0][2] - .5) * L * -1; const pos = [], idx = [], sv = [];
    const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    pos.push(x, cy, 0); sv.push(r[0][2]);
    for (const p of pts) { pos.push(x, p[1], p[0]); sv.push(r[0][2]); }
    for (let k = 1; k < pts.length; k++) idx.push(0, k, k + 1, 0, k + 1, k);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(sv, 1));
    g.setIndex(idx); g.computeVertexNormals();
    const n = g.attributes.normal; for (let k = 0; k < n.count; k++) n.setXYZ(k, i === 0 ? 1 : -1, 0, 0);
    return g;
  }
  const body = mergeGeometries([strip(0, 6 * SUB), cap(0), cap(NS)]);
  return { body, glass: strip(6 * SUB, 8 * SUB), roof: strip(8 * SUB, 9 * SUB), hood, top, yb, hw, cab, L, W };
}
function car(G, c, idx, env) {
  const g = new THREE.Group(); g.position.set(c.x, 0, c.z); g.rotation.y = c.rot; G.add(g);
  const cg = carGeometry();
  const col = new THREE.Color(...c.color);
  const hero = c.hero ? 1 : 0;
  // picture: body paint with clearcoat feel, lights, grille, wheel arches; snow on top, melted hood on the hero car
  const ZONES = `
  float s=clamp(.5-vLP.x/${cg.L.toFixed(2)},0.,1.); float y=vLP.y; float az=abs(vLP.z);
  float arch=0.; for(int k=0;k<2;k++){ float sc= k==0? .19 : .79; vec2 d=vec2((s-sc)*${cg.L.toFixed(2)},y-.33); arch=max(arch,1.-smoothstep(.36,.39,length(d))); }
  float head=step(s,.035)*step(.62,y)*step(y,.73)*step(.42,az)*step(az,.78);
  float tail=step(.965,s)*step(.76,y)*step(y,.9)*step(.38,az)*step(az,.84);
  float grille=step(s,.03)*step(.42,y)*step(y,.6)*step(az,.55);
  float plate=step(.975,s)*step(.5,y)*step(y,.64)*step(az,.24)+step(s,.02)*step(.36,y)*step(y,.48)*step(az,.24);
  float hoodZone=step(s,.31)*step(.7,vWN.y);`;
  const bodyM = snowy({ color: col.clone().multiplyScalar(.6), roughness: .42, metalness: .55, envMap: env, envMapIntensity: 1.0, clearcoat: 1, clearcoatRoughness: .08 }, {
    physical: true, cover: c.snow, thr: .5, head: '', mask: `(1.-${hero.toFixed(1)}*step(clamp(.5-vLP.x/${cg.L.toFixed(2)},0.,1.),.36))`,
    albedo: ZONES + `
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.01),arch*.95);
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.03),grille);
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.75,.78,.8),head);
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.35,.02,.02),tail);
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.06,.13,.42),plate);
  if(${hero.toFixed(1)}>.5 && hoodZone>.5){ diffuseColor.rgb*=.3; gRough=.06; gMetal=.75; float drop=step(.82,vn2(vLP.xz*70.)); diffuseColor.rgb+=drop*.02; }
  // panel gaps
  { float sg=min(min(abs(s-.31),abs(s-.585)),min(abs(s-.83),abs(s-.37))); float g1=(1.-smoothstep(.0,.0025,sg))*step(.35,y)*step(y,.95)*step(.6,az); float g2=(1.-smoothstep(0.,.006,abs(az-.72)))*step(s,.31)*step(.75,vWN.y); diffuseColor.rgb*=1.-.8*max(g1,g2); }
  diffuseColor.rgb*=1.-.25*smoothstep(.6,.2,y)*(1.-arch);
  if(((s>.295&&s<.36)||(s>.8&&s<.865))&&y>.935&&vWN.y<.9){ diffuseColor.rgb=vec3(.02,.021,.023); gRough=.4; gMetal=.1; }` });
  const glassM = snowy({ color: 0x0a0c0e, roughness: .06, metalness: .9, envMap: env, envMapIntensity: 1.1 }, {
    cover: c.hero ? 0 : c.snow * .9, thr: .45, mask: c.hero ? '0.' : '1.',
    albedo: `{ float s=clamp(.5-vLP.x/${cg.L.toFixed(2)},0.,1.); float pil=1.-step(.022,abs(s-.585));
      pil=max(pil,(1.-step(.345,s))*step(.3,s)); pil=max(pil,step(.81,s)*step(s,.85));
      if(pil>.5){ diffuseColor.rgb=vec3(.02,.021,.023); gRough=.85; gMetal=0.; }
      if(s<.3||s>.85){ diffuseColor.rgb=vec3(${col.r.toFixed(3)},${col.g.toFixed(3)},${col.b.toFixed(3)})*.6*(${hero.toFixed(1)}>.5&&s<.3 ? .3 : 1.); gRough=${hero.toFixed(1)}>.5&&s<.3 ? .08 : .42; gMetal=.55; } }` });
  const roofM = snowy({ color: col.clone().multiplyScalar(.6), roughness: .42, metalness: .55, envMap: env, envMapIntensity: 1.0, clearcoat: 1, clearcoatRoughness: .08 }, {
    physical: true, cover: c.snow, thr: .5, mask: `(1.-${hero.toFixed(1)}*max(step(clamp(.5-vLP.x/${cg.L.toFixed(2)},0.,1.),.315),step(.3,clamp(.5-vLP.x/${cg.L.toFixed(2)},0.,1.))*step(clamp(.5-vLP.x/${cg.L.toFixed(2)},0.,1.),.48)))`,
    albedo: `{ float s=clamp(.5-vLP.x/${cg.L.toFixed(2)},0.,1.); float gl=(step(.31,s)*step(s,.47)+step(.7,s)*step(s,.86));
      if(gl>.5){ diffuseColor.rgb=vec3(.01,.012,.014); gRough=.05; gMetal=.95; }
      if(${hero.toFixed(1)}>.5 && s<.31){ diffuseColor.rgb*=.3; gRough=.07; gMetal=.75; diffuseColor.rgb+=step(.82,vn2(vLP.xz*70.))*.02; }
      float g2=(1.-smoothstep(0.,.006,abs(abs(vLP.z)-.72)))*step(s,.31); diffuseColor.rgb*=1.-.7*g2; }` });
  // thermal
  const thB = TMC(`
  float s=clamp(.5-vL.x/${cg.L.toFixed(2)},0.,1.); float y=vL.y; float az=abs(vL.z);
  float hero=${hero.toFixed(1)};
  T=-7.3+mix(0.,1.3,hero)*smoothstep(.6,.4,s);
  T-=1.6*smoothstep(.55,.9,N.y)*(1.-hero*step(s,.32));
  if(hero>.5){
    float hz=step(s,.33)*smoothstep(.55,.85,N.y);
    float hc=exp(-pow((s-.16)/.13,2.))*exp(-pow(az/.55,2.));
    T=mix(T,6.5+9.*hc,hz);
    T+=step(s,.06)*smoothstep(.75,.4,y)*9.;
    T+=step(s,.33)*(1.-hz)*4.5;
    T+=exp(-pow((s-.97)/.03,2.))*exp(-pow((y-.3)/.08,2.))*3.;
    T+=(1.-smoothstep(.31,.5,s))*0.;
  }
  eps=.9;`);
  const thG = TMC(`T=-6.8; eps=.84; float s=clamp(.5-vL.x/${cg.L.toFixed(2)},0.,1.); if(${hero.toFixed(1)}>.5) T+=2.*exp(-pow((s-.36)/.1,2.));`);
  const thR = TMC(`float s=clamp(.5-vL.x/${cg.L.toFixed(2)},0.,1.); float az=abs(vL.z); float gl=(step(.31,s)*step(s,.47)+step(.7,s)*step(s,.86));
  float hero=${hero.toFixed(1)};
  T=mix(-8.6,-6.8,gl)+hero*mix(4.,2.4,gl)*smoothstep(.95,.5,s); eps=mix(.95,.84,gl);
  if(hero>.5 && s<.31){ float hc=exp(-pow((s-.15)/.12,2.))*exp(-pow(az/.6,2.)); T=7.+8.5*hc+(vn2(vL.xz*9.)-.5)*.6; eps=.9; }`);
  add(g, cg.body, bodyM, thB);
  add(g, cg.glass, glassM, thG);
  add(g, cg.roof, roofM, thR);
  // end caps: simple rounded plugs at both ends
  // wheels
  const tireP = [[.0, -.11], [.25, -.12], [.31, -.1], [.33, -.04], [.33, .04], [.31, .1], [.25, .12], [.0, .11]].map(p => new THREE.Vector2(p[0], p[1]));
  const tire = new THREE.LatheGeometry(tireP, 32).rotateX(Math.PI / 2);
  const rim = new THREE.CylinderGeometry(.2, .2, .02, 24).rotateX(Math.PI / 2);
  const tireM = snowy({ color: 0x111111, roughness: .9 }, { cover: .5 }), rimM = patch(new THREE.MeshStandardMaterial({ color: 0x8a8d90, roughness: .35, metalness: .9, envMap: env }), { albedo: 'diffuseColor.rgb*=.25+.75*step(.4,fract(atan(vLP.y,vLP.x)/6.2832*5.+.1))*step(.06,length(vLP.xy));' });
  for (const s of [.19, .79]) for (const side of [1, -1]) {
    const x = (.5 - s) * cg.L, z = side * (cg.W / 2 - .13);
    const tm = add(g, tire, tireM, TM({ T: -6.5 + hero * (s < .5 ? 3.5 : 1.2), eps: .95 }));
    tm.position.set(x, .33, z);
    const rm = add(g, rim, rimM, TM({ T: -7 + hero * (s < .5 ? 6 : 2), eps: .3 }), { cast: false });
    rm.position.set(x, .33, z + side * .1);
  }
  // bumpers, lamps, plates
  const bump = new THREE.MeshPhysicalMaterial({ color: 0x1a1b1d, roughness: .55, clearcoat: .3 });
  const bumpT = TMC(`T=-7.+${hero.toFixed(1)}*(vL.x>0.?6.:1.); eps=.92;`);
  add(g, new RoundedBoxGeometry(.2, .22, cg.W * .96, 4, .07).translate(cg.L / 2 - .02, .38, 0), bump, bumpT);
  add(g, new RoundedBoxGeometry(.2, .2, cg.W * .96, 4, .07).translate(-cg.L / 2 + .02, .42, 0), bump, bumpT);
  const lampF = new THREE.MeshPhysicalMaterial({ color: 0x888c90, roughness: .05, metalness: .2, clearcoat: 1, emissive: 0x332a1e, emissiveIntensity: .3 });
  const lampR = new THREE.MeshPhysicalMaterial({ color: 0x4a0606, roughness: .1, clearcoat: 1, emissive: 0x200000, emissiveIntensity: .4 });
  for (const sd of [1, -1]) {
    add(g, new THREE.BoxGeometry(.06, .1, .32).translate(cg.L / 2 - .015, .66, sd * .6), lampF, TM({ T: -7 + hero * 4, eps: .85 }), { cast: false });
    add(g, new THREE.BoxGeometry(.06, .12, .36).translate(-cg.L / 2 + .03, .82, sd * .6), lampR, TM({ T: -7, eps: .85 }), { cast: false });
  }
  const plateM = new THREE.MeshStandardMaterial({ color: 0x0b2a7a, roughness: .5 });
  add(g, new THREE.BoxGeometry(.02, .14, .44).translate(cg.L / 2 + .085, .4, 0), plateM, TM({ T: -7, eps: .9 }), { cast: false });
  add(g, new THREE.BoxGeometry(.02, .14, .44).translate(-cg.L / 2 - .085, .58, 0), plateM, TM({ T: -7, eps: .9 }), { cast: false });
  // mirrors
  for (const side of [1, -1]) {
    const mx = cg.L * (.5 - .335), mz = side * (cg.W / 2 + .06);
    add(g, new RoundedBoxGeometry(.075, .11, .17, 3, .03).translate(mx, 1.0, mz), bodyM, thB, { cast: false });
    add(g, new RoundedBoxGeometry(.04, .03, .07, 2, .012).translate(mx + .02, .95, side * (cg.W / 2 - .02)), bump, bumpT, { cast: false });
    add(g, new THREE.PlaneGeometry(.14, .085).rotateY(-Math.PI / 2).translate(mx - .039, 1.0, mz), new THREE.MeshStandardMaterial({ color: 0x9aa2a8, roughness: .03, metalness: 1, envMap: env }), TM({ T: -12, eps: .1 }), { cast: false });
  }
  return { group: g, cg };
}

// ------------------------------------------------------------------ neighbouring blocks (seen in the wide shots)
function blocks(G) {
  const R = mulberry(5);
  const BL = [
    { x0: -64, x1: -27, z0: -30, z1: -19, h: 18.2 }, { x0: 27, x1: 64, z0: -28, z1: -17, h: 18.2 },
    { x0: -48, x1: 10, z0: -52, z1: -40, h: 24 }, { x0: 18, x1: 70, z0: -58, z1: -46, h: 30 },
    { x0: -90, x1: -50, z0: -40, z1: -28, h: 15.4 }, { x0: 60, x1: 96, z0: -35, z1: -22, h: 18.2 },
    { x0: -40, x1: 40, z0: 66, z1: 77, h: 18.2 }];
  const geos = [];
  for (const b of BL) { const g = bx(b.x0, 0, b.z0, b.x1, b.h, b.z1); const n = g.attributes.position.count; const s = new Float32Array(n).fill(R()); g.setAttribute('aSeed', new THREE.BufferAttribute(s, 1)); geos.push(g); }
  const geo = mergeGeometries(geos);
  const photo = patch(new THREE.MeshStandardMaterial({ color: 0x777069, roughness: .95 }), {
    vhead: 'attribute float aSeed; varying float vSeed;', vert: 'vSeed=aSeed;',
    head: 'varying float vSeed;',
    albedo: `{ vec2 q=abs(vWN.x)>.5? vec2(vWP.z,vWP.y): vec2(vWP.x,vWP.y);
      vec2 cell=floor(vec2(q.x/1.65,(q.y-.45)/2.8)); vec2 f=fract(vec2(q.x/1.65,(q.y-.45)/2.8));
      float win=step(.22,f.x)*step(f.x,.78)*step(.3,f.y)*step(f.y,.82)*step(.4,q.y)*step(abs(vWN.y),.5);
      float lit=step(.62,h21(cell+vSeed*91.))*win;
      float k=h21(cell*1.7+vSeed*13.);
      diffuseColor.rgb*=.55+.3*fbm2(q*.2);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.02),win*(1.-lit));
      gEmis=lit*(k<.6? vec3(1.,.62,.3) : vec3(.75,.85,1.))*(.35+.4*h21(cell+2.))*1.4;
      if(vWN.y>.5){ diffuseColor.rgb=SNOWC*.9; gEmis=vec3(0.); } }` });
  photo.userData = {};
  const therm = TMC(`
  vec2 q=abs(N.x)>.5? vec2(vW.z,vW.y): vec2(vW.x,vW.y);
  vec2 f=fract(vec2(q.x/1.65,(q.y-.45)/2.8));
  float win=step(.22,f.x)*step(f.x,.78)*step(.3,f.y)*step(f.y,.82)*step(.4,q.y)*step(abs(N.y),.5);
  float band=exp(-pow((fract((q.y-.45)/2.8)-.0)*2.8/.18,2.))+exp(-pow((fract((q.y-.45)/2.8)-1.)*2.8/.18,2.));
  T=-4.8+band*.6+win*1.6*(.5+h21(floor(vec2(q.x/1.65,(q.y-.45)/2.8))))+(fbm2(q*.4)-.5)*.4;
  if(N.y>.5) T=-8.5;
  eps=.93;`);
  add(G, geo, photo, therm, { cast: false, recv: false });
}

// ------------------------------------------------------------------ sky dome
function sky(G) {
  const geo = new THREE.SphereGeometry(380, 48, 24);
  const photo = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { ...U },
    vertexShader: 'varying vec3 vD; void main(){ vD=normalize(position); vec4 w=modelMatrix*vec4(position,1.); gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: NOISE + `uniform float uTime; varying vec3 vD;
void main(){ float y=vD.y; vec3 zen=vec3(.0035,.0045,.010), hor=vec3(.035,.026,.024);
  float k=pow(clamp(y,0.,1.),.42); vec3 c=mix(hor,zen,k);
  float cl=fbm2(vD.xz/(max(y,.05)+.3)*2.2+vec2(uTime*.004,0.)); c*=.75+.5*cl;
  c+=vec3(.05,.028,.016)*exp(-max(y,0.)*9.);
  if(y<0.) c=vec3(.008,.008,.01);
  gl_FragColor=vec4(c,1.); }` });
  const therm = TMC(`float y=normalize(vW-cameraPosition).y; T=mix(-12.,-27.,pow(clamp(y,0.,1.),.5))+(fbm2(normalize(vW-cameraPosition).xz*4.)-.5)*1.2; eps=1.;`, {}, THREE.BackSide);
  const m = add(G, geo, photo, therm, { cast: false, recv: false });
  m.userData.followCam = true; m.renderOrder = -10;
  return m;
}

// ------------------------------------------------------------------ falling snow (picture only), positions from t
function snowfall(G) {
  const N = 7000; const R = mulberry(31);
  const pos = new Float32Array(N * 3), seed = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) { pos.set([R(), R(), R()], i * 3); seed.set([R(), R(), R(), R()], i * 4); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { ...U, uBox: { value: new THREE.Vector3(40, 22, 40) }, uCen: { value: new THREE.Vector3() }, uPx: { value: 1 } },
    vertexShader: `uniform float uTime; uniform vec3 uBox, uCen; uniform vec3 uLamp[5]; uniform float uPx; attribute vec4 aSeed; varying float vA; varying vec3 vC; varying float vA0;
void main(){
  float t=uTime; vec3 p=position*uBox;
  p.y-=t*(.55+.45*aSeed.x); p.x+=t*.25+.35*sin(t*(.6+aSeed.y)+aSeed.z*6.28); p.z+=.3*cos(t*(.5+aSeed.w)+aSeed.x*6.28);
  p=uCen-uBox*.5+mod(p-(uCen-uBox*.5),uBox);
  vec4 mv=viewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv;
  float d=-mv.z; float sz=uPx*(.8+1.6*aSeed.w)*26./max(d,1.); gl_PointSize=max(sz,1.3); vA0=min(1.,sz/1.3);
  vec3 L=vec3(.010,.012,.018);
  for(int i=0;i<2;i++){ vec3 dl=uLamp[i]-p; float r2=dot(dl,dl); L+=vec3(1.,.62,.3)*.9*smoothstep(-.2,.6,-normalize(dl).y)/(1.+r2*.08); }
  vC=L; vA=smoothstep(.6,2.5,d)*(1.-smoothstep(25.,40.,d))*vA0;
}`,
    fragmentShader: `varying float vA; varying vec3 vC; varying float vA0; void main(){ vec2 q=gl_PointCoord-.5; float a=smoothstep(.5,.1,length(q)); gl_FragColor=vec4(vC*1.4,a*vA*.85); }` });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.userData.photo = mat; pts.userData.therm = null;
  G.add(pts);
  return pts;
}

export function buildStreet(scene, env) {
  const G = new THREE.Group(); scene.add(G);
  ground(G);
  const lampLights = lamps(G, scene);
  const treeList = trees(G);
  const cars = CARS.map((c, i) => car(G, c, i, env));
  blocks(G);
  const skyM = sky(G);
  const snow = snowfall(G);
  return { group: G, lampLights, cars, skyM, snow, treeList };
}
