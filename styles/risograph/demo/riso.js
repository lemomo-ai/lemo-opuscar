// Riso print compositor (WebGL2)
// Input: one "separation canvas" — R = blue plate density, G = yellow plate density, B = fluorescent pink plate density (0 = no ink, 255 = solid)
//   drawing with plain source-over = automatic "knockout" (later shapes cover earlier ones on all three plates);
//   using 'lighter' to add only to one channel = "overprint" (e.g. pink sun over blue sky → purple).
// Output: three spot colours multiplied over a paper-white base, each plate with its own: misregistration (offset + slight rotation), halftone dots (own screen angle),
//   ink grain (white pinholes in solids), uneven ink (streaks along the paper-feed direction + large density patches), rough plate edges, plate on/off gate and the "drum inking" reveal.
export const INK = {
  blue: [0, 120, 191],        // Riso Blue
  yellow: [255, 232, 0],      // Riso Yellow
  pink: [255, 72, 176],       // Riso Fluorescent Pink
};
export const PAPER = [246, 241, 230];

const VS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

const FS = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uOff[3];      // per-plate offset (px)
uniform float uRot[3];     // per-plate slight rotation (rad, about the frame centre)
uniform float uAng[3];     // screen angle
uniform vec3 uInk[3];
uniform vec3 uPaper;
uniform float uSeed;       // changes once per "printed sheet" (12fps steps = boiling ink grain)
uniform float uBoil;       // share of ink grain that boils 0..1
uniform float uSheet;      // sheet-level variation (ink streaks / density): changes only on shot cuts, to avoid full-screen flicker
uniform float uPeriod;     // halftone dot period px
uniform float uGate[3];    // whether this plate is on the machine yet 0..1
uniform float uSweep[3];   // inking reveal: the x (px) this plate has advanced to from left to right; >= uRes.x+200 means fully revealed
uniform float uGrain;      // ink grain strength
uniform float uWaterY;     // water line (px, canvas coordinates); <0 means no water
uniform float uWaterAmp;   // reflection sway amplitude (px)
uniform float uWaterT;
uniform float uWaterSep;   // plate misregistration inside the reflection (0..1)
uniform float uRefl;       // reflection strength
uniform float uWaterB;     // lower edge of the water (px)
out vec4 o;

