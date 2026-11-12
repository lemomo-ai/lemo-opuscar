// 1-bit pipeline: shading pass → G-buffer pass (normal, surface-anchored Bayer threshold, depth) → 1-bit pass
// (optional depth of field gathered from the shading, outlines from depth/normal breaks) → present (two 1-bit
// images can be mixed with an ordered "dither dissolve", inverted or flashed). Internal frame is always 960×540,
// drawn to the canvas with nearest-neighbour scaling.
import * as THREE from 'three';
export const RW = 960, RH = 540;
export const L_EDGE = 0, L_FLAT = 1, L_SCREEN = 2;   // 0: outlines; 1: sky, glows, sparkles (no outlines); 2: outlines, screen-locked threshold (large grazing planes: no octave rings)

export const BAYER = `
float bayer(vec2 p){
  int x=int(mod(p.x,8.)), y=int(mod(p.y,8.));
  int M[64] = int[64](0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21);
  return (float(M[y*8+x])+0.5)/64.;
}`;
const OCT = `
vec2 oct(vec3 n){ n /= (abs(n.x)+abs(n.y)+abs(n.z)); vec2 s = vec2(n.x>=0.?1.:-1., n.y>=0.?1.:-1.); vec2 p = n.z>=0. ? n.xy : (1.-abs(n.yx))*s; return p*0.5+0.5; }
vec3 unoct(vec2 e){ e=e*2.-1.; vec3 n=vec3(e, 1.-abs(e.x)-abs(e.y)); float t=clamp(-n.z,0.,1.); n.x += n.x>=0.?-t:t; n.y += n.y>=0.?-t:t; return normalize(n); }`;

