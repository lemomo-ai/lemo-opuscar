// The building: walls with real openings, reveals, sills, frames, glass with fake rooms behind, balconies, entrances,
// air-conditioner units, window cages, drying poles, awnings, downpipes, cables, roof. Each part has a picture and a thermal material.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { B, BAYS, WINDOWS, LEAKY, yF, BALC_D } from './layout.js';
import { TM, TMC, add, U, MESHES } from './thermal.js';
import { patch, snowy, plateTex } from './photo.js';
import { NOISE, LAYOUT } from './glsl.js';
import { mulberry } from './util.js';

const bx = (x0, y0, z0, x1, y1, z1) => new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
function quad(a, b, c, d) {   // a b c d counter-clockwise seen from the front
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...d], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); return g;
}
const merge = (arr) => mergeGeometries(arr.map(g => g.index ? g : g), false);
// attach per-window attributes (aWin: col,row,w,h; aUV: position inside the window rect) to a geometry
function winAttrs(g, w, rect) {
  const p = g.attributes.position, n = p.count; const aw = new Float32Array(n * 4), au = new Float32Array(n * 2);
  const [x0, y0, x1, y1, axis] = rect;
  for (let i = 0; i < n; i++) {
    aw.set([w.col, w.row, x1 - x0, y1 - y0], i * 4);
    const h = axis === 'z' ? p.getZ(i) : p.getX(i);
    au.set([(h - x0) / (x1 - x0), (p.getY(i) - y0) / (y1 - y0)], i * 2);
  }
  g.setAttribute('aWin', new THREE.BufferAttribute(aw, 4)); g.setAttribute('aUV', new THREE.BufferAttribute(au, 2));
  return g;
}

