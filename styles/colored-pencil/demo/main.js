// The Other Half · Colored-Pencil Science Illustration 彩铅科普插画 — one timeline for the whole 50.8 s film.
// three.js builds the world (tree, ground, soil block, roots, worms, stones, mycelium);
// four G-buffer passes (albedo+id / light+depth+normal / hatch direction / anchor+reveal time) are re-drawn
// by a post shader as layered colored-pencil hatching on a paper tooth.
// Anti-swim rule: hatching, tooth-in-pigment and contour wobble are computed in "anchor" coordinates
// (each surface point projected through a fixed reference camera; the camera only translates inside a shot),
// so strokes stick to the things they draw. Only the contour wobble boils: a new drawing every 2 frames, 3 drawings cycled.
// Things are "drawn in" over time: every surface has a reveal time (arev); the post pass builds the four pencil
// layers up stroke by stroke after it, so the cutaway gets coloured in as the camera sinks.
import * as THREE from 'three';

const W = 1920, H = 1080, SS = 2, FPS = 24;  // post runs at 2x, then a 2x2 box downsample
const FILM = 50.8;                          // the whole film; ?from=&to= renders an excerpt (build.sh)
const QS = new URLSearchParams(location.search);
const FROM = +(QS.get('from') || 0), TO = +(QS.get('to') || FILM);
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.autoClear = false;

// ---------------------------------------------------------------- random & noise (JS)
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const h2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
function vn2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm1 = (x, s = 0) => { let r = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { r += a * (vn2(x * f, s + i * 7.3) - 0.5); f *= 2.1; a *= 0.5; } return r; };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- geometry builder
class Builder {
  constructor() { this.p = []; this.n = []; this.c = []; this.t = []; this.ao = []; this.r = []; this.i = []; this.rv = -100; }
  get vc() { return this.p.length / 3; }
  v(p, n, c, t, ao = 1, rv = this.rv) { this.p.push(p.x, p.y, p.z); this.n.push(n.x, n.y, n.z); this.c.push(c[0], c[1], c[2]); this.t.push(t.x, t.y, t.z); this.ao.push(ao); this.r.push(rv); }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('acol', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('atan', new THREE.Float32BufferAttribute(this.t, 3));
    g.setAttribute('aao', new THREE.Float32BufferAttribute(this.ao, 1));
    g.setAttribute('arev', new THREE.Float32BufferAttribute(this.r, 1));
    g.setIndex(this.i);
    g.computeBoundingSphere();
    return g;
  }
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);

// tube with per-point radius; rfn(i, angle) optional radius multiplier; cfn(i, k) colour
function tube(b, pts, rad, sides, cfn, rfn, aofn, rvfn) {
  const n = pts.length; if (n < 2) return;
  const base = b.vc;
  let T = pts[1].clone().sub(pts[0]).normalize();
  let N = Math.abs(T.y) < 0.9 ? V(0, 1, 0) : V(1, 0, 0);
  N.sub(T.clone().multiplyScalar(N.dot(T))).normalize();
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], c = pts[Math.min(n - 1, i + 1)];
    T = c.clone().sub(a).normalize();
    N.sub(T.clone().multiplyScalar(N.dot(T))).normalize();
    const B = T.clone().cross(N);
    for (let k = 0; k < sides; k++) {
      const ang = k / sides * Math.PI * 2;
      const d = N.clone().multiplyScalar(Math.cos(ang)).add(B.clone().multiplyScalar(Math.sin(ang)));
      const r = rad[i] * (rfn ? rfn(i, ang, d) : 1);
      b.v(pts[i].clone().add(d.clone().multiplyScalar(r)), d, cfn(i, k, d), T, aofn ? aofn(i, d) : 1, rvfn ? rvfn(i) : b.rv);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < sides; k++) {
    const k2 = (k + 1) % sides, a = base + i * sides + k, b1 = base + i * sides + k2, c = a + sides, d = b1 + sides;
    b.i.push(a, b1, c, b1, d, c);
  }
}
// append a three geometry with matrix + colour (fn of world pos & normal)
function append(b, geo, m, cfn, tan = UP, aofn) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const pa = g.attributes.position, na = g.attributes.normal;
  const nm = new THREE.Matrix3().getNormalMatrix(m);
  const base = b.vc;
  for (let i = 0; i < pa.count; i++) {
    const p = V(pa.getX(i), pa.getY(i), pa.getZ(i)).applyMatrix4(m);
    const n = V(na.getX(i), na.getY(i), na.getZ(i)).applyMatrix3(nm).normalize();
    b.v(p, n, cfn(p, n), tan, aofn ? aofn(p, n) : 1);
    b.i.push(base + i);
  }
}
function chaikin(pts, rad, it = 1) {
  for (let r = 0; r < it; r++) {
    const P = [pts[0]], R = [rad[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      P.push(pts[i].clone().lerp(pts[i + 1], 0.25), pts[i].clone().lerp(pts[i + 1], 0.75));
      R.push(lerp(rad[i], rad[i + 1], 0.25), lerp(rad[i], rad[i + 1], 0.75));
    }
    P.push(pts[pts.length - 1]); R.push(rad[rad.length - 1]);
    pts = P; rad = R;
  }
  return [pts, rad];
}

// ---------------------------------------------------------------- materials
const SHARED = { uPass: { value: 0 }, uTime: { value: 0 }, uWindT: { value: 0 }, uRefVP: { value: new THREE.Matrix4() }, uOut: { value: new THREE.Vector2(W, H) } };
const VS = /* glsl */`
attribute vec3 acol; attribute vec3 atan; attribute float aao; attribute float arev;
uniform float uWind, uWindT;
varying vec3 vN, vW, vC, vT; varying float vZ, vAO, vRev;
void main(){
  vec4 wp = modelMatrix*vec4(position,1.0);
  if(uWind > 0.5 && wp.z > -9.0 && wp.y > 0.0){   // grass and flowers lean in the wind (time stepped at 12 drawings a second)
    float g = 0.7*sin(uWindT*1.7 + wp.x*0.9 + wp.z*0.6) + 0.3*sin(uWindT*2.9 + wp.x*2.3 - wp.z*1.1);
    wp.x += 0.10*wp.y*wp.y*(0.35 + g);
  }
  vW = wp.xyz; vN = normalize(mat3(modelMatrix)*normal); vC = acol; vT = normalize(mat3(modelMatrix)*atan); vAO = aao; vRev = arev;
  vec4 mv = viewMatrix*wp; vZ = -mv.z;
  gl_Position = projectionMatrix*mv;
}`;
const FS = /* glsl */`
uniform mat4 projectionMatrix;
uniform float uTip, uPass, uId, uKind, uDirMode, uAngle, uOutline, uDens, uAspect, uTime, uDisc, uRevMode, uRevT, uRevD;
uniform vec3 uColor; uniform mat4 uRefVP; uniform vec2 uOut;
varying vec3 vN, vW, vC, vT; varying float vZ, vAO, vRev;
float h31(vec3 p){ p = fract(p*0.3183099+0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vn3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x), mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x), mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y), f.z); }
float fbm3(vec3 p){ float s=0.0, a=0.5; for(int i=0;i<4;i++){ s+=a*vn3(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=0.5; } return s; }
vec2 vor3(vec3 p){ vec3 i=floor(p), f=fract(p); float d1=9.0, d2=9.0; float id=0.0;
  for(int z=-1;z<=1;z++) for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
    vec3 g=vec3(x,y,z); vec3 o=vec3(h31(i+g), h31(i+g+11.3), h31(i+g+27.1));
    float d=length(g+o-f); if(d<d1){ d2=d1; d1=d; id=h31(i+g+5.7);} else if(d<d2) d2=d; }
  return vec2(d2-d1, id); }
vec3 albedo(){
  vec3 c = uColor*vC;
  if(uKind==1.0){            // soil: clods, grit, faint banding
    float n = fbm3(vW*vec3(2.2,3.5,2.2));
    c *= 0.78+0.44*n;
    // round grains (sand, dark crumbs, grey grit) on the cut face
    for(int k=0;k<2;k++){
      float sc = k==0 ? 26.0 : 11.0;
      vec2 q = vW.xy*sc + vec2(vW.z*7.0, float(k)*17.0);
      vec2 ci = floor(q), cf = fract(q);
      float hh = h31(vec3(ci, float(k)*3.1));
      vec2 o = 0.32 + 0.36*vec2(h31(vec3(ci,5.0+float(k))), h31(vec3(ci,9.0+float(k))));
      float rr = (0.10 + 0.17*h31(vec3(ci,13.0)))*(k==0?1.0:0.8);
      vec2 dd = (cf - o)*vec2(1.0, 1.25);
      float m = 1.0 - smoothstep(rr*0.75, rr, length(dd));
      if(k==0){ if(hh>0.90) c = mix(c, vec3(0.86,0.72,0.50), 0.75*m); else if(hh<0.08) c = mix(c, c*0.5, m); }
      else if(hh>0.93) c = mix(c, vec3(0.64,0.62,0.60), 0.8*m);
    }
    c *= 0.92+0.08*sin(vW.y*26.0+n*7.0);
  } else if(uKind==2.0){     // bark ridges + moss
    float s = fbm3(vec3(vW.x*7.0, vW.y*0.9, vW.z*7.0));
    c *= 0.72+0.56*s;
    float m = fbm3(vW*2.6+4.0);
    if(m>0.56 && vW.y<1.4) c = mix(c, vec3(0.46,0.56,0.22), smoothstep(0.56,0.64,m)*0.8);
  } else if(uKind==3.0){     // foliage: leaf cells
    vec2 v = vor3(vW*6.5);
    c *= 0.78+0.42*v.y;
    c = mix(c, c*vec3(1.15,1.12,0.7), step(0.82, v.y)*0.6);
    c *= mix(0.62, 1.0, smoothstep(0.02, 0.14, v.x));
  } else if(uKind==4.0){     // ground surface
    c *= 0.82+0.36*fbm3(vW*vec3(1.4,1.0,2.5));
  } else if(uKind==5.0){     // stone: mottling + speckle
    c *= 0.85+0.3*fbm3(vW*9.0);
    if(h31(floor(vW*60.0))>0.94) c*=0.75;
  }
  return clamp(c, 0.0, 1.0);
}
float revealTime(){
  if(uRevMode < 0.5) return vRev;
  // a sweep across the cut face, left to right, with a ragged front
  float x = clamp((vW.x + 6.0)/14.0, 0.0, 1.0);
  return uRevT + uRevD*x + 0.10*(fbm3(vec3(vW.x*1.3, vW.y*2.0, 0.0)) - 0.5);
}
void main(){
  vec3 N = normalize(vN); if(!gl_FrontFacing) N = -N;
  vec3 vn = normalize((viewMatrix*vec4(N,0.0)).xyz);
  float rt = revealTime() + uTip*length(vn.xy);    // uTip: the middle of a root leads its edges → a rounded growing tip
  if(uDisc > 0.5 && uTime < rt) discard;          // not drawn yet: leave what is behind
  if(uPass > 2.5){                                 // pass 3: anchor (reference-camera pixel) + reveal time
    vec4 c = uRefVP*vec4(vW,1.0);
    vec2 px = (c.xy/c.w*0.5 + 0.5)*uOut;
    gl_FragColor = vec4(px, rt, 1.0); return;
  }
  if(uPass < 0.5){ gl_FragColor = vec4(albedo(), uId/255.0); return; }
  if(uPass < 1.5){
    vec3 L = normalize(vec3(-0.5,0.78,0.45));
    float d = dot(N,L);
    float l = 0.30 + 0.12*N.y + 0.66*smoothstep(-0.15, 0.85, d);
    if(uKind==3.0) l *= mix(0.62, 1.0, smoothstep(1.3, 3.4, vW.y));
    if(uKind==6.0) l = 1.0;           // mycelium: never shaded
    l *= vAO;
    gl_FragColor = vec4(clamp(l,0.0,1.0), vZ, vn.xy*0.5+0.5); return;
  }
  // pass 2: hatch direction (doubled angle), outline weight, density
  vec2 fx = vec2(cos(2.0*uAngle), sin(2.0*uAngle));
  vec2 dv = fx;
  if(uDirMode > 0.5 && uDirMode < 1.5){
    vec4 a = projectionMatrix*viewMatrix*vec4(vW,1.0);
    vec4 b = projectionMatrix*viewMatrix*vec4(vW+vT*0.05,1.0);
    vec2 s = (b.xy/b.w - a.xy/a.w)*vec2(uAspect,1.0);
    if(length(s) > 1e-6){ float an = atan(s.y, s.x); dv = vec2(cos(2.0*an), sin(2.0*an)); }
  } else if(uDirMode > 1.5){
    float k = clamp(length(vn.xy)*1.3, 0.0, 1.0);
    float an = atan(vn.y, vn.x) + 1.5708;
    dv = normalize(mix(fx, vec2(cos(2.0*an), sin(2.0*an)), k*0.75) + 1e-4);
  }
  gl_FragColor = vec4(dv*0.5+0.5, uOutline, uDens);
}`;
function mat({ id, kind = 0, color = [1, 1, 1], dir = 0, angle = 0.8, outline = 1, dens = 1, side = THREE.FrontSide, disc = 0, wind = 0, rev = null, tip = 0 }) {
  return new THREE.ShaderMaterial({
    vertexShader: VS, fragmentShader: FS, side,
    uniforms: {
      uPass: SHARED.uPass, uTime: SHARED.uTime, uWindT: SHARED.uWindT, uRefVP: SHARED.uRefVP, uOut: SHARED.uOut,
      uDisc: { value: disc }, uWind: { value: wind }, uTip: { value: tip },
      uRevMode: { value: rev ? 1 : 0 }, uRevT: { value: rev ? rev[0] : 0 }, uRevD: { value: rev ? rev[1] : 0 },
      uId: { value: id }, uKind: { value: kind }, uDirMode: { value: dir },
      uAngle: { value: angle }, uOutline: { value: outline }, uDens: { value: dens },
      uAspect: { value: W / H }, uColor: { value: new THREE.Color(...color) },
    },
  });
}
// ids: 0 sky · 1 hills · 2 ground · 3 grass · 4 trunk · 5 foliage · 6 litter strip · 7 topsoil · 8 subsoil · 9 weathered · 10 bedrock matrix
//      11 roots · 12 worms · 13 stones · 14 bedrock rocks · 15 mycelium · 16 mushrooms · 17 flowers · 18 leaves · 19 far trees · 20 tunnels
const scene = new THREE.Scene();
const add = (geo, m) => { const o = new THREE.Mesh(geo, m); o.frustumCulled = false; scene.add(o); return o; };

// ================================================================ the film's timeline (seconds) — everything below reads it
const TL = {
  v: [0.9, 5.9, 13.9, 18.1, 21.1, 26.1, 31.3, 35.5, 41.4],   // narration starts; lengths come from voice/dur.json
  descend: [5.4, 10.4],                                       // S2 crane down
  circle: 11.55, pop: 12.5, popEnd: 13.75,                     // magnifier: ring drawn, inset opens, fills the frame
  hyphae: 14.6, focus: [17.5, 18.4], hyTag: 18.7, bridge: 18.8,
  sugar: 20.0, sugarTag: 21.7, water: 25.7, waterTag: 26.5, absorb: 28.2,
  truck: [21.0, 30.6], qArrow: 34.4,
  irisIn: [38.85, 40.0], net: [40.1, 44.6], title: 45.2, sign: 45.85, end: 50.8,
};

// ---------------------------------------------------------------- soil block
const TOP = -0.006, X0 = -20, X1 = 20, ZB = -7;
const bLit = x => -0.16 + 0.03 * fbm1(x * 1.3, 2);
const bTop = x => -1.5 + 0.24 * fbm1(x * 0.42, 5) + 0.05 * fbm1(x * 3, 6);
const bSub = x => -3.25 + 0.3 * fbm1(x * 0.35, 9) + 0.06 * fbm1(x * 2.5, 10);
const bWea = x => -4.02 + 0.2 * fbm1(x * 0.5, 13);
// when the pencil colours each horizon in: [start, sweep duration] (sweeps left → right over x −6..8)
const REV = { lit: [5.75, 0.9], top: [6.2, 1.1], sub: [7.0, 1.15], wea: [7.8, 1.0], bed: [8.4, 1.0] };
const sweepX = x => clamp((x + 6) / 14, 0, 1);
function soilRev(x, y) {
  const r = y > bLit(x) ? REV.lit : y > bTop(x) ? REV.top : y > bSub(x) ? REV.sub : y > bWea(x) ? REV.wea : REV.bed;
  return r[0] + r[1] * sweepX(x);
}
function layer(upper, lower, id, color, rev) {
  const sh = new THREE.Shape();
  const N = 320;
  for (let i = 0; i <= N; i++) { const x = lerp(X0, X1, i / N); i ? sh.lineTo(x, upper(x)) : sh.moveTo(x, upper(x)); }
  for (let i = N; i >= 0; i--) { const x = lerp(X0, X1, i / N); sh.lineTo(x, lower(x)); }
  const g = new THREE.ExtrudeGeometry(sh, { depth: -ZB, bevelEnabled: false, steps: 1, curveSegments: 1 });
  g.translate(0, 0, ZB);
  const b = new Builder();
  append(b, g, new THREE.Matrix4(), () => [1, 1, 1], V(1, 0, 0));
  add(b.geo(), mat({ id, kind: 1, color, dir: 0, angle: 0.62 + id * 0.11, outline: 0.55, dens: 1.0, rev }));
}
layer(() => TOP, bLit, 6, [0.30, 0.19, 0.11], REV.lit);
layer(bLit, bTop, 7, [0.40, 0.25, 0.14], REV.top);
layer(bTop, bSub, 8, [0.74, 0.46, 0.23], REV.sub);
layer(bSub, bWea, 9, [0.70, 0.55, 0.36], REV.wea);
layer(bWea, () => -15, 10, [0.40, 0.37, 0.35], REV.bed);

// ---------------------------------------------------------------- ground surface + far land
{
  const g = new THREE.PlaneGeometry(90, 70, 180, 140); g.rotateX(-Math.PI / 2); g.translate(0, 0, -35);
  const pa = g.attributes.position;
  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i), z = pa.getZ(i);
    const far = ss((-z - 7) / 30);
    pa.setY(i, far * (1.4 + 2.2 * (vn2(x * 0.06, z * 0.05) - 0.3)) + 0.03 * vn2(x * 2, z * 2) * (1 - far));
  }
  g.computeVertexNormals();
  const b = new Builder();
  append(b, g, new THREE.Matrix4(), (p) => {
    const t = vn2(p.x * 0.18, p.z * 0.2);
    return [lerp(0.55, 0.72, t), lerp(0.66, 0.74, t), lerp(0.26, 0.32, t)];
  });
  add(b.geo(), mat({ id: 2, kind: 4, color: [1, 1, 1], dir: 0, angle: 0.15, outline: 0.6, dens: 0.95 }));
}
{ // hills
  const b = new Builder(), R = mulberry(31);
  const hills = [[-38, -6, -90, 34, 11, 14, [0.46, 0.62, 0.42]], [10, -7, -110, 46, 12, 16, [0.44, 0.58, 0.54]], [45, -5, -85, 30, 9.5, 12, [0.50, 0.64, 0.40]],
    [-10, -8, -70, 26, 9, 10, [0.62, 0.72, 0.36]], [28, -9, -62, 22, 10, 9, [0.56, 0.69, 0.36]]];
  for (const [x, y, z, sx, sy, sz, col] of hills) {
    const g = new THREE.SphereGeometry(1, 64, 32);
    append(b, g, new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion(), V(sx, sy, sz)), () => col);
  }
  add(b.geo(), mat({ id: 1, kind: 4, dir: 2, angle: 0.3, outline: 0.55, dens: 0.75 }));
  const bt = new Builder();
  const clump = (x, y, z, r, col) => {
    const g = new THREE.SphereGeometry(1, 20, 14);
    append(bt, g, new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion(), V(r * (0.9 + R() * 0.4), r * (1.0 + R() * 0.5), r)), () => col);
  };
  for (let i = 0; i < 90; i++) {
    const h = hills[Math.floor(R() * hills.length)];
    const ang = (R() - 0.5) * 1.6, x = h[0] + Math.sin(ang) * h[3] * 0.92, z = h[2] + 3;
    const y = h[1] + Math.cos(ang) * h[4] * 0.97;
    clump(x, y, z, 0.8 + R() * 1.1, [0.30 + R() * 0.12, 0.45 + R() * 0.1, 0.25 + R() * 0.08]);
  }
  for (let i = 0; i < 18; i++) {
    const x = (R() < 0.5 ? -1 : 1) * (9 + R() * 22), z = -22 - R() * 14;
    const y = ss((-z - 7) / 30) * (1.4 + 2.2 * (vn2(x * 0.06, z * 0.05) - 0.3));
    clump(x, y + 0.3, z, 0.5 + R() * 0.6, [0.34 + R() * 0.1, 0.5 + R() * 0.1, 0.22]);
  }
  add(bt.geo(), mat({ id: 19, kind: 3, dir: 2, angle: 0.5, outline: 0.7, dens: 0.85 }));
}

