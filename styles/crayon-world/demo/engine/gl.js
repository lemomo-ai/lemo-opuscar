// WebGL2 compositor: paper -> crayon layers (wax sticks by a paper-tooth threshold) -> watercolour layer (resisted by wax) -> final pass (tooth emboss, vignette)
// Each crayon layer is a Canvas2D: RGB = crayon colour, A = pressure. The shader deposits wax where the pressure beats the depth of the tooth.
export const W = 1920, H = 1080;

const VS = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p*.5+.5; gl_Position = vec4(p,0,1); }`;

// Paper tooth: pixel coordinates -> height [0,1] (1 = a peak)
const TOOTH = `
float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),u.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x), u.y); }
uniform float uToothScale;
float toothRaw(vec2 px){
  px /= uToothScale;
  float n = vn(px/1.35)*.34 + vn(px/2.9+17.)*.33 + vn(px/6.3+41.)*.21;
  n += (vn(vec2(px.x/10., px.y/1.9)+7.)-.5)*.22;   // long thin grooves along the fibre (horizontal streaks)
  n += (vn(vec2(px.x/2.1, px.y/13.)+71.)-.5)*.08;
  return n;
}
float tooth(vec2 px){ return smoothstep(.16,.86,toothRaw(px)+.06); }
// The paper travels with the drawing: screen pixel -> paper coordinates (pans with the camera; on zoom two octaves cross-fade so the grain stays about 1 px on screen)
uniform vec3 uPC;
vec2 paperQ(vec2 uv, vec2 res){ vec2 sp = vec2(uv.x*res.x, (1.-uv.y)*res.y); return (sp - res*.5)/uPC.z + uPC.xy; }
float toothRawAt(vec2 uv, vec2 res, vec2 off){
  float L = log2(uPC.z); float k = floor(L), f = L - k;
  vec2 q = paperQ(uv, res);
  float a = toothRaw(q*exp2(k) + off), b = toothRaw(q*exp2(k+1.) + off + 37.1);
  return mix(a, b, smoothstep(0.,1.,f));
}
float toothAt(vec2 uv, vec2 res, vec2 off){ return smoothstep(.16,.86,toothRawAt(uv,res,off)+.06); }
`;

// Paper ground: low-frequency mottling
const FS_PAPER = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform vec3 uPaper; uniform vec2 uRes; uniform vec2 uPoff;
${TOOTH}
void main(){
  vec2 px = paperQ(uv, uRes) + uPoff;
  float m = vn(px/180.)*.6 + vn(px/60.+9.)*.4;
  vec3 c = uPaper * (0.975 + 0.035*m);
  o = vec4(c, 0.);
}`;

const FS_IMG = `#version 300 es
precision highp float; in vec2 uv; out vec4 o; uniform sampler2D uL;
void main(){ o = texture(uL, uv); }`;

// A captured drawing laid as a sheet in the world: screen pixel through uHi (inverse homography) -> [0,1]^2 on the sheet, outside discarded; edges antialiased by pixel width
const FS_QUAD = `#version 300 es
precision highp float; in vec2 uv; out vec4 o; uniform sampler2D uL; uniform mat3 uHi; uniform vec2 uRes;
void main(){
  vec3 q = uHi * vec3(uv.x*uRes.x, (1.-uv.y)*uRes.y, 1.);
  if (q.z <= 0.) discard;   // the half-plane behind the camera
  vec2 s = q.xy/q.z, e = min(s, 1.-s); float d = min(e.x, e.y);
  float a = smoothstep(0., fwidth(d)*1.2 + 1e-6, d);
  if (a <= 0.) discard;
  o = vec4(texture(uL, vec2(s.x, 1.-s.y)).rgb, a);
}`;

