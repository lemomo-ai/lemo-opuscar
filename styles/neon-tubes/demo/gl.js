// WebGL2 back end. Canvas 2D layers come in as textures:
//   prof  (W x 2H, extended): tube cross-section height in R (0.1 + 0.9 h, 0 = no tube), material in G (0 clear, 85 coated, 170 black paint, 255 metal)
//   tcol  (W x 2H): emitted colour of the gas column (already x power)
//   ovl   (W x 2H): albedo of painted / built things that replace the base surface (alpha = coverage)
//   add   (W x 2H): self-lit things that are not tubes (flames, lit windows, the barber pole)
//   emit  (W/2 x H): every light source, blurred into a pyramid -> light falling on surfaces + bloom
//   rain  (W x H, screen): rain streaks (alpha)
// SURF lights the surface (street facade / workshop wall / bench board), shades every glass tube as a cylinder
// (gas column, glass wall, Fresnel rim, specular, refraction of what is behind), FIN adds the wet street and its
// reflections, POST does motion blur, tone curve, vignette and dither.
export function makeGL(cv, W, H, TOP = H) {
  const CHT = H + TOP;
  const gl = cv.getContext('webgl2', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true, alpha: false });
  const HALF = !!gl.getExtension('EXT_color_buffer_float'); gl.getExtension('OES_texture_float_linear');
  const VS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;
  function prog(fs) {
    const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) + '\n' + src.split('\n').map((l, i) => (i + 1) + ': ' + l).join('\n')); return s; };
    const pr = gl.createProgram(); gl.attachShader(pr, mk(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(pr, 0, 'p'); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    const u = {}; const n = gl.getProgramParameter(pr, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(pr, i); u[a.name.replace('[0]', '')] = gl.getUniformLocation(pr, a.name); }
    return { pr, u };
  }
  const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  function tex(w, h, hdr) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    if (hdr && HALF) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  function target(w, h, hdr = true) { const t = tex(w, h, hdr); const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return { t, fb, w, h }; }
  const EW = W >> 1, EH = CHT >> 1;
  const T = { prof: tex(W, CHT), tcol: tex(W, CHT), ovl: tex(W, CHT), add: tex(W, CHT), emit: tex(EW, EH), rain: tex(W, H) };
  const NL = 8, lv = [], upL = [], upB = [];
  for (let i = 0; i < NL; i++) { const w = Math.max(1, EW >> i), h = Math.max(1, EH >> i); lv.push(i === 0 ? { t: T.emit, w, h } : target(w, h)); upL.push(target(w, h)); upB.push(target(w, h)); }
  const surfT = target(W, CHT), finT = target(W, H);

  const COMMON = `#version 300 es
precision highp float;
out vec4 o;
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p), u = f*f*(3.-2.*f);
  return mix(mix(h12(i), h12(i+vec2(1,0)), u.x), mix(h12(i+vec2(0,1)), h12(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a*vn(p); p = p*2.03 + vec2(17.1, 9.7); a *= .5; } return s; }
`;
  const DOWN = prog(COMMON + `uniform sampler2D src; uniform vec2 ts; uniform vec2 sz;
void main(){ vec2 uv = gl_FragCoord.xy / sz; vec2 h = ts * .5;
  vec3 c = texture(src, uv).rgb * 4. + texture(src, uv + vec2(-h.x,-h.y)*2.).rgb + texture(src, uv + vec2(h.x,-h.y)*2.).rgb + texture(src, uv + vec2(-h.x,h.y)*2.).rgb + texture(src, uv + vec2(h.x,h.y)*2.).rgb;
  o = vec4(c / 8., 1.); }`);
  const UP = prog(COMMON + `uniform sampler2D coarse; uniform sampler2D fine; uniform vec2 ts; uniform vec2 sz; uniform float wf; uniform float hasC;
void main(){ vec2 uv = gl_FragCoord.xy / sz; vec2 h = ts;
  vec3 c = vec3(0.);
  if (hasC > .5){
    c += texture(coarse, uv + vec2(-h.x*2., 0.)).rgb + texture(coarse, uv + vec2(h.x*2., 0.)).rgb + texture(coarse, uv + vec2(0., -h.y*2.)).rgb + texture(coarse, uv + vec2(0., h.y*2.)).rgb;
    c += (texture(coarse, uv + vec2(-h.x, h.y)).rgb + texture(coarse, uv + vec2(h.x, h.y)).rgb + texture(coarse, uv + vec2(-h.x, -h.y)).rgb + texture(coarse, uv + vec2(h.x, -h.y)).rgb) * 2.;
    c /= 12.;
  }
  o = vec4(c + texture(fine, uv).rgb * wf, 1.); }`);

  // ---------------------------------------------------------------- surface + tubes
  const SURF = prog(COMMON + `uniform vec2 R; uniform int mode; uniform mat2 A; uniform vec2 B; uniform float K; uniform float t;
uniform sampler2D light; uniform sampler2D prof; uniform sampler2D tcol; uniform sampler2D ovl; uniform sampler2D addT;
uniform vec4 bld[8]; uniform vec3 bldC[8]; uniform vec3 amb; uniform float gain; uniform float wetW; uniform vec3 envC;
const float BW = .232, BH = .074, MO = .012;
vec4 brick(vec2 q){
  float row = floor(q.y / BH); float off = mod(row, 2.) * .5 * BW + h12(vec2(row, 3.)) * .02;
  float col = floor((q.x + off) / BW);
  vec2 l = vec2(q.x + off - col * BW, q.y - row * BH);
  float jag = (vn(q * 160.) - .5) * .005 + (vn(q * 33.) - .5) * .004;
  float e = min(min(l.x, BW - l.x), min(l.y, BH - l.y)) - MO * .5 + jag;
  float id = h12(vec2(col, row));
  float bev = smoothstep(0., .011, e);
  float hb = bev * (.92 + .08 * fbm(q * 45. + id));
  float isB = smoothstep(-.0015, .0015, e);
  return vec4(mix(.05 * vn(q * 300.), hb, isB), isB, id, 1. - isB);
}
vec4 tile(vec2 q, float sz){             // mosaic tile: (height, isTile, id, grout)
  vec2 c = floor(q / sz); vec2 l = q - c * sz;
  float e = min(min(l.x, sz - l.x), min(l.y, sz - l.y)) - .0018;
  float isT = smoothstep(-.0006, .0006, e);
  float bev = smoothstep(0., .004, e);
  return vec4(bev * isT, isT, h12(c * 1.7 + 3.), 1. - isT);
}
// facade albedo at wall point q (metres); returns albedo, writes height and gloss
vec3 facade(vec2 q, out float hgt, out float gloss, out float sky){
  hgt = 0.; gloss = .05; sky = 0.;
  int bi = 0; vec4 b = bld[0]; vec3 tint = bldC[0];
  for (int i = 0; i < 8; i++){ if (q.x >= bld[i].x && q.x < bld[i].y){ bi = i; b = bld[i]; tint = bldC[i]; } }
  float roof = 7.4 + h12(vec2(b.w, 1.)) * 2.2;
  if (q.y > roof){ sky = 1.; return vec3(0.); }
  float type = b.z; vec3 alb;
  float edgeL = q.x - b.x, edgeR = b.y - q.x;
  if (type < .5){
    vec4 br = brick(q + vec2(b.w * 3.1, 0.)); hgt = br.x;
    float id2 = h12(vec2(br.z * 91., 7.));
    vec3 bc = mix(tint, tint * vec3(.85, .95, 1.05), id2) * (.62 + .55 * br.z);
    bc *= .75 + .45 * fbm(q * 18. + br.z * 7.);
    alb = mix(bc, vec3(.27, .26, .25) * (.6 + .5 * fbm(q * 70.)), br.w);
  } else if (type < 1.5){
    vec4 tl = tile(q, .05); hgt = tl.x * .6;
    vec3 tc = tint * (.86 + .28 * tl.z) * (.9 + .15 * fbm(q * 3.));
    alb = mix(tc, vec3(.33, .32, .3), tl.w); gloss = .55 * tl.y;
  } else {
    float f = fbm(q * 1.7 + b.w);
    alb = tint * (.72 + .4 * f) * (.85 + .2 * fbm(q * 40.));
    float crack = smoothstep(.012, .0, abs(vn(q * vec2(3., 1.1) + b.w) - .5) - .002) * smoothstep(.6, .7, fbm(q * 2. + 9.));
    alb *= 1. - .5 * crack; hgt = .2 * fbm(q * 30.);
  }
  // floor slabs / cornice over the shopfronts
  if (q.y > 2.72 && q.y < 2.95){ alb = vec3(.36, .35, .33) * (.7 + .3 * fbm(q * 20.)); hgt = smoothstep(2.72, 2.76, q.y) * smoothstep(2.95, 2.9, q.y); gloss = .05; }
  if (q.y > 6.3 && q.y < 6.42){ alb = vec3(.3, .29, .28) * (.7 + .3 * fbm(q * 20.)); hgt = .8; }
  // dark joint between two buildings
  float j = min(edgeL, edgeR); alb *= mix(.25, 1., smoothstep(.0, .06, j));
  // grime and rain streaks
  float grime = smoothstep(.45, .8, fbm(vec2(q.x * 1.3, q.y * .5) + 11. + b.w));
  alb *= 1. - .4 * grime;
  float wetS = smoothstep(.5, .8, fbm(vec2(q.x * 9., q.y * .45) + 5.)) * (1. - smoothstep(2.6, 6., q.y) * .5);
  alb *= 1. - .3 * wetS * wetW; gloss += wetS * .25 * wetW;
  return alb;
}
vec3 bench(vec2 q, out float hgt, out float gloss){
  hgt = 0.; gloss = .08;
  if (mode == 1){
    // side view: workshop wall far behind, out of focus; bench front edge below y = -0.07
    float f = fbm(q * 3. + 2.);
    vec3 c = vec3(.07, .065, .06) * (.6 + .6 * f);
    if (q.y < -.07){ c = vec3(.16, .15, .14) * (.6 + .5 * fbm(q * vec2(4., 60.))); hgt = .3 * fbm(q * 80.); gloss = .15; }
    return c;
  }
  // top view: cement board with scorch marks and scratches
  float f = fbm(q * 6.);
  vec3 c = vec3(.30, .29, .275) * (.75 + .4 * f) * (.92 + .1 * vn(q * 400.));
  float sc = smoothstep(.55, .78, fbm(q * 3.3 + 4.)); c = mix(c, vec3(.09, .06, .045), sc * .85);
  float scr = smoothstep(.004, 0., abs(fract(q.x * 9. + vn(q * 2.) * 3.) - .5) - .497) * step(.7, vn(q * vec2(1., 8.)));
  c *= 1. - .15 * scr;
  hgt = .15 * vn(q * 300.);
  return c;
}
void main(){
  vec2 fc = vec2(gl_FragCoord.x, R.y - gl_FragCoord.y);     // top-down pixel in the extended canvas
  vec2 uv = vec2(fc.x / R.x, 1. - fc.y / R.y);
  vec2 q = A * fc + B;                                      // world point on the surface
  float hgt, gloss, sky = 0.;
  vec3 alb = mode == 0 ? facade(q, hgt, gloss, sky) : bench(q, hgt, gloss);
  vec4 ov = texture(ovl, uv);
  alb = alb * (1. - ov.a) + ov.rgb; hgt *= 1. - ov.a; gloss = mix(gloss, .25, ov.a);
  // bump from the height field (screen-space differences)
  float e = 1.5;
  vec2 qx = A * (fc + vec2(e, 0.)) + B, qy = A * (fc + vec2(0., e)) + B;
  float h1, h2, g1, g2, s1, s2;
  if (mode == 0){ facade(qx, h1, g1, s1); facade(qy, h2, g2, s2); } else { bench(qx, h1, g1); bench(qy, h2, g2); }
  h1 *= 1. - ov.a; h2 *= 1. - ov.a;
  vec2 n2 = -vec2(h1 - hgt, -(h2 - hgt)) / e * clamp(K / 400., .3, 3.) * .5;
  // light: blurred emission; its gradient says where the light comes from
  vec3 Li = texture(light, uv).rgb;
  vec2 dt = vec2(6. / R.x, 6. / R.y);
  float lx = dot(texture(light, uv + vec2(dt.x, 0.)).rgb - texture(light, uv - vec2(dt.x, 0.)).rgb, vec3(.33));
  float ly = dot(texture(light, uv + vec2(0., dt.y)).rgb - texture(light, uv - vec2(0., dt.y)).rgb, vec3(.33));
  float lum = dot(Li, vec3(.33)) + .02;
  vec2 dir = vec2(lx, ly) / lum;
  float shade = clamp(1. + dot(n2, dir) * 2.6, .2, 2.);
  vec3 col = alb * (amb + Li * shade) + Li * gloss * .12;
  if (sky > .5) col = vec3(.010, .011, .019) + vec3(.03, .018, .02) * smoothstep(12., 7., q.y) + Li * .02;

  // ---- glass tubes
  vec4 P = texture(prof, uv);
  float cov = smoothstep(.03, .11, P.r);
  if (cov > 0.){
    float hh = clamp((P.r - .1) / .9, 0., 1.);
    vec2 px = 1. / R; float d = 1.5;
    // Sobel over the stepped profile: smooth outward direction even where the bands alias
    float s00 = texture(prof, uv + vec2(-px.x, -px.y) * d).r, s10 = texture(prof, uv + vec2(0., -px.y) * d).r, s20 = texture(prof, uv + vec2(px.x, -px.y) * d).r;
    float s01 = texture(prof, uv + vec2(-px.x, 0.) * d).r, s21 = texture(prof, uv + vec2(px.x, 0.) * d).r;
    float s02 = texture(prof, uv + vec2(-px.x, px.y) * d).r, s12 = texture(prof, uv + vec2(0., px.y) * d).r, s22 = texture(prof, uv + vec2(px.x, px.y) * d).r;
    float gx = (s20 + 2. * s21 + s22) - (s00 + 2. * s01 + s02);
    float gy = (s02 + 2. * s12 + s22) - (s00 + 2. * s10 + s20);
    vec2 out2 = -vec2(gx, gy); float gl2 = length(out2); out2 = gl2 > 1e-4 ? out2 / gl2 : vec2(0., 1.);
    float r = sqrt(max(0., 1. - hh * hh));
    vec3 n = normalize(vec3(out2 * r, hh + .001));
    float F = .04 + .96 * pow(1. - hh, 5.);
    vec3 Lk = normalize(vec3(-.35, .6, .72));
    float spec = pow(max(dot(n, normalize(Lk + vec3(0., 0., 1.))), 0.), 90.);
    float spec2 = pow(max(dot(n, normalize(normalize(vec3(.5, -.2, .8)) + vec3(0., 0., 1.))), 0.), 30.);
    vec3 env = Li * 0.9 + amb * 2.5 + envC;
    vec3 E = texture(tcol, uv).rgb * gain;
    float m = P.g;
    vec3 tc;
    if (m < .2){                                   // clear glass, gas column inside the bore
      vec2 ro = out2 * r * 10. * px;
      vec3 behind = col * .72 + texture(addT, uv - ro * 3.).rgb * .8 + texture(light, uv - ro * 4.).rgb * .15;
      float bore = smoothstep(.86, .7, r);
      vec3 gas = E * (bore * (.42 + .8 * hh * hh) + (1. - bore) * .3);
      float rim = smoothstep(.78, .93, r) * smoothstep(1., .95, r);
      tc = behind * (1. - F) * .9 + gas + env * (F * 1.2 + rim * .5) + E * rim * .25 + (envC * 4. + vec3(.5)) * spec * .9 + env * spec2 * .35;
    } else if (m < .45){                           // phosphor-coated: milky when off, glows across the whole width when on
      vec3 milk = vec3(.78, .8, .82) * (env * .55 + amb) * (.45 + .55 * hh);
      tc = milk + E * (.82 + .3 * hh) + vec3(.8, .85, .9) * spec * .35 + env * F * .4;
    } else if (m < .8){                            // black blockout paint (double-backs, electrodes)
      tc = vec3(.02, .019, .022) * (env + amb) * (.7 + .5 * hh) + env * spec * .12 + env * F * .08;
    } else {                                       // metal (tie wires, clamps, electrode shells)
      tc = vec3(.32, .31, .3) * (env * .8 + amb * 1.5) * (.4 + .8 * hh) + env * spec * 1.1 + vec3(.6) * spec;
      tc += E * .9;                               // glowing hot metal (electrodes while bombarding)
    }
    col = mix(col, tc, cov);
  }
  col += texture(addT, uv).rgb * 1.6;
  o = vec4(col, 1.);
}`);

  // ---------------------------------------------------------------- final: street floor + rain (mode 0), or the surface alone
  const FIN = prog(COMMON + `uniform vec2 R; uniform int mode; uniform float K; uniform vec2 L; uniform float E; uniform float FL; uniform float t;
uniform sampler2D surf; uniform sampler2D bloom; uniform sampler2D light; uniform sampler2D rain;
uniform vec4 drop; uniform float wet; uniform float rainA; uniform float calm; uniform vec4 pud1; uniform vec4 pud2; uniform vec3 floorAmb; uniform float dropS;
uniform float TOPR; uniform float CHT;
vec2 ext(vec2 sp){ return vec2(sp.x / R.x, 1. - (sp.y + TOPR) / CHT); }
vec2 ripple(vec2 P){
  vec2 g = vec2(0.); float cs = .3; vec2 c0 = floor(P / cs);
  for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++){
    vec2 c = c0 + vec2(i, j);
    for (int k = 0; k < 2; k++){
      float per = .5 + h12(c + float(k) * 3.3) * .7;
      float tt = t / per + h12(c + 7.1 + float(k));
      float n = floor(tt); float age = fract(tt) * per;
      vec2 pos = (c + vec2(h12(c + n * 1.37 + float(k)), h12(c + n * 2.71 + 4.))) * cs;
      vec2 d = P - pos; float r = length(d); float Rr = age * .28;
      float x = (r - Rr) / .012;
      g += d / (r + 1e-4) * (-x * exp(-x * x) * exp(-age * 5.) * .9);
    }
  }
  g *= rainA;
  float age = t - drop.z;
  if (age > 0. && age < 1.8){
    vec2 d = P - drop.xy; float r = length(d);
    for (int m = 0; m < 3; m++){
      float Rr = age * dropS * (1. - float(m) * .24); float x = (r - Rr) / (.03 * dropS / .42);
      g += d / (r + 1e-4) * (-x * exp(-x * x)) * exp(-age * 2.) * drop.w * (1. - float(m) * .25);
    }
  }
  return g;
}
float splash(vec2 P){
  float s = 0.; float cs = .3; vec2 c0 = floor(P / cs);
  for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++){
    vec2 c = c0 + vec2(i, j);
    for (int k = 0; k < 2; k++){
      float per = .5 + h12(c + float(k) * 3.3) * .7;
      float tt = t / per + h12(c + 7.1 + float(k));
      float n = floor(tt); float age = fract(tt) * per;
      vec2 pos = (c + vec2(h12(c + n * 1.37 + float(k)), h12(c + n * 2.71 + 4.))) * cs;
      float r = length(P - pos);
      s += exp(-r * r / (.006 * .006)) * exp(-age / .035);
    }
  }
  return s * rainA;
}
void main(){
  vec2 sp = vec2(gl_FragCoord.x, R.y - gl_FragCoord.y);
  vec3 col; vec2 lightUV = ext(sp);
  float sy0 = R.y * .5 + L.y * K;               // wall base row
  if (mode != 0 || sp.y < sy0){
    vec2 uv = ext(sp);
    col = texture(surf, uv).rgb + texture(bloom, uv).rgb;
  } else {
    float D = FL / K;
    float c0 = R.y * .5 + K * (L.y - E);           // row of the horizon (eye height), lens shifted
    float dy = (sp.y - c0) / FL;
    float tf = E / max(dy, 1e-4); float z = D - tf;   // distance from the wall
    vec2 P = vec2(L.x + (sp.x - R.x * .5) / FL * tf, z);
    float kf = FL / tf;
    float pz = kf * dy;                            // screen rows per metre of depth: small at grazing angles
    float detail = smoothstep(12., 40., pz);       // fade fine floor detail before it aliases into streaks
    // paving slabs on the pavement, granite kerb, asphalt road with a worn lane line
    vec3 alb; float rough = 1.;
    if (z < 2.4){
      vec2 c = floor(P / .4); vec2 l = P - c * .4; float e = min(min(l.x, .4 - l.x), min(l.y, .4 - l.y));
      float gr = smoothstep(.004, .008, e);
      alb = vec3(.2, .195, .19) * (.75 + .4 * mix(.5, h12(c), detail)) * (.8 + .3 * fbm(P * 7.)) * mix(mix(.45, 1., gr), .85, 1. - detail);
    } else if (z < 2.62){
      alb = vec3(.3, .29, .28) * (.7 + .4 * fbm(P * vec2(5., 40.))) * mix(.8, (z > 2.58 ? .5 : 1.), detail);
    } else {
      float ag = fbm(P * 6.); float gr = vn(P * 900.) * .6 + vn(P * 2300.) * .4;
      alb = vec3(.1, .097, .1) * (.5 + .7 * ag) * (.7 + .6 * gr);
      float lane = step(.5, fract(P.x / 3.)) * smoothstep(.07, .05, abs(z - 8.2)) * (.5 + .5 * fbm(P * 20.));
      alb = mix(alb, vec3(.5, .48, .42), lane * .6);
    }
    float pn = fbm(vec2(P.x * 1.3, P.y * 1.9) + 2.);
    pn += .32 * exp(-pow((P.x - pud1.x) / pud1.z, 4.) - pow((P.y - pud1.y) / pud1.w, 4.)) + .32 * exp(-pow((P.x - pud2.x) / pud2.z, 4.) - pow((P.y - pud2.y) / pud2.w, 4.));
    float th = mix(.75, .47, wet);
    float pw = .015 + 25. / max(kf, 1.) + 6. / max(pz, 1.);
    float pud = smoothstep(th, th + pw, pn + (z > 2.62 ? .02 : -.02)) * step(.0, z);
    // the puddle that holds the last reflection: an ellipse with a ragged edge
    float e2 = pow((P.x - pud2.x) / pud2.z, 2.) + pow((P.y - pud2.y) / pud2.w, 2.) + (fbm(P * 55.) - .5) * .45;
    pud = max(pud, smoothstep(1., .92, e2));
    vec2 g = ripple(P) * (.35 + .65 * pud);
    alb *= mix(1., .45, pud);
    float off = sp.y - sy0;
    vec2 rp = vec2(sp.x, sy0 - off) + g * vec2(min(kf, 450.) * .06, min(pz, 450.) * .12);   // ripple offsets follow the floor's own scale in x and in depth
    vec3 mir = vec3(0.), rgh = vec3(0.);
    float spread = 10. + off * .75;
    for (int i = 0; i < 8; i++){
      float f = (float(i) - 3.5) / 3.5;
      vec2 q = rp + vec2(f * 1.5, f * spread);
      q.y = min(q.y, sy0 - 1.);
      vec2 uv = ext(q);
      float fade = smoothstep(1., .97, uv.y);
      rgh += (max(texture(surf, uv).rgb - .1, 0.) * .7 * clamp(40. / spread, 0., 1.) + texture(bloom, uv).rgb * 1.3) * fade;
    }
    rgh /= 8.;
    { vec2 uv = ext(vec2(rp.x, min(rp.y, sy0 - 1.)));
      mir = (max(texture(surf, uv).rgb - .01, 0.) * .85 + texture(bloom, uv).rgb * 1.4) * smoothstep(1., .97, uv.y); }
    float sinE = clamp(dy * 1., 0., 1.);
    float Fr = .04 + .96 * pow(1. - sinE, 5.);
    float gs = min(380., kf / 2.5);
    float glint = .15 + 2.2 * pow(vn(P * gs), 4.) + .6 * vn(P * gs * .35);
    float wetness = mix(.25, 1., wet);
    vec3 refl = mix(rgh * (.3 + .7 * Fr) * glint * wetness, mir * (.62 + .38 * Fr) + vec3(.004, .006, .012) * (.5 + Fr), pud);
    vec2 luv = ext(vec2(sp.x, sy0 - .5 * K));
    vec3 Lf = texture(light, luv).rgb * exp(-max(z, 0.) * .7) * 2.2;
    col = alb * (Lf + floorAmb) * (1. - .5 * pud) + refl;
    col += floorAmb * 1.6 * (1. - pud) * glint * (.4 + .6 * wet);
    float rim = (1. - smoothstep(0., .012 + pw, abs(pn + (z > 2.62 ? .02 : -.02) - th - .007))) * smoothstep(60., 200., kf);
    col += rim * (rgh * .6 + vec3(.008, .01, .016)) * wet;
    col += splash(P) * (rgh * 3. + Lf * 2. + vec3(.04, .045, .06));
    col += pud * min(length(g), 1.2) * vec3(.025, .03, .045);
    col *= smoothstep(-.02, .1, z) * .6 + .4;
    lightUV = ext(vec2(sp.x, sy0 - off * .5));
  }
  float ra = texture(rain, vec2(sp.x / R.x, 1. - sp.y / R.y)).a;
  vec3 Lr = texture(light, lightUV).rgb + texture(bloom, lightUV).rgb;
  col += ra * (Lr * 1.2 + vec3(.012, .015, .024));
  o = vec4(col, 1.);
}`);

  const POST = prog(COMMON + `uniform vec2 R; uniform sampler2D src; uniform vec2 mT; uniform float mS; uniform float mR; uniform float exposure; uniform float t; uniform vec3 lift; uniform float vig;
vec3 at(vec2 sp){ return texture(src, vec2(sp.x / R.x, 1. - sp.y / R.y)).rgb; }
void main(){
  vec2 sp = vec2(gl_FragCoord.x, R.y - gl_FragCoord.y);
  vec2 c = R * .5; vec2 d = sp - c;
  vec2 v = mT + d * mS + vec2(-d.y, d.x) * mR;
  vec3 col = vec3(0.);
  float n = 1.; if (length(v) > 1.5) n = clamp(floor(length(v) / 3.), 6., 24.);
  float jit = h12(sp * 1.37 + fract(t * 7.));
  for (int i = 0; i < 24; i++){
    if (float(i) >= n) break;
    float f = n > 1. ? (float(i) + jit) / n - .5 : 0.;
    vec2 q = sp - v * f;
    vec2 ca = (q - c) / R.x * 2.2;
    col += vec3(at(q + ca).r, at(q).g, at(q - ca).b);
  }
  col /= n;
  col *= exposure;
  col = 1. - exp(-col * 1.15);
  col = pow(col, vec3(.95)) + lift;
  col *= 1. - vig * pow(length(d / R) * 1.25, 2.2);
  col += (h12(sp + fract(t) * 91.) - .5) / 255.;
  o = vec4(col, 1.);
}`);

  const bindTex = (unit, t) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); };
  const upload = (t, canvas) => { gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, canvas); };
  const uploadPM = (t, canvas) => { gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, canvas); };
  const draw = (tg, w, h) => { gl.bindFramebuffer(gl.FRAMEBUFFER, tg ? tg.fb : null); gl.viewport(0, 0, w, h); gl.drawArrays(gl.TRIANGLES, 0, 3); };

  function runChain(up, weights) {
    for (let i = NL - 1; i >= 0; i--) {
      gl.useProgram(UP.pr);
      bindTex(0, i < NL - 1 ? up[i + 1].t : lv[i].t); bindTex(1, lv[i].t);
      gl.uniform1i(UP.u.coarse, 0); gl.uniform1i(UP.u.fine, 1);
      const cw = i < NL - 1 ? up[i + 1].w : lv[i].w, ch = i < NL - 1 ? up[i + 1].h : lv[i].h;
      gl.uniform2f(UP.u.ts, 0.5 / cw, 0.5 / ch); gl.uniform2f(UP.u.sz, up[i].w, up[i].h);
      gl.uniform1f(UP.u.wf, weights[i]); gl.uniform1f(UP.u.hasC, i < NL - 1 ? 1 : 0);
      draw(up[i], up[i].w, up[i].h);
    }
  }
  // light lobes in metres -> pyramid level weights at the current scale
  const LOBES = [[0.02, 1.3], [0.06, 1.0], [0.18, 0.65], [0.5, 0.45], [1.4, 0.32], [3.2, 0.13]];
  function lightWeights(K, D) {
    const w = new Array(NL).fill(0), rmax = 3 * Math.pow(2, NL - 1);
    for (const [r, a] of LOBES) {
      const rpx = Math.min(r * K * 0.5, rmax);
      const Lf = Math.max(0, Math.min(NL - 1, Math.log2(Math.max(rpx, 3) / 3)));
      const i0 = Math.floor(Lf), fr = Lf - i0;
      const amt = a * r / D * 0.32;
      w[i0] += amt * (1 - fr); if (i0 + 1 < NL) w[i0 + 1] += amt * fr;
    }
    return w;
  }
  const BLOOMW = [0.10, 0.14, 0.16, 0.14, 0.12, 0.09, 0.06, 0.04];

  // u: {mode, A:[a,b,c,d] (column-major mat2), B:[x,y], K, lx, ly, E, F, t, amb, gain, bld, bldC, wet, rain, calm, drop, wetW, mT, mS, mR, exposure, lift, vig, bloomGain, tubeD}
  function frame(c, u) {
    upload(T.prof, c.prof); upload(T.tcol, c.tcol); uploadPM(T.ovl, c.ovl); upload(T.add, c.add); upload(T.emit, c.emit); uploadPM(T.rain, c.rain);
    gl.useProgram(DOWN.pr);
    for (let i = 1; i < NL; i++) {
      bindTex(0, lv[i - 1].t); gl.uniform1i(DOWN.u.src, 0);
      gl.uniform2f(DOWN.u.ts, 1 / lv[i - 1].w, 1 / lv[i - 1].h); gl.uniform2f(DOWN.u.sz, lv[i].w, lv[i].h);
      draw(lv[i], lv[i].w, lv[i].h);
    }
    runChain(upL, lightWeights(u.K, u.tubeD).map(x => x * (u.lightGain ?? 1)));
    runChain(upB, (u.bloomW || BLOOMW).map(x => x * (u.bloomGain ?? 1)));
    gl.useProgram(SURF.pr);
    gl.uniform2f(SURF.u.R, W, CHT); gl.uniform1i(SURF.u.mode, u.mode); gl.uniformMatrix2fv(SURF.u.A, false, u.A); gl.uniform2f(SURF.u.B, u.B[0], u.B[1]);
    gl.uniform1f(SURF.u.K, u.K); gl.uniform1f(SURF.u.t, u.t); gl.uniform3fv(SURF.u.amb, u.amb); gl.uniform1f(SURF.u.gain, u.gain); gl.uniform1f(SURF.u.wetW, u.wet); gl.uniform3fv(SURF.u.envC, u.envC);
    gl.uniform4fv(SURF.u.bld, u.bld); gl.uniform3fv(SURF.u.bldC, u.bldC);
    bindTex(0, upL[0].t); bindTex(1, T.prof); bindTex(2, T.tcol); bindTex(3, T.ovl); bindTex(4, T.add);
    gl.uniform1i(SURF.u.light, 0); gl.uniform1i(SURF.u.prof, 1); gl.uniform1i(SURF.u.tcol, 2); gl.uniform1i(SURF.u.ovl, 3); gl.uniform1i(SURF.u.addT, 4);
    draw(surfT, W, CHT);
    gl.useProgram(FIN.pr);
    gl.uniform2f(FIN.u.R, W, H); gl.uniform1f(FIN.u.TOPR, TOP); gl.uniform1f(FIN.u.CHT, CHT); gl.uniform1i(FIN.u.mode, u.mode); gl.uniform1f(FIN.u.K, u.K); gl.uniform2f(FIN.u.L, u.lx, u.ly); gl.uniform1f(FIN.u.E, u.E); gl.uniform1f(FIN.u.FL, u.F); gl.uniform1f(FIN.u.t, u.t);
    gl.uniform4fv(FIN.u.drop, u.drop); gl.uniform1f(FIN.u.wet, u.wet); gl.uniform1f(FIN.u.rainA, u.rain); gl.uniform1f(FIN.u.calm, u.calm); gl.uniform4fv(FIN.u.pud1, u.pud1); gl.uniform4fv(FIN.u.pud2, u.pud2); gl.uniform3fv(FIN.u.floorAmb, u.floorAmb); gl.uniform1f(FIN.u.dropS, u.dropS ?? 0.42);
    bindTex(0, surfT.t); bindTex(1, upB[0].t); bindTex(2, upL[0].t); bindTex(3, T.rain);
    gl.uniform1i(FIN.u.surf, 0); gl.uniform1i(FIN.u.bloom, 1); gl.uniform1i(FIN.u.light, 2); gl.uniform1i(FIN.u.rain, 3);
    draw(finT, W, H);
    gl.useProgram(POST.pr);
    gl.uniform2f(POST.u.R, W, H); gl.uniform2f(POST.u.mT, u.mT[0], u.mT[1]); gl.uniform1f(POST.u.mS, u.mS); gl.uniform1f(POST.u.mR, u.mR);
    gl.uniform1f(POST.u.exposure, u.exposure); gl.uniform1f(POST.u.t, u.t); gl.uniform3fv(POST.u.lift, u.lift); gl.uniform1f(POST.u.vig, u.vig);
    bindTex(0, finT.t); gl.uniform1i(POST.u.src, 0);
    draw(null, W, H);
  }
  return { frame, EW, EH };
}