// ---------------------------------------------------------------- trees: A is our tree, B "the next tree", C D E the rest of the wood
const TREES = [
  { k: 'A', x: 0.5, z: -1.45, s: 1.0, seed: 11, root: 6.45 },
  { k: 'B', x: 7.4, z: -1.3, s: 0.72, seed: 21, root: 7.0 },
  { k: 'C', x: -8.6, z: -2.2, s: 0.85, seed: 31, root: 6.6 },
  { k: 'D', x: 14.2, z: -2.0, s: 0.8, seed: 41, root: 7.4 },
  { k: 'E', x: -15.2, z: -1.7, s: 0.7, seed: 51, root: 7.4 },
];
const TX = 0.5;
{
  const bTrunk = new Builder(), bf = new Builder();
  for (const T of TREES) {
    const { x: TXi, z: TZi, s } = T, R = mulberry(T.seed);
    const pts = [], rad = [];
    for (let i = 0; i <= 40; i++) {
      const u = i / 40, y = lerp(0.0, 3.4 * s, u);
      pts.push(V(TXi + 0.08 * s * Math.sin(u * 3.1 + T.seed) + 0.05 * u, y, TZi));
      rad.push((lerp(0.76, 0.56, u) + 0.5 * Math.exp(-Math.max(0, y / s + 0.05) * 3.4)) * s);
    }
    tube(bTrunk, pts, rad, 48, () => [0.68, 0.54, 0.40], (i, a) => {
      const y = pts[i].y / s;
      const lobes = Math.exp(-Math.max(0, y + 0.1) * 2.8) * 0.18 * Math.pow(Math.max(0, Math.cos(a * 3 + 0.4)), 2);
      const ca = Math.cos(a), sa = Math.sin(a);
      const ridge = 0.05 * Math.sin(a * 22 + vn2(ca * 1.5 + y * 1.4, sa * 1.5) * 4) + 0.035 * (vn2(ca * 4 + 7, sa * 4 + y * 3) - 0.5);
      return 1 + lobes + ridge;
    });
    const L = (dx, dy, dz) => V(TXi + dx * s, dy * s, TZi + dz * s);
    const limb = (p0, p1, p2, r0, r1, sides = 18) => {
      const P = [], Rr = [];
      for (let i = 0; i <= 20; i++) { const u = i / 20, a = p0.clone().lerp(p1, u), c = p1.clone().lerp(p2, u); P.push(a.lerp(c, u)); Rr.push(lerp(r0, r1, u) * s); }
      tube(bTrunk, P, Rr, sides, () => [0.62, 0.52, 0.41], (i, a) => 1 + 0.05 * Math.sin(a * 9 + i));
    };
    limb(L(0, 1.8, 0), L(-1.0, 2.6, 0), L(-3.4, 3.3, -0.4), 0.36, 0.12);
    limb(L(0.05, 2.1, 0), L(1.1, 2.7, 0.1), L(3.3, 3.6, -0.3), 0.33, 0.1);
    limb(L(-0.1, 2.9, 0), L(-0.4, 3.6, 0.3), L(-0.2, 4.6, 0), 0.28, 0.12);
    const clumps = [];
    for (let tries = 0; clumps.length < 80 * Math.min(1, s * 1.1) && tries < 6000; tries++) {
      const cx = lerp(-3.3, 4.6, R()), cy = lerp(1.75, 5.0, R()), cz = lerp(-1.4, 1.1, R());
      const e = Math.pow((cx - 0.1) / 4.7, 2) + Math.pow((cy - 4.1) / 2.4, 2);
      if (e > 1) continue;
      if (Math.abs(cx) < 1.0 && cy < 2.5) continue;
      clumps.push([TXi + cx * s, cy * s, TZi + cz * s, lerp(0.38, 0.95, R()) * s]);
    }
    for (const [cx, cy, cz, r] of clumps) {
      const g = new THREE.SphereGeometry(1, 40, 28);
      const pa = g.attributes.position, sd = R() * 100;
      for (let i = 0; i < pa.count; i++) {
        const p = V(pa.getX(i), pa.getY(i), pa.getZ(i));
        const n = 1 + 0.22 * (vn2(p.x * 2.6 + sd, p.y * 2.6 + p.z * 1.7) - 0.5) + 0.1 * (vn2(p.x * 7 + sd, p.z * 7 - p.y * 3) - 0.5);
        p.multiplyScalar(n); pa.setXYZ(i, p.x, p.y, p.z);
      }
      g.computeVertexNormals();
      const tint = R();
      const col = tint > 0.8 ? [0.74, 0.80, 0.30] : [lerp(0.44, 0.66, tint), lerp(0.64, 0.78, tint), lerp(0.24, 0.22, tint)];
      append(bf, g, new THREE.Matrix4().compose(V(cx, cy, cz), new THREE.Quaternion(), V(r * 1.15, r * 0.9, r)), () => col);
    }
  }
  add(bTrunk.geo(), mat({ id: 4, kind: 2, dir: 1, outline: 1.0, dens: 1.0 }));
  add(bf.geo(), mat({ id: 5, kind: 3, dir: 2, angle: 0.9, outline: 0.9, dens: 1.0 }));
}