// ---------------------------------------------------------------- wall shading (picture)
const WALL_HEAD = `
uniform float uFace, uSpill;
vec3 lightCol(float k){ return k<.25? vec3(1.,.58,.26) : k<.75 ? vec3(1.,.78,.52) : vec3(.70,.83,1.); }
vec4 winPic(float u, int bi, float fl){ int col=int(u)*5+bi; int row = BAYK[bi]>1.5 ? 8+int(fl) : int(fl); return texelFetch(tWinPic, ivec2(col,row),0); }
vec3 brick(vec2 q, float fw, out float hgt){
  const float CH=.0625;
  float row=floor(q.y/CH);
  float hdr=step(2.5,mod(row,4.));                   // every fourth course is headers (3 stretchers, 1 header)
  float bl=mix(.25,.125,hdr);
  float off=mix(mod(row,2.)*.125,.0625,hdr);
  float xx=q.x+off; vec2 cell=vec2(floor(xx/bl),row);
  float fx=fract(xx/bl)*bl, fy=fract(q.y/CH)*CH;
  float jx=min(fx,bl-fx), jy=min(fy,CH-fy);
  float aa=max(fw*.8,.0012);
  float mort=max(1.-smoothstep(.0045-aa,.0045+aa,jx), 1.-smoothstep(.0045-aa,.0045+aa,jy));
  float r=h21(cell*vec2(1.37,7.11)+3.);
  vec3 bc=mix(vec3(.27,.13,.095), vec3(.42,.22,.16), r);
  bc=mix(bc, vec3(.20,.09,.07), step(.86,h21(cell+11.3))*.85);
  bc=mix(bc, vec3(.52,.33,.24), step(.92,h21(cell+5.7))*.7);
  bc*=.84+.32*vn2(q*60.+cell*7.);
  vec3 mc=vec3(.44,.42,.39)*(.8+.35*vn2(q*24.));
  float far=smoothstep(.010,.028,fw);
  vec3 c=mix(mix(bc,mc,mort), mix(vec3(.335,.17,.125),mc,.2)*(.9+.2*vn2(cell*.37)), far);
  hgt=(1.-mort)*(1.-far);
  return c;
}
vec3 facade(vec3 p, out float rough, out float hgt){
  vec2 q=vec2((uFace>.5&&uFace<1.5)? p.z : p.x, p.y);
  float fw=max(fwidth(q.x),fwidth(q.y));
  vec3 c=brick(q,fw,hgt); rough=.9;
  vec3 conc=vec3(.42,.41,.385)*(.8+.32*fbm2(q*2.3))*(.9+.15*vn2(q*40.));
  float band=0.;
  for(int k=1;k<=6;k++){ float yb=yFl(float(k)); band=max(band, step(yb-.26,q.y)*step(q.y,yb+.10)); }
  if(band>.5){ c=conc; hgt=.25*vn2(q*30.); }
  if(q.y<BPL){ c=vec3(.33,.325,.31)*(.75+.4*fbm2(q*4.)); hgt=.3*vn2(q*40.); rough=.96; }
  if(q.y>BPAR-.05) c=conc;
  float stain=0.;
  if(uFace<.5){
    float u; int bi; float lx; bayOf(q.x,u,bi,lx);
    float fl=floor((q.y-BPL)/BFH);
    if(BAYK[bi]>.5 && fl>=0.){
      for(int k=0;k<2;k++){
        float f2=fl-float(k); if(f2<0.) continue;
        if(BAYK[bi]>1.5 && f2>4.) continue;
        vec4 r=winRect(bi,f2,u);
        if(BAYK[bi]<1.5 && k==0 && q.x>r.x-.12 && q.x<r.z+.12 && q.y>r.w && q.y<r.w+.18){ c=conc*.92; hgt=.2; }
        float below=r.y-q.y;
        if(below>0. && q.x>r.x-.1 && q.x<r.z+.1){
          float len=.5+1.6*h11(u*31.+f2*7.+float(bi));
          float st=vn2(vec2(q.x*34.,q.y*1.3+u*5.));
          float edge=exp(-pow((q.x-r.x)/.06,2.))+exp(-pow((q.x-r.z)/.06,2.));
          stain=max(stain,(1.-smoothstep(0.,len,below))*(smoothstep(.4,.8,st)*.7+edge*.5));
        }
        float lk=texelFetch(tWinTh, ivec2(int(u)*5+bi, int(f2)),0).b;
        float above=q.y-r.w;
        if(lk>0. && above>.18){ float wd=.22+above*.3; float m=exp(-pow((q.x-.5*(r.x+r.z))/wd,2.))*exp(-above/1.4)*min(lk*2.,1.);
          stain=max(stain,m*(.55+.45*vn2(q*vec2(14.,2.5)))); }
      }
    }
    // rain water from the downpipe joints
    float dp=min(min(abs(q.x-(BX0+.2)),abs(q.x-(BX0+BUW))), min(abs(q.x-(BX0+2.*BUW)),abs(q.x-(BX0+3.*BUW-.2))));
    stain=max(stain,exp(-pow(dp/.18,2.))*.6*vn2(vec2(q.x*20.,q.y*.7)));
  }
  c*=1.-.42*stain;
  c*=mix(.62,1.,smoothstep(.05,.9,q.y));                          // splash band
  c*=1.-.32*smoothstep(BPAR-2.2,BPAR,q.y)*smoothstep(.3,.75,vn2(vec2(q.x*18.,q.y*.6)));   // run-off below the coping
  c*=.84+.3*fbm2(q*.33);
  c=mix(c,c*vec3(1.1,1.06,1.0)+.03,smoothstep(.72,.9,fbm2(q*.9+4.))*.35);   // efflorescence
  if(uAfter>.5){
    vec3 rc=vec3(.66,.62,.56);
    if(q.y<1.25) rc=vec3(.36,.335,.31);
    for(int k=1;k<=5;k++){ float yb=yFl(float(k)); if(abs(q.y-(yb-.05))<.14) rc=vec3(.55,.47,.40); }
    if(q.y>BPAR-.5) rc=vec3(.55,.47,.40);
    rc*=.94+.08*vn2(q*70.)+.04*fbm2(q*.6);
    rc*=mix(.85,1.,smoothstep(.0,.7,q.y));
    c=rc; rough=.85; hgt=.4*vn2(q*160.)*(1.-smoothstep(.004,.012,fw));
  }
  return c;
}
vec3 spill(vec3 p){
  if(uFace>.5) return vec3(0.);
  float u; int bi; float lx; bayOf(p.x,u,bi,lx);
  if(BAYK[bi]<.5) return vec3(0.);
  vec3 acc=vec3(0.); float fl0=floor((p.y-BPL)/BFH);
  for(int k=-1;k<=0;k++){
    float fl=fl0+float(k);
    if(fl<0.||fl>5.) continue;
    if(BAYK[bi]>1.5 && fl>4.) continue;
    if(BAYK[bi]<1.5 && k<0) continue;
    vec4 r=winRect(bi,fl,u); float d=sdRect(p.xy,r);
    vec4 wp=winPic(u,bi,fl);
    float rev=smoothstep(-.004,-.03,p.z);
    acc+=wp.x*(1.-.5*wp.z)*(exp(-max(d,0.)/.18)*.22+rev*exp(-max(d,0.)/.06))*lightCol(wp.y);
  }
  return acc*uSpill;
}`;
export function wallMat(face) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0 });
  return patch(m, {
    uniforms: { uFace: { value: face }, uSpill: U.uSpill }, head: WALL_HEAD,
    albedo: `{ float r,h; vec3 c=facade(vWP,r,h); diffuseColor.rgb=c; gRough=r; gHgt=h; }`,
    bump: '0.0035', emis: 'gEmis+=spill(vWP);',
  });
}
// thermal of the walls
const WALL_T_HEAD = `
float plumeAt(vec2 q, vec4 r, float lk){
  vec2 d=q-vec2(.5*(r.x+r.z),r.w);
  if(d.y<-.05||lk<=0.) return 0.;
  float w=.20+max(d.y,0.)*.38;
  float n=fbm2(vec2(d.x*3.2+lk*7.,d.y*1.7-uTime*.9));
  float wisp=.6+.4*sin(d.x*9.+d.y*3.-uTime*2.+n*4.);
  float core=exp(-pow(d.x/.42,2.))*exp(-max(d.y,0.)/.2)*(.75+.5*n)*11.;
  return lk*(core+exp(-pow((d.x-.08*sin(d.y*2.2+uTime*.7))/w,2.))*exp(-max(d.y,0.)/.95)*(.3+1.15*n)*wisp*15.)*smoothstep(-.05,.05,d.y);
}`;
export function wallTherm(face) {
  return TMC(`
float A=uAfter;
vec2 q=vec2((uFace>.5&&uFace<1.5)? vW.z : vW.x, vW.y);
float base=mix(P_WALL,P_WALLA,A); T=base;
float bands=0.;
for(int k=1;k<=6;k++){ float d=(q.y-(yFl(float(k))-.08))/.2; bands=max(bands,exp(-d*d)); }
T+=bands*(mix(P_BEAM,P_BEAMA,A)-base);
T+=exp(-pow((q.y-.45)/.3,2.))*mix(.9,.05,A);
T-=smoothstep(BROOF+.1,BPAR,q.y)*mix(1.,.3,A);
if(uFace<.5){
  float u; int bi; float lx; bayOf(q.x,u,bi,lx);
  float fl=clamp(floor((q.y-BPL)/BFH),0.,5.);
  float cx=1e9; for(int k=0;k<4;k++) cx=min(cx,abs(q.x-(BX0+float(k)*BUW)));
  T+=exp(-pow(cx/.25,2.))*mix(.9,.06,A);
  float sx0=BX0+u*BUW+BAYX0[2]-.4, sx1=BX0+u*BUW+BAYX1[2]+.4;
  float inS=smoothstep(sx0-.25,sx0+.25,q.x)*(1.-smoothstep(sx1-.25,sx1+.25,q.x))*smoothstep(.3,.6,q.y)*(1.-smoothstep(BROOF-.3,BROOF,q.y));
  T+=inS*(1.-A)*(P_STAIR-P_WALL);
  for(int j=0;j<2;j++){
    int b=j==0?1:3;
    vec4 r=winRect(b,fl,u);
    vec4 th=texelFetch(tWinTh, ivec2(int(u)*5+b,int(fl)),0);
    float on=step(14.,th.x);
    vec4 nr=vec4(r.x+.1,yFl(fl)+.12,r.z-.1,yFl(fl)+.82);
    float dn=sdRect(q,nr);
    T+=on*(1.-smoothstep(-.05,.16,dn))*(mix(P_NICHE,P_NICHEA,A)-base)*(.85+.15*(th.x-18.)/4.);
    float dl=sdRect(q,vec4(r.x-.12,r.w,r.z+.12,r.w+.2));
    T+=(1.-smoothstep(-.02,.1,dl))*mix(.8,.05,A);
    float dw=sdRect(q,r);
    T+=exp(-max(dw,0.)/.08)*mix(1.2,.15,A);
    float rx= j==0 ? r.x-.24 : r.z+.24;
    float riser=exp(-pow((q.x-rx)/.075,2.))*step(.3,q.y)*step(q.y,yFl(5.)+2.45);
    float by=yFl(fl)+.62; float xa=min(rx, j==0? nr.x : nr.z), xb=max(rx, j==0? nr.x : nr.z);
    float branch=exp(-pow((q.y-by)/.06,2.))*smoothstep(xa-.02,xa+.02,q.x)*(1.-smoothstep(xb-.02,xb+.02,q.x))*on;
    // return pipe along the floor, from the far end of the radiator back to the riser
    float ry=yFl(fl)+.2; float ra=min(rx, j==0? nr.z : nr.x), rb=max(rx, j==0? nr.z : nr.x);
    float ret=exp(-pow((q.y-ry)/.05,2.))*smoothstep(ra-.02,ra+.02,q.x)*(1.-smoothstep(rb-.02,rb+.02,q.x))*on;
    float vein=max(riser*3.0,max(branch*2.6,ret*1.9));
    T+=vein*mix(1.,.07,A);
    T+=(1.-A)*plumeAt(q,r,th.z);
    if(fl>0.){ vec4 r2=winRect(b,fl-1.,u); vec4 t2=texelFetch(tWinTh, ivec2(int(u)*5+b,int(fl)-1),0); T+=(1.-A)*plumeAt(q,r2,t2.z); }
  }
  // stairwell windows and the entrance: warm frames, door head leak
  vec4 sr=winRect(2,fl,u); T+=exp(-max(sdRect(q,sr),0.)/.07)*mix(.7,.1,A);
  vec4 dr=vec4(BX0+u*BUW+BAYX0[2],.45,BX0+u*BUW+BAYX1[2],2.55);
  vec2 dd=q-vec2(.5*(dr.x+dr.z),dr.w);
  T+=(1.-A)*exp(-pow(dd.x/.55,2.))*exp(-max(dd.y,0.)/.5)*step(-.05,dd.y)*2.2;
}
T+=(fbm2(q*.9)-.5)*.35+(vn2(q*7.)-.5)*.12;
eps=.93;`, { uFace: { glsl: 'float', value: face } }, THREE.FrontSide, { fhead: WALL_T_HEAD });
}

