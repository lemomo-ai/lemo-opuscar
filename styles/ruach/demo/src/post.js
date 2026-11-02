// From Paper-cut Lightbox (paper-lantern), Lemo-Opuscar, MIT. Ruach: film grain in the final pass, any frame size.
// Post-processing: each shot → (MSAA + depth) → physical depth of field → bloom → rtA/rtB; final composite: crossfade / grading / vignette / tone mapping / sRGB
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;
const cocShader = {
  uniforms: { tColor: { value: null }, tDepth: { value: null }, focus: { value: .5 }, aper: { value: 4 }, maxCoc: { value: 18 }, near: { value: .01 }, far: { value: 50 } },
  vertexShader: VS,
  fragmentShader: `
    #include <packing>
    varying vec2 vUv; uniform sampler2D tColor, tDepth; uniform float focus, aper, maxCoc, near, far;
    void main(){
      float z = -perspectiveDepthToViewZ(texture2D(tDepth, vUv).x, near, far);
      float c = clamp(aper * (1.0/focus - 1.0/z), -maxCoc, maxCoc);
      gl_FragColor = vec4(texture2D(tColor, vUv).rgb, c);
    }`
};
const gatherShader = {
  uniforms: { tIn: { value: null }, res: { value: new THREE.Vector2(1920, 1080) }, maxCoc: { value: 18 } },
  vertexShader: VS,
  fragmentShader: `
    varying vec2 vUv; uniform sampler2D tIn; uniform vec2 res; uniform float maxCoc;
    void main(){
      vec4 c0 = texture2D(tIn, vUv); float a0 = abs(c0.a);
      if (maxCoc < .5) { gl_FragColor = vec4(c0.rgb, 1.); return; }
      vec3 acc = c0.rgb / (a0*a0 + 1.); float wsum = 1. / (a0*a0 + 1.);
      const int N = 96;
      for (int i = 0; i < N; i++) {
        float r = maxCoc * sqrt((float(i) + .5) / float(N));
        float th = float(i) * 2.39996;
        vec4 s = texture2D(tIn, vUv + vec2(cos(th), sin(th)) * r / res);
        float sa = abs(s.a);
        if (s.a > c0.a) sa = min(sa, max(a0, 0.));
        float w = smoothstep(r - 1.5, r + .5, sa) / (sa*sa + 1.);
        acc += s.rgb * w; wsum += w;
      }
      gl_FragColor = vec4(acc / wsum, 1.);
    }`
};
const finalShader = {
  uniforms: {
    tA: { value: null }, tB: { value: null }, mixB: { value: 0 }, mode: { value: 0 }, center: { value: new THREE.Vector2(.5, .5) }, aspect: { value: 16 / 9 },
    grain: { value: .025 }, res: { value: new THREE.Vector2(1920, 1080) }, expo: { value: 1 }, fade: { value: 1 }, vig: { value: .35 }, sat: { value: 1 }, contrast: { value: .1 },
    lift: { value: new THREE.Vector3(.0, .005, .018) }, gain: { value: new THREE.Vector3(1.03, 1., .95) }, time: { value: 0 },
  },
  vertexShader: VS,
  fragmentShader: `
    varying vec2 vUv; uniform sampler2D tA, tB; uniform float grain; uniform vec2 res; uniform float mixB, mode, aspect, expo, fade, vig, sat, contrast, time; uniform vec2 center; uniform vec3 lift, gain;
    vec3 neutral(vec3 color){
      const float S = 0.76; const float D = 0.15;
      float x = min(color.r, min(color.g, color.b)); float off = x < 0.08 ? x - 6.25 * x * x : 0.04; color -= off;
      float peak = max(color.r, max(color.g, color.b)); if (peak < S) return color;
      float d = 1. - S; float np = 1. - d * d / (peak + d - S); color *= np / peak;
      float g = 1. - 1. / (D * (peak - np) + 1.); return mix(color, vec3(np), g);
    }
    vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1./2.4)) - .055, step(.0031308, c)); }
    void main(){
      vec3 a = texture2D(tA, vUv).rgb;
      if (mixB > 0.) {
        vec3 b = texture2D(tB, vUv).rgb; float m = mixB;
        if (mode > .5) { vec2 d = vUv - center; d.x *= aspect; float r = length(d); m = smoothstep(mixB * 1.3 - .08, mixB * 1.3, r) ; m = 1. - m; }   // circular spread
        a = mix(a, b, m);
      }
      a *= expo;
      float l = dot(a, vec3(.2126, .7152, .0722)); a = mix(vec3(l), a, sat);
      a = a * (1. + contrast) / (1. + contrast * a / (a + .6));
      vec2 d = vUv - .5; d.x *= 1.25; a *= 1. - vig * smoothstep(.25, .85, length(d));
      a = neutral(a);
      a = a * gain + lift * (1. - a);
      a *= fade;
      vec3 o = toSRGB(clamp(a, 0., 1.));
      { vec2 p = floor(vUv * res); float n = fract(sin(dot(p + fract(time * 7.13) * 91.7, vec2(12.9898, 78.233))) * 43758.5453); o += (n - .5) * grain; }
      gl_FragColor = vec4(o, 1.);
    }`
};