// ---------------------------------------------------------------- roots: recursive growth (main roots → laterals → fine roots), gravitropism + wander
const ROOT = { chains: [], main: [] };
const ROOT_V = 2.7;                           // roots are drawn outward from the crown at ROOT_V units a second
{
  const b = new Builder(), bThin = new Builder();
  const zOf = (x, y, r) => 0.1 + 0.07 * (vn2(x * 0.9 + 3, y * 0.9) - 0.5) - r * 0.3;
  const STEP = 0.055;
  let R = mulberry(5), T0 = 6.45, TK = 'A';
  const grow = (x, y, ang, r0, level, maxLen, d0 = 0) => {
    const pts = [V(x, y, zOf(x, y, r0))], rad = [r0], dist = [d0];
    if (level === 0) ROOT.main.push(pts);
    let len = 0, curv = 0, loss = 1, r = r0;
    let next = (level === 0 ? 0.35 : 0.12) + R() * 0.3;
    const gravity = [0.010, 0.006, 0.004, 0.003, 0.002][level];
    while (len < maxLen) {
      curv = curv * 0.9 + (R() - 0.5) * 0.026 * (1 + level * 1.1);
      ang += curv;
      let da = -Math.PI / 2 - ang; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      ang += da * gravity * (0.6 + len / maxLen);
      x += Math.cos(ang) * STEP; y += Math.sin(ang) * STEP;
      if (y > -0.1) { y = -0.1; if (Math.sin(ang) > 0) ang = -ang; }
      const floor = bWea(x) + 0.06;
      if (y < floor) { y = floor; ang = Math.cos(ang) >= 0 ? -0.35 : Math.PI + 0.35; maxLen = Math.min(maxLen, len + 0.12); }
      if (x < -19.6 || x > 19.6) break;
      len += STEP;
      r = lerp(r0, 0.008, Math.pow(len / maxLen, 0.8)) * loss;
      pts.push(V(x, y, zOf(x, y, r))); rad.push(r); dist.push(d0 + len);
      if (len > next && level < 3) {
        const br = r * (0.34 + R() * 0.24);
        if (br > 0.011) {
          const side = R() < 0.5 ? 1 : -1;
          grow(x, y, ang + side * (0.55 + R() * 0.75), br, level + 1, Math.min(maxLen - len + 0.6, maxLen * (0.35 + R() * 0.3)) * (level === 0 ? 1.15 : 1), d0 + len);
          loss *= 0.97;
        }
        next = len + [0.62, 0.5, 0.42][level] * (0.6 + R() * 0.9);
      }
    }
    if (pts.length < 2) return;
    const t0 = T0, rvAt = i => t0 + 0.1 + dist[i] / ROOT_V + level * 0.08;
    ROOT.chains.push({ tree: TK, pts, rad, level, t0: rvAt(0), t1: rvAt(pts.length - 1), rv: pts.map((_, i) => rvAt(i)) });
    const tint = R(), sides = r0 > 0.08 ? 14 : r0 > 0.025 ? 8 : 5;
    tube(r0 > 0.03 ? b : bThin, pts, rad, sides, (i, k) => {
      const v = 0.9 + 0.2 * vn2(pts[i].x * 6, pts[i].y * 6 + k);
      return [lerp(0.86, 0.9, tint) * v, lerp(0.71, 0.76, tint) * v, lerp(0.52, 0.57, tint) * v];
    }, (i, a) => 1 + (rad[i] > 0.05 ? 0.07 * Math.sin(a * 5 + i * 0.7) : 0), (i, d) => 0.78 + 0.22 * clamp(d.y * 0.5 + 0.5 + d.z * 0.3, 0, 1), rvAt);
  };
  const MAINS = [[184, 0.27, 8.4], [208, 0.21, 6.2], [236, 0.2, 4.6], [-90, 0.19, 3.4], [-56, 0.2, 4.6], [-28, 0.21, 6.2], [-4, 0.27, 8.4]];
  for (const T of TREES) {
    R = mulberry(T.seed * 7 + 5); T0 = T.root; TK = T.k;
    const g = new THREE.SphereGeometry(1, 40, 20), pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) { const p = V(pa.getX(i), pa.getY(i), pa.getZ(i)); p.multiplyScalar(1 + 0.12 * (vn2(p.x * 3 + 5, p.y * 3 + p.z * 2) - 0.5)); pa.setXYZ(i, p.x, p.y, p.z); }
    g.computeVertexNormals();
    b.rv = T0;
    append(b, g, new THREE.Matrix4().compose(V(T.x, -0.13, -0.25), new THREE.Quaternion(), V(0.78 * T.s, 0.2 * T.s, 0.48 * T.s)), () => [0.84, 0.70, 0.52], UP);
    const s = T.s, mains = T.k === 'A' ? MAINS : MAINS.filter((_, i) => i % 3 !== 1 || s > 0.8);
    for (const [deg, r, Lm] of mains) {
      const a = (deg + (T.k === 'A' ? 0 : (R() - 0.5) * 26)) * Math.PI / 180;
      grow(T.x + Math.cos(a) * 0.45 * s, -0.1 + Math.sin(a) * 0.08, a, r * s, 0, Lm * (0.55 + 0.45 * s));
    }
  }
  add(b.geo(), mat({ id: 11, kind: 0, dir: 1, outline: 1.0, dens: 1.0, disc: 1, tip: 0.16 }));
  add(bThin.geo(), mat({ id: 21, kind: 0, dir: 1, outline: 0.45, dens: 0.85, disc: 1 }));
}

// ---------------------------------------------------------------- the two hero roots, their fungus, and the bridge between them (the close-ups)
const HERO = {};
{
  const bR = new Builder(), bH = new Builder();
  const bez = (p0, p1, p2, p3, n) => { const P = []; for (let i = 0; i <= n; i++) { const u = i / n, a = 1 - u; P.push(V(a * a * a * p0.x + 3 * a * a * u * p1.x + 3 * a * u * u * p2.x + u * u * u * p3.x, a * a * a * p0.y + 3 * a * a * u * p1.y + 3 * a * u * u * p2.y + u * u * u * p3.y, a * a * a * p0.z + 3 * a * a * u * p1.z + 3 * a * u * u * p2.z + u * u * u * p3.z)); } return P; };
  const heroRoot = (P, r0, r1, t0, dur) => {
    const rad = P.map((_, i) => { const u = i / (P.length - 1); return lerp(r0, r1, Math.pow(u, 0.9)) * (u > 0.93 ? Math.sqrt(Math.max(0.05, (1 - u) / 0.07)) : 1); });
    tube(bR, P, rad, 16, (i, k) => { const v = 0.92 + 0.14 * vn2(P[i].x * 30, k * 0.7); return [0.90 * v, 0.76 * v, 0.58 * v]; },
      (i, a) => 1 + 0.06 * Math.sin(a * 3 + i * 0.4), (i, d) => 0.8 + 0.2 * clamp(d.y * 0.5 + 0.5, 0, 1), i => t0 + dur * i / (P.length - 1));
    return { P, rad, tip: P[P.length - 1] };
  };
  HERO.A = heroRoot(bez(V(1.75, -0.7, 0.24), V(2.5, -0.95, 0.26), V(3.0, -1.45, 0.26), V(3.55, -1.72, 0.26), 90), 0.066, 0.03, 8.0, 1.4);
  HERO.B = heroRoot(bez(V(6.6, -0.9, 0.24), V(5.9, -1.2, 0.26), V(5.4, -1.75, 0.26), V(4.95, -1.92, 0.26), 90), 0.06, 0.028, 8.8, 1.2);
  // fungus: threads wound round the last part of each root (the mantle), threads fanning into the soil, and a bundle between the tips
  const R = mulberry(404);
  HERO.paths = [];
  const thread = (P, rv, r = 0.0055) => tube(bH, P, P.map(() => r), 4, () => [0.995, 0.985, 0.95], null, null, i => rv(i));
  const mantle = (root, t0) => {
    const { P, rad } = root, n = P.length;
    for (let k = 0; k < 9; k++) {
      const Q = [], ph = R() * 6.28, turns = 2.5 + R() * 2, i0 = Math.floor(n * (0.55 + R() * 0.12));
      for (let i = i0; i < n - 1; i++) {
        const u = (i - i0) / (n - 1 - i0), T = P[i + 1].clone().sub(P[i]).normalize();
        const N = V(-T.y, T.x, 0), a = ph + u * turns * 6.28;
        const rr = rad[i] * 1.12 + 0.004;
        Q.push(P[i].clone().addScaledVector(N, Math.cos(a) * rr).add(V(0, 0, Math.sin(a) * rr)));
      }
      thread(Q, i => t0 + 0.06 * k + 1.4 * i / Q.length);
    }
  };
  const fan = (from, t0, count, reach) => {
    for (let k = 0; k < count; k++) {
      let x = from.x, y = from.y, ang = R() * 6.28; const Q = [V(x, y, 0.27)];
      const steps = Math.floor(reach * (0.6 + R() * 0.6) / 0.03);
      for (let i = 0; i < steps; i++) { ang += (R() - 0.5) * 0.7; x += Math.cos(ang) * 0.03; y += Math.sin(ang) * 0.03; Q.push(V(x, y, 0.27 + (R() - 0.5) * 0.02)); }
      thread(Q, i => t0 + 0.08 * k + i * 0.03 / 0.55, 0.0045);
    }
  };
  mantle(HERO.A, TL.hyphae); mantle(HERO.B, TL.hyphae + 0.6);
  // fans grow from points along the last third of the root
  const along = (root, u) => root.P[Math.floor(u * (root.P.length - 1))];
  for (const u of [0.7, 0.82, 0.93, 1.0]) { fan(along(HERO.A, u), TL.hyphae + 0.5 + u, 3, 0.45); fan(along(HERO.B, u), TL.hyphae + 1.0 + u, 3, 0.45); }
  // the bundle A tip → B tip: three threads on gently different paths (these carry the particles)
  const a = HERO.A.tip, bt = HERO.B.tip;
  for (let k = 0; k < 3; k++) {
    const off = (k - 1) * 0.05;
    const P = bez(a.clone().add(V(-0.04, -0.01 + off * 0.3, 0.01)), V(a.x + 0.35, a.y - 0.16 + off, 0.27), V(bt.x - 0.4, bt.y - 0.12 - off, 0.27), bt.clone().add(V(0.05, -0.01, 0.01)), 140);
    for (let i = 1; i < P.length - 1; i++) { P[i].x += 0.012 * Math.sin(i * 0.31 + k * 2); P[i].y += 0.014 * Math.sin(i * 0.19 + k); }
    HERO.paths.push(P);
    thread(P, i => TL.bridge + 1.6 * i / P.length, 0.0062);
  }
  add(bR.geo(), mat({ id: 22, kind: 0, dir: 1, outline: 1.0, dens: 1.0, disc: 1, tip: 0.1 }));
  add(bH.geo(), mat({ id: 23, kind: 6, dir: 1, outline: 0.35, dens: 1.0, disc: 1 }));
}

// ---------------------------------------------------------------- nutrients: one sugar drop (amber) out of the root, water + nutrient grains (teal) back in
const GRAINS = [];
{
  const mk = (col, r, id) => {
    const b = new Builder(); const g = new THREE.SphereGeometry(r, 18, 12);
    append(b, g, new THREE.Matrix4().makeScale(1.25, 0.9, 1), () => col);
    const m = add(b.geo(), mat({ id, kind: 0, dir: 2, angle: 0.6, outline: 1.0, dens: 1.0 })); m.visible = false; m.userData.grain = 1; return m;
  };
  GRAINS.push({ kind: 'sugar', m: mk([0.93, 0.62, 0.20], 0.032, 24), path: 0, t0: TL.sugar, t1: TL.absorb + 0.4, u0: -0.06, u1: 0.5 });
  for (let i = 0; i < 4; i++) GRAINS.push({ kind: 'water', m: mk([0.33, 0.62, 0.72], 0.022, 25), path: 1 + (i % 2), t0: TL.water + i * 0.55, t1: TL.water + i * 0.55 + 4.4, u0: 0.98, u1: -0.06 });
}
const pathAt = (P, u) => {          // u 0..1 along polyline; u < 0 runs back inside the root
  if (u < 0) { const d = P[1].clone().sub(P[0]).normalize(); return P[0].clone().addScaledVector(d, u * 2.0 * 0.9); }
  const f = clamp(u, 0, 1) * (P.length - 1), i = Math.min(P.length - 2, Math.floor(f));
  return P[i].clone().lerp(P[i + 1], f - i);
};
function placeGrains(t) {
  for (const g of GRAINS) {
    const on = t >= g.t0 && t <= g.t1; g.m.visible = on; if (!on) continue;
    let k = (t - g.t0) / (g.t1 - g.t0);
    if (g.kind === 'sugar') k = (TL.absorb - g.t0) > 0 ? clamp((t - g.t0) / (TL.absorb - g.t0), 0, 1) : 1;
    const u = lerp(g.u0, g.u1, g.kind === 'sugar' ? k * k * (3 - 2 * k) * 0.5 + k * 0.5 : k);
    const p = pathAt(HERO.paths[g.path], u); p.z += 0.012;
    g.m.position.copy(p);
    let sc = 1;
    if (g.kind === 'sugar') sc = 1 - ss((t - TL.absorb) / 0.4);       // taken up by the fungus
    else sc = ss((t - g.t0) / 0.25) * (1 - ss((t - g.t1 + 0.3) / 0.3));
    g.m.scale.setScalar(Math.max(0.001, sc));
    g.m.updateMatrixWorld();
  }
}

// ---------------------------------------------------------------- stones, pebbles, bedrock
{
  const R = mulberry(77), b = new Builder();
  const stone = (x, y, z, s, sq, col, detail = 1, jag = 0.22) => {
    const g = new THREE.IcosahedronGeometry(1, detail);
    const pa = g.attributes.position, sd = R() * 50;
    for (let i = 0; i < pa.count; i++) {
      const p = V(pa.getX(i), pa.getY(i), pa.getZ(i));
      p.multiplyScalar(1 + jag * (vn2(p.x * 1.8 + sd, p.y * 1.8 + p.z * 1.3) - 0.5));
      pa.setXYZ(i, p.x, p.y, p.z);
    }
    g.computeVertexNormals();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(R() * 3, R() * 3, R() * 3));
    b.rv = y > 0 ? -100 : soilRev(x, y) + 0.18;
    append(b, g, new THREE.Matrix4().compose(V(x, y, z), q, V(s * sq[0], s * sq[1], s * sq[2])), () => col);
  };
  const gcol = () => { const t = R(); return t < 0.35 ? [0.62 + R() * 0.08, 0.60 + R() * 0.06, 0.58 + R() * 0.06] : t < 0.7 ? [0.74, 0.62, 0.46] : t < 0.85 ? [0.58, 0.60, 0.64] : [0.88, 0.85, 0.78]; };
  for (let i = 0; i < 520; i++) {
    const x = lerp(-19, 19, R()), y = lerp(-4.0, -0.25, Math.pow(R(), 0.7));
    const depth = clamp(-y / 4.0, 0, 1);
    if (R() > 0.35 + depth * 0.65) continue;
    if (Math.abs(x - 4.2) < 1.5 && y > -2.4 && y < -1.0) continue;          // keep the close-up clean
    const s = lerp(0.025, 0.07, R()) * (0.6 + depth * 1.3) * (R() < 0.06 ? 2.0 : 1);
    stone(x, y, -s * 0.3, s, [1.35, 0.72, 1], gcol());
  }
  for (let i = 0; i < 30; i++) {
    const x = lerp(-19.5, 19.5, i / 29) + (R() - 0.5) * 0.6;
    const y = -4.6 - R() * 0.35 + (i % 2) * -0.2;
    const s = lerp(0.62, 0.95, R());
    const t = R(), col = t > 0.7 ? [0.62, 0.57, 0.50] : [lerp(0.50, 0.58, t), lerp(0.52, 0.57, t), lerp(0.57, 0.6, t)];
    stone(x, y, -0.45, s, [1.4, 0.78, 0.9], col, 1, 0.42);
  }
  for (let i = 0; i < 28; i++) {
    const x = lerp(-19, 19, i / 27) + (R() - 0.5) * 0.8;
    stone(x, -5.55 - R() * 0.3, -0.35, lerp(0.7, 1.0, R()), [1.4, 0.8, 0.9], [0.50, 0.52, 0.56], 1, 0.4);
  }
  for (let i = 0; i < 40; i++) {             // deep bedrock for the wide shot
    const x = lerp(-19.5, 19.5, R()), y = lerp(-6.4, -9.5, R());
    stone(x, y, -0.5, lerp(0.7, 1.2, R()), [1.4, 0.8, 0.9], [0.47 + R() * 0.06, 0.49, 0.54], 1, 0.4);
  }
  stone(4.6, 0.05, -1.2, 0.5, [1.3, 0.75, 1], [0.66, 0.66, 0.66], 2, 0.25);
  add(b.geo(), mat({ id: 13, kind: 5, dir: 2, angle: 0.7, outline: 1.0, dens: 1.0, disc: 1 }));
}