// Silhouette knock-out: the background behind a figure is kept as paper (a child draws the figure first, then colours around it)
const FS_KNOCK = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uL; uniform vec3 uPaper; uniform vec2 uRes; uniform vec2 uPoff;
${TOOTH}
void main(){
  float m = texture(uL, uv).a;
  if (m < .5) discard;
  vec2 px = paperQ(uv, uRes) + uPoff;
  float n = vn(px/180.)*.6 + vn(px/60.+9.)*.4;
  o = vec4(uPaper*(0.975+0.035*n), 0.);
}`;

// crayon layer
const FS_CRAYON = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uL; uniform vec2 uRes; uniform vec2 uGoff; uniform float uGain; uniform float uSoft;
${TOOTH}
void main(){
  vec4 L = texture(uL, uv);
  if (L.a < .003) { o = vec4(0); return; }
  float t = toothAt(uv, uRes, uGoff);
  float a = clamp(L.a*uGain, 0., 1.);
  // heavier pressure reaches deeper into the tooth
  float thr = 1.0 - a*1.22;
  float cov = smoothstep(thr - uSoft, thr + uSoft, t);
  cov *= smoothstep(0.0, 0.18, a);
  vec3 c = L.rgb * (1.0 - 0.10*a*a);   // heavy pressure: thicker wax, deeper colour
  o = vec4(c, cov);
}`;