// The threshold is computed from the OBJECT-space position (times the object's scale), projected on the dominant
// object-space axis, and the Bayer octave is picked from the screen footprint, so the pattern rides on the surface
// when the camera or the object moves, and never drifts across it.
function ndMaterial(flag, screen = 0) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { uFlag: { value: flag }, uDens: { value: 1 }, uScr: { value: screen } },
    vertexShader: `varying vec3 vAP; varying vec3 vAN; varying vec3 vWN; varying float vZ;
    void main(){ vec4 p=vec4(position,1.); vec3 n=normal;
    #ifdef USE_INSTANCING
      p=instanceMatrix*p; n=mat3(instanceMatrix)*n;
    #endif
      float sc = length(modelMatrix[0].xyz);
      vAP = p.xyz*sc; vAN = n;
      vec4 w = modelMatrix*p; vWN = normalize(mat3(modelMatrix)*n);
      vec4 mv = viewMatrix*w; vZ = -mv.z; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: BAYER + OCT + `
    uniform float uFlag, uDens, uScr; varying vec3 vAP; varying vec3 vAN; varying vec3 vWN; varying float vZ;
    void main(){
      vec3 n = normalize(vWN); if(!gl_FrontFacing) n=-n;
      vec3 a = abs(normalize(vAN));
      vec2 q = (a.x>a.y && a.x>a.z) ? vAP.zy : ((a.y>a.z) ? vAP.xz : vAP.xy);
      // per-axis octave: a cell is 1–2 screen pixels along each surface axis, even at grazing angles
      vec2 F = vec2(length(vec2(dFdx(q.x),dFdy(q.x))), length(vec2(dFdx(q.y),dFdy(q.y))));
      vec2 sk = log2(max(F*uDens, vec2(1e-9))); vec2 k = ceil(sk); vec2 u = smoothstep(0.15, 0.85, k - sk);
      float T00 = bayer(floor(q/exp2(k))), T10 = bayer(floor(q/exp2(k+vec2(1.,0.)))), T01 = bayer(floor(q/exp2(k+vec2(0.,1.)))), T11 = bayer(floor(q/exp2(k+1.)));
      float T = mix(mix(T11, T01, u.x), mix(T10, T00, u.x), u.y);
      if (uScr > 0.5) T = bayer(gl_FragCoord.xy);
      gl_FragColor = vec4(oct(n), T, vZ*uFlag);
    }`
  });
}

const QUAD_V = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }';

export class Pipe {
  constructor(renderer, w = RW, h = RH) {
    this.r = renderer; this.w = w; this.h = h;
    const o = { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter };
    this.rtS = new THREE.WebGLRenderTarget(w, h, { ...o, samples: 4 });
    this.rtND = new THREE.WebGLRenderTarget(w, h, o);
    this.ndEdge = ndMaterial(1); this.ndFlat = ndMaterial(-1); this.ndScr = ndMaterial(1, 1);
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        tS: { value: this.rtS.texture }, tND: { value: this.rtND.texture }, uR: { value: new THREE.Vector2(w, h) },
        uExp: { value: 1 }, uLo: { value: 0.12 }, uHi: { value: 0.88 }, uGam: { value: 1 / 2.2 }, uCell: { value: 1 },
        uEdge: { value: 1 }, uEdgeK: { value: 0.045 }, uLineLum: { value: 0.3 }, uFarEdge: { value: 400 },
        uFocus: { value: 1 }, uAp: { value: 0 }, uMaxCoc: { value: 10 }, uScreenT: { value: 0 },
      },
      vertexShader: QUAD_V,
      fragmentShader: BAYER + OCT + `
      uniform sampler2D tS, tND; uniform vec2 uR;
      uniform float uExp, uLo, uHi, uGam, uCell, uEdge, uEdgeK, uLineLum, uFarEdge, uFocus, uAp, uMaxCoc, uScreenT;
      varying vec2 vUv;
      vec4 nd(vec2 c){ return texture2D(tND, (c+0.5)/uR); }
      float sh(vec2 c){ return texture2D(tS, (c+0.5)/uR).r; }
      float coc(float z){ z = z <= 0.0 ? 1e5 : z; return min(uMaxCoc, uAp*abs(1.0/uFocus - 1.0/z)); }
      void main(){
        vec2 c = floor(vUv*uR);
        if (uCell > 1.5) c = floor(c/uCell)*uCell + floor(uCell*0.5);
        vec4 a = nd(c); float z = a.a; float zc = abs(z) < 1e-6 ? 1e5 : (z < 0.0 ? 1e5 : z);
        float lum = sh(c), cc = 0.0;
        if (uAp > 0.0) {
          cc = coc(z);
          // dilate: the largest blur radius around (so a blurred foreground spills over a sharp background)
          float R = cc;
          for (int i = 0; i < 8; i++) { float an = float(i)*0.785398; vec2 o = vec2(cos(an), sin(an))*uMaxCoc*0.7; R = max(R, min(coc(nd(c+o).a), length(o)+2.0)); }
          if (R > 0.75) {
            float sw = 1.0, sl = lum;
            for (int i = 0; i < 40; i++) {
              float fi = float(i)+0.5; float r = sqrt(fi/40.0)*R; float an = fi*2.39996;
              vec2 o = vec2(cos(an), sin(an))*r; vec2 p = c+o;
              float zi = nd(p).a; float zz = zi <= 0.0 ? 1e5 : zi;
              float ci = coc(zi);
              float ce = zz < zc ? ci : min(ci, cc);           // in front: its own blur reaches us; behind: limited by ours
              float w = clamp(ce - r + 1.0, 0.0, 1.0);
              sl += sh(p)*w; sw += w;
            }
            lum = sl/sw;
          }
        }
        float l = pow(clamp(lum*uExp, 0., 32.), uGam);
        l = smoothstep(uLo, uHi, l);
        float T = (uCell > 1.5 || uScreenT > 0.5) ? bayer(floor(c/max(uCell,1.0))) : a.b;
        float ink = l < T ? 1.0 : 0.0;
        if (uEdge > 0.5 && z > 0.0 && z < uFarEdge && cc < 1.2 && uCell < 1.5) {
          vec4 b1=nd(c+vec2(1,0)), b2=nd(c+vec2(0,1)), b3=nd(c-vec2(1,0)), b4=nd(c-vec2(0,1));
          float dz = max(max(abs(abs(b1.a)-z),abs(abs(b2.a)-z)),max(abs(abs(b3.a)-z),abs(abs(b4.a)-z)));
          vec3 n0 = unoct(a.rg);
          float dn = 1.0 - min(min(dot(n0, unoct(b1.rg)), dot(n0, unoct(b2.rg))), 1.0);
          if (dz > uEdgeK*z + 0.002 || dn > 0.5) ink = l > uLineLum ? 1.0 : 0.0;
        }
        gl_FragColor = vec4(ink, l, 0.0, 1.0);
      }`
    });
    this.fs = new THREE.Scene(); this.fs.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat));
    this.fc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }
  target() { return new THREE.WebGLRenderTarget(this.w, this.h, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter }); }
  // render one scene to a 1-bit target. o: {exp, lo, hi, gam, cell, edge, edgeK, lineLum, farEdge, focus, ap, maxCoc, dens, screenT}
  render(scene, camera, out, o = {}) {
    const r = this.r, U = this.mat.uniforms;
    camera.layers.set(L_EDGE); camera.layers.enable(L_FLAT); camera.layers.enable(L_SCREEN);
    r.setRenderTarget(this.rtS); r.setClearColor(o.clear ?? 0x000000, 1); r.clear(); r.render(scene, camera);
    const sm = r.shadowMap.enabled; r.shadowMap.enabled = false;
    r.setRenderTarget(this.rtND); r.setClearColor(new THREE.Color(0.5, 0.5, 0.5), -1); r.clear();
    this.ndEdge.uniforms.uDens.value = this.ndFlat.uniforms.uDens.value = this.ndScr.uniforms.uDens.value = o.dens ?? 1;
    camera.layers.set(L_EDGE); scene.overrideMaterial = this.ndEdge; r.render(scene, camera);
    r.autoClear = false; camera.layers.set(L_FLAT); scene.overrideMaterial = this.ndFlat; r.render(scene, camera);
    camera.layers.set(L_SCREEN); scene.overrideMaterial = this.ndScr; r.render(scene, camera);
    scene.overrideMaterial = null; r.autoClear = true; r.shadowMap.enabled = sm;
    camera.layers.set(L_EDGE); camera.layers.enable(L_FLAT); camera.layers.enable(L_SCREEN);
    U.uExp.value = o.exp ?? 1; U.uLo.value = o.lo ?? 0.12; U.uHi.value = o.hi ?? 0.88; U.uGam.value = o.gam ?? 1 / 2.2;
    U.uCell.value = o.cell ?? 1; U.uEdge.value = o.edge === false ? 0 : 1; U.uEdgeK.value = o.edgeK ?? 0.045;
    U.uLineLum.value = o.lineLum ?? 0.3; U.uFarEdge.value = o.farEdge ?? 400; U.uScreenT.value = o.screenT ? 1 : 0;
    U.uFocus.value = o.focus ?? 1; U.uAp.value = o.ap ?? 0; U.uMaxCoc.value = o.maxCoc ?? 10;
    r.setRenderTarget(out); r.render(this.fs, this.fc);
  }
}

// present: mix two 1-bit images (ordered dissolve, block dissolve, or a top-to-bottom fax scan; never a grey blend), invert, ink & paper colours
export class Present {
  constructor(renderer, ink, paper) {
    this.r = renderer;
    this.mat = new THREE.ShaderMaterial({
      uniforms: { tA: { value: null }, tB: { value: null }, uMix: { value: 0 }, uInv: { value: 0 }, uMode: { value: 0 }, uBlk: { value: 32 }, uR: { value: new THREE.Vector2(RW, RH) },
        uInk: { value: new THREE.Color(ink) }, uPaper: { value: new THREE.Color(paper) } },
      vertexShader: QUAD_V,
      fragmentShader: BAYER + `
      uniform sampler2D tA, tB; uniform float uMix, uInv, uMode, uBlk; uniform vec2 uR; uniform vec3 uInk, uPaper; varying vec2 vUv;
      float h21(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx+33.33); return fract((p.x+p.y)*p.x); }
      void main(){
        vec2 c = floor(vUv*uR);
        float ink = texture2D(tA,(c+0.5)/uR).r;
        if (uMix > 0.0) {
          float b = texture2D(tB,(c+0.5)/uR).r;
          if (uMode < 0.5) { if (bayer(c) < uMix) ink = b; }                       // 0: ordered dissolve (per pixel)
          else if (uMode < 1.5) { if (h21(floor(c/uBlk)) < uMix) ink = b; }          // 1: block dissolve, whole uBlk cells swap at once
          else {                                                                       // 2: fax scan, top to bottom, a 2-row scan head
            float row = uR.y - 1.0 - c.y, edge = uMix*(uR.y + 6.0);
            if (row < edge - 2.0) ink = b; else if (row < edge) ink = 1.0 - ink;
          }
        }
        if (uInv > 0.5) ink = 1.0 - ink;
        gl_FragColor = vec4(mix(uPaper, uInk, ink), 1.0);
      }`
    });
    this.s = new THREE.Scene(); this.s.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat));
    this.c = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }
  draw(a, b, mix, inv, mode = 0, blk = 32) {
    const U = this.mat.uniforms; U.tA.value = a.texture; U.tB.value = b ? b.texture : a.texture; U.uMix.value = mix || 0; U.uInv.value = inv ? 1 : 0;
    U.uMode.value = mode; U.uBlk.value = blk;
    this.r.setRenderTarget(null); this.r.render(this.s, this.c);
  }
}