// ---------------------------------------------------------------- earthworms
const WORMS_T = [];
{
  const b = new Builder();
  const worm = (x0, y0, len, amp, ph, ang, r0, rv) => {
    const P = [], Rr = [], n = 120, ca = Math.cos(ang), sa = Math.sin(ang);
    for (let i = 0; i <= n; i++) {
      const s = i / n, u = s * len, v = amp * Math.sin(s * Math.PI * 2.2 + ph) + amp * 0.4 * Math.sin(s * 9 + ph);
      P.push(V(x0 + u * ca - v * sa, y0 + u * sa + v * ca, 0.34));
      const taper = Math.min(1, ss(s / 0.1) * 0.85 + 0.15) * Math.min(1, ss((1 - s) / 0.16) * 0.8 + 0.2);
      Rr.push(r0 * taper * (1 + 0.1 * Math.abs(Math.sin(s * n * 0.55 * Math.PI)) + (Math.abs(s - 0.3) < 0.05 ? 0.12 : 0)));
    }
    tube(b, P, Rr, 14, (i) => {
      const s = i / n, ring = Math.abs(Math.sin(s * n * 0.55 * Math.PI)), v = 0.86 + 0.14 * ring;
      return Math.abs(s - 0.3) < 0.05 ? [0.80 * v, 0.44 * v, 0.42 * v] : [0.89 * v, 0.58 * v, 0.55 * v];
    }, null, null, i => rv + 0.35 * i / n);
    WORMS_T.push(rv);
  };
  worm(-3.9, -0.85, 1.9, 0.12, 0.3, 0.1, 0.08, 7.0);
  worm(-2.7, -2.4, 1.5, 0.11, 1.6, -0.06, 0.072, 7.8);
  worm(-11.0, -2.0, 1.6, 0.1, 0.9, 0.2, 0.07, 8.0);
  worm(10.5, -3.0, 1.3, 0.09, 2.4, -0.2, 0.065, 8.6);
  add(b.geo(), mat({ id: 12, kind: 0, dir: 1, outline: 1.0, dens: 1.0, disc: 1 }));
}

// ---------------------------------------------------------------- the wood's fungal network (drawn in the last shot, spreading out from tree B)
const NET = { threads: [] };
{
  const R = mulberry(99), bThick = new Builder(), bThin = new Builder();
  const Bt = HERO.B.tip, V0 = 3.2;            // spread speed (units/s) from tree B
  const pts = { A: [], B: [], C: [], D: [], E: [] };
  ROOT.chains.forEach(c => { if (c.level < 1) return; for (let i = 0; i < c.pts.length; i += 5) { const p = c.pts[i]; if (p.y < -0.5 && p.y > -3.8) pts[c.tree].push(p); } });
  const thread = (P, D, t0, r, b) => tube(b, P, P.map(() => r), 3, () => [0.99, 0.98, 0.94], null, null, i => t0 + D[i] / 1.4);
  const wander = (x, y, ang, steps, d0, t0, depth, b, r) => {
    const P = [V(x, y, 0.2 + (R() - 0.5) * 0.06)], D = [d0]; let d = d0;
    for (let i = 0; i < steps; i++) {
      ang += (R() - 0.5) * 0.9; x += Math.cos(ang) * 0.06; y = Math.min(-0.2, y + Math.sin(ang) * 0.06); d += 0.06;
      P.push(V(x, y, P[0].z)); D.push(d);
      if (depth < 2 && R() < 0.14) wander(x, y, ang + (R() < 0.5 ? 0.9 : -0.9), Math.floor(steps * 0.55), d, t0, depth + 1, b, r * 0.8);
    }
    thread(P, D, t0, r, b);
  };
  const bridge = (A, B, t0, r) => {
    let x = A.x, y = A.y, d = 0, ang = Math.atan2(B.y - y, B.x - x) + (R() - 0.5) * 1.0;
    const z = 0.22 + (R() - 0.5) * 0.06, P = [V(x, y, z)], D = [0];
    for (let i = 0; i < 400; i++) {
      const to = Math.atan2(B.y - y, B.x - x);
      let da = to - ang; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      ang += da * 0.16 + (R() - 0.5) * 0.5;
      x += Math.cos(ang) * 0.07; y = Math.min(-0.3, y + Math.sin(ang) * 0.07); d += 0.07;
      P.push(V(x, y, z)); D.push(d);
      if (R() < 0.08) wander(x, y, ang + (R() < 0.5 ? 1.1 : -1.1), 6 + Math.floor(R() * 10), d, t0, 1, bThick, r * 0.75);
      if (Math.hypot(B.x - x, B.y - y) < 0.08) break;
    }
    thread(P, D, t0, r, bThick);
    NET.threads.push({ t0, t1: t0 + d / 1.4, x0: A.x, x1: B.x });
  };
  const near = (list, x, y) => list.reduce((a, p) => (Math.hypot(p.x - x, p.y - y) < Math.hypot(a.x - x, a.y - y) ? p : a), list[0]);
  const T = Object.fromEntries(TREES.map(t => [t.k, t]));
  const link = (k1, k2, n) => {
    for (let i = 0; i < n; i++) {
      const yy = -1.0 - 2.2 * (i + R() * 0.6) / n, mid = (T[k1].x + T[k2].x) / 2;
      const A = near(pts[k1], lerp(T[k1].x, mid, 0.55), yy), B = near(pts[k2], lerp(T[k2].x, mid, 0.55), yy);
      const t0 = TL.net[0] + Math.hypot(A.x - Bt.x, A.y - Bt.y) / V0;
      for (let h = 0; h < 2; h++) bridge(A, B, t0 + h * 0.08, 0.03);
    }
  };
  link('B', 'A', 4); link('A', 'C', 4); link('C', 'E', 3); link('B', 'D', 4);
  // local webs round every tree's fine roots
  for (const k of Object.keys(pts)) {
    for (let i = 0; i < 16; i++) {
      const p = pts[k][Math.floor(R() * pts[k].length)];
      const t0 = TL.net[0] + Math.hypot(p.x - Bt.x, p.y - Bt.y) / V0 + 0.2;
      for (let h = 0; h < 3; h++) wander(p.x, p.y, R() * 6.28, 8 + Math.floor(R() * 10), 0, t0, 0, bThin, 0.012);
    }
  }
  add(bThick.geo(), mat({ id: 26, kind: 6, dir: 1, outline: 0.25, dens: 1.0, disc: 1 }));
  add(bThin.geo(), mat({ id: 15, kind: 6, dir: 1, outline: 0.0, dens: 1.0, disc: 1 }));
}

// ---------------------------------------------------------------- mushrooms (the fungus's fruit, above ground near tree A)
{
  const bm = new Builder();
  const mush = (x, z, h, cr, tilt) => {
    const stem = new THREE.CylinderGeometry(cr * 0.22, cr * 0.3, h, 14, 4);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, tilt));
    append(bm, stem, new THREE.Matrix4().compose(V(x, h / 2, z), q, V(1, 1, 1)), () => [0.90, 0.86, 0.76]);
    const cap = new THREE.SphereGeometry(cr, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const top = V(0, h, 0).applyQuaternion(q).add(V(x, 0, z));
    append(bm, cap, new THREE.Matrix4().compose(top.add(V(0, -cr * 0.08, 0)), q, V(1, 0.62, 1)), (p, n) => n.y > 0.3 ? [0.72, 0.50, 0.30] : [0.86, 0.78, 0.62]);
  };
  mush(3.15, 0.08, 0.42, 0.24, 0.12); mush(3.55, -0.12, 0.3, 0.17, -0.2); mush(2.75, -0.25, 0.22, 0.12, 0.25);
  add(bm.geo(), mat({ id: 16, kind: 0, dir: 2, angle: 0.4, outline: 1.0, dens: 1.0 }));
}

// ---------------------------------------------------------------- grass, flowers, fallen leaves
{
  const R = mulberry(123), b = new Builder(), bfl = new Builder(), bl = new Builder();
  const blade = (x, z, h, lean, col) => {
    const w = 0.022 + R() * 0.02, segs = 4, base = b.vc;
    const nrm = V((R() - 0.5) * 0.6, 0.35, 1).normalize();
    const side = V(1, 0, -0.2 * (R() - 0.5)).normalize();
    for (let i = 0; i <= segs; i++) {
      const s = i / segs, ww = w * (1 - s * 0.92);
      const c = V(x + lean * s * s * h, s * h - 0.01, z + 0.04 * s);
      const k = 0.75 + 0.45 * s;
      b.v(c.clone().addScaledVector(side, -ww), nrm, [col[0] * k, col[1] * k, col[2] * k], V(lean * 2 * s, 1, 0).normalize(), 0.7 + 0.3 * s);
      b.v(c.clone().addScaledVector(side, ww), nrm, [col[0] * k, col[1] * k, col[2] * k], V(lean * 2 * s, 1, 0).normalize(), 0.7 + 0.3 * s);
    }
    for (let i = 0; i < segs; i++) { const a = base + i * 2; b.i.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  };
  const gcol = () => { const t = R(); return [lerp(0.42, 0.72, t), lerp(0.62, 0.78, t), lerp(0.18, 0.26, t)]; };
  for (let i = 0; i < 17000; i++) {
    const z = 0.12 - Math.pow(R(), 1.9) * 5.5, x = lerp(-19.5, 19.5, R());
    if (TREES.some(T => Math.abs(x - T.x) < 0.75 * T.s && Math.abs(z - T.z) < 0.6) && R() < 0.8) continue;
    const front = ss((z + 1.2) / 1.3);
    blade(x, z, (0.08 + R() * 0.22) * (0.75 + front * 0.6), (R() - 0.5) * 0.7, gcol());
  }
  for (let i = 0; i < 1500; i++) {
    const z = -5.5 - R() * 10, x = lerp(-30, 30, R());
    const y = ss((-z - 7) / 30) * (1.4 + 2.2 * (vn2(x * 0.06, z * 0.05) - 0.3));
    const before = b.vc; blade(x, z, 0.15 + R() * 0.15, (R() - 0.5) * 0.6, gcol());
    for (let k = before; k < b.vc; k++) b.p[k * 3 + 1] += y;
  }
  add(b.geo(), mat({ id: 3, kind: 0, dir: 1, outline: 0.75, dens: 1.0, side: THREE.DoubleSide, wind: 1 }));
  // flowers: daisies + buttercups on stems
  const flower = (x, z, h, kind) => {
    blade(x, z, h, (R() - 0.5) * 0.15, [0.40, 0.58, 0.22]);
    const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.75 + (R() - 0.5) * 0.4, 0, (R() - 0.5) * 0.4));
    const pos = V(x, h, z + 0.04);
    if (kind === 0) {
      for (let k = 0; k < 11; k++) {
        const g = new THREE.CircleGeometry(1, 10); g.scale(0.044, 0.014, 1); g.translate(0.05, 0, 0); g.rotateZ(k / 11 * Math.PI * 2);
        g.rotateX(-Math.PI / 2);
        append(bfl, g, new THREE.Matrix4().compose(pos, tilt, V(1, 1, 1)), () => [0.97, 0.96, 0.92]);
      }
      const c = new THREE.SphereGeometry(0.028, 10, 6); append(bfl, c, new THREE.Matrix4().compose(pos.clone().add(V(0, 0.008, 0)), tilt, V(1, 0.5, 1)), () => [0.98, 0.78, 0.18]);
    } else {
      const c = new THREE.SphereGeometry(0.065, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
      append(bfl, c, new THREE.Matrix4().compose(pos, tilt.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI, 0, 0))), V(1, 0.8, 1)), () => [0.98, 0.84, 0.16]);
    }
  };
  const spots = [[-7.4, 0], [-6.2, -0.4], [-5.4, -0.1], [-4.6, -0.8], [-2.6, -0.2], [-1.9, -1.4], [1.6, -0.3], [1.9, -1.1], [4.6, -0.3], [5.5, -0.9], [6.8, -0.2], [7.7, -0.7], [-3.4, -2.2], [1.2, -2.6], [5.0, -2.4], [-6.8, -1.7]];
  for (const [x, z] of [...spots, ...spots.map(([a, c]) => [a + 17.5, c]), ...spots.map(([a, c]) => [a - 12.5, c])].filter(([a]) => Math.abs(a) < 19.5)) for (let k = 0; k < 5; k++) flower(x + (R() - 0.5) * 0.9, z + (R() - 0.5) * 0.6, 0.24 + R() * 0.34, R() < 0.55 ? 0 : 1);
  add(bfl.geo(), mat({ id: 17, kind: 0, dir: 2, angle: 0.3, outline: 0.9, dens: 0.9, side: THREE.DoubleSide, wind: 1 }));
  // fallen leaves on the ground and in the litter strip
  for (let i = 0; i < 420; i++) {
    const onFace = i < 220;
    const x = onFace ? lerp(-19.5, 19.5, R()) : TX + (R() - 0.5) * 9, z = onFace ? 0.03 : -R() * 2.5;
    const y = onFace ? lerp(-0.13, -0.02, R()) : 0.012;
    const g = new THREE.CircleGeometry(1, 9); g.scale(0.09, 0.045, 1);
    const q = onFace ? new THREE.Quaternion().setFromEuler(new THREE.Euler((R() - 0.5) * 0.6, (R() - 0.5) * 0.6, R() * 3)) : new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + (R() - 0.5) * 0.5, 0, R() * 6));
    const t = R(), col = t < 0.4 ? [0.78, 0.48, 0.20] : t < 0.75 ? [0.62, 0.38, 0.18] : [0.80, 0.66, 0.30];
    bl.rv = onFace ? soilRev(x, y) + 0.12 : -100;
    append(bl, g, new THREE.Matrix4().compose(V(x, y, z), q, V(1, 1, 1)), () => col);
  }
  add(bl.geo(), mat({ id: 18, kind: 0, dir: 2, angle: 1.0, outline: 0.85, dens: 1.0, side: THREE.DoubleSide, disc: 1 }));
}