// Watercolour layer: reads the previous pass (rgb + wax coverage a), multiplies by the wash's transmission; resisted where there is wax
const FS_WASH = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uPrev; uniform sampler2D uW; uniform vec2 uRes; uniform vec3 uT; uniform vec2 uGoff;
uniform float uResist; uniform float uEdge; uniform float uGran;
${TOOTH}
void main(){
  vec4 P = texture(uPrev, uv);
  vec4 Wc = texture(uW, uv);
  float d = Wc.a;
  vec2 px = uv*uRes;
  if (d > .002) {
    float blur = textureLod(uW, uv, 4.0).a;
    float blur2 = textureLod(uW, uv, 2.0).a;
    float edge = clamp(d - blur, 0., 1.)*uEdge + clamp(d - blur2, 0., 1.)*uEdge*.6;   // tide line: pigment piles up at the edge
    float t = smoothstep(.16,.86, toothRaw(paperQ(uv,uRes)*0.55 + uGoff + 300.) + .06);
    vec2 wq = paperQ(uv, uRes);
    float lo = vn(wq/160.)*.5 + vn(wq/55.+3.)*.3 + vn(wq/19.+8.)*.2;   // blooms (cauliflower-like density)
    float gr = smoothstep(.35, .05, t);   // granulation settles only in the deepest pits
    float dd = d * (0.82 + 0.3*lo) * (1.0 + uGran*.45*gr) + edge;
    float wax = P.a;
    float res = 1.0 - uResist*smoothstep(.12, .55, wax);   // wax resist
    dd = clamp(dd*res, 0., 1.25);
    vec3 tr = mix(vec3(1.), uT, clamp(dd,0.,1.));
    tr *= mix(1.0, 0.82, clamp(dd-1.0,0.,1.)*4.);
    o = vec4(P.rgb*tr, P.a);
  } else o = P;
}`;


// Wet: real water on the drawing (the paper is real and so is the water, so the water runs at 24 fps while the drawing changes at 12). Not used by this demo.
// Wet map uWet: R = where water has been, G = bead height (beads stay up on wax), B = fresh drops (soak quickly into paper)
// On paper: spreads, darkens, a tide line at the edge; on wax: wax resists, water beads up with refraction and highlights
const FS_WET = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uS; uniform sampler2D uWet; uniform vec2 uRes; uniform float uRun; uniform float uBead; uniform float uRefr; uniform float uCock; uniform float uDark;
${TOOTH}
float waxAt(vec2 q){ vec2 e = 3./uRes;
  return (texture(uS,q).a + texture(uS,q+vec2(e.x,0)).a + texture(uS,q-vec2(e.x,0)).a + texture(uS,q+vec2(0,e.y)).a + texture(uS,q-vec2(0,e.y)).a) / 5.; }
void main(){
  vec4 S = texture(uS, uv);
  vec3 L = normalize(vec3(-.5, .62, .6));   // light from the top left (uv y points up)
  float wx = smoothstep(.25, .6, waxAt(uv));
  float wb = 0.; for (int k = 0; k < 8; k++) { float a = float(k)*.785; wb += texture(uS, uv + vec2(cos(a), sin(a))*9./uRes).a; }
  float wxD = smoothstep(.12, .4, wb/8.);   // a big bead sees an area: the hatching has gaps, but the area is wax
  float reach = texture(uWet, uv).r;
  // big beads: height field -> normal
  vec2 ex = vec2(1.5/uRes.x, 0.), ey = vec2(0., 1.5/uRes.y);
  #define HD(q) max(textureLod(uWet, q, 1.).g*wxD, textureLod(uWet, q, 1.).b)
  float hd = HD(uv);
  vec2 gd = vec2(HD(uv+ex) - HD(uv-ex), HD(uv+ey) - HD(uv-ey));
  // small beads on wax: one per cell; a cell has a bead if its centre has water and wax
  vec2 cp = uv*uRes/uBead, ci = floor(cp), cf = fract(cp);
  float hb = 0.; vec3 nb = vec3(0, 0, 1);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 n = vec2(i, j), c = ci + n;
    vec2 ctr = n + .2 + .6*vec2(h21(c), h21(c + 17.7));
    float r = .14 + .3*h21(c + 5.3)*h21(c + 9.1) + .1*h21(c + 2.2);
    vec2 d = (cf - ctr)/r; float q = dot(d, d);
    if (q < 1. && h21(c + 3.1) < .78) {
      vec2 cuv = (ci + ctr)*uBead/uRes;
      if (texture(uWet, cuv).r > .4 && waxAt(cuv) > .45) {
        float h = sqrt(1. - q);
        if (h > hb) { hb = h; nb = normalize(vec3(d, h + .08)); }
      }
    }
  }
  float h; vec3 nm;
  if (hd > .02 && hd*1.2 > hb) { h = hd; nm = normalize(vec3(-gd*7., 1.)); } else { h = hb; nm = nb; }
  float body = smoothstep(0., .1, h);
  // cockling: wet paper bulges a little
  vec2 e5 = vec2(14./uRes.x, 0.), f5 = vec2(0., 14./uRes.y);
  vec2 cg = vec2(textureLod(uWet, uv+e5, 5.).r - textureLod(uWet, uv-e5, 5.).r, textureLod(uWet, uv+f5, 5.).r - textureLod(uWet, uv-f5, 5.).r);
  vec2 cockOff = cg*uCock*2./uRes;
  vec3 c = texture(uS, uv + cockOff).rgb;
  // seen through a bead: a convex lens, sample inward (magnified)
  if (body > 0.) c = mix(c, texture(uS, uv - nm.xy*h*uRefr/uRes).rgb, body);
  // water soaked into paper: colour bleeds downward (uRun), the paper darkens and saturates, a tide line at the edge
  float soak = reach*(1. - wx);
  if (uRun > 0. && soak > .01) {
    vec3 acc = vec3(0); float ws = 0.;
    for (int k = 1; k <= 8; k++) { vec2 q = uv + vec2(0., float(k)*4./uRes.y); float w = texture(uWet, q).r*(1. - float(k)/10.); acc += texture(uS, q).rgb*w; ws += w; }
    if (ws > 0.) c = mix(c, min(c, acc/ws*1.03), uRun*soak*.85);
  }
  float lum = dot(c, vec3(.3, .55, .15));
  c = mix(vec3(lum), c, 1. + .18*soak);
  c *= 1. - uDark*soak;
  c = mix(c, c*vec3(1., .95, .85), clamp(soak*uDark*3., 0., 1.));   // wet paper is a slightly deeper, warmer cream, not grey
  float rb = textureLod(uWet, uv, 3.).r;
  float tide = clamp(reach - rb, 0., 1.);
  c *= 1. - .16*tide*(1. - wx);
  c *= 1. + dot(cg, L.xy)*.22*uCock;
  // beads: dark rim, a bright line on the shadow side, a highlight on the lit side, a small shadow behind
  float rim = 1. - nm.z;
  c = mix(c, c*c*1.08, .35*body);   // colour under water is deeper and richer
  c *= 1. - rim*body*(.18 + .4*max(dot(nm.xy, L.xy), 0.));   // the dark rim falls on the lit side
  c += .16*smoothstep(.15, .8, dot(nm.xy, -L.xy))*(1. - rim)*body;
  float sp = pow(max(dot(reflect(-L, nm), vec3(0, 0, 1)), 0.), 70.);
  c += sp*body*1.1;
  float shd = HD(uv + L.xy*5./uRes)*(1. - body);
  c *= 1. - .22*smoothstep(0., .3, shd);
  o = vec4(clamp(c, 0., 1.), max(S.a, body));
}`;