// ---------------------------------------------------------------- glass with a room behind (picture)
const GLASS_VS = `
attribute vec3 aO; attribute vec3 aT; attribute vec4 aRoom; attribute vec4 aWin; attribute vec2 aUV;
varying vec3 vRL; varying vec3 vRD; varying vec4 vRoom; varying vec4 vWin; varying vec2 vUV; varying vec3 vWPos; varying vec3 vNw;
void main(){
  vec4 w=modelMatrix*vec4(position,1.);
  vec3 N=normalize(cross(aT,vec3(0.,1.,0.)));
  vec3 rel=w.xyz-aO; vRL=vec3(dot(rel,aT),rel.y,dot(rel,N));
  vec3 d=w.xyz-cameraPosition; vRD=vec3(dot(d,aT),d.y,dot(d,N));
  vRoom=aRoom; vWin=aWin; vUV=aUV; vWPos=w.xyz; vNw=N;
  gl_Position=projectionMatrix*viewMatrix*w;
}`;
const GLASS_FS = NOISE + `
uniform sampler2D tWinPic; uniform vec3 uLamp[5]; uniform float uTime, uAfter, uRoomGain;
varying vec3 vRL; varying vec3 vRD; varying vec4 vRoom; varying vec4 vWin; varying vec2 vUV; varying vec3 vWPos; varying vec3 vNw;
vec3 lightCol(float k){ return k<.25? vec3(1.,.58,.26) : k<.75 ? vec3(1.,.80,.55) : vec3(.72,.84,1.); }
vec3 curtCol(float s){ return s<.2? vec3(.75,.62,.42) : s<.4? vec3(.55,.16,.12) : s<.55? vec3(.30,.40,.62) : s<.7? vec3(.40,.52,.36) : s<.85? vec3(.85,.80,.70) : vec3(.70,.45,.30); }
vec3 roomCol(vec3 o, vec3 d, vec4 rm, vec4 pic, float seed, float winW){
  float RW=rm.x, RH=rm.y, RD=rm.z, kind=rm.w;
  float tx=d.x>0.?(RW*.5-o.x)/d.x:(-RW*.5-o.x)/d.x;
  float ty=d.y>0.?(RH-o.y)/d.y:(-o.y)/d.y;
  float tz=(-RD-o.z)/d.z;
  float t=min(tx,min(ty,tz)); vec3 p=o+d*t;
  float s1=h11(seed*91.7), s2=h11(seed*13.3), s3=h11(seed*57.1), s4=h11(seed*7.9);
  vec3 wallC= s1<.4? vec3(.78,.76,.70) : s1<.6? vec3(.80,.73,.58) : s1<.8 ? vec3(.62,.72,.64) : vec3(.68,.72,.80);
  if(kind>.5&&kind<1.5) wallC= p.y<1.2 ? vec3(.22,.42,.36) : vec3(.70,.70,.66);
  vec3 alb=wallC; float emit=0.; float isCeil=0.;
  if(t==tz){
    if(kind<.5){
      float fx=(s2-.5)*RW*.45;
      if(s3<.4 && abs(p.x-fx)<.6 && p.y<2.0) alb=vec3(.30,.20,.12)*(.8+.4*step(.5,fract((p.x-fx)*1.6)));
      else if(s3<.75 && abs(p.x-fx)<.9 && p.y<.85) alb=(s2<.5? vec3(.40,.20,.13) : vec3(.24,.30,.44))*(.85+.15*step(.55,p.y));
      if(abs(p.x+fx*.7)<.3 && abs(p.y-1.6)<.22) alb=vec3(.20,.18,.15)+.4*vn2(p.xy*9.);
      if(pic.w<.12 && s4>.4){ if(abs(p.x-fx)<.45 && abs(p.y-1.05)<.27) { alb=vec3(.02); emit=1.; } }
    } else if(kind>1.5){
      // balcony back wall: the flat's door and window, lit from inside
      alb=vec3(.62,.6,.56);
      float door=step(abs(p.x+RW*.18),.42)*step(p.y,2.05);
      float win=step(abs(p.x-RW*.22),.55)*step(.85,p.y)*step(p.y,2.05);
      if(door+win>.5){ alb=vec3(0.); emit=2.; }
      if(abs(p.x-RW*.4)<.3 && p.y<1.4) alb=vec3(.25,.2,.15);
    }
  } else if(t==ty){
    if(d.y>0.){ alb=vec3(.82,.82,.8); isCeil=1.; }
    else alb= s2<.5? vec3(.40,.26,.16)*(.85+.3*step(.5,fract(p.x*3.3))) : vec3(.55,.53,.50)*(.85+.3*step(.5,fract(p.x*2.)+fract(p.z*2.)));
  } else {
    alb=wallC*.92;
    if(kind<.5 && s2>.6 && p.y<1.9 && p.z<-1.2 && p.z>-2.1) alb=vec3(.28,.18,.11);
  }
  vec3 Lc=lightCol(pic.y); float lit=pic.x;
  vec3 lp=vec3(0.,RH-.12,-RD*.5);
  float dl=length(lp-p);
  float ill=.2+1.25/(1.+dl*dl*.5);
  float ao=.55+.45*smoothstep(0.,.45,min(min(RW*.5-abs(p.x),p.y),min(RH-p.y,RD+p.z)));
  vec3 col=alb*ill*Lc*lit*ao;
  if(isCeil>.5 && length(p.xz-lp.xz)<.2) col+=Lc*lit*5.;
  if(emit>.5 && emit<1.5) col+=lit*vec3(.25,.45,.9)*(.6+.4*sin(uTime*7.+seed*40.)*sin(uTime*2.3));
  if(emit>1.5) col+=lit*Lc*mix(vec3(1.6),curtCol(s3)*1.2,step(.4,pic.z));
  col+=alb*vec3(.0015,.002,.003);
  return col;
}
void main(){
  vec4 pic=texelFetch(tWinPic, ivec2(int(vWin.x),int(vWin.y)),0);
  float seed=pic.w; float kind=vRoom.w;
  vec3 o=vRL; vec3 d=normalize(vRD);
  vec3 inside=roomCol(o,d,vRoom,pic,seed,vWin.z);
  // curtains just behind the glass
  if(kind<.5 || kind>1.5){
    float tc=(-.12-o.z)/d.z; vec3 pc=o+d*tc;
    float hw=vWin.z*.5+.15; float cl=pic.z;
    float gap=(1.-cl)*hw;
    float s3=h11(seed*57.1);
    float fold=.55+.45*sin(pc.x*26.+seed*20.)*sin(pc.x*7.3+seed*3.);
    float hem=step(pc.y-o.y+.0, 2.6);
    if(cl>.05 && abs(pc.x)>gap && abs(pc.x)<hw+.3){
      vec3 cc=curtCol(s3);
      vec3 back=cc*lightCol(pic.y)*pic.x*(.35+.45*fold)*.75;
      bool sheer=h11(seed*3.3)>.72;
      inside= sheer ? mix(inside, back*1.3+inside*.2, .55) : back+cc*vec3(.002,.0025,.004);
    }
  }
  vec3 V=normalize(vWPos-cameraPosition); vec3 N=vNw;
  float wav=(1.-uAfter)*.03;
  vec3 Nr=normalize(N+wav*vec3(vn2(vUV*vec2(3.,2.)+seed*9.)-.5, vn2(vUV*vec2(2.,4.)+seed*5.)-.5,0.));
  vec3 R=reflect(V,Nr);
  float F=.04+.96*pow(1.-clamp(abs(dot(-V,Nr)),0.,1.),5.);
  vec3 env= R.y>0. ? mix(vec3(.018,.016,.022),vec3(.004,.005,.010),pow(clamp(R.y,0.,1.),.45)) : vec3(.012,.012,.014);
  for(int i=0;i<5;i++){ vec3 L=uLamp[i]-vWPos; float dl=length(L); env+=vec3(1.,.72,.42)*pow(max(dot(R,L/dl),0.),600.)*60./(1.+dl*.05); }
  float dirt=(1.-uAfter)*vn2(vUV*vec2(9.,6.)+seed*10.);
  vec3 col=inside*uRoomGain*(1.-F)*(.9-.15*dirt)+env*(F+.05)+vec3(.006,.006,.007)*dirt;
  gl_FragColor=vec4(col,1.);
}`;
export function glassPhoto() {
  return new THREE.ShaderMaterial({ vertexShader: GLASS_VS, fragmentShader: GLASS_FS, uniforms: { ...U, uRoomGain: U.uRoomGain } });
}
export function glassTherm() {
  return TMC(`
vec4 th=texelFetch(tWinTh, ivec2(int(vWin.x),int(vWin.y)),0);
T=th.y;
float kind=vRoom.w;
T+=(1.-uAfter)*step(kind,.5)*exp(-vUV.y/.22)*1.4;
float edge=min(min(vUV.x,1.-vUV.x)*vWin.z,min(vUV.y,1.-vUV.y)*vWin.w);
T+=exp(-edge/.07)*mix(1.6,.6,uAfter);
T+=th.z*(1.-uAfter)*(exp(-(1.-vUV.y)*vWin.w/.06)*(P_LEAK-th.y)+exp(-vUV.x*vWin.z/.05)*.5*(P_LEAK-th.y));
T+=(vn2(vUV*vec2(5.,3.)+vWin.xy)-.5)*.3;
eps=.84;`, {}, THREE.FrontSide, {
    vhead: 'attribute vec4 aWin; attribute vec2 aUV; attribute vec4 aRoom; varying vec4 vWin; varying vec2 vUV; varying vec4 vRoom;',
    vbody: 'vWin=aWin; vUV=aUV; vRoom=aRoom;', fhead: 'varying vec4 vWin; varying vec2 vUV; varying vec4 vRoom;' });
}
function frameTherm() {
  return TMC(`
vec4 th=texelFetch(tWinTh, ivec2(int(vWin.x),int(vWin.y)),0);
float st=th.w;
T=th.y+(st<1.5? 1.8 : .7)*(1.-uAfter)+uAfter*.4;
T+=th.z*(1.-uAfter)*(exp(-(1.-vUV.y)*vWin.w/.08)*(P_LEAK+1.-th.y)+exp(-vUV.x*vWin.z/.08)*.6*(P_LEAK-th.y));
T+=1.5*smoothstep(.7,.95,N.y)*-1.;
eps= st<.5 ? .9 : st<1.5 ? .3 : .92;`, {}, THREE.FrontSide, {
    vhead: 'attribute vec4 aWin; attribute vec2 aUV; varying vec4 vWin; varying vec2 vUV;', vbody: 'vWin=aWin; vUV=aUV;', fhead: 'varying vec4 vWin; varying vec2 vUV;' });
}
// window frames by style (members as boxes); returns geometry with window attributes
function frameParts(w, style, rect, z0, z1, axis = 'x') {
  const [x0, y0, x1, y1] = rect; const P = [];
  const t = style === 'new' ? .065 : style === 'steel' ? .035 : style === 'alu' ? .045 : .06;
  const B3 = (a0, b0, a1, b1) => axis === 'x' ? bx(a0, b0, z0, a1, b1, z1) : bx(z0, b0, a0, z1, b1, a1);
  P.push(B3(x0, y0, x1, y0 + t), B3(x0, y1 - t, x1, y1), B3(x0, y0, x0 + t, y1), B3(x1 - t, y0, x1, y1));
  const W = x1 - x0, H = y1 - y0, m = t * .8;
  if (w.k === 'A') {
    const n = axis === 'x' ? 4 : 1;
    for (let i = 1; i < n; i++) { const xx = x0 + W * i / n; P.push(B3(xx - m / 2, y0, xx + m / 2, y1)); }
    if (style === 'steel') P.push(B3(x0, y0 + H * .72 - m / 2, x1, y0 + H * .72 + m / 2));
    if (style === 'new') P.push(B3(x0, y0 + H * .7 - m / 2, x1, y0 + H * .7 + m / 2));
  } else if (style === 'steel') {
    const ty = y0 + H * .72; P.push(B3(x0, ty - m / 2, x1, ty + m / 2));
    for (const k of [1 / 3, 2 / 3]) P.push(B3(x0 + W * k - m / 2, y0, x0 + W * k + m / 2, y1));
    P.push(B3(x0, y0 + H * .36 - m / 3, x1, y0 + H * .36 + m / 3));
  } else if (style === 'alu') {
    P.push(B3(x0 + W / 2 - m, y0, x0 + W / 2 + m, y1));
  } else if (style === 'wood') {
    const ty = y0 + H * .74; P.push(B3(x0, ty - m / 2, x1, ty + m / 2)); P.push(B3(x0 + W / 2 - m / 2, y0, x0 + W / 2 + m / 2, y1));
  } else {   // pvc / new
    const ty = y0 + H * .74; P.push(B3(x0, ty - m / 2, x1, ty + m / 2)); P.push(B3(x0 + W * .5 - m / 2, y0, x0 + W * .5 + m / 2, ty));
  }
  return P.map(g => winAttrs(g, w, [x0, y0, x1, y1, axis]));
}