// ---------------------------------------------------------------- G-buffer targets
const IW = W * SS, IH = H * SS;
const mkRT = (type, filter) => new THREE.WebGLRenderTarget(IW, IH, { type, minFilter: filter, magFilter: filter, depthBuffer: true, generateMipmaps: false });
const rtA = mkRT(THREE.HalfFloatType, THREE.NearestFilter), rtL = mkRT(THREE.HalfFloatType, THREE.NearestFilter), rtD = mkRT(THREE.HalfFloatType, THREE.NearestFilter);
const rtR = mkRT(THREE.FloatType, THREE.NearestFilter);      // anchor pixel (full float: values up to ~3000 px) + reveal time
const rtP1 = mkRT(THREE.UnsignedByteType, THREE.LinearFilter), rtP2 = mkRT(THREE.UnsignedByteType, THREE.LinearFilter), rtC = mkRT(THREE.UnsignedByteType, THREE.LinearFilter);
const camera = new THREE.PerspectiveCamera(34, W / H, 0.02, 400);
const refCam = new THREE.PerspectiveCamera(34, W / H, 0.02, 400);
const PITCH = -0.06;                          // fixed orientation everywhere: inside a shot the camera only translates (strokes stay anchored)
const CQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(PITCH, 0, 0, 'YXZ'));
const TANP = Math.tan(-PITCH);

// ---------------------------------------------------------------- shots
const SHOTS = [
  [0.0, 'S1', 'the meadow: the question'], [TL.descend[0], 'S2', 'crane down, the soil coloured in, roots grow'],
  [TL.pop, 'S3', 'magnifier opens on a root tip; focus root → fungus'], [TL.truck[0], 'S4', 'follow the sugar along the fungus; water comes back'],
  [TL.truck[1], 'S5', 'the next tree; the open question'], [TL.irisIn[0], 'S6', 'magnifier closes; pull back over the whole wood, the network drawn in'],
  [TL.end, 'end', ''],
];
// a camera "view" = position (fixed orientation) + reference position for anchoring + focus map + redraw
const keys = (K, t) => {                      // [t, x, y, z, ease]
  if (t <= K[0][0]) return V(K[0][1], K[0][2], K[0][3]);
  for (let i = 1; i < K.length; i++) { const a = K[i - 1], b = K[i]; if (t <= b[0]) { let k = (t - a[0]) / (b[0] - a[0]); if (b[4]) k = ease5(k); return V(lerp(a[1], b[1], k), lerp(a[2], b[2], k), lerp(a[3], b[3], k)); } }
  const l = K[K.length - 1]; return V(l[1], l[2], l[3]);
};
const ease5 = k => k * k * k * (k * (k * 6 - 15) + 10);
const KW1 = [[0, -1.62, 2.36, 10.6, 0], [TL.descend[0], -1.38, 2.22, 9.95, 0], [TL.descend[1], 1.5, -1.45, 7.6, 1], [TL.pop + 1, 1.56, -1.5, 7.55, 0]];
const REF1 = V(0.0, 0.4, 8.8);
const ZC = 2.56, DC = ZC - 0.26, PXC = H / (2 * DC * Math.tan(17 * Math.PI / 180));   // close camera: 2.3 units from the hero plane
const camFor = (cx, cy, z = ZC) => V(cx, cy + (z - 0.26) * TANP, z);                    // camera that centres world point (cx, cy) on the hero plane
const S3C = [3.3, -1.45];
const S5C = [HERO.B.tip.x - 0.1, HERO.B.tip.y + 0.12];
const REF2 = camFor(4.2, -1.6);
const KW3 = [[TL.irisIn[0] - 0.01, 1.3, 1.7, 20.0, 0], [TL.irisIn[1], 1.3, 1.7, 20.0, 0], [46.2, 1.5, 3.1, 26.0, 1], [TL.end, 1.5, 3.12, 26.1, 0]];
const REF3 = V(1.4, 2.4, 23.0);
const sugar = HERO.paths[0];
function sugarX(t) {                          // where the sugar drop is (x on the bundle) — the follow shot tracks it
  const g = GRAINS[0], k = clamp((t - g.t0) / (TL.absorb - g.t0), 0, 1);
  return pathAt(sugar, lerp(g.u0, g.u1, k * k * (3 - 2 * k) * 0.5 + k * 0.5)).x;
}
function closeCentre(t) {
  if (t < TL.truck[0]) { const k = clamp((t - TL.popEnd) / (TL.truck[0] - TL.popEnd), 0, 1); return [S3C[0] + 0.08 * k, S3C[1] - 0.02 * k]; }
  const fx = sugarX(Math.max(TL.sugar, t - 0.5)) + 0.22, f0 = S3C[0] + 0.08;
  const kin = ease5(clamp((t - TL.truck[0]) / 1.2, 0, 1));
  let x = lerp(f0, Math.max(f0, fx), kin), y = lerp(S3C[1] - 0.02, -1.62, clamp((t - TL.truck[0]) / 6, 0, 1));
  const kout = ease5(clamp((t - TL.absorb) / (TL.truck[1] - TL.absorb), 0, 1));
  const xa = sugarX(TL.absorb - 0.5) + 0.22;
  if (t > TL.absorb) { x = lerp(xa, S5C[0], kout); y = lerp(-1.62, S5C[1], kout); }
  if (t > TL.truck[1]) { const k = clamp((t - TL.truck[1]) / 8, 0, 1); x = S5C[0] + 0.05 * k; y = S5C[1] - 0.02 * k; }
  return [x, y];
}
// focus: how fully each kind of thing is drawn (1 = all four pencil layers + firm line, 0.3 = a light wash in the background)
const FOCUS_ALL = {};
function focusClose(t) {
  const f = { 6: 0.85, 7: 0.85, 8: 0.85, 9: 0.85, 10: 0.85, 13: 0.75 };
  const k = ease5(clamp((t - TL.focus[0]) / (TL.focus[1] - TL.focus[0]), 0, 1));
  const kb = ease5(clamp((t - TL.truck[1] + 0.6) / 1.2, 0, 1));
  f[22] = lerp(1, 0.45, k) + 0.4 * kb; f[23] = lerp(0.45, 1, k);
  return f;
}
function views(t) {
  // returns { main, inset?, iris? } ; iris = { cx, cy, r, inner: bool, ring: 0..1 drawn, ringA: alpha }
  // the magnified view draws only what this part of the story is about: the two hero roots, their fungus, soil and stones
  const close = (c, redraw) => ({ pos: camFor(c[0], c[1]), ref: REF2, focus: focusClose(t), redraw, hide: [11, 21, 12, 15, 26] });
  if (t < TL.circle) return { main: { pos: keys(KW1, t), ref: REF1, focus: FOCUS_ALL } };
  if (t < TL.pop) {
    const w = { pos: keys(KW1, t), ref: REF1, focus: FOCUS_ALL };
    setCamera(w); const c = proj(HERO.A.tip);
    return { main: w, iris: { cx: c[0], cy: c[1], r: 92, inner: false, ring: ease5(clamp((t - TL.circle) / 0.45, 0, 1)), ringA: 1 } };
  }
  if (t < TL.popEnd + 0.01) {
    const w = { pos: keys(KW1, t), ref: REF1, focus: FOCUS_ALL };
    setCamera(w); const c0 = proj(HERO.A.tip);
    const k = ease5(clamp((t - TL.pop) / (TL.popEnd - TL.pop), 0, 1));
    const tgt = [960 + (HERO.A.tip.x - S3C[0]) * PXC, 540 - (HERO.A.tip.y - S3C[1]) * PXC];
    const cx = lerp(c0[0], tgt[0], k), cy = lerp(c0[1], tgt[1], k), r = lerp(92, 2300, k * k);
    const cc = [HERO.A.tip.x - (cx - 960) / PXC, HERO.A.tip.y + (cy - 540) / PXC];
    return { main: w, inset: close(cc, { t: TL.pop - 0.05, cx, cy, k: 0.0011 }), iris: { cx, cy, r, inner: true, ring: 1, ringA: 1 - ss((k - 0.45) / 0.4) } };
  }
  if (t < TL.irisIn[0]) return { main: close(closeCentre(t), { t: TL.pop - 0.05, cx: 960 + (HERO.A.tip.x - S3C[0]) * PXC, cy: 540 - (HERO.A.tip.y - S3C[1]) * PXC, k: 0.0011 }) };
  // the wood: once the network starts spreading, focus moves off the roots and onto the fungus
  const kn = ease5(clamp((t - TL.net[0] - 0.4) / 1.6, 0, 1));
  const wide = { pos: keys(KW3, t), ref: REF3, focus: { 11: 1 - 0.42 * kn, 21: 1 - 0.5 * kn, 12: 1 - 0.3 * kn } };
  if (t < TL.irisIn[1] + 0.6) {
    setCamera(wide); const cw = proj(HERO.B.tip);
    const c5 = closeCentre(TL.irisIn[0]);
    const cs = [960 + (HERO.B.tip.x - c5[0]) * PXC, 540 - (HERO.B.tip.y - c5[1]) * PXC];
    const k = ease5(clamp((t - TL.irisIn[0]) / (TL.irisIn[1] - TL.irisIn[0]), 0, 1));
    const cx = lerp(cs[0], cw[0], k), cy = lerp(cs[1], cw[1], k), r = lerp(2300, 64, Math.sqrt(k));
    const cc = [HERO.B.tip.x - (cx - 960) / PXC, HERO.B.tip.y + (cy - 540) / PXC];
    const inner = t < TL.irisIn[1];
    return { main: wide, inset: inner ? close(cc, null) : null, iris: { cx, cy, r, inner, ring: 1, ringA: inner ? ss((k - 0.3) / 0.4) : 1 - clamp((t - TL.irisIn[1]) / 0.55, 0, 1) } };
  }
  return { main: wide };
}
function setCamera(v) {
  camera.position.copy(v.pos); camera.quaternion.copy(CQ); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
  refCam.position.copy(v.ref); refCam.quaternion.copy(CQ); refCam.updateMatrixWorld(); refCam.updateProjectionMatrix();
  SHARED.uRefVP.value.multiplyMatrices(refCam.projectionMatrix, refCam.matrixWorldInverse);
}
const proj = (v, cam = camera) => { const p = v.clone().project(cam); return [(p.x * 0.5 + 0.5) * W, (0.5 - p.y * 0.5) * H]; };
const camPos = t => views(t).main.pos;