export const GRADE0 = { grain: .025, expo: 1, fade: 1, vig: .35, sat: 1, contrast: .1, time: 0, lift: [0, .005, .018], gain: [1.03, 1, .95] };   // = finalShader initial values

export class Pipe {
  constructor(renderer, w, h, s = 2) {
    this.r = renderer; this.W = w * s; this.H = h * s; this.s = s;
    const W = this.W, H = this.H, hf = { type: THREE.HalfFloatType };
    this.rtS = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType, depthTexture: new THREE.DepthTexture(W, H, THREE.FloatType) });
    this.rtC = new THREE.WebGLRenderTarget(W, H, hf);
    this.rtA = new THREE.WebGLRenderTarget(W, H, hf);
    this.rtB = new THREE.WebGLRenderTarget(W, H, hf);
    this.coc = new FullScreenQuad(new THREE.ShaderMaterial(cocShader));
    this.gat = new FullScreenQuad(new THREE.ShaderMaterial(gatherShader)); this.gat.material.uniforms.res.value.set(W, H);
    this.fin = new FullScreenQuad(new THREE.ShaderMaterial(finalShader)); this.fin.material.uniforms.res.value.set(w, h); this.fin.material.uniforms.aspect.value = w / h;
    this.bloom = new UnrealBloomPass(new THREE.Vector2(W, H), .35, .6, 1.1);
  }
  // p: { focus, aper, maxCoc, bloom:{strength,radius,threshold} }
  shot(scene, cam, p, target) {
    const r = this.r, s = this.s;
    r.setRenderTarget(this.rtS); r.clear(); r.render(scene, cam);
    const u = this.coc.material.uniforms;
    u.tColor.value = this.rtS.texture; u.tDepth.value = this.rtS.depthTexture; u.focus.value = p.focus ?? .5; u.aper.value = (p.aper ?? 3) * s; u.maxCoc.value = (p.maxCoc ?? 16) * s;
    u.near.value = cam.near; u.far.value = cam.far;
    r.setRenderTarget(this.rtC); this.coc.render(r);
    const g = this.gat.material.uniforms; g.tIn.value = this.rtC.texture; g.maxCoc.value = (p.maxCoc ?? 16) * s;
    r.setRenderTarget(target); this.gat.render(r);
    const b = p.bloom || {};
    this.bloom.strength = b.strength ?? .35; this.bloom.radius = b.radius ?? .6; this.bloom.threshold = b.threshold ?? 1.1;
    if (this.bloom.strength > 0) this.bloom.render(r, null, target, 0, false);
  }
  final(o) {
    const u = this.fin.material.uniforms;
    u.tA.value = this.rtA.texture; u.tB.value = this.rtB.texture; u.mixB.value = o.mixB || 0; u.mode.value = o.mode || 0;
    if (o.center) u.center.value.set(o.center[0], o.center[1]);
    // Every frame starts from the defaults: any grading parameter a shot doesn't set returns to its default, never inherited from the previous shot and never dependent on where a worker started (otherwise the grade jumps at segment boundaries)
    for (const k of ['grain', 'expo', 'fade', 'vig', 'sat', 'contrast', 'time']) u[k].value = o[k] !== undefined ? o[k] : GRADE0[k];
    u.lift.value.set(...(o.lift || GRADE0.lift)); u.gain.value.set(...(o.gain || GRADE0.gain));
    this.r.setRenderTarget(null); this.fin.render(this.r);
  }
}