float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float h21s(vec2 p, float s){ return h21(p + s * 17.13); }
float vn(vec2 p, float s){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  float a = h21s(i, s), b = h21s(i + vec2(1, 0), s), c = h21s(i + vec2(0, 1), s), d = h21s(i + vec2(1, 1), s);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
vec2 rot(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }

float dens(int i, vec2 px){
  vec2 q = rot(px - uRes * .5, uRot[i]) + uRes * .5 - uOff[i];
  float d = texture(uTex, q / uRes)[i];
  if (uWaterY > 0. && q.y > uWaterY && q.y < uWaterB) {
    // reflection: flip about the water line, each plate sways on a sine with a different phase → the colours separate in the reflection
    float fi = float(i);
    float yy = 2. * uWaterY - q.y;
    float depth = (q.y - uWaterY);
    float w = sin(q.y * .09 + uWaterT * 2.3 + fi * 2.1) * (1. + depth * .012) + sin(q.y * .031 - uWaterT * 1.3 + fi) * .6;
    float sep = uWaterSep * (fi - 1.) * 14.;
    vec2 rq = vec2(q.x + w * uWaterAmp + sep, yy);
    float r = rq.y > 0. ? texture(uTex, rq / uRes)[i] : 0.;
    // horizontal breaks in the water (thin paper-white gaps in the ripples)
    float gap = step(.72, vn(vec2(q.x * .012, q.y * .35) + uWaterT * vec2(.8, 0), 3.));
    r *= uRefl * (1. - gap * .85);
    d = 1. - (1. - d) * (1. - r);
  }
  return d;
}

void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  // paper: warm white + fibres
  float fib = vn(px * vec2(.9, .25), 7.) * .5 + vn(px * .05, 9.) * .5;
  vec3 col = uPaper * (.975 + .03 * fib);
  for (int i = 0; i < 3; i++) {
    if (uGate[i] <= 0.001) continue;
    vec2 q = rot(px - uRes * .5, uRot[i]) + uRes * .5 - uOff[i];
    float d = dens(i, px);
    // inking reveal: inked area = x < uSweep (advances from left to right), with a slightly denser ink band at the advancing edge
    float reveal = 1. - smoothstep(-5., 5., px.x - uSweep[i]);
    float band = exp(-pow((px.x - uSweep[i]) / 22., 2.));
    if (d < .002 && band < .01) continue;
    // halftone dots: in this plate's coordinates (shift together with the misregistration)
    vec2 g = rot(q, uAng[i]) / uPeriod;
    float spot = 1. - (cos(6.2831853 * g.x) + cos(6.2831853 * g.y) + 2.) * .25; // 0..1
    // ink grain and rough plate edges
    // ink grain: the static part follows the paper (one sheet per shot), the boiling part changes once per printed sheet, with a small amplitude (uBoil)
    float n1 = mix(h21s(floor(q * .9), uSheet + float(i) * 3.1), h21s(floor(q * .9), uSeed + float(i) * 3.1), uBoil);
    float n2 = vn(q * .33, uSheet * .7 + float(i));
    float thr = spot + (n1 - .5) * .16 * uGrain + (n2 - .5) * .12;
    float dd = d * 1.06;
    float cov = smoothstep(thr - .07, thr + .07, dd);
    cov = max(cov, smoothstep(.9, 1., d) * .96);   // solid
    // white pinholes (paper showing through solids)
    float sp = h21s(floor(q * .55), uSheet * 1.3 + float(i) * 7.7 + floor(uSeed * uBoil * 2.) * 0.);
    cov *= 1. - step(.955 - .03 * uGrain, sp) * .75 * smoothstep(.4, 1., d);
    // uneven ink: streaks along the paper-feed direction (vertical) + large density patches + an overall density per sheet
    float streak = vn(vec2(q.x * .025, q.y * .0022), 11. + float(i) + uSheet * .37);
    float blot = vn(q * .004, 5. + float(i) * 2. + uSheet * .13);
    float k = .80 + .14 * streak + .08 * blot;
    k = clamp(k, 0., 1.);
    float c = clamp(cov * k * reveal + band * .45 * smoothstep(0., .25, d), 0., 1.) * uGate[i];
    col *= mix(vec3(1.), uInk[i], c);
  }
  o = vec4(col, 1.);
}`;

export function makeRiso(out, W, H) {
  const gl = out.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, alpha: false });
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
  gl.useProgram(pr);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  const U = n => gl.getUniformLocation(pr, n);
  const u = {}; for (const n of ['uTex', 'uRes', 'uOff', 'uRot', 'uAng', 'uInk', 'uPaper', 'uSeed', 'uBoil', 'uSheet', 'uPeriod', 'uGate', 'uSweep', 'uGrain', 'uWaterY', 'uWaterAmp', 'uWaterT', 'uWaterSep', 'uRefl', 'uWaterB']) u[n] = U(n);
  gl.viewport(0, 0, W, H);
  return function print(plate, o = {}) {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, plate);
    const inks = o.inks || [INK.blue, INK.yellow, INK.pink];
    gl.uniform1i(u.uTex, 0);
    gl.uniform2f(u.uRes, W, H);
    const off = o.off || [[0, 0], [0, 0], [0, 0]];
    gl.uniform2fv(u.uOff, off.flat());
    gl.uniform1fv(u.uRot, o.rot || [0, 0, 0]);
    gl.uniform1fv(u.uAng, o.ang || [0.2618, 0, 1.309]);  // 15° / 0° / 75°
    gl.uniform3fv(u.uInk, inks.map(c => c.map(v => v / 255)).flat());
    gl.uniform3fv(u.uPaper, (o.paper || PAPER).map(v => v / 255));
    gl.uniform1f(u.uSeed, o.seed ?? 0);
    gl.uniform1f(u.uSheet, o.sheet ?? 0);
    gl.uniform1f(u.uBoil, o.boil ?? .35);
    gl.uniform1f(u.uPeriod, o.period ?? 7);
    gl.uniform1fv(u.uGate, o.gate || [1, 1, 1]);
    gl.uniform1fv(u.uSweep, o.sweep || [1e5, 1e5, 1e5]);
    gl.uniform1f(u.uGrain, o.grain ?? 1);
    const w = o.water || null;
    gl.uniform1f(u.uWaterY, w ? w.y : -1);
    gl.uniform1f(u.uWaterAmp, w ? w.amp : 0);
    gl.uniform1f(u.uWaterT, w ? w.t : 0);
    gl.uniform1f(u.uWaterSep, w ? w.sep : 0);
    gl.uniform1f(u.uRefl, w ? w.refl : 0);
    gl.uniform1f(u.uWaterB, w ? (w.b ?? 1e5) : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
}