// ---------------------------------------------------------------- overlay canvases: paper (tags, slips), graphite, coloured pencil
const tagC = document.createElement('canvas'), inkC = document.createElement('canvas'), colC = document.createElement('canvas'), OC = document.createElement('canvas');
for (const c of [tagC, inkC, colC, OC]) { c.width = W; c.height = H; }
const tg = tagC.getContext('2d'), ik = inkC.getContext('2d'), cl = colC.getContext('2d'), octx = OC.getContext('2d');
const tagT = new THREE.CanvasTexture(tagC), inkT = new THREE.CanvasTexture(inkC), colT = new THREE.CanvasTexture(colC);
const FONT = 'WK';
let GLY = null, BOIL = 0;
const hsh = (a, b = 0, c = 0) => h2(a * 1.731 + c * 0.377, b * 2.113 + c * 1.913);
const plen = P => { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return L; };
function textLayout(s, size, seed, o = {}) {
  const { jit = 1 } = o;
  ik.save(); ik.font = `${size}px ${FONT}`;
  const ch = [...s], ws = ch.map(c => ik.measureText(c).width); ik.restore();
  const R = mulberry(seed), rr = () => R() * 2 - 1;
  let cx = 0, L = 0; const chars = [], G = GLY.WK;
  ch.forEach((c, i) => {
    const dy = rr() * jit * size * 0.025, r = rr() * jit * 0.035;
    const sk = (G.g[c] || []).map(a => { const P = []; for (let j = 0; j < a.length; j += 2) P.push([a[j] * size, a[j + 1] * size]); return P; });
    const len = sk.map(plen).reduce((a, b) => a + b, 0) + sk.length * size * 0.12;
    chars.push({ c, ox: cx, dy, r, sk, len, L0: L }); L += len; cx += ws[i];
  });
  return { s, size, chars, L, hw: G.hw * size, tot: cx };
}
function textDraw(T, x, y, prog, alpha = 1) {   // write T at (x, y) (left, baseline) along its glyph skeletons up to prog
  const target = prog * T.L; if (target <= 0) return;
  ik.save(); ik.translate(x, y); ik.globalAlpha = alpha;
  ik.font = `${T.size}px ${FONT}`; ik.fillStyle = '#000'; ik.textBaseline = 'alphabetic';
  for (const C of T.chars) {
    if (C.L0 >= target) break;
    const part = target - C.L0;
    ik.save(); ik.translate(C.ox, C.dy); ik.rotate(C.r);
    if (part >= C.len || !C.sk.length) { ik.fillText(C.c, 0, 0); ik.restore(); continue; }
    const m = ik.getTransform();
    octx.setTransform(1, 0, 0, 1, 0, 0); octx.clearRect(0, 0, W, H);
    octx.setTransform(m); octx.font = ik.font; octx.fillStyle = '#000'; octx.textBaseline = 'alphabetic';
    octx.fillText(C.c, 0, 0);
    octx.globalCompositeOperation = 'destination-in'; octx.lineCap = 'round'; octx.lineJoin = 'round'; octx.lineWidth = T.hw * 2.9 + 1.5; octx.strokeStyle = '#000';
    let left = part; octx.beginPath();
    for (let k = 0; k < C.sk.length && left > 0; k++) {
      const P = C.sk[k]; octx.moveTo(P[0][0], P[0][1]); if (P.length === 1) octx.lineTo(P[0][0] + 0.1, P[0][1]);
      for (let j = 1; j < P.length && left > 0; j++) {
        const d = Math.hypot(P[j][0] - P[j - 1][0], P[j][1] - P[j - 1][1]);
        if (d <= left) { octx.lineTo(P[j][0], P[j][1]); left -= d; }
        else { const u = left / d; octx.lineTo(P[j - 1][0] + (P[j][0] - P[j - 1][0]) * u, P[j - 1][1] + (P[j][1] - P[j - 1][1]) * u); left = 0; }
      }
      left -= T.size * 0.12;
    }
    octx.stroke(); octx.globalCompositeOperation = 'source-over';
    ik.restore(); ik.save(); ik.setTransform(1, 0, 0, 1, 0, 0); ik.globalAlpha = alpha; ik.drawImage(OC, 0, 0); ik.restore();
  }
  ik.restore();
}
// a pencil line: fixed jitter per point (seeded) + a small boil (3 drawings); drawn up to prog of its length
function pline(c, pts, prog, w, seed, alpha = 1, col = '#000', dash = null) {
  if (prog <= 0 || pts.length < 2) return;
  const L = plen(pts);
  for (let pass = 0; pass < 2; pass++) {
    c.save(); c.globalAlpha = alpha * (pass ? 0.8 : 1); c.strokeStyle = col; c.lineWidth = w * (pass ? 0.65 : 1); c.lineCap = 'round'; c.lineJoin = 'round';
    if (dash) c.setLineDash(dash);
    c.beginPath(); let rem = prog * L;
    for (let i = 0; i < pts.length; i++) {
      const jx = (hsh(seed, i, pass) - 0.5) * 1.3 + (hsh(seed + 7, i, BOIL + 3 * pass) - 0.5) * 0.7;
      const jy = (hsh(seed + 3, i, pass) - 0.5) * 1.3 + (hsh(seed + 11, i, BOIL + 3 * pass) - 0.5) * 0.7;
      let [x, y] = pts[i];
      if (i) {
        const d = Math.hypot(x - pts[i - 1][0], y - pts[i - 1][1]);
        if (d > rem) { const u = rem / d; x = pts[i - 1][0] + (x - pts[i - 1][0]) * u; y = pts[i - 1][1] + (y - pts[i - 1][1]) * u; c.lineTo(x + jx, y + jy); break; }
        rem -= d; c.lineTo(x + jx, y + jy);
      } else c.moveTo(x + jx, y + jy);
    }
    c.stroke(); c.restore();
  }
}
const curve = (x0, y0, x1, y1, bend, n = 24) => {
  const pts = [], mx = (x0 + x1) / 2 - (y1 - y0) * bend, my = (y0 + y1) / 2 + (x1 - x0) * bend;
  for (let i = 0; i <= n; i++) { const s = i / n, a = (1 - s) * (1 - s), b = 2 * s * (1 - s), c = s * s; pts.push([a * x0 + b * mx + c * x1, a * y0 + b * my + c * y1]); }
  return pts;
};
const seg = (t, a, d) => clamp((t - a) / d, 0, 1);

// labels (few, on purpose): each knows its anchor, its times and how it leaves
const LAB = [], EVX = [], TXT = [];
function addTag({ id, en, zh, at, t0, t1, size = 30, align = 'left', seed }) {
  const TE = textLayout(en, size, seed), TZ = zh ? textLayout(zh, Math.round(size * 1.05), seed + 1) : null;
  const gap = 14, pad = 18, w = TE.tot + (TZ ? gap + TZ.tot : 0) + pad * 2, h = size + 24;
  const tLine = t0 + 0.06, dLine = 0.28, tEn = t0 + 0.2, dEn = 0.18 + en.length * 0.045, tZh = tEn + dEn + 0.04, dZh = zh ? 0.12 + [...zh].length * 0.13 : 0;
  const rot = (hsh(seed, 1) - 0.5) * 0.04;
  LAB.push({
    id, t0, t1, draw(t) {
      if (t < t0 || t > t1) return null;
      const [ax, ay] = at(t); const x = align === 'right' ? ax - w : ax, y = ay;
      const pop = seg(t, t0, 0.14) * (1 - seg(t, t1 - 0.25, 0.25)), sc = 0.9 + 0.1 * ease5(seg(t, t0, 0.14));
      for (const c of [tg, ik]) { c.save(); c.translate(x + w / 2, y); c.rotate(rot); c.scale(sc, sc); c.translate(-w / 2, 0); }
      tg.globalAlpha = pop; tg.fillStyle = '#fff'; tg.beginPath(); tg.roundRect(0, -h / 2, w, h, 6); tg.fill(); tg.globalAlpha = 1;
      pline(ik, [[0, -h / 2], [w, -h / 2 + 1], [w + 1, h / 2], [0, h / 2 - 1], [0, -h / 2]], seg(t, tLine, dLine), 1.5, seed + 5, 0.7 * pop);
      ik.restore(); tg.restore();
      ik.save(); ik.translate(x + w / 2, y); ik.rotate(rot); ik.translate(-w / 2, 0);
      textDraw(TE, pad, size * 0.36, seg(t, tEn, dEn), pop);
      if (TZ) textDraw(TZ, pad + TE.tot + gap, size * 0.38, seg(t, tZh, dZh), 0.85 * pop);
      ik.restore();
      return { x0: x, y0: y - h / 2, x1: x + w, y1: y + h / 2, text: en + (zh ? ' ' + zh : '') };
    },
  });
  EVX.push({ t: t0, type: 'tag', d: 0.05, at }, { t: tEn, type: 'write', d: dEn, at }, ...(TZ ? [{ t: tZh, type: 'write', d: dZh, at }] : []), { t: tLine, type: 'line', d: dLine, at });
}
function addLeader({ from, to, t0, t1, d = 0.3, bend = 0.25, seed, head = true }) {
  LAB.push({
    t0, t1, draw(t) {
      if (t < t0 || t > t1) return null;
      const a = 1 - seg(t, t1 - 0.25, 0.25);
      const [x0, y0] = from(t), [x1, y1] = to(t);
      const pts = curve(x0, y0, x1, y1, bend), k = seg(t, t0, d);
      tg.save(); tg.globalAlpha = 0.55 * a; pline(tg, pts, k, 9, seed + 1); tg.restore();
      pline(ik, pts, k, 2.8, seed, 0.9 * a);
      if (head && k >= 1) {
        const [ax, ay] = pts[pts.length - 4], an = Math.atan2(y1 - ay, x1 - ax), hl = seg(t, t0 + d, 0.08);
        pline(ik, [[x1 - Math.cos(an - 0.5) * 16, y1 - Math.sin(an - 0.5) * 16], [x1, y1], [x1 - Math.cos(an + 0.5) * 16, y1 - Math.sin(an + 0.5) * 16]], hl, 2.6, seed + 9, 0.9 * a);
      }
      return null;
    },
  });
  EVX.push({ t: t0, type: 'line', d: d + 0.08, at: to });
}
// subtitles: a paper slip, bottom left; Chinese line over the English one, both set straight (they are read, not drawn)
let SUBS = [];
function drawSubs(t) {
  for (const s of SUBS) {
    if (t < s.t0 || t > s.t1 + 0.2) continue;
    const a = seg(t, s.t0, 0.16) * (1 - seg(t, s.t1, 0.2)), wipe = ease5(seg(t, s.t0 + 0.05, 0.28));
    const x = 92, yb = H - 62;
    ik.save(); ik.font = `40px ${FONT}`; const wz = ik.measureText(s.zh).width; ik.font = `29px ${FONT}`; const we = ik.measureText(s.en).width; ik.restore();
    const w = Math.max(wz, we) + 52, h = 112, y = yb - h;
    tg.save(); tg.globalAlpha = 0.93 * a; tg.fillStyle = '#fff';
    tg.beginPath(); tg.moveTo(x, y + 4); tg.lineTo(x + w, y); tg.lineTo(x + w - 3, y + h); tg.lineTo(x + 3, y + h - 3); tg.closePath(); tg.fill(); tg.restore();
    pline(ik, [[x + 3, y + h - 3], [x + w - 3, y + h]], 1, 1.4, 900 + Math.round(s.t0 * 10), 0.5 * a);
    ik.save(); ik.beginPath(); ik.rect(x, y - 20, 26 + (w + 10) * wipe, h + 40); ik.clip();
    ik.globalAlpha = a; ik.fillStyle = '#000'; ik.textBaseline = 'alphabetic';
    ik.font = `40px ${FONT}`; ik.fillText(s.zh, x + 26, y + 50);
    ik.globalAlpha = 0.72 * a; ik.font = `29px ${FONT}`; ik.fillText(s.en, x + 26, y + 92);
    ik.restore();
  }
}