// ---------------------------------------------------------------- build
export function buildBuilding(scene) {
  const R = mulberry(77);
  const G = new THREE.Group(); scene.add(G);
  const wallF = wallMat(0), wallG = wallMat(1), wallB = wallMat(2);
  const wallFT = wallTherm(0), wallGT = wallTherm(1), wallBT = wallTherm(2);

  // ---- front wall with openings
  const sh = new THREE.Shape(); sh.moveTo(B.X0, 0); sh.lineTo(B.X1, 0); sh.lineTo(B.X1, B.PAR); sh.lineTo(B.X0, B.PAR); sh.closePath();
  const holes = [];
  for (const w of WINDOWS) if (w.k !== 'A') holes.push([w.x0, w.y0, w.x1, w.y1, 0.13]);
  for (let u = 0; u < B.NU; u++) { const ux = B.X0 + u * B.UW; holes.push([ux + BAYS[2].x0, B.PL, ux + BAYS[2].x1, B.PL + 2.1, 0.28]); }
  for (const [x0, y0, x1, y1] of holes) { const p = new THREE.Path(); p.moveTo(x0, y0); p.lineTo(x0, y1); p.lineTo(x1, y1); p.lineTo(x1, y0); p.closePath(); sh.holes.push(p); }
  const front = new THREE.ShapeGeometry(sh);
  const reveals = [];
  for (const [x0, y0, x1, y1, d] of holes) {
    reveals.push(quad([x0, y0, 0], [x0, y0, -d], [x0, y1, -d], [x0, y1, 0]));       // left jamb faces +x
    reveals.push(quad([x1, y0, -d], [x1, y0, 0], [x1, y1, 0], [x1, y1, -d]));       // right jamb faces -x
    reveals.push(quad([x0, y1, 0], [x0, y1, -d], [x1, y1, -d], [x1, y1, 0]));       // head faces -y
    reveals.push(quad([x0, y0, -d], [x0, y0, 0], [x1, y0, 0], [x1, y0, -d]));       // bottom faces +y
  }
  add(G, front, wallF, wallFT);
  add(G, merge(reveals), wallF, wallFT);
  // gables, back, parapet inner faces
  add(G, quad([B.X0, 0, -B.DEPTH], [B.X0, 0, 0], [B.X0, B.PAR, 0], [B.X0, B.PAR, -B.DEPTH]), wallG, wallGT);
  add(G, quad([B.X1, 0, 0], [B.X1, 0, -B.DEPTH], [B.X1, B.PAR, -B.DEPTH], [B.X1, B.PAR, 0]), wallG, wallGT);
  add(G, quad([B.X1, 0, -B.DEPTH], [B.X0, 0, -B.DEPTH], [B.X0, B.PAR, -B.DEPTH], [B.X1, B.PAR, -B.DEPTH]), wallB, wallBT);
  const pi = .24, inner = [
    quad([B.X1 - pi, B.ROOF, -pi], [B.X0 + pi, B.ROOF, -pi], [B.X0 + pi, B.PAR, -pi], [B.X1 - pi, B.PAR, -pi]),
    quad([B.X0 + pi, B.ROOF, -B.DEPTH + pi], [B.X1 - pi, B.ROOF, -B.DEPTH + pi], [B.X1 - pi, B.PAR, -B.DEPTH + pi], [B.X0 + pi, B.PAR, -B.DEPTH + pi]),
    quad([B.X0 + pi, B.ROOF, -pi], [B.X0 + pi, B.ROOF, -B.DEPTH + pi], [B.X0 + pi, B.PAR, -B.DEPTH + pi], [B.X0 + pi, B.PAR, -pi]),
    quad([B.X1 - pi, B.ROOF, -B.DEPTH + pi], [B.X1 - pi, B.ROOF, -pi], [B.X1 - pi, B.PAR, -pi], [B.X1 - pi, B.PAR, -B.DEPTH + pi])];
  add(G, merge(inner), wallB, wallBT);

  // ---- coping, ring of concrete with snow on top
  const concrete = snowy({ color: 0x6d6a64, roughness: .9 }, { cover: .95, head: '', albedo: 'diffuseColor.rgb*=.8+.35*fbm2(vWP.xz*1.7+vWP.y);' });
  const concT = TM({ T: -6.2, TA: -6.6, top: -2.2, noise: .3, ns: 2, world: true, eps: .93 });
  const cop = [bx(B.X0 - .04, B.PAR, -B.DEPTH - .04, B.X1 + .04, B.PAR + .07, -B.DEPTH + .3), bx(B.X0 - .04, B.PAR, -.3, B.X1 + .04, B.PAR + .07, .05),
    bx(B.X0 - .04, B.PAR, -B.DEPTH, B.X0 + .3, B.PAR + .07, 0), bx(B.X1 - .3, B.PAR, -B.DEPTH, B.X1 + .04, B.PAR + .07, 0)];
  add(G, merge(cop), concrete, concT);
  // plinth lip
  add(G, bx(B.X0 - .03, 0, -.0, B.X1 + .03, .42, .035), concrete, TM({ T: -4.6, TA: -5.8, top: -2, eps: .93, noise: .3, ns: 2, world: true }));

  // ---- sills
  const sills = [];
  for (const w of WINDOWS) if (w.k !== 'A') sills.push(bx(w.x0 - .06, w.y0 - .06, -.02, w.x1 + .06, w.y0, .07));
  const sillMat = snowy({ color: 0x77736c, roughness: .85 }, { cover: 1.1, thr: .5, albedo: 'if(uAfter>.5) diffuseColor.rgb=vec3(.58,.58,.56);' });
  add(G, merge(sills), sillMat, TM({ T: -5.4, TA: -6.3, top: -2.4, eps: .93, noise: .2, ns: 3, world: true }));

  // ---- glass + frames for room windows and stair windows
  const glassP = glassPhoto(), glassT = glassTherm();
  const frameT = frameTherm();
  const glassGeos = [], frames = { steel: [], alu: [], pvc: [], wood: [], new: [] };
  function pushGlass(w, corners, O, T, room) {
    const g = quad(...corners);
    const n = 4; const aO = new Float32Array(n * 3), aT = new Float32Array(n * 3), aR = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { aO.set(O, i * 3); aT.set(T, i * 3); aR.set(room, i * 4); }
    g.setAttribute('aO', new THREE.BufferAttribute(aO, 3)); g.setAttribute('aT', new THREE.BufferAttribute(aT, 3)); g.setAttribute('aRoom', new THREE.BufferAttribute(aR, 4));
    g.deleteAttribute('uv');
    const axis = Math.abs(T[0]) > .5 ? 'x' : 'z';
    const xs = corners.map(c => axis === 'x' ? c[0] : c[2]), ys = corners.map(c => c[1]);
    winAttrs(g, w, [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), axis]);
    if (axis === 'z' && T[2] < 0) { const au = g.attributes.aUV; for (let i = 0; i < au.count; i++) au.setX(i, 1 - au.getX(i)); }
    glassGeos.push(g);
  }
  for (const w of WINDOWS) {
    if (w.k === 'A') continue;
    const z = -.085, fy = w.k === 'S' ? w.y0 - 1.0 : yF(w.f);
    pushGlass(w, [[w.x0, w.y0, z], [w.x1, w.y0, z], [w.x1, w.y1, z], [w.x0, w.y1, z]], [(w.x0 + w.x1) / 2, fy, z], [1, 0, 0],
      w.k === 'S' ? [2.6, 3.0, 4.5, 1] : [3.3, 2.7, 4.2, 0]);
    frames[w.style].push(...frameParts(w, w.style, [w.x0, w.y0, w.x1, w.y1], -.115, -.06));
    frames.new.push(...frameParts(w, 'new', [w.x0, w.y0, w.x1, w.y1], -.125, -.055));
  }

  // ---- balconies
  const balcSlab = [], balcPar = [], balcSoff = [];
  const parCol = [];
  for (const w of WINDOWS) {
    if (w.k !== 'A') continue;
    const x0 = w.x0, x1 = w.x1, D = BALC_D, yf = yF(w.f), top = yf + 1.0, gy1 = yf + 2.68;
    balcSlab.push(bx(x0 - .06, yf - .12, 0, x1 + .06, yf, D + .06));
    if (w.f === 0) balcSlab.push(bx(x0, 0, D - .12, x1, yf, D));
    const par = [bx(x0, yf, D - .12, x1, top, D), bx(x0, yf, 0, x0 + .12, top, D - .12), bx(x1 - .12, yf, 0, x1, top, D - .12),
      bx(x0 - .03, top, D - .15, x1 + .03, top + .05, D + .03), bx(x0 - .03, top, -.0, x0 + .15, top + .05, D - .15), bx(x1 - .15, top, 0, x1 + .03, top + .05, D - .15)];
    if (w.f === 0) par.push(bx(x0, 0, 0, x0 + .12, yf, D), bx(x1 - .12, 0, 0, x1, yf, D));
    const pc = [[.78, .74, .64], [.70, .70, .66], [.80, .70, .56], [.66, .70, .68], [.84, .80, .72]][Math.floor(w.seed * 5)];
    for (const g of par) { const n = g.attributes.position.count; const c = new Float32Array(n * 3); for (let i = 0; i < n; i++) c.set(pc, i * 3); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); balcPar.push(g); }
    // glazing: front + two sides
    const gz = D - .06, gx0 = x0 + .06, gx1 = x1 - .06;
    pushGlass(w, [[gx0, top + .05, gz], [gx1, top + .05, gz], [gx1, gy1, gz], [gx0, gy1, gz]], [(gx0 + gx1) / 2, top + .05 - 1.0, gz], [1, 0, 0], [gx1 - gx0, 2.7, D - .1, 2]);
    pushGlass(w, [[gx0, top + .05, 0], [gx0, top + .05, gz], [gx0, gy1, gz], [gx0, gy1, 0]].map((c, i) => c), [gx0, top + .05 - 1.0, gz / 2], [0, 0, 1], [D - .1, 2.7, gx1 - gx0, 3]);
    pushGlass(w, [[gx1, top + .05, gz], [gx1, top + .05, 0], [gx1, gy1, 0], [gx1, gy1, gz]], [gx1, top + .05 - 1.0, gz / 2], [0, 0, -1], [D - .1, 2.7, gx1 - gx0, 3]);
    for (const st of [w.style, 'new']) {
      const z0 = st === 'new' ? gz - .03 : gz - .025, z1 = st === 'new' ? gz + .04 : gz + .03;
      frames[st].push(...frameParts(w, st, [gx0, top + .05, gx1, gy1], z0, z1));
      frames[st].push(...frameParts(w, st, [0, top + .05, gz, gy1], gx0 - .03, gx0 + .03, 'z'));
      frames[st].push(...frameParts(w, st, [0, top + .05, gz, gy1], gx1 - .03, gx1 + .03, 'z'));
    }
  }
  add(G, merge(balcSlab), concrete, TM({ T: -2.6, TA: -5.8, top: -2.4, eps: .93, noise: .3, ns: 3, world: true }));
  const parMat = snowy({ color: 0xffffff, vertexColors: true, roughness: .92 }, { cover: 1, thr: .6,
    albedo: 'diffuseColor.rgb*=.75+.35*fbm2(vWP.xy*vec2(1.4,2.2));\n diffuseColor.rgb*=1.-.35*smoothstep(.45,.9,vn2(vec2(vWP.x*18.,vWP.y*1.1)))*smoothstep(.2,1.,fract((vWP.y-.45)/2.8));\n if(uAfter>.5) diffuseColor.rgb=vec3(.64,.60,.54)*(.95+.08*vn2(vWP.xy*60.));' });
  add(G, merge(balcPar), parMat, TM({ T: -4.0, TA: -5.9, top: -2.5, eps: .93, noise: .35, ns: 2.5, world: true, hot: [] }));

  // glass and frames
  const glassMesh = add(G, merge(glassGeos), glassP, glassT, { cast: false, recv: false });
  const fMats = {
    steel: snowy({ color: 0x41504c, roughness: .55, metalness: .2 }, { cover: .9 }),
    alu: snowy({ color: 0xa6a9ab, roughness: .38, metalness: .85 }, { cover: .9 }),
    pvc: snowy({ color: 0xd6d4cc, roughness: .45 }, { cover: .9 }),
    wood: snowy({ color: 0x5a3b26, roughness: .7 }, { cover: .9 }),
    new: snowy({ color: 0xe4e3de, roughness: .4 }, { cover: .9 })};
  const frameMeshes = {};
  for (const k in frames) if (frames[k].length) { frameMeshes[k] = add(G, merge(frames[k]), fMats[k], frameT); frameMeshes[k].userData.state = k === 'new' ? 'after' : 'before'; }

  // ---- entrances
  const entr = [], doors = [];
  const doorMat = patch(new THREE.MeshStandardMaterial({ color: 0x2e4a3a, roughness: .5, metalness: .3 }), {
    albedo: `{ vec2 q=vec2(vWP.x,vWP.y); float cx=floor((q.x-BX0)/BUW)*BUW+BX0+${(BAYS[2].x0 + BAYS[2].x1) / 2};
      float lx=q.x-cx, ly=q.y-${B.PL};
      float pan=step(.08,abs(abs(lx)-.3))*step(.1,abs(ly-.55))*step(.1,abs(ly-1.55));
      diffuseColor.rgb*=.75+.3*pan;
      if(ly>1.45 && ly<1.95 && abs(lx)<.42) diffuseColor.rgb=mix(vec3(.02),diffuseColor.rgb,step(.5,fract(lx*14.)));
      if(abs(lx-.42)<.07 && abs(ly-1.15)<.14) diffuseColor.rgb=vec3(.55,.56,.58);
      diffuseColor.rgb*=1.-.4*smoothstep(.5,.9,vn2(q*vec2(9.,2.)));
      if(uAfter>.5) diffuseColor.rgb=vec3(.12,.12,.13)*(1.+.3*pan); }` });
  const stepsMat = snowy({ color: 0x6a6762, roughness: .9 }, { cover: 1.2, thr: .5, mask: 'smoothstep(.35,.6,abs(fract((vWP.x-BX0)/BUW)*BUW-' + ((BAYS[2].x0 + BAYS[2].x1) / 2).toFixed(3) + '))' });
  const lampHouse = new THREE.MeshStandardMaterial({ color: 0x9a9a96, roughness: .5, metalness: .4 });
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffc58a, emissiveIntensity: 9 });
  const entranceLights = [];
  for (let u = 0; u < B.NU; u++) {
    const ux = B.X0 + u * B.UW, cx = ux + (BAYS[2].x0 + BAYS[2].x1) / 2;
    doors.push(bx(cx - .6, B.PL, -.3, cx + .6, B.PL + 2.1, -.28));
    for (let s = 0; s < 3; s++) entr.push(bx(cx - .95 + s * .0, s * .15, 0, cx + .95, (s + 1) * .15, 1.0 - s * .3));
    const can = bx(cx - 1.05, 2.72, 0, cx + 1.05, 2.84, 1.15);
    add(G, can, concrete, concT);
    add(G, bx(cx - .09, 2.6, .18, cx + .09, 2.72, .36), lampHouse, TM({ T: 18, eps: .9 }), { cast: false });
    const bulb = add(G, new THREE.SphereGeometry(.055, 16, 8).translate(cx, 2.585, .27), bulbMat, TM({ T: 46, eps: .9 }), { cast: false });
    const pl = new THREE.PointLight(0xffb070, 5, 9, 2); pl.position.set(cx, 2.45, .45); G.add(pl); entranceLights.push(pl);
    // unit sign beside the door
    const sign = new THREE.MeshStandardMaterial({ map: plateTex([{ text: `${u + 1}单元`, size: 74, y: 64 }], 256, 128), roughness: .6 });
    add(G, new THREE.PlaneGeometry(.36, .18).translate(cx + .95, 2.05, .012), sign, TM({ T: -5, eps: .9 }), { cast: false });
  }
  add(G, merge(doors), doorMat, TMC(`T=mix(-3.2,-5.4,uAfter)+(1.-uAfter)*exp(-pow((vW.y-2.53)/.06,2.))*7.; eps=.9;`), {});
  add(G, merge(entr), stepsMat, TM({ T: -6.5, top: -1.6, eps: .93, noise: .3, ns: 3, world: true }));
  // building number plate on the left corner
  const bp = new THREE.MeshStandardMaterial({ map: plateTex([{ text: '7号楼', size: 96, y: 92 }], 320, 180), roughness: .6 });
  add(G, new THREE.PlaneGeometry(.5, .28).translate(B.X0 + .55, 3.1, .012), bp, TM({ T: -5, eps: .9 }), { cast: false });

  // ---- air-conditioner outdoor units
  const acBody = [], acGrille = [], acBr = [], acPipe = [];
  const acSpots = [];
  for (const w of WINDOWS) {
    if (w.k === 'S') continue;
    const r = R();
    if (w.k === 'B' && r < .42 && !(w.u === 1 && w.f >= 1 && w.f <= 3) && w !== LEAKY) acSpots.push({ x: w.x0 + (w.seed < .5 ? -.05 : w.x1 - w.x0 - .85), y: w.y0 - .78, z: 0 });
    if (w.k === 'A' && r < .5) acSpots.push({ x: w.x0 + .3 + (w.x1 - w.x0 - 1.4) * w.seed, y: yF(w.f) + .18, z: BALC_D });
  }
  for (const s of acSpots) {
    const x0 = s.x, x1 = s.x + .8, y0 = s.y, y1 = s.y + .55, z0 = s.z + .1, z1 = s.z + .4;
    acBody.push(bx(x0, y0, z0, x1, y1, z1));
    acGrille.push(new THREE.CircleGeometry(.2, 28).translate(x0 + .3, (y0 + y1) / 2, z1 + .003));
    acBr.push(bx(x0 + .08, y0 - .04, s.z, x0 + .12, y0, z1 + .02), bx(x1 - .12, y0 - .04, s.z, x1 - .08, y0, z1 + .02), bx(x0 + .08, y0 - .3, s.z, x0 + .12, y0 - .04, s.z + .04), bx(x1 - .12, y0 - .3, s.z, x1 - .08, y0 - .04, s.z + .04));
    const pts = [new THREE.Vector3(x1 - .05, (y0 + y1) / 2, z0 + .05), new THREE.Vector3(x1 + .12, (y0 + y1) / 2, z0 - .02), new THREE.Vector3(x1 + .15, y1 + .25, s.z + .05), new THREE.Vector3(x1 + .1, y1 + .55, s.z + .02)];
    acPipe.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, .025, 6));
  }
  const acMat = snowy({ color: 0xd8d6cf, roughness: .55 }, { cover: 1, albedo: 'diffuseColor.rgb*=1.-.35*smoothstep(.4,.9,vn2(vec2(vWP.x*30.,vWP.y*4.)))*smoothstep(.0,.3,fract(vWP.y*1.9));' });
  add(G, merge(acBody), acMat, TM({ T: -6.6, top: -2, eps: .9, noise: .2, ns: 4, world: true }));
  const grilleMat = patch(new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: .7, metalness: .3 }), { albedo: 'diffuseColor.rgb*=.4+.6*step(.5,fract(length(vLP.xy)*45.));' });
  add(G, merge(acGrille), grilleMat, TM({ T: -7, eps: .85 }), { cast: false });
  add(G, merge(acBr), new THREE.MeshStandardMaterial({ color: 0x2c2b2a, roughness: .6, metalness: .6 }), TM({ T: -7, eps: .5 }));
  add(G, merge(acPipe), snowy({ color: 0xe6e3da, roughness: .6 }, { cover: .7 }), TM({ T: -6.2, eps: .9 }));

  // ---- window cages (ground and first floor) with a sheet on top
  const bars = [], cageTops = [];
  for (const w of WINDOWS) {
    if (!w.cage) continue;
    let x0, x1, y0, y1, d, zb;
    if (w.k === 'B') { x0 = w.x0 - .1; x1 = w.x1 + .1; y0 = w.y0 - .2; y1 = w.y1 + .15; d = .42; zb = 0; }
    else { x0 = w.x0 - .05; x1 = w.x1 + .05; y0 = yF(w.f) + .95; y1 = w.y1 + .05; d = .3; zb = BALC_D; }
    const n = Math.round((x1 - x0) / .12);
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; bars.push(bx(x - .007, y0, zb + d - .007, x + .007, y1, zb + d + .007)); }
    for (const y of [y0, y0 + (y1 - y0) * .5, y1]) { bars.push(bx(x0, y - .01, zb + d - .015, x1, y + .01, zb + d + .015)); bars.push(bx(x0 - .007, y - .01, zb, x0 + .007, y + .01, zb + d)); bars.push(bx(x1 - .007, y - .01, zb, x1 + .007, y + .01, zb + d)); }
    for (let i = 0; i <= 3; i++) { const yy = y0 + (y1 - y0) * i / 3; bars.push(bx(x0 - .007, yy, zb, x0 + .007, yy + .01, zb + d)); }
    const ct = new THREE.PlaneGeometry(x1 - x0 + .1, d + .12, 24, 1); ct.rotateX(-Math.PI / 2 + .12); ct.translate((x0 + x1) / 2, y1 + .04, zb + d / 2);
    const p = ct.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + .012 * Math.sin(p.getX(i) * 26));
    ct.computeVertexNormals(); cageTops.push(ct);
  }
  add(G, merge(bars), new THREE.MeshStandardMaterial({ color: 0xb8bcbf, roughness: .3, metalness: 1 }), TM({ T: -6.8, eps: .25 }));
  const sheetMat = snowy({ color: 0x8aa4b6, roughness: .5, side: THREE.DoubleSide }, { cover: 1.3, thr: .4 });
  add(G, merge(cageTops), sheetMat, TM({ T: -7.2, top: -1.5, eps: .9, side: THREE.DoubleSide }));

  // ---- awnings over top-floor windows, drying poles with a few clothes
  const awn = [], poles = [], cloth = [];
  for (const w of WINDOWS) {
    if (w.k === 'B' && w.f === 5 && w.seed < .8) {
      const a = new THREE.PlaneGeometry(w.x1 - w.x0 + .35, .75, 30, 1); a.rotateX(-Math.PI / 2 + .3); a.translate((w.x0 + w.x1) / 2, w.y1 + .3, .34);
      const p = a.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + .018 * Math.sin(p.getX(i) * 24)); a.computeVertexNormals(); awn.push(a);
      awn.push(bx(w.x0 - .1, w.y1 + .1, 0, w.x0 - .08, w.y1 + .32, .7), bx(w.x1 + .08, w.y1 + .1, 0, w.x1 + .1, w.y1 + .32, .7));
    }
    if (w.k === 'A' && w.f === 5) {
      const a = new THREE.PlaneGeometry(w.x1 - w.x0 + .3, BALC_D + .35, 50, 1); a.rotateX(-Math.PI / 2 + .12); a.translate((w.x0 + w.x1) / 2, yF(6) + .05, (BALC_D + .35) / 2);
      const p = a.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + .02 * Math.sin(p.getX(i) * 24)); a.computeVertexNormals(); awn.push(a);
    }
    if (w.k === 'B' && w.f >= 2 && w.f <= 4 && w.seed > .78 && w !== LEAKY) {
      const y = w.y1 + .12, x0 = w.x0 + .15, x1 = w.x1 - .15;
      poles.push(bx(x0 - .012, y - .012, 0, x0 + .012, y + .012, .8), bx(x1 - .012, y - .012, 0, x1 + .012, y + .012, .8), bx(x0, y - .01, .78, x1, y + .01, .8), bx(x0, y - .01, .45, x1, y + .01, .47));
      const cg = new THREE.PlaneGeometry(.42, .62, 6, 8); const p = cg.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, .03 * Math.sin(p.getX(i) * 18 + p.getY(i) * 3));
      cg.translate(x0 + .35, y - .32, .79); cg.computeVertexNormals();
      const n = cg.attributes.position.count, col = new Float32Array(n * 3), cc = [[.62, .18, .16], [.2, .3, .55], [.75, .72, .6]][Math.floor(w.seed * 7) % 3];
      for (let i = 0; i < n; i++) col.set(cc, i * 3); cg.setAttribute('color', new THREE.BufferAttribute(col, 3)); cloth.push(cg);
    }
  }
  add(G, merge(awn), snowy({ color: 0x5f86a3, roughness: .45, side: THREE.DoubleSide, metalness: .1 }, { cover: 1.2, thr: .35 }), TM({ T: -7.4, top: -1.4, eps: .9, side: THREE.DoubleSide }));
  if (poles.length) add(G, merge(poles), new THREE.MeshStandardMaterial({ color: 0xc0c3c5, roughness: .3, metalness: 1 }), TM({ T: -6.8, eps: .3 }));
  if (cloth.length) add(G, merge(cloth), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, side: THREE.DoubleSide }), TM({ T: -7, eps: .95, side: THREE.DoubleSide }));

  // ---- downpipes and cables
  const pipes = [];
  for (const x of [B.X0 + .2, B.X0 + B.UW, B.X0 + 2 * B.UW, B.X1 - .2]) {
    pipes.push(new THREE.CylinderGeometry(.055, .055, B.PAR - .3, 12).translate(x, (B.PAR - .3) / 2 + .1, .13));
    for (let y = 1.5; y < B.PAR; y += 1.8) pipes.push(bx(x - .07, y, .0, x + .07, y + .04, .2));
    pipes.push(new THREE.CylinderGeometry(.06, .06, .35, 12).rotateX(Math.PI / 2 - .5).translate(x, .12, .25));
  }
  add(G, merge(pipes), snowy({ color: 0x8d8f8c, roughness: .55 }, { cover: .5 }), TM({ T: -5.6, eps: .9 }));
  const cab = [];
  const cy = 6.15, hooks = []; for (let x = B.X0 + .3; x <= B.X1 - .3; x += 2.8) hooks.push(x);
  for (let i = 0; i < hooks.length - 1; i++) {
    const a = hooks[i], b = hooks[i + 1]; const pts = [];
    for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push(new THREE.Vector3(a + (b - a) * u, cy - .12 * Math.sin(Math.PI * u), .06)); }
    cab.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, .009, 5));
  }
  for (let u = 0; u < B.NU; u++) { const x = B.X0 + u * B.UW + BAYS[2].x0 - .25; const pts = [new THREE.Vector3(x, cy - .05, .06), new THREE.Vector3(x + .05, 4.6, .05), new THREE.Vector3(x, 3.2, .05), new THREE.Vector3(x + .2, 2.9, .04)]; cab.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, .008, 5)); }
  add(G, merge(cab), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: .6 }), TM({ T: -6.4, eps: .95 }), { cast: false });

  // ---- roof: snow with melted patches over missing insulation, flues (two with gas heaters running), hatches, antennas, solar heaters
  const PATCHES = [[-8.8, -4.2, 1.5, .95], [2.6, -6.6, 1.15, 1.7], [12.4, -3.1, 1.7, 1.05], [-15.6, -7.6, .95, .9], [6.8, -8.6, .8, .6]];
  const FLUES = [];
  for (let u = 0; u < B.NU; u++) for (const dx of [2.9, 10.3]) FLUES.push({ x: B.X0 + u * B.UW + dx, z: -3.6, on: (u === 1 && dx > 5) || (u === 0 && dx < 5) });
  const ROOF_GLSL = `
uniform vec4 uPatch[5]; uniform vec4 uFlue[6];
float patchM(vec2 p){ float m=0.; for(int i=0;i<5;i++){ vec4 q=uPatch[i]; vec2 d=(p-q.xy)/q.zw; float r=length(d)+.18*(vn2(p*2.3+float(i))-.5)+.1*(vn2(p*7.)-.5); m=max(m,1.-smoothstep(.75,1.05,r)); } return m; }
float flueM(vec2 p){ float m=0.; for(int i=0;i<6;i++){ vec2 d=abs(p-uFlue[i].xy)-vec2(.42,.36); float r=max(d.x,d.y); m=max(m,(1.-smoothstep(.0,.35+.1*vn2(p*5.),r))*(.5+.5*uFlue[i].z)); } return m; }`;
  const roofUni = { uPatch: { value: PATCHES.map(p => new THREE.Vector4(...p)) }, uFlue: { value: FLUES.map(f => new THREE.Vector4(f.x, f.z, f.on ? 1 : 0, 0)) } };
  const roofGeo = new THREE.PlaneGeometry(B.X1 - B.X0 - .48, B.DEPTH - .48, 1, 1).rotateX(-Math.PI / 2).translate(0, B.ROOF + .02, -B.DEPTH / 2);
  const roofP = patch(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .85 }), { uniforms: roofUni, head: ROOF_GLSL,
    albedo: `{ vec2 p=vWP.xz; float A=uAfter;
      vec3 snow=SNOWC*(.84+.14*fbm2(p*.8)+.05*vn2(p*12.));
      snow*=1.-.08*smoothstep(.45,.75,fbm2(p*vec2(.4,2.)+7.));
      float pm=patchM(p)*(1.-A), fm=flueM(p)*.9;
      vec3 felt=vec3(.045,.042,.04)*(.8+.4*vn2(p*9.));
      vec3 slush=vec3(.36,.37,.39)*(.85+.3*vn2(p*14.));
      float m=max(pm,fm);
      vec3 c=mix(snow,slush,smoothstep(.0,.35,m));
      c=mix(c,felt,smoothstep(.45,.85,m));
      // drift against the parapet
      float e=min(min(p.x-(${(B.X0 + .24).toFixed(2)}),${(B.X1 - .24).toFixed(2)}-p.x),min(p.y+${(B.DEPTH - .24).toFixed(2)},-.24-p.y));
      c*=1.+.06*(1.-smoothstep(0.,.8,e));
      diffuseColor.rgb=c; gRough=mix(.82,.18,smoothstep(.45,.85,m)); gHgt=vn2(p*18.)*(1.-m); }`, bump: '0.01' });
  const roofT = TMC(`
  vec2 p=vW.xz; float A=uAfter;
  float pm=patchM(p)*(1.-A), fm=flueM(p);
  T=-8.6+(fbm2(p*.7)-.5)*.6;
  T=mix(T,-1.2+(vn2(p*3.)-.5)*.6,smoothstep(.2,.8,pm));
  T=mix(T,-3.5,fm*.8);
  float e=min(min(p.x-(${(B.X0 + .24).toFixed(2)}),${(B.X1 - .24).toFixed(2)}-p.x),min(p.y+${(B.DEPTH - .24).toFixed(2)},-.24-p.y));
  T+=1.2*(1.-smoothstep(0.,.5,e))*(1.-A);
  eps=.96;`, { uPatch: { glsl: 'vec4 uPatch[5]', value: roofUni.uPatch.value }, uFlue: { glsl: 'vec4 uFlue[6]', value: roofUni.uFlue.value } }, THREE.FrontSide, { fhead: ROOF_GLSL.replace('uniform vec4 uPatch[5]; uniform vec4 uFlue[6];', '') });
  add(G, roofGeo, roofP, roofT, { cast: false });
  // flues
  const flueBr = [], flueCap = [];
  for (const f of FLUES) {
    flueBr.push(bx(f.x - .33, B.ROOF, f.z - .28, f.x + .33, B.ROOF + 1.45, f.z + .28));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) flueCap.push(bx(f.x + sx * .27 - .04, B.ROOF + 1.45, f.z + sz * .22 - .04, f.x + sx * .27 + .04, B.ROOF + 1.68, f.z + sz * .22 + .04));
    flueCap.push(bx(f.x - .46, B.ROOF + 1.68, f.z - .4, f.x + .46, B.ROOF + 1.75, f.z + .4));
  }
  const flueOn = FLUES.map(f => f.on ? 1 : 0);
  add(G, merge(flueBr), wallMat(1), TMC(`
  float on=0.; vec2 p=vW.xz; ${FLUES.map((f, i) => `if(distance(p,vec2(${f.x.toFixed(2)},${f.z.toFixed(2)}))<.6) on=${f.on ? '1.' : '0.'};`).join(' ')}
  float h=vW.y-${B.ROOF.toFixed(2)};
  T=-5.2+h*mix(.6,3.6,on); T+=1.4*(1.-smoothstep(0.,.25,h)); if(N.y>.6) T=-8.5;
  eps=.93;`), {});
  add(G, merge(flueCap), concrete, TMC(`
  float on=0.; vec2 p=vW.xz; ${FLUES.map((f, i) => `if(distance(p,vec2(${f.x.toFixed(2)},${f.z.toFixed(2)}))<.8) on=${f.on ? '1.' : '0.'};`).join(' ')}
  T=mix(-6.,-6.+on*30.,smoothstep(.2,-.6,N.y)); if(N.y<.2&&N.y>-.2) T=-5.+on*14.; if(N.y>.6) T=-8.5+on*2.;
  eps=.93;`), {});
  // hatches and antennas
  const misc = [];
  for (let u = 0; u < B.NU; u++) { const x = B.X0 + u * B.UW + 6.6; misc.push(bx(x - .5, B.ROOF, -6.2, x + .5, B.ROOF + .5, -5.2), bx(x - .55, B.ROOF + .5, -6.25, x + .55, B.ROOF + .56, -5.15)); }
  add(G, merge(misc), concrete, TM({ T: -6.6, top: -2, eps: .93, noise: .2, ns: 3, world: true }));
  const ant = [];
  for (const [x, z] of [[-11.5, -7.8], [7.3, -2.1]]) {
    ant.push(new THREE.CylinderGeometry(.025, .03, 3.2, 8).translate(x, B.ROOF + 1.6, z));
    for (let k = 0; k < 7; k++) ant.push(new THREE.CylinderGeometry(.006, .006, .9 - k * .08, 4).rotateZ(Math.PI / 2).translate(x, B.ROOF + 2.0 + k * .16, z));
    for (const a of [0, 2.1, 4.2]) ant.push(new THREE.CylinderGeometry(.004, .004, 3.4, 3).rotateZ(.62).rotateY(a).translate(x + Math.cos(a) * .95, B.ROOF + 1.5, z + Math.sin(a) * .95));
  }
  add(G, merge(ant), new THREE.MeshStandardMaterial({ color: 0x6a6d70, roughness: .4, metalness: .9 }), TM({ T: -7, eps: .3 }), { cast: false });
  // solar water heaters (tank, tubes, frame)
  const sol = [], tubes = [];
  for (const [x, z] of [[-1.8, -8.4], [15.2, -7.2]]) {
    sol.push(new THREE.CylinderGeometry(.21, .21, 2.0, 18).rotateZ(Math.PI / 2).translate(x, B.ROOF + 1.45, z - .9));
    for (let k = 0; k < 14; k++) { const tx = x - .92 + k * .14; tubes.push(new THREE.CylinderGeometry(.029, .029, 1.8, 10).rotateX(-.95).translate(tx, B.ROOF + .75, z)); }
    for (const sx of [-1, 1]) { sol.push(bx(x + sx * 1.0 - .02, B.ROOF, z - 1.0, x + sx * 1.0 + .02, B.ROOF + 1.3, z - .96)); sol.push(new THREE.CylinderGeometry(.02, .02, 1.95, 6).rotateX(-.95).translate(x + sx * 1.0, B.ROOF + .72, z - .02)); }
  }
  add(G, merge(sol), snowy({ color: 0xb8bcc0, roughness: .35, metalness: .7 }, { cover: 1 }), TM({ T: -5.5, top: -2.5, eps: .5 }));
  add(G, merge(tubes), new THREE.MeshStandardMaterial({ color: 0x1b2026, roughness: .05, metalness: .6, envMapIntensity: 1.5 }), TM({ T: -6, eps: .84 }), { cast: false });

  // warm exhaust over the two working flues: billboards, temperature in the thermal pass, faint vapour in the picture
  const plumes = [];
  const PL_COMMON = NOISE + `uniform float uTime; uniform float uSeed; varying vec2 vUv;
float plume(){ vec2 uv=vUv; float y=uv.y;
  float sway=(fbm2(vec2(y*2.1-uTime*.45,uSeed))-.5)*.6*y+.12*y;
  float x=(uv.x-.5-sway)/(.11+.32*y);
  float body=exp(-x*x*2.4);
  float tex=smoothstep(.32,.85,fbm2(vec2(uv.x*4.5+uSeed,y*3.6-uTime*1.1)));
  return body*tex*smoothstep(0.,.05,y)*(1.-smoothstep(.3,1.,y)); }`;
  for (const f of FLUES.filter(f => f.on)) for (let i = 0; i < 2; i++) {
    const g = new THREE.PlaneGeometry(1.6, 4.2).translate(0, 2.1, 0);
    const un = { uTime: U.uTime, uSeed: { value: f.x * .37 + i * 3.1 } };
    const VSP = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }';
    const th = new THREE.ShaderMaterial({ vertexShader: VSP, fragmentShader: PL_COMMON + 'void main(){ float a=plume(); gl_FragColor=vec4(4.+58.*pow(1.-vUv.y,2.6),0.,0.,clamp(a*1.4,0.,.9)); }', uniforms: un, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const ph = new THREE.ShaderMaterial({ vertexShader: VSP, fragmentShader: PL_COMMON + 'void main(){ float a=plume(); gl_FragColor=vec4(vec3(.06,.055,.06),a*.35); }', uniforms: un, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const m = add(G, g, ph, th, { cast: false, recv: false, order: 20 });
    m.position.set(f.x + (i - .5) * .1, B.ROOF + 1.7, f.z + i * .05); plumes.push(m);
  }
  return { group: G, frameMeshes, glassMesh, entranceLights, FLUES, PATCHES, plumes };
}
