// The chart ground: one WebGL2 full-screen pass that intersects every pixel's camera ray with the sea-level plane and
// prints the chart there: warm paper, a pale depth tint and coastal wash on the sea, the land in umber with hill shading
// and engraved hatching (world-anchored, level-of-detail blended so it never pops). Height comes from the two ETOPO1
// grids (region 2', Hainan 1'), sampled bilinearly by hand (no float-texture filtering needed).
import { LON0, LAT0, R_E } from './field.js';

const VS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
const FS = `#version 300 es
precision highp float;
uniform vec3 uC, uR, uU, uF; uniform float uFoc; uniform vec2 uRes;
uniform highp sampler2D uDR, uDH;
uniform vec4 uGR, uGH;      // lon0, lat0, dlon, dlat
uniform vec2 uNR, uNH;      // nx, ny
uniform float uY0, uSS, uLandK, uDim, uHiK;
uniform vec4 uFocus;        // x, y (km), radius km, strength: paper lifts outside the focus
out vec4 o;
const float R = ${R_E.toFixed(1)}, D2R = 0.017453292519943295, LON0 = ${LON0.toFixed(1)};
float tex(highp sampler2D s, vec4 g, vec2 n, vec2 ll, out float inside){
  vec2 f = vec2((ll.x - g.x) / g.z, (ll.y - g.y) / g.w);
  inside = step(0., f.x) * step(0., f.y) * step(f.x, n.x - 1.001) * step(f.y, n.y - 1.001);
  f = clamp(f, vec2(0.), n - 1.001);
  ivec2 i = ivec2(floor(f)); vec2 u = f - vec2(i);
  float a = texelFetch(s, i, 0).r, b = texelFetch(s, i + ivec2(1, 0), 0).r, c = texelFetch(s, i + ivec2(0, 1), 0).r, d = texelFetch(s, i + ivec2(1, 1), 0).r;
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float height(vec2 P){
  vec2 ll = vec2(LON0 + P.x / R / D2R, (2. * atan(exp((P.y + uY0) / R)) - 1.5707963) / D2R);
  float inR, inH; float hr = tex(uDR, uGR, uNR, ll, inR); float hh = tex(uDH, uGH, uNH, ll, inH);
  float m = 0.25;
  float w = inH * smoothstep(0., m, ll.x - uGH.x) * smoothstep(0., m, uGH.x + uGH.z * (uNH.x - 1.) - ll.x) * smoothstep(0., m, ll.y - uGH.y) * smoothstep(0., m, uGH.y + uGH.w * (uNH.y - 1.) - ll.y);
  return mix(hr, hh, w * uHiK);
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
// world-anchored line pattern with LOD: lines of spacing ~ px pixels, blended across octaves
float hatch(vec2 P, vec2 dir, float pk, float px, float wpx){
  float l = log2(max(1e-6, pk * px)), l0 = floor(l), k = fract(l);
  float r = 0.;
  for (int j = 0; j < 2; j++){
    float sp = exp2(l0 + float(j)); float s = dot(P, dir) / sp;
    float d = abs(fract(s) - 0.5) * sp / pk;                 // distance to the line, px
    float a = 1. - smoothstep(wpx * 0.5, wpx * 0.5 + 0.9, d);
    r += a * (j == 0 ? 1. - k : k);
  }
  return r;
}
void main(){
  vec2 fc = gl_FragCoord.xy / uSS;
  vec3 d = normalize(uF * uFoc + uR * (fc.x - uRes.x * .5) + uU * (fc.y - uRes.y * .5));
  float t = -uC.z / min(d.z, -1e-4);
  vec2 P = (uC + t * d).xy;
  float pk = t / uFoc;                                         // km per pixel (along the ray, isotropic)
  float h = height(P);
  float e = max(0.35 * pk, 3.2);                               // km offset for the slope (at least about a grid cell, so shading isn't faceted)
  float hx = height(P + vec2(e, 0.)) - height(P - vec2(e, 0.)), hy = height(P + vec2(0., e)) - height(P - vec2(0., e));
  vec2 grad = vec2(hx, hy) / (2. * e * 1000.);                 // m per m
  float fw = max(1e-3, length(vec2(dFdx(h), dFdy(h))));
  float land = smoothstep(-0.8, 0.8, h / fw);
  // paper
  float mott = vn(P / 180.) * .6 + vn(P / 47.) * .3 + vn(P / 13.) * .1;
  vec3 paper = vec3(0.925, 0.858, 0.722) + (mott - 0.5) * 0.035;
  // sea: depth tint and a coastal wash
  float dep = clamp(-h / 4500., 0., 1.);
  vec3 sea = mix(paper, vec3(0.80, 0.80, 0.72), 0.55 * smoothstep(0.0, 1.0, dep));
  float shelf = 1. - smoothstep(0., 120., -h);
  sea = mix(sea, vec3(0.79, 0.81, 0.76), 0.35 * shelf);
  // land: umber wash, hill shade, engraved hatching
  float sl = length(grad);
  vec3 n = normalize(vec3(-grad * 6., 1.));
  float shade = dot(n, normalize(vec3(-0.6, 0.55, 0.6)));
  vec3 lc = vec3(0.885, 0.80, 0.635) * mix(0.88, 1.05, smoothstep(0.25, 0.95, shade));
  lc = mix(lc, vec3(0.74, 0.62, 0.45), smoothstep(150., 900., h) * 0.35);
  float hk = hatch(P, normalize(vec2(1., 1.)), pk, 5.0, 0.9) * (0.25 + 0.6 * smoothstep(0.005, 0.06, sl));
  lc = mix(lc, vec3(0.38, 0.29, 0.22), hk * 0.30 * uLandK);
  vec3 col = mix(sea, lc, land);
  // focus: outside the area of interest the chart pales a little (like a lifted print)
  float fd = length(P - uFocus.xy) / max(1., uFocus.z);
  col = mix(col, vec3(0.93, 0.875, 0.75), uFocus.w * smoothstep(0.6, 1.4, fd));
  col *= 1. - uDim;
  o = vec4(col, 1.);
}`;