function buildLabels() {
  const vAt = t => setCamera(views(t).main);
  const P = (v, t) => { vAt(t); return proj(v); };
  // S3: HYPHAE — the threads round the root tip, once the focus has moved onto them
  const mA = HERO.A.P[Math.floor(HERO.A.P.length * 0.8)];
  addTag({ id: 'hyphae', en: 'HYPHAE', zh: '菌丝', at: t => { const p = P(mA, t); return [p[0] + 120, p[1] - 210]; }, t0: TL.hyTag, t1: TL.truck[0] + 0.6, size: 32, seed: 131 });
  addLeader({ from: t => { const p = P(mA, t); return [p[0] + 150, p[1] - 180]; }, to: t => { const p = P(mA, t); return [p[0] + 18, p[1] - 22]; }, t0: TL.hyTag + 0.75, t1: TL.truck[0] + 0.6, bend: 0.2, seed: 141 });
  // S4: SUGAR rides along above the drop; WATER + NUTRIENTS waits for the grains on their way back
  const sg = GRAINS[0].m.position;
  addTag({ id: 'sugar', en: 'SUGAR', zh: '糖', at: t => { placeGrains(t); const p = P(sg.clone(), t); return [p[0] - 190, p[1] - 150]; }, t0: TL.sugarTag, t1: TL.absorb - 0.2, size: 32, seed: 151 });
  addLeader({ from: t => { placeGrains(t); const p = P(sg.clone(), t); return [p[0] - 70, p[1] - 125]; }, to: t => { placeGrains(t); const p = P(sg.clone(), t); return [p[0] - 10, p[1] - 22]; }, t0: TL.sugarTag + 0.6, t1: TL.absorb - 0.2, bend: -0.2, seed: 161 });
  const wp = pathAt(HERO.paths[1], 0.5);
  addTag({ id: 'water', en: 'WATER + NUTRIENTS', zh: '水和养分', at: t => { const p = P(wp, t); return [p[0] + 70, p[1] - 230]; }, t0: TL.waterTag, t1: TL.truck[1] - 0.2, size: 30, seed: 171 });
  addLeader({ from: t => { const p = P(wp, t); return [p[0] + 100, p[1] - 205]; }, to: t => { const p = P(wp, t); return [p[0] + 8, p[1] - 30]; }, t0: TL.waterTag + 0.9, t1: TL.truck[1] - 0.2, bend: -0.15, seed: 181 });
  // S5: the open question — an amber dashed path from tree A's side into tree B's root, and a pencilled "?"
  const qa = pathAt(HERO.paths[0], 0.12), qb = HERO.B.P[Math.floor(HERO.B.P.length * 0.7)];
  const QM = textLayout('?', 170, 191, { jit: 0.3 });
  LAB.push({
    t0: TL.qArrow, t1: TL.irisIn[0] + 0.3, draw(t) {
      if (t < TL.qArrow || t > TL.irisIn[0] + 0.3) return null;
      const a = 1 - seg(t, TL.irisIn[0], 0.3);
      const A = P(qa, t), B = P(qb, t), pts = curve(A[0], A[1] - 40, B[0] - 10, B[1] - 26, -0.32, 40);
      pline(cl, pts, ease5(seg(t, TL.qArrow, 1.1)), 11, 201, a, 'rgb(226,128,24)', [26, 18]);
      const m = pts[20];
      textDraw(QM, m[0] - 40, m[1] - 46, seg(t, TL.qArrow + 1.0, 0.5), a);
      return { x0: m[0] - 26, y0: m[1] - 150, x1: m[0] + 40, y1: m[1] - 40, text: '?' };
    },
  });
  EVX.push({ t: TL.qArrow, type: 'color', d: 1.1, at: () => [1100, 0] }, { t: TL.qArrow + 1.0, type: 'write', d: 0.5, at: () => [1000, 0] });
  // end title, in the sky of the wide shot
  const TEN = textLayout('The Other Half', 88, 31, { jit: 0.6 }), TZH = textLayout('树的另一半', 48, 32, { jit: 0.6 });
  const tEn = TL.title, dEn = 1.05, tZh = tEn + 1.1, dZh = 0.6;
  LAB.push({
    id: 'title', t0: tEn, t1: TL.end, draw(t) {
      if (t < tEn) return null;
      const x = 104, y = 196;
      textDraw(TEN, x, y, seg(t, tEn, dEn));
      textDraw(TZH, x + 4, y + 70, seg(t, tZh, dZh), 0.85);
      ik.save(); ik.globalAlpha = 0.7; pline(ik, curve(x + 2, y + 96, x + TEN.tot * 0.98, y + 92, -0.02), seg(t, tZh + dZh, 0.3), 2.2, 77); ik.restore();
      return { x0: x, y0: y - 80, x1: x + TEN.tot, y1: y + 100, text: 'The Other Half 树的另一半' };
    },
  });
  EVX.push({ t: tEn, type: 'write', d: dEn, at: () => [300, 0] }, { t: tZh, type: 'write', d: dZh, at: () => [300, 0] }, { t: tZh + dZh, type: 'line', d: 0.3, at: () => [300, 0] });
  // end card, right side of the sky: the style's name, then the credit line — pencilled like the title
  const SE = textLayout('Colored-Pencil Science Illustration', 31, 401, { jit: 0.5 }), SZ = textLayout('彩铅科普插画', 31, 402, { jit: 0.5 });
  const SG = textLayout('LemoLab × Claude Opus 5.5', 30, 403, { jit: 0.4 });
  const tS = TL.sign, dS = 0.75, tSZ = tS + 0.8, dSZ = 0.4, tG = tSZ + 0.45, dG = 0.7;
  LAB.push({
    id: 'sign', t0: tS, t1: TL.end, draw(t) {
      if (t < tS) return null;
      const xr = W - 104, y = 132;
      textDraw(SE, xr - SE.tot, y, seg(t, tS, dS), 0.85);
      textDraw(SZ, xr - SZ.tot, y + 46, seg(t, tSZ, dSZ), 0.85);
      ik.save(); ik.globalAlpha = 0.55; pline(ik, [[xr - SE.tot * 0.55, y + 74], [xr, y + 72]], seg(t, tSZ + dSZ, 0.2), 1.6, 409); ik.restore();
      textDraw(SG, xr - SG.tot, y + 118, seg(t, tG, dG));
      return { x0: xr - SE.tot, y0: y - 34, x1: xr, y1: y + 126, text: 'Colored-Pencil Science Illustration 彩铅科普插画 LemoLab × Claude Opus 5.5' };
    },
  });
  EVX.push({ t: tS, type: 'write', d: dS, at: () => [1500, 0] }, { t: tSZ, type: 'write', d: dSZ, at: () => [1600, 0] }, { t: tG, type: 'write', d: dG, at: () => [1550, 0] });
}
function drawRing(ir) {
  if (!ir || ir.ringA <= 0.01) return;
  const n = 140, pts = [], pts2 = [];
  for (let i = 0; i <= n; i++) { const a = -Math.PI * 0.6 + i / n * Math.PI * 2; pts.push([ir.cx + Math.cos(a) * ir.r, ir.cy + Math.sin(a) * ir.r]); pts2.push([ir.cx + Math.cos(a + 0.05) * (ir.r + 7), ir.cy + Math.sin(a + 0.05) * (ir.r + 7)]); }
  tg.save(); tg.globalAlpha = 0.5 * ir.ringA; pline(tg, pts, ir.ring, 12, 301); tg.restore();
  pline(ik, pts, ir.ring, 3.2, 311, 0.95 * ir.ringA);
  pline(ik, pts2, ir.ring, 1.6, 321, 0.55 * ir.ringA);
}
function drawOverlay(t, ir) {
  for (const c of [tg, ik, cl]) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); }
  TXT.length = 0;
  for (const el of LAB) { const r = el.draw(t); if (r && r.x1 > 0 && r.x0 < W && r.y1 > 0 && r.y0 < H) TXT.push({ id: el.id || 'q', ...r }); }
  drawRing(ir);
  drawSubs(t);
  tagT.needsUpdate = true; inkT.needsUpdate = true; colT.needsUpdate = true;
}
const POST_FS = /* glsl */`
uniform sampler2D tA, tL, tD, tR, tFoc; uniform vec2 uRes, uRdC; uniform float uSS, uTime, uBoil, uRdT, uRdK;
varying vec2 vUv;
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
vec2 h22(vec2 p){ float n = h21(p); return vec2(n, h21(p+n*17.31+3.7)); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<4;i++){ s+=a*vn(p); p=p*2.03+17.1; a*=0.5; } return s; }
// paper tooth: fine grain + laid fibres + soft cockling
float tooth(vec2 p){
  float a = vn(p*0.68);
  vec2 q = mat2(0.94,-0.34,0.34,0.94)*p;
  float b = vn(q*vec2(0.11,0.85));
  float c = vn(p*0.23+3.1);
  return clamp(0.48*a + 0.3*b + 0.22*c, 0.0, 1.0);
}
float cov(float pr, float t){ return smoothstep(t-0.17, t+0.17, pr); }
float ramp(float e, float a, float b){ return clamp((e-a)/(b-a), 0.0, 1.0); }
// one pencil layer: patches of short parallel strokes, each patch slightly re-angled.
// amt (0..1) = how much of the layer has been drawn so far: each stroke has its own turn.
float hatch(vec2 p, float ang, float sp, float cs, float seed, float jit, float amt){
  if(amt <= 0.0) return 0.0;
  vec2 g = floor(p/cs); float acc = 0.0;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 c = g + vec2(float(i), float(j)); vec2 h = h22(c + seed*7.13);
    vec2 ctr = (c + 0.15 + 0.7*h)*cs;
    float a0 = ang + (h.x-0.5)*jit;
    vec2 d = vec2(cos(a0), sin(a0)), n = vec2(-d.y, d.x);
    vec2 q = p - ctr; float u = dot(q,d), v = dot(q,n);
    v += u*u*(h.y-0.5)*0.006;
    float w = 1.0 - smoothstep(cs*0.45, cs*0.92, length(q));
    float k = floor(v/sp), f = fract(v/sp);
    float r = h21(vec2(k, dot(c, vec2(7.0,13.0)) + seed));
    float r2 = h21(vec2(k*1.7 + seed, c.x - c.y*3.0));
    if(amt < 1.0){ float turn = h21(vec2(k*0.61 + seed*3.3, dot(c, vec2(3.1, 5.7)))); w *= step(turn, amt); }
    float L = cs*(0.75 + 0.7*r);
    float uu = u - (r2-0.5)*cs*0.7;
    float taper = smoothstep(-L*0.5, -L*0.5 + L*0.2, uu) * (1.0 - smoothstep(L*0.5 - L*0.3, L*0.5, uu));
    float hw = sp*(0.26 + 0.2*r2);
    float dd = abs(f-0.5)*sp;
    float prof = 1.0 - smoothstep(hw-0.55, hw+0.55, dd);
    float press = (0.72 + 0.28*r) * (0.85 + 0.15*sin(uu*0.08 + r*6.0));
    acc = max(acc, w*prof*taper*press);
  }
  return acc;
}
vec4 gA(vec2 uv){ return texture2D(tA, uv); }
void main(){
  vec2 p = gl_FragCoord.xy / uSS;              // output-pixel coordinates (y up), fixed to the screen
  vec4 A = gA(vUv), Lb = texture2D(tL, vUv), Db = texture2D(tD, vUv), Rb = texture2D(tR, vUv);
  float id = floor(A.a*255.0 + 0.5);
  vec3 alb = A.rgb; float light = Lb.r, vz = Lb.g;
  float ang = atan(Db.g*2.0-1.0, Db.r*2.0-1.0)*0.5;
  float ow = Db.b, dens = Db.a;
  float yN = vUv.y;
  vec2 pa = p; float ev = 100.0;                // anchor coords (strokes stick to surfaces) and time since this surface was drawn
  if(id > 0.5){ pa = Rb.rg; ev = uTime - Rb.b; }
  if(uRdT > -50.0) ev = min(ev, uTime - (uRdT + uRdK*length(p - uRdC)));   // a fresh drawing (the magnifier) spreads out from its centre
  float fo = texture2D(tFoc, vec2((id + 0.5)/32.0, 0.5)).r;            // focus: 1 = fully drawn, lower = a light wash behind
  // things that grow in (roots, worms, stones, hyphae, leaves) arrive already half coloured and finish fast,
  // so the growing tip never reads as a blank white stick on the soil
  if(id > 10.5 && id < 21.5 && id != 14.0 && id != 16.0 && id != 17.0 && id != 19.0) ev = ev*2.2 + 0.32;
  if(id < 0.5){                                 // sky: loose blue wash, clouds left as paper
    float cl = smoothstep(0.52, 0.72, fbm(p*vec2(0.0032, 0.008) + vec2(2.0, 5.0)));
    alb = mix(vec3(0.70,0.83,0.90), vec3(0.42,0.63,0.86), smoothstep(0.72, 1.0, yN));
    alb = mix(alb, vec3(0.97,0.96,0.93), cl*0.85);
    light = 0.93; ang = 0.32; ow = 0.0; dens = 0.85*(1.0 - cl*0.75); vz = 0.0;
  }
  float t = tooth(pa);
  alb = mix(mix(vec3(dot(alb, vec3(0.333))), alb, 0.6)*0.35 + vec3(0.62), alb, mix(0.25, 1.0, fo));
  dens *= mix(0.55, 1.0, fo);
  float lum = dot(alb, vec3(0.299, 0.587, 0.114));
  float dark = clamp(1.0 - light, 0.0, 1.0);
  float fog = smoothstep(22.0, 150.0, vz)*0.6;
  vec3 paper = vec3(0.972, 0.955, 0.918) * (0.965 + 0.035*fbm(p*0.006));
  alb = mix(alb, vec3(0.74, 0.82, 0.84), fog*0.35);
  dark *= 1.0 - fog*0.6;
  vec3 pig = clamp(sqrt(alb/paper), 0.0, 1.0);
  vec3 col = paper;
  float hi = smoothstep(0.78, 0.98, light);
  // how far each of the four layers has been drawn on this surface
  float r0 = ramp(ev, 0.0, 0.42), r1 = ramp(ev, 0.10, 0.62)*mix(0.6, 1.0, fo), r2 = ramp(ev, 0.30, 0.90)*fo, r3 = ramp(ev, 0.50, 1.15)*fo*fo;
  vec2 bq = mat2(0.8,-0.6,0.6,0.8)*pa;
  float g0 = smoothstep(0.0, 0.14, r0*1.2 - vn(bq*vec2(0.03, 0.11)));
  // L0 underlayer: soft side-of-the-lead fill
  float c0 = cov((0.52 + 0.28*(1.0-lum) - 0.22*hi) * dens * (1.0 - 0.25*fog), t) * g0;
  col *= mix(vec3(1.0), pig, c0);
  // L1 local colour, strokes along the hatch direction
  float h1 = hatch(pa, ang, 4.4, 40.0, 1.0, 0.55, r1);
  float c1 = cov(h1 * (0.82 + 0.4*(1.0-lum) - 0.25*hi) * dens * (1.0 - 0.35*fog), t*0.92);
  col *= mix(vec3(1.0), pig, c1);
  // L2 shading: cross strokes in a darker, cooler version of the colour
  vec3 sh = clamp(alb*alb*vec3(0.95, 0.92, 1.08) + vec3(0.0, 0.0, 0.03), 0.0, 1.0);
  float h2 = hatch(pa, ang + 1.0, 3.8, 34.0, 2.0, 0.6, r2);
  float c2 = cov(h2 * smoothstep(0.1, 0.6, dark) * 1.3 * dens, t);
  col *= mix(vec3(1.0), sqrt(sh), c2);
  // L3 deepest accents: sepia/indigo, a third angle
  float h3 = hatch(pa, ang - 0.55, 3.2, 26.0, 3.0, 0.4, r3);
  float c3 = cov(h3 * smoothstep(0.42, 0.85, dark) * 1.15 * dens, t*1.05);
  col *= mix(vec3(1.0), mix(vec3(0.46, 0.36, 0.34), vec3(0.36, 0.38, 0.5), 0.35), c3);

  // contour lines: id / depth / normal breaks, sampled through a wobble anchored to the surface,
  // plus a small boil (a new drawing every 2 frames, 3 drawings cycled)
  vec2 px = 1.0/uRes;
  vec2 bo = vec2(uBoil*3.7, uBoil*1.9);
  vec2 wob = (vec2(vn(pa*0.045), vn(pa*0.045 + 9.3)) - 0.5) * 2.0 + (vec2(vn(pa*0.07 + bo), vn(pa*0.07 + 5.1 + bo)) - 0.5) * 1.5;
  vec2 uv0 = vUv + wob*uSS*px;
  vec4 A0 = gA(uv0), L0 = texture2D(tL, uv0); float ow0 = texture2D(tD, uv0).b;
  float id0 = floor(A0.a*255.0 + 0.5);
  float e = 0.0;
  for(int k=0;k<4;k++){
    vec2 o = k==0 ? vec2(1,0) : k==1 ? vec2(-1,0) : k==2 ? vec2(0,1) : vec2(0,-1);
    vec2 uv1 = uv0 + o*1.25*uSS*px;
    vec4 A1 = gA(uv1), L1 = texture2D(tL, uv1); float ow1 = texture2D(tD, uv1).b;
    float id1 = floor(A1.a*255.0 + 0.5);
    float de = step(0.5, abs(id1 - id0));
    float z0 = max(L0.g, 1e-3), z1 = max(L1.g, 1e-3);
    if(id0 < 0.5) z0 = 400.0; if(id1 < 0.5) z1 = 400.0;
    de = max(de, smoothstep(0.012, 0.035, abs(z1 - z0)/min(z0, z1)));
    de = max(de, 0.6*smoothstep(0.35, 0.75, length(L1.ba - L0.ba)*2.0));
    float wgt = (z1 < z0) ? ow1 : ow0;     // the nearer surface owns the line
    e = max(e, de * wgt);
  }
  // lines appear with their surface; soil horizons are pencilled in faintly from the start
  float ev0 = id0 > 0.5 ? uTime - texture2D(tR, uv0).b : 100.0;
  if(uRdT > -50.0) ev0 = min(ev0, uTime - (uRdT + uRdK*length(p - uRdC)) + 0.1);
  float fo0 = texture2D(tFoc, vec2((id0 + 0.5)/32.0, 0.5)).r;
  float lg = smoothstep(0.0, 0.12, ramp(ev0, -0.05, 0.3)*1.15 - vn(pa*0.035 + 2.0));
  if(id0 > 5.5 && id0 < 10.5) lg = max(lg, 0.4);
  e *= lg * (1.0 - fog*0.55) * mix(0.3, 1.0, fo0);
  vec3 lineCol = mix(alb*0.32, vec3(0.20, 0.14, 0.11), 0.55);
  float lc = cov(e * (0.62 + 0.38*vn(pa*0.11 + 4.0)), t*0.72);
  col *= mix(vec3(1.0), lineCol, lc*0.82);

  float lu = dot(col, vec3(0.299, 0.587, 0.114));
  col = clamp(mix(vec3(lu), col, 1.12), 0.0, 1.0);
  gl_FragColor = vec4(col, 1.0);
}`;
const COMP_FS = /* glsl */`
uniform sampler2D tV1, tV2, tTag, tInk, tCol; uniform vec4 uIris; uniform vec2 uLabOff; uniform float uSS, uLabS;
varying vec2 vUv;
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
float tooth(vec2 p){
  float a = vn(p*0.68); vec2 q = mat2(0.94,-0.34,0.34,0.94)*p; float b = vn(q*vec2(0.11,0.85)); float c = vn(p*0.23+3.1);
  return clamp(0.48*a + 0.3*b + 0.22*c, 0.0, 1.0);
}
float cov(float pr, float t){ return smoothstep(t-0.17, t+0.17, pr); }
void main(){
  vec2 p = gl_FragCoord.xy / uSS;                         // output pixels, y up
  vec3 col = texture2D(tV1, vUv).rgb;
  if(uIris.w > 0.5){                                      // the magnifier: inside the ring, the other view
    vec2 c = vec2(uIris.x, ${H}.0 - uIris.y);
    float d = length(p - c);
    col = mix(texture2D(tV2, vUv).rgb, col, smoothstep(uIris.z - 0.8, uIris.z + 0.8, d));
  }
  vec2 pl = p*uLabS + uLabOff; float tl = tooth(pl);
  // coloured pencil (amber path), paper (tags, slips, halos), graphite (writing, lines)
  vec4 cc = texture2D(tCol, vUv);
  if(cc.a > 0.0) col *= mix(vec3(1.0), cc.rgb/max(cc.a, 1e-3), cc.a*(0.75 + 0.25*cov(0.85, tl)));
  float tag = texture2D(tTag, vUv).a, ink = texture2D(tInk, vUv).a;
  if(tag + ink > 0.0){
    vec3 tp = vec3(0.975, 0.95, 0.88) * (0.955 + 0.045*tl);
    col = mix(col, tp, tag);
    col *= mix(vec3(1.0), vec3(0.22, 0.17, 0.14), ink * (0.82 + 0.18*cov(0.8, tl*0.6)));
  }
  gl_FragColor = vec4(col, 1.0);
}`;
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
const qScene = new THREE.Scene(); qScene.add(quad);
const qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const QVS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const focData = new Float32Array(32 * 4), focTex = new THREE.DataTexture(focData, 32, 1, THREE.RGBAFormat, THREE.FloatType);
focTex.minFilter = focTex.magFilter = THREE.NearestFilter;
const postMat = new THREE.ShaderMaterial({
  vertexShader: QVS, fragmentShader: POST_FS,
  uniforms: { tA: { value: rtA.texture }, tL: { value: rtL.texture }, tD: { value: rtD.texture }, tR: { value: rtR.texture }, tFoc: { value: focTex },
    uRes: { value: new THREE.Vector2(IW, IH) }, uSS: { value: SS }, uTime: SHARED.uTime, uBoil: { value: 0 },
    uRdT: { value: -100 }, uRdC: { value: new THREE.Vector2() }, uRdK: { value: 0 } },
});
const compMat = new THREE.ShaderMaterial({
  vertexShader: QVS, fragmentShader: COMP_FS,
  uniforms: { tV1: { value: rtP1.texture }, tV2: { value: rtP2.texture }, tTag: { value: tagT }, tInk: { value: inkT }, tCol: { value: colT },
    uIris: { value: new THREE.Vector4() }, uLabOff: { value: new THREE.Vector2() }, uLabS: { value: 1 }, uSS: { value: SS } },
});
const downMat = new THREE.ShaderMaterial({
  vertexShader: QVS, uniforms: { tP: { value: rtC.texture }, uPx: { value: new THREE.Vector2(1 / IW, 1 / IH) } },
  fragmentShader: `uniform sampler2D tP; uniform vec2 uPx; varying vec2 vUv;
  void main(){ vec3 c = texture2D(tP, vUv).rgb*0.5 + 0.125*(texture2D(tP, vUv+vec2(uPx.x*1.5,0.)).rgb + texture2D(tP, vUv-vec2(uPx.x*1.5,0.)).rgb + texture2D(tP, vUv+vec2(0.,uPx.y*1.5)).rgb + texture2D(tP, vUv-vec2(0.,uPx.y*1.5)).rgb);
  gl_FragColor = vec4(c, 1.0); }`,
});

