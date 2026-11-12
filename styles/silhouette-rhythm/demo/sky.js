// Sky, sea, sun, god rays and silhouette compositing in one fragment shader.
// Inputs: three canvases (F = silhouettes, R = their reflections, X = water fx) as textures.
// Camera is a level pinhole over a flat lagoon: u,v are tangent angles (v>0 above the horizon).
window.SKY = (function () {
  const VS = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const FS = `precision highp float;
uniform vec2 R; uniform float T, HOR, FPX, YAW, CX, CH, SUNR, PH, PULSE, FLASH, RAYS;
uniform vec2 SUN; uniform float VS;
uniform sampler2D TF, TR, TX;
float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<6;i++){s+=a*n(p);p=mat2(1.6,1.2,-1.2,1.6)*p+vec2(1.7,9.2);a*=.5;}return s;}
vec3 rampA(float v){
  vec3 c=vec3(1.,.70,.28);
  c=mix(c,vec3(1.,.50,.12),smoothstep(.0,.035,v));
  c=mix(c,vec3(.99,.30,.17),smoothstep(.02,.11,v));
  c=mix(c,vec3(.88,.14,.36),smoothstep(.08,.22,v));
  c=mix(c,vec3(.50,.07,.42),smoothstep(.18,.38,v));
  c=mix(c,vec3(.22,.04,.32),smoothstep(.34,.65,v));
  return c;
}
vec3 rampB(float v){
  vec3 c=vec3(1.,.50,.18);
  c=mix(c,vec3(.97,.24,.24),smoothstep(.0,.035,v));
  c=mix(c,vec3(.80,.10,.40),smoothstep(.02,.11,v));
  c=mix(c,vec3(.50,.07,.48),smoothstep(.08,.22,v));
  c=mix(c,vec3(.26,.05,.40),smoothstep(.18,.38,v));
  c=mix(c,vec3(.10,.03,.24),smoothstep(.34,.65,v));
  return c;
}
vec3 ramp(float v){ v*=VS; return mix(rampA(v),rampB(v),clamp(PH,0.,1.)); }
float sunDist(float u,float v){ return length(vec2(u-SUN.x,v-SUN.y)); }
vec3 sky(float u,float v){
  vec3 c=ramp(v);
  float r=sunDist(u,v);
  float pul=1.+.25*PULSE;
  c+=vec3(1.,.50,.16)*exp(-r/(.09/VS))*.45*pul+vec3(1.,.75,.40)*exp(-r/(SUNR*.9))*.6*pul;
  c+=vec3(1.,.45,.2)*exp(-abs(v-SUN.y)/.01)*exp(-abs(u-SUN.x)/.35)*.18;   // horizontal flare band
  // clouds on a perspective plane (long sunset streaks)
  float z=1./(max(v,0.)+.022);
  vec2 q=vec2(u*z*.75+CX*.004+T*.025,z*.42);
  vec2 wq=q*vec2(.55,1.)+vec2(0.,3.); wq+=.6*vec2(fbm(wq*.5+1.),fbm(wq*.5+7.));
  float dn=fbm(wq);
  vec2 toS=normalize(vec2(SUN.x-u,SUN.y-v)+1e-4);
  float dn2=fbm(wq+toS*vec2(.05,-.08));
  float cov=mix(.47,.42,smoothstep(.02,.3,v));
  float cl=smoothstep(cov,cov+.18,dn)*smoothstep(.006,.05,v);
  float lit=clamp((dn-dn2)*10.+.4,0.,1.);
  float near=exp(-r/.18);
  vec3 dark=ramp(v+.12)*vec3(.62,.45,.62)*mix(1.,1.6,near);
  vec3 litc=mix(vec3(1.,.42,.30),vec3(1.,.66,.28),near)*1.15;
  vec3 cc=mix(dark,litc,pow(lit,1.3)*(.55+.45*near));
  cc*=.86+.28*fbm(q*vec2(2.,7.)+5.);
  c=mix(c,cc,cl*.9);
  return c;
}
float island(float u){
  float a=smoothstep(-.9,-.75,u)*(1.-smoothstep(-.42,-.3,u));
  float b=smoothstep(.25,.36,u)*(1.-smoothstep(.62,.8,u))*.7;
  float c2=smoothstep(.95,1.1,u);
  float m=a+b+c2*.8;
  return m*(.004+.02*pow(fbm(vec2(u*9.,2.3)),1.7));
}
void main(){
  vec2 px=vec2(gl_FragCoord.x,R.y-gl_FragCoord.y);
  vec2 uv=px/R;
  float u=(px.x-R.x*.5)/FPX+YAW;
  float v=(HOR-px.y)/FPX;
  vec3 col;
  float sunR=SUNR;
  if(v>=0.){
    col=sky(u,v);
    float isl=island(u);
    if(v<isl) col=mix(col,ramp(.05)*vec3(.42,.22,.36),.9);
  } else {
    float dv=-v, z=CH/dv;
    float wx=CX+(u-YAW)*z;
    vec2 wp=vec2(wx,z);
    float a1=n(vec2(wp.x*1.6,wp.y*3.2+T*.6)), a2=n(vec2(wp.x*4.1-T*.4,wp.y*9.));
    float du=(a1-.5)*.010+(a2-.5)*.006;
    float rv=dv+(a1-.5)*dv*.25;
    col=sky(u+du,rv)*vec3(.80,.66,.72);
    float isl=island(u+du);
    if(rv<isl*.9) col=mix(col,ramp(.05)*vec3(.30,.14,.26),.85);
    // sun glitter column
    float gx=abs(u-SUN.x);
    float wcol=SUNR*1.4+dv*.6;
    float sp=smoothstep(.55,.9,n(vec2(wp.x*6.,wp.y*14.+T*2.)));
    col+=vec3(1.,.72,.34)*exp(-gx*gx/(wcol*wcol))*(.35+1.3*sp)*exp(-dv*4.)*(1.+.3*PULSE);
    col*=mix(1.,.62,smoothstep(.0,.35,dv));
    col=mix(col,ramp(.0)*.95,exp(-dv*260.)*.5);
  }
  // sun disc (clipped by the horizon)
  float r=sunDist(u,v);
  float disc=smoothstep(sunR,sunR-1.5/FPX,r)*step(island(u),v);
  col=mix(col,vec3(1.25,1.08,.82),disc);
  // reflections of the silhouettes (wobbled by ripples)
  if(v<0.){
    float dv=-v;
    float wob=(n(vec2(px.y*.09/(R.y/1080.),T*3.))-.5)*7.*(R.y/1080.)*(.4+dv*6.);
    float ra=texture2D(TR,(px+vec2(wob,0.))/R).a;
    float ra2=texture2D(TR,(px+vec2(wob*.5,2.*(R.y/1080.)))/R).a;
    ra=max(ra,ra2*.8);
    col=mix(col,col*vec3(.08,.04,.07),ra*.88);
  }
  // water fx: ripples and droplets catch the sky light
  vec4 fx=texture2D(TX,uv);
  vec3 fxc=mix(vec3(1.,.62,.42),vec3(1.,.88,.62),exp(-abs(u-SUN.x)/.12));
  col+=fxc*fx.a*.85;
  // silhouettes
  float a=texture2D(TF,uv).a;
  vec2 sunPx=vec2((SUN.x-YAW)*FPX+R.x*.5,HOR-SUN.y*FPX);
  vec2 sd=sunPx-px; float sl=length(sd); vec2 sdir=sd/max(sl,1.);
  // god rays: radial blur of the sun glow, masked by the silhouettes (jittered march toward the sun)
  float acc=0.,acc0=0.,wsum=0.;
  float mlen=min(sl,R.y*.75);
  vec2 st=sdir*mlen/56.;
  vec2 pp=px+st*h(px*.01+T);
  float dec=1.;
  for(int i=0;i<56;i++){
    pp+=st;
    float occ=1.-texture2D(TF,pp/R).a;
    float pu=(pp.x-R.x*.5)/FPX+YAW, pv=(HOR-pp.y)/FPX;
    float l=exp(-sunDist(pu,pv)/(SUNR*3.5));
    acc+=occ*l*dec; acc0+=l*dec; wsum+=dec; dec*=.975;
  }
  acc/=wsum; acc0/=wsum;
  float sh=acc0>.002?acc/acc0:1.;
  vec3 rayc=vec3(1.,.62,.30);
  float dsk=smoothstep(SUNR*.9,SUNR*1.6,sunDist(u,v));
  col*=mix(1.,.72+.28*sh,RAYS*(1.-a)*smoothstep(.0,.08,acc0)*dsk);
  col+=rayc*acc*RAYS*.65*(1.-a)*(1.+.4*PULSE);
  // backlit rim on the sun-facing edges + soft halo outside the silhouettes
  float e=1.6*(R.y/1080.);
  float a2=texture2D(TF,(px+sdir*e*1.5)/R).a;
  float rim=a*(1.-a2);
  float near=exp(-sl/(R.y*.55));
  vec3 fig=vec3(.035,.012,.028);
  col=mix(col,fig,a);
  col+=vec3(1.,.62,.3)*rim*(.35+1.2*near)*(1.+.3*PULSE);
  float halo=0.;
  for(int i=0;i<8;i++){ float an=float(i)*.785; halo+=texture2D(TF,(px+vec2(cos(an),sin(an))*e*5.)/R).a; }
  halo=halo/8.*(1.-a);
  col+=vec3(1.,.5,.25)*halo*.22*(.3+near);
  // flash on the climax beat
  col+=vec3(1.,.75,.6)*FLASH*.35*(1.-a*.85);
  // vignette
  vec2 cuv=uv-.5; col*=1.-dot(cuv,cuv)*.55;
  col=mix(col,.82+.18*(1.-exp(-(col-.82)/.18)),step(.82,col));  // soft knee only above .82
  col=clamp(col,0.,1.);
  gl_FragColor=vec4(col,1.);
}`;
  function make(canvas) {
    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: false });
    function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; const u = n => U[n] || (U[n] = gl.getUniformLocation(prog, n));
    const tex = [];
    for (let i = 0; i < 3; i++) {
      const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      tex.push(t);
    }
    gl.uniform1i(u('TF'), 0); gl.uniform1i(u('TR'), 1); gl.uniform1i(u('TX'), 2);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    return function draw(P, layers) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      layers.forEach((c, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex[i]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c); });
      gl.uniform2f(u('R'), canvas.width, canvas.height);
      gl.uniform1f(u('T'), P.T); gl.uniform1f(u('HOR'), P.hor); gl.uniform1f(u('FPX'), P.fpx); gl.uniform1f(u('YAW'), P.yaw);
      gl.uniform1f(u('CX'), P.cx); gl.uniform1f(u('CH'), P.ch); gl.uniform1f(u('SUNR'), P.sunR); gl.uniform1f(u('PH'), P.ph);
      gl.uniform1f(u('PULSE'), P.pulse); gl.uniform1f(u('FLASH'), P.flash); gl.uniform1f(u('RAYS'), P.rays);
      gl.uniform2f(u('SUN'), P.sun[0], P.sun[1]); gl.uniform1f(u('VS'), P.vs || 1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.finish();
    };
  }
  return { make };
})();