// Final pass: tooth emboss (wax sits on the peaks, so the emboss goes over everything), warm vignette
const FS_FINAL = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uS; uniform vec2 uRes; uniform float uVig; uniform float uEmb; uniform vec2 uPoff; uniform float uLift; uniform vec4 uLamp;
${TOOTH}
void main(){
  vec4 S = texture(uS, uv);
  vec2 du = vec2(1./uRes.x, 0.), dv = vec2(0., 1./uRes.y);
  float t0 = toothRawAt(uv, uRes, uPoff), tx = toothRawAt(uv+du, uRes, uPoff), ty = toothRawAt(uv-dv, uRes, uPoff);
  vec2 g = vec2(tx-t0, ty-t0);
  float waxSmooth = 1.0 - .55*S.a;   // wax fills the tooth a little
  float lit = 1.0 + (g.x*-.9 + g.y*.9)*uEmb*waxSmooth - (1.0-t0)*.035*waxSmooth;
  vec3 c = S.rgb*lit;
  c += S.a*.018*uLift;   // a faint wax sheen
  vec2 q = uv-.5; q.x *= uRes.x/uRes.y;
  float v = 1.0 - uVig*dot(q,q);
  c *= mix(vec3(1.), vec3(1.0,.965,.9), clamp((1.0-v)*1.4,0.,1.)) * v;
  if (uLamp.w > 0.) {   // desk-lamp light: a warm pool, edges falling into warm dark
    vec2 d = (uv - uLamp.xy); d.x *= uRes.x/uRes.y;
    float fall = exp(-dot(d,d)/(uLamp.z*uLamp.z));
    vec3 lamp = mix(vec3(.46,.36,.30), vec3(1.07,1.0,.9), fall);
    c *= mix(vec3(1.), lamp, uLamp.w);
  }
  o = vec4(clamp(c,0.,1.), 1.);
}`;

function sh(gl, type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) + '\n' + src.slice(0, 200)); return s; }
function prog(gl, fs) {
  const p = gl.createProgram(); gl.attachShader(p, sh(gl, gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl, gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); }
  return { p, u };
}

export function makeComp(canvas, w = W, h = H) {
  const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, premultipliedAlpha: false, antialias: false, alpha: false });
  if (!gl) throw new Error('no webgl2');
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const P = { img: prog(gl, FS_IMG), knock: prog(gl, FS_KNOCK), paper: prog(gl, FS_PAPER), crayon: prog(gl, FS_CRAYON), wash: prog(gl, FS_WASH), wet: prog(gl, FS_WET), final: prog(gl, FS_FINAL), quad: prog(gl, FS_QUAD) };
  function tex(mip) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  function target() {
    const t = tex(false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    return { t, f };
  }
  const T = [target(), target()]; let cur = 0;
  const layerTex = tex(false), washTex = tex(true), wetTex = tex(true), grabTex = tex(true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  let toothScale = 1; let pc = [0, 0, 1];
  function use(pr, extra = {}) {
    gl.useProgram(pr.p);
    if (pr.u.uRes) gl.uniform2f(pr.u.uRes, w, h);
    if (pr.u.uToothScale) gl.uniform1f(pr.u.uToothScale, toothScale);
    if (pr.u.uPC) gl.uniform3f(pr.u.uPC, pc[0], pc[1], pc[2]);
    for (const k in extra) { const l = pr.u[k]; if (!l) continue; const v = extra[k]; if (Array.isArray(v)) (v.length === 2 ? gl.uniform2f : gl.uniform3f).call(gl, l, ...v); else gl.uniform1f(l, v); }
  }
  const draw = () => gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.viewport(0, 0, w, h);
  return {
    gl,
    set toothScale(v) { toothScale = v; },
    paperCam(x, y, z) { pc = [x, y, z]; },   // paper coordinates: camera centre (paper pixels) and relative zoom
    begin(paper = [0.957, 0.937, 0.890], poff = [0, 0]) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, T[cur].f); gl.disable(gl.BLEND);
      use(P.paper, { uPaper: paper, uPoff: poff }); draw();
    },
    knock(cv, paper = [0.957, 0.937, 0.890], poff = [0, 0]) {
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, layerTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
      gl.bindFramebuffer(gl.FRAMEBUFFER, T[cur].f); gl.disable(gl.BLEND);
      use(P.knock, { uPaper: paper, uPoff: poff }); gl.uniform1i(P.knock.u.uL, 0); draw();
    },
    group(C, o = {}) { this.knock(C.k.c); this.crayon(C.f.c, o); this.crayon(C.l.c, o); },
    crayon(cv, { goff = [0, 0], gain = 1, soft = 0.07 } = {}) {
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, layerTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
      gl.bindFramebuffer(gl.FRAMEBUFFER, T[cur].f);
      gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      use(P.crayon, { uGoff: goff, uGain: gain, uSoft: soft }); gl.uniform1i(P.crayon.u.uL, 0); draw();
      gl.disable(gl.BLEND);
    },
    wash(cv, { color = [0.16, 0.2, 0.46], goff = [0, 0], resist = 0.93, edge = 1.6, gran = 0.6 } = {}) {
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, washTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv); gl.generateMipmap(gl.TEXTURE_2D);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, T[cur].t);
      const nx = 1 - cur; gl.bindFramebuffer(gl.FRAMEBUFFER, T[nx].f); gl.disable(gl.BLEND);
      use(P.wash, { uT: color, uGoff: goff, uResist: resist, uEdge: edge, uGran: gran });
      gl.uniform1i(P.wash.u.uPrev, 0); gl.uniform1i(P.wash.u.uW, 1); draw();
      cur = nx;
    },
    wet(cv, { run = 0, bead = 15, refr = 9, cock = 1, dark = .06 } = {}) {
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, wetTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv); gl.generateMipmap(gl.TEXTURE_2D);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, T[cur].t);
      const nx = 1 - cur; gl.bindFramebuffer(gl.FRAMEBUFFER, T[nx].f); gl.disable(gl.BLEND);
      use(P.wet, { uRun: run, uBead: bead, uRefr: refr, uCock: cock, uDark: dark });
      gl.uniform1i(P.wet.u.uS, 0); gl.uniform1i(P.wet.u.uWet, 1); draw();
      cur = nx;
    },
    image(cv) {   // a pre-rendered image (a book page): plain alpha over, no paper tooth
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, layerTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
      gl.bindFramebuffer(gl.FRAMEBUFFER, T[cur].f);
      gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      use(P.img); gl.uniform1i(P.img.u.uL, 0); draw(); gl.disable(gl.BLEND);
    },
    grab() {   // copy the frame just composited (on screen) into a mipmapped texture, to place it in another picture with quad()
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, grabTex);
      gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGB8, 0, 0, w, h, 0); gl.generateMipmap(gl.TEXTURE_2D);
    },
    quad(Hi) {   // Hi: 3x3 screen pixel -> sheet uv (row-major). Wax is cleared where the sheet is (it is paper, not wax)
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, grabTex);
      gl.bindFramebuffer(gl.FRAMEBUFFER, T[cur].f);
      gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);
      use(P.quad); gl.uniform1i(P.quad.u.uL, 2);
      gl.uniformMatrix3fv(P.quad.u.uHi, false, [Hi[0], Hi[3], Hi[6], Hi[1], Hi[4], Hi[7], Hi[2], Hi[5], Hi[8]]);
      draw(); gl.disable(gl.BLEND); gl.activeTexture(gl.TEXTURE0);
    },
    finish({ vig = 0.32, emb = 0.55, poff = [0, 0], lift = 1, lamp = [0.5, 0.5, 1, 0] } = {}) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.disable(gl.BLEND);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, T[cur].t);
      use(P.final, { uVig: vig, uEmb: emb, uPoff: poff, uLift: lift }); gl.uniform4f(P.final.u.uLamp, ...lamp); gl.uniform1i(P.final.u.uS, 0); draw();
    },
  };
}