export function makeChartGL(W, H, SS, chartData) {
  const cv = document.createElement('canvas'); cv.width = Math.round(W * SS); cv.height = Math.round(H * SS);
  const gl = cv.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false });
  if (!gl) throw new Error('WebGL2 is required');
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n);
  function upload(unit, g) {
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    const f = Float32Array.from(g.z);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, g.nx, g.ny, 0, gl.RED, gl.FLOAT, f);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  const { GR, GH } = chartData;
  upload(0, GR); upload(1, GH);
  gl.uniform1i(U('uDR'), 0); gl.uniform1i(U('uDH'), 1);
  gl.uniform4f(U('uGR'), GR.lon0, GR.lat0, GR.dlon, GR.dlat); gl.uniform2f(U('uNR'), GR.nx, GR.ny);
  gl.uniform4f(U('uGH'), GH.lon0, GH.lat0, GH.dlon, GH.dlat); gl.uniform2f(U('uNH'), GH.nx, GH.ny);
  gl.uniform1f(U('uY0'), R_E * Math.log(Math.tan(Math.PI / 4 + LAT0 * Math.PI / 360)));
  gl.uniform1f(U('uSS'), SS); gl.uniform2f(U('uRes'), W, H);
  gl.viewport(0, 0, cv.width, cv.height);
  return {
    canvas: cv,
    draw(cam, o = {}) {
      gl.uniform3f(U('uC'), ...cam.C); gl.uniform3f(U('uR'), ...cam.R); gl.uniform3f(U('uU'), ...cam.U); gl.uniform3f(U('uF'), ...cam.F);
      gl.uniform1f(U('uFoc'), cam.foc); gl.uniform1f(U('uHiK'), 1 - Math.min(1, Math.max(0, (1 / cam.ppkRef - 1.0) / 1.0)));
      gl.uniform1f(U('uLandK'), o.landK ?? 1); gl.uniform1f(U('uDim'), o.dim ?? 0);
      const f = o.focus || [0, 0, 1e5, 0]; gl.uniform4f(U('uFocus'), f[0], f[1], f[2], f[3]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  };
}
