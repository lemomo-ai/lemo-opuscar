// Shared GLSL: noise, the facade layout (mirrors layout.js), the radiometric model and the iron palette.
import { B, BAYS, PHYS } from './layout.js';
const f = v => (Math.round(v * 10000) / 10000).toFixed(4);

export const NOISE = `
float h11(float p){ p=fract(p*.1031); p*=p+33.33; p*=p+p; return fract(p); }
float h21(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float h31(vec3 p3){ p3=fract(p3*.1031); p3+=dot(p3,p3.zyx+31.32); return fract((p3.x+p3.y)*p3.z); }
vec2 h22(vec2 p){ vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3+=dot(p3,p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
float vn2(vec2 x){ vec2 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
float vn3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm2(vec2 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*vn2(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return s; }
float fbm3(vec3 p){ float a=.5,s=0.; for(int i=0;i<4;i++){ s+=a*vn3(p); p=p*2.03+vec3(1.7,9.2,4.1); a*=.5; } return s; }
`;

// facade layout: which bay a facade x falls in, and the window rectangle for (bay, floor)
export const LAYOUT = `
const float BX0=${f(B.X0)}, BUW=${f(B.UW)}, BPL=${f(B.PL)}, BFH=${f(B.FH)}, BROOF=${f(B.ROOF)}, BPAR=${f(B.PAR)};
const float BAYX0[5]=float[5](${BAYS.map(b => f(b.x0)).join(',')});
const float BAYX1[5]=float[5](${BAYS.map(b => f(b.x1)).join(',')});
const float BAYK[5]=float[5](${BAYS.map(b => (b.k === 'A' ? '0.' : b.k === 'B' ? '1.' : '2.')).join(',')});
float yFl(float fl){ return BPL+BFH*fl; }
// nearest bay to x: returns bay index (0..4) and unit; lx is x inside the unit
void bayOf(float x, out float u, out int bi, out float lx){
  u=clamp(floor((x-BX0)/BUW),0.,2.); lx=x-BX0-u*BUW; bi=0; float best=1e9;
  for(int i=0;i<5;i++){ float c=.5*(BAYX0[i]+BAYX1[i]); float d=abs(lx-c); if(d<best){best=d;bi=i;} }
}
vec4 winRect(int bi, float fl, float u){   // x0,y0,x1,y1 in world
  float x0=BX0+u*BUW+BAYX0[bi], x1=BX0+u*BUW+BAYX1[bi]; float k=BAYK[bi];
  float y0 = k>1.5 ? yFl(fl)+2.35 : k>.5 ? yFl(fl)+.9 : yFl(fl)+1.0;
  float y1 = k>1.5 ? yFl(fl)+3.35 : k>.5 ? yFl(fl)+2.4 : yFl(fl)+2.68;
  return vec4(x0,y0,x1,y1);
}
// signed distance to a rectangle (negative inside)
float sdRect(vec2 p, vec4 r){ vec2 c=.5*(r.xy+r.zw), h=.5*(r.zw-r.xy); vec2 d=abs(p-c)-h; return length(max(d,0.))+min(max(d.x,d.y),0.); }
`;

// radiometric model: what the camera reads off a surface
export const THERMO = `
uniform float uTout;
// apparent temperature of the scene reflected in direction R (world): overcast night sky above, snow and walls below
float envT(vec3 R){
  if(R.y>0.){ float k=pow(clamp(R.y,0.,1.),.55); return mix(-11.,-26.,k); }
  return mix(-7.5,-8.5,clamp(-R.y*2.,0.,1.));
}
// T: true surface °C, eps: normal emissivity
float apparent(float T, float eps, vec3 N, vec3 V){
  float ndv=clamp(abs(dot(N,V)),0.,1.);
  float e=eps*(1.-.55*pow(1.-ndv,5.));
  vec3 R=reflect(-V,N);
  return e*T+(1.-e)*envT(R);
}
`;

export const PHYS_GLSL = `
const float P_WALL=${f(PHYS.wall)}, P_WALLA=${f(PHYS.wallAfter)}, P_BEAM=${f(PHYS.beam)}, P_BEAMA=${f(PHYS.beamAfter)};
const float P_NICHE=${f(PHYS.niche)}, P_NICHEA=${f(PHYS.nicheAfter)}, P_STAIR=${f(PHYS.stairWall)}, P_LEAK=${f(PHYS.leak)};
`;

// iron palette (black-blue-purple-magenta-orange-yellow-white)
export const IRON = `
vec3 iron(float v){
  v=clamp(v,0.,1.);
  vec3 c0=vec3(0.0,0.0,0.03), c1=vec3(0.07,0.02,0.33), c2=vec3(0.30,0.03,0.58), c3=vec3(0.60,0.07,0.58), c4=vec3(0.86,0.20,0.32), c5=vec3(0.98,0.47,0.07), c6=vec3(1.0,0.75,0.13), c7=vec3(1.0,0.98,0.86);
  if(v<0.10) return mix(c0,c1,v/0.10);
  if(v<0.25) return mix(c1,c2,(v-0.10)/0.15);
  if(v<0.40) return mix(c2,c3,(v-0.25)/0.15);
  if(v<0.55) return mix(c3,c4,(v-0.40)/0.15);
  if(v<0.70) return mix(c4,c5,(v-0.55)/0.15);
  if(v<0.86) return mix(c5,c6,(v-0.70)/0.16);
  return mix(c6,c7,(v-0.86)/0.14);
}
`;
export const IRON_STOPS = [[0, [0, 0, 8]], [0.10, [18, 5, 84]], [0.25, [77, 8, 148]], [0.40, [153, 18, 148]], [0.55, [219, 51, 82]], [0.70, [250, 120, 18]], [0.86, [255, 191, 33]], [1, [255, 250, 219]]];