// ---------------------------------------------------------------- render
function pass(n, rt, clear) {
  SHARED.uPass.value = n;
  renderer.setRenderTarget(rt);
  renderer.setClearColor(new THREE.Color(clear[0], clear[1], clear[2]), clear[3]);
  renderer.clear(true, true, true);
  renderer.render(scene, camera);
}
function renderView(v, out) {
  setCamera(v);
  const hide = v.hide || [];
  for (const o of scene.children) if (!o.userData.grain) o.visible = !hide.includes(o.material.uniforms.uId.value);
  focData.fill(1); for (const [k, f] of Object.entries(v.focus || {})) focData[+k * 4] = f;
  focTex.needsUpdate = true;
  const rd = v.redraw; postMat.uniforms.uRdT.value = rd ? rd.t : -100;
  if (rd) { postMat.uniforms.uRdC.value.set(rd.cx, H - rd.cy); postMat.uniforms.uRdK.value = rd.k; }
  pass(0, rtA, [0, 0, 0, 0]);
  pass(1, rtL, [1, 400, 0.5, 0.5]);
  pass(2, rtD, [Math.cos(0.64) * 0.5 + 0.5, Math.sin(0.64) * 0.5 + 0.5, 0, 0.6]);
  pass(3, rtR, [0, 0, -100, 0]);
  const dbg = QS.get('dbg');
  if (dbg) { quad.material = downMat; downMat.uniforms.tP.value = [rtA, rtL, rtD, rtR][+dbg].texture; renderer.setRenderTarget(out); renderer.render(qScene, qCam); downMat.uniforms.tP.value = rtC.texture; return; }
  quad.material = postMat; renderer.setRenderTarget(out); renderer.render(qScene, qCam);
}
function labelTooth(v) {                      // paper tooth for overlay marks: the page plane seen by the reference vs the current camera
  setCamera(v);
  const P0 = V(camera.position.x, camera.position.y, 0.3), P1 = P0.clone().add(V(1, 1, 0));
  const a0 = P0.clone().project(refCam), b0 = P0.clone().project(camera), a1 = P1.clone().project(refCam), b1 = P1.clone().project(camera);
  const sc = (a1.x - a0.x) / (b1.x - b0.x);
  compMat.uniforms.uLabS.value = sc;
  compMat.uniforms.uLabOff.value.set((a0.x * 0.5 + 0.5) * W - sc * (b0.x * 0.5 + 0.5) * W, (a0.y * 0.5 + 0.5) * H - sc * (b0.y * 0.5 + 0.5) * H);
}
function renderFilm(t) {
  const f = Math.round(t * FPS); BOIL = Math.floor(f / 2) % 3;
  postMat.uniforms.uBoil.value = BOIL;
  const only = QS.get('only'); if (only) scene.children.forEach(o => o.visible = only.split(',').includes(String(o.material.uniforms.uId.value)));
  const tt = QS.get('all') ? 100 : t;
  SHARED.uTime.value = tt;
  SHARED.uWindT.value = Math.floor(t * 12) / 12;
  placeGrains(t);
  const vs = views(t);
  renderView(vs.main, rtP1);
  if (vs.inset) renderView(vs.inset, rtP2);
  const ir = vs.iris;
  compMat.uniforms.uIris.value.set(ir ? ir.cx : 0, ir ? ir.cy : 0, ir ? ir.r : 0, ir && ir.inner && vs.inset ? 1 : 0);
  drawOverlay(tt, ir);
  labelTooth(ir && ir.inner && ir.r > 900 ? vs.inset : vs.main);
  quad.material = compMat; renderer.setRenderTarget(rtC); renderer.render(qScene, qCam);
  quad.material = downMat; downMat.uniforms.tP.value = rtC.texture; renderer.setRenderTarget(null); renderer.render(qScene, qCam);
  setCamera(vs.main);
}
window.DUR = TO - FROM;
window.render = (tl) => renderFilm(FROM + tl);
window.TEXTS = (tl) => { renderFilm(FROM + tl); return TXT.map(x => ({ id: x.id, text: x.text, x0: x.x0, y0: x.y0, x1: x.x1, y1: x.y1 })); };
window.SHOTS = SHOTS; window.LAB = LAB;
(async () => {
  try { await document.fonts.load(`40px ${FONT}`, 'The Other Half 树的另一半'); } catch (e) { }
  GLY = await (await fetch('glyphs.json')).json();
  const VO = await (await fetch('voice/lines.json')).json(), DURS = await (await fetch('out/voice/dur.json')).json();
  const ZH = ['森林里的树，会互相喂食吗？', '如果有答案，就在这下面。', '树最细的根，裹着一层真菌，', '菌丝比头发还细得多。', '树用阳光做成的糖，付给真菌。',
    '真菌用土里的水和养分回报。', '同一片真菌，还能连到下一棵树。', '树会不会借它互相传递养分，科学家还在争论。', '但有一点很清楚：没有一棵树是独自长大的。'];
  SUBS = VO.map((l, i) => ({ id: l.id, t0: TL.v[i], t1: TL.v[i] + Math.max(1.8, DURS[l.id] + 0.6), en: l.text, zh: ZH[i], d: DURS[l.id] }));
  for (let i = 0; i + 1 < SUBS.length; i++) SUBS[i].t1 = Math.min(SUBS[i].t1, SUBS[i + 1].t0 - 0.05);
  buildLabels();
  // events for sound and subtitles (film seconds; made excerpt-relative below)
  const EV = [];
  const panAt = (t, at) => { const x = at(t)[0]; return clamp(x / W * 2 - 1, -1, 1); };
  for (const e of EVX) EV.push({ t: e.t, type: e.type, d: e.d, pan: +panAt(e.t + e.d / 2, e.at).toFixed(3) });
  for (const [k, r] of Object.entries(REV)) for (let i = 0; i < 4; i++)
    EV.push({ t: +(r[0] + r[1] * i / 4).toFixed(3), type: 'color', d: +(r[1] / 4 + 0.45).toFixed(3), pan: +(-0.7 + 1.4 * (i + 0.5) / 4).toFixed(3), layer: k });
  for (const c of ROOT.chains) if (c.level <= 1 && (c.tree === 'A' || c.tree === 'B')) EV.push({ t: +c.t0.toFixed(3), type: c.level ? 'root2' : 'root', d: +(c.t1 - c.t0).toFixed(3), pan: +clamp((c.pts[c.pts.length - 1].x - 1.5) / 5, -1, 1).toFixed(3) });
  EV.push({ t: TL.circle, type: 'line', d: 0.45, pan: 0.5 }, { t: TL.pop, type: 'pop', d: 0.1, pan: 0.4 }, { t: TL.pop, type: 'color', d: 1.3, pan: 0.2 }, { t: TL.pop + 0.2, type: 'color', d: 1.0, pan: -0.2 });
  EV.push({ t: TL.hyphae, type: 'myc', d: 2.6, pan: 0.2 }, { t: TL.bridge, type: 'myc', d: 1.6, pan: 0.5 });
  EV.push({ t: TL.sugar, type: 'sugar', d: 0.2, pan: 0 }, { t: TL.absorb, type: 'absorb', d: 0.4, pan: 0 });
  for (const g of GRAINS) if (g.kind === 'water') EV.push({ t: +(g.t0 + 1.2).toFixed(3), type: 'water', d: 0.2, pan: 0.3 });
  EV.push({ t: TL.irisIn[0], type: 'line', d: 0.8, pan: 0.1 }, { t: TL.irisIn[1], type: 'pop', d: 0.1, pan: 0.2 });
  for (const n of NET.threads) EV.push({ t: +n.t0.toFixed(3), type: 'myc', d: +Math.min(3, n.t1 - n.t0).toFixed(3), pan: +clamp(((n.x0 + n.x1) / 2 - 1.4) / 13, -1, 1).toFixed(3) });
  WORMS_T.forEach((t, i) => EV.push({ t, type: 'worm', d: 0.4, pan: [-0.8, -0.5, -0.9, 0.9][i] }));
  for (const s of SUBS) EV.push({ t: s.t0, type: 'vo', id: s.id, d: s.d }, { t: s.t0, type: 'sub', t1: s.t1, zh: s.zh, en: s.en });
  for (const s of SHOTS) EV.push({ t: s[0], type: 'shot', id: s[1] });
  for (let t = 0; t <= FILM; t += 0.1) { const v = views(t); EV.push({ t: +t.toFixed(2), type: 'cam', y: +v.main.pos.y.toFixed(4), z: +v.main.pos.z.toFixed(3), close: v.main.pos.z < 3 ? 1 : 0 }); }
  EV.sort((a, b) => a.t - b.t);
  window.FILMEV = EV;
  window.EV = EV.filter(e => e.t >= FROM - 2 && e.t < TO).map(e => ({ ...e, t: +(e.t - FROM).toFixed(4), ...(e.t1 != null ? { t1: +(e.t1 - FROM).toFixed(4) } : {}) }));
  renderFilm(FROM);
  window.READY = true;
})();
