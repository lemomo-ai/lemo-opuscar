// Render targets and full-screen passes: picture (HDR, depth), thermal (°C), sensor simulation, bloom, composite.
import * as THREE from 'three';
import { NOISE, IRON } from './glsl.js';

export const SENSOR = { w: 640, h: 360 };      // a 640 x 480 microbolometer, cropped to 16:9
export function makePost(renderer, W, H) {
  const rtPhoto = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
  rtPhoto.depthTexture = new THREE.DepthTexture(W, H); rtPhoto.depthTexture.type = THREE.FloatType;
  const TW = SENSOR.w * 3, TH = SENSOR.h * 3;
  const rtThermHi = new THREE.WebGLRenderTarget(TW, TH, { type: THREE.FloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  rtThermHi.depthTexture = new THREE.DepthTexture(TW, TH); rtThermHi.depthTexture.type = THREE.FloatType;
  const rtThermMS = rtThermHi;
  const rtSensor = new THREE.WebGLRenderTarget(SENSOR.w, SENSOR.h, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const bw = Math.round(W / 4), bh = Math.round(H / 4);
  const rtB = [0, 1, 2, 3].map(i => new THREE.WebGLRenderTarget(i < 2 ? bw : bw / 2, i < 2 ? bh : bh / 2, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }));
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadGeo = new THREE.PlaneGeometry(2, 2);
  const VS = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }';
  function pass(fs, uniforms) { const m = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: fs, uniforms, depthTest: false, depthWrite: false }); const s = new THREE.Scene(); s.add(new THREE.Mesh(quadGeo, m)); return { s, m }; }
  const run = (p, rt) => { renderer.setRenderTarget(rt); renderer.render(p.s, quadCam); };

  const copy = pass('uniform sampler2D tSrc; varying vec2 vUv; void main(){ gl_FragColor=texture2D(tSrc,vUv); }', { tSrc: { value: null } });
  // sensor: optics blur from the 2x render, integrate, add temporal noise, column fixed-pattern noise, row noise and lens shading
  const sensor = pass(NOISE + `
uniform sampler2D tHi; uniform vec2 uHiRes; uniform float uFrame, uNoise, uFreeze;
varying vec2 vUv;
void main(){
  vec2 px=vUv*uHiRes; float T=0., w=0.;
  for(int y=-3;y<=3;y++) for(int x=-3;x<=3;x++){ vec2 o=vec2(x,y); float k=exp(-dot(o,o)/7.); T+=texture2D(tHi,(px+o)/uHiRes).r*k; w+=k; }
  T/=w;
  vec2 sp=floor(vUv*vec2(${SENSOR.w}.,${SENSOR.h}.));
  float fr=uFrame;
  float n1=h21(sp+vec2(fr*17.31,fr*3.17))+h21(sp*1.7+vec2(fr*5.1,fr*11.9))-1.;
  float col=(h11(sp.x*.731+3.)-.5)*.10+(h11(floor(sp.x/8.)*1.37)-.5)*.05;
  float row=(h11(sp.y*.913+fr*.37)-.5)*.05;
  vec2 c=vUv-.5; float shade=-.35*dot(c,c)*2.;
  T+=uNoise*(n1*.11+col+row)+shade;
  gl_FragColor=vec4(T,0.,0.,1.);
}`, { tHi: { value: rtThermHi.texture }, uHiRes: { value: new THREE.Vector2(TW, TH) }, uFrame: { value: 0 }, uNoise: { value: 1 }, uFreeze: { value: 0 } });

  // bloom
  const bright = pass(`uniform sampler2D tSrc; uniform float uThr; varying vec2 vUv;
void main(){ vec3 s=vec3(0.); for(int y=0;y<2;y++) for(int x=0;x<2;x++) s+=texture2D(tSrc,vUv+(vec2(x,y)-.5)/vec2(${bw}.,${bh}.)).rgb; s/=4.;
  if(any(isnan(s))||any(isinf(s))) s=vec3(0.); s=min(s,vec3(60.)); float l=max(max(s.r,s.g),s.b); gl_FragColor=vec4(s*smoothstep(uThr,uThr*2.5,l),1.); }`, { tSrc: { value: rtPhoto.texture }, uThr: { value: 0.9 } });
  const blur = pass(`uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
void main(){ vec3 s=vec3(0.); float w=0.; for(int i=-6;i<=6;i++){ float k=exp(-float(i*i)/14.); s+=texture2D(tSrc,vUv+uDir*float(i)).rgb*k; w+=k; } gl_FragColor=vec4(s/w,1.); }`, { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } });

  const final = pass(NOISE + IRON + `
uniform sampler2D tPhoto, tDepth, tSensor, tB0, tB1, tTDepth; uniform vec2 uRes; uniform float uNear, uFar, uFocus, uAper, uFrame;
uniform float uLo, uHi, uIso, uIsoOn, uMsx, uExpo, uFlash, uSplitGlow, uDiv, uDde, uPhotoOnly, uThermOnly, uBloom;
uniform vec2 uA, uB;
varying vec2 vUv;
float lin(float d){ float z=d*2.-1.; return 2.*uNear*uFar/(uFar+uNear-z*(uFar-uNear)); }
float coc(vec2 uv){ float d=lin(texture2D(tDepth,uv).x); return clamp(uAper*abs(d-uFocus)/max(d,.01),0.,22.); }
vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
vec3 photo(vec2 uv){
  float c0=coc(uv); vec3 acc=vec3(0.); float ws=0.;
  if(c0<.6){ acc=texture2D(tPhoto,uv).rgb; if(any(isnan(acc))) acc=vec3(0.); ws=1.; }
  else for(int i=0;i<48;i++){
    float fi=float(i); float r=sqrt((fi+.5)/48.); float a=fi*2.39996;
    vec2 su=uv+vec2(cos(a),sin(a))*r*c0/uRes; float cs=coc(su);
    float w=(cs>=c0*r*.8)?1.:.12; vec3 c=texture2D(tPhoto,su).rgb; if(any(isnan(c))) c=vec3(0.); c=min(c,vec3(40.)); w*=1.+1.5*smoothstep(1.,3.,dot(c,vec3(.3,.6,.1)));
    acc+=c*w; ws+=w;
  }
  vec3 col=acc/ws;
  col+=(texture2D(tB0,uv).rgb*.6+texture2D(tB1,uv).rgb*.9)*uBloom;
  col*=uExpo;
  col=aces(col);
  col=pow(col,vec3(1./2.2));
  // night grade: cool shadows, warm highlights
  float l=dot(col,vec3(.3,.59,.11));
  col=mix(col*vec3(.92,.98,1.08), col*vec3(1.04,1.0,.94), smoothstep(.15,.7,l));
  float vig=smoothstep(1.3,.35,length((uv-.5)*vec2(1.,.8)));
  col*=mix(.72,1.,vig);
  return col;
}
// bicubic (Catmull-Rom) sample of the sensor
float sensorT(vec2 uv){
  vec2 res=vec2(${SENSOR.w}.,${SENSOR.h}.);
  vec2 p=uv*res-.5; vec2 i=floor(p), f=p-i;
  vec2 w0=f*(-.5+f*(1.-.5*f)), w1=1.+f*f*(-2.5+1.5*f), w2=f*(.5+f*(2.-1.5*f)), w3=f*f*(-.5+.5*f);
  float s=0.;
  for(int y=0;y<4;y++){ float wy= y==0?w0.y: y==1?w1.y: y==2?w2.y: w3.y;
    for(int x=0;x<4;x++){ float wx= x==0?w0.x: x==1?w1.x: x==2?w2.x: w3.x;
      s+=wx*wy*texture2D(tSensor,(i+vec2(float(x)-1.,float(y)-1.)+.5)/res).r; } }
  return s;
}
float ldT(vec2 uv){ return log(lin(texture2D(tTDepth,uv).x)); }
vec3 thermal(vec2 uv){
  float T=sensorT(uv);
  float Tb=0.; vec2 tp=1./vec2(${SENSOR.w}.,${SENSOR.h}.);
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++) Tb+=texture2D(tSensor,uv+vec2(x,y)*tp*1.5).r; Tb/=9.;
  T+=uDde*(T-Tb);
  float v=(T-uLo)/(uHi-uLo);
  vec2 e=2./vec2(${TW}.,${TH}.); float l0=ldT(uv);
  float hp=l0-.25*(ldT(uv+vec2(e.x,0.))+ldT(uv-vec2(e.x,0.))+ldT(uv+vec2(0.,e.y))+ldT(uv-vec2(0.,e.y)));
  v+=clamp(-hp*5.,-.06,.06)*uMsx;
  vec3 th=iron(v);
  if(uIsoOn>.5 && T>uIso){ float k=clamp((T-uIso)/6.,0.,1.); th=mix(vec3(.10,.78,.22),vec3(.72,1.,.55),k)*(.85+.15*v); }
  th*=mix(.88,1.,smoothstep(1.3,.4,length((uv-.5)*vec2(1.,.75))));
  return th;
}
void main(){
  vec2 uv=vUv; vec2 px=uv*uRes;
  vec2 d=normalize(uB-uA); vec2 n=vec2(d.y,-d.x); float side=dot(px-uA,n);
  float m=smoothstep(-.7,.7,side);
  if(uPhotoOnly>.5) m=0.; if(uThermOnly>.5) m=1.;
  vec3 col=vec3(0.);
  if(m<.999) col=photo(uv);
  if(m>.001) col=mix(col,thermal(uv),m);
  float line=(1.-smoothstep(1.,2.2,abs(side)))*(1.-uPhotoOnly)*(1.-uThermOnly);
  col=mix(col,vec3(1.),line*.92);
  col+=vec3(1.,.55,.2)*.10*uSplitGlow*exp(-max(side,0.)/26.)*step(0.,side)*(1.-uThermOnly);
  if(uDiv>0.){ float dv=1.-smoothstep(1.,2.4,abs(px.x-uDiv)); col=mix(col,vec3(1.),dv*.95); }
  col=mix(col,vec3(1.),uFlash);
  col+=(h21(px+uFrame*7.13)-.5)*.022;
  gl_FragColor=vec4(col,1.);
}`, {
    tPhoto: { value: rtPhoto.texture }, tDepth: { value: rtPhoto.depthTexture }, tSensor: { value: rtSensor.texture },
    tB0: { value: rtB[1].texture }, tB1: { value: rtB[3].texture }, tTDepth: { value: rtThermHi.depthTexture },
    uRes: { value: new THREE.Vector2(W, H) }, uNear: { value: .1 }, uFar: { value: 400 }, uFocus: { value: 20 }, uAper: { value: 0 }, uFrame: { value: 0 },
    uLo: { value: -10 }, uHi: { value: 8 }, uIso: { value: 8 }, uIsoOn: { value: 0 }, uMsx: { value: .5 }, uExpo: { value: 1 }, uFlash: { value: 0 }, uSplitGlow: { value: 0 },
    uDiv: { value: -1 }, uDde: { value: .55 }, uPhotoOnly: { value: 0 }, uThermOnly: { value: 0 }, uBloom: { value: 1 },
    uA: { value: new THREE.Vector2() }, uB: { value: new THREE.Vector2() },
  });

  const sbuf = new Float32Array(SENSOR.w * SENSOR.h * 4);
  return {
    rtPhoto, rtThermMS, rtThermHi, rtSensor, final, sensor, sbuf, TW, TH,
    // after the photo pass: bloom chain
    bloom() {
      bright.m.uniforms.tSrc.value = rtPhoto.texture; run(bright, rtB[0]);
      blur.m.uniforms.tSrc.value = rtB[0].texture; blur.m.uniforms.uDir.value.set(1 / bw, 0); run(blur, rtB[1]);
      blur.m.uniforms.tSrc.value = rtB[1].texture; blur.m.uniforms.uDir.value.set(0, 1 / bh); run(blur, rtB[0]);
      copy.m.uniforms.tSrc.value = rtB[0].texture; run(copy, rtB[1]);
      blur.m.uniforms.tSrc.value = rtB[1].texture; blur.m.uniforms.uDir.value.set(2 / (bw / 2), 0); run(blur, rtB[2]);
      blur.m.uniforms.tSrc.value = rtB[2].texture; blur.m.uniforms.uDir.value.set(0, 2 / (bh / 2)); run(blur, rtB[3]);
    },
    // after the thermal pass into rtThermMS: resolve, sensor, read back
    sense(frame, noise = 1) {
      sensor.m.uniforms.uFrame.value = frame; sensor.m.uniforms.uNoise.value = noise; run(sensor, rtSensor);
      renderer.readRenderTargetPixels(rtSensor, 0, 0, SENSOR.w, SENSOR.h, sbuf);
    },
    composite() { run(final, null); },
  };
}
