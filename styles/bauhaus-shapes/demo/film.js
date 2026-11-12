// Bauhaus Shapes (包豪斯几何) · the demo film «COMPOUND» (52 s), one timeline. Loaded by index.html.
// index.html[?cut=a:b][&pal=X][&sign=1]: render(t) draws film second a+t; window.EV = sound events (absolute film seconds);
// window.TEXTS(t) = every readable on-screen text with its box (subtitles excluded: they are checked from the .srt).
// Story, shots and narration: ../DEMO.md. Voice lines and subtitles: voice/lines.json + VO_T below.
import { clamp, lerp, seg, eo, ei, eio, back } from '/core/lib.js';

export function setupFilm(X){
const { g, P, W, H, SANS, HEI, disc, poly, rect, line, cross, measure, finish } = X;
const TAU = Math.PI*2, SQ2 = Math.SQRT2;
const FULL = 52;   // 50 s of story + 2 s more hold for the credit card

// ---------------- shots and narration (film seconds) ----------------
const SHOTS = { S1:[0,11.6], S2:[11.6,21.0], S3:[21.0,32.7], S4:[32.7,40.5], S5:[40.5,52] };
// voice line starts; durations come from voice/dur.json (passed in by the page)
const VO_T = { v01:0.9, v02:3.6, v03:7.45, v04:12.4, v05:17.33, v06:21.5, v07:24.36, v08:27.92, v09:33.3, v10:37.21, v11:41.6, v12:46.05 };

// ---------------- text with bookkeeping for readcheck ----------------
let REC = null;                                   // when an array, every checked text drawn this frame is pushed here
function T(str,x,y,o={},id=null){
  const { size=40, weight=800, fam=SANS, col=P.ink, align='left', base='alphabetic', rot=0, track=0 } = o;
  g.save(); g.translate(x,y); if (rot) g.rotate(rot);
  g.font=`${weight} ${size}px ${fam}`; g.fillStyle=col; g.textAlign=align; g.textBaseline=base;
  g.letterSpacing = track ? `${track}px` : '0px';
  g.fillText(str,0,0);
  if (REC && id!==false){
    const w = g.measureText(str).width, x0 = align==='center' ? -w/2 : align==='right' ? -w : 0;
    const y0 = base==='middle' ? -size*0.4 : -size*0.78, y1 = base==='middle' ? size*0.4 : size*0.2;
    const m = g.getTransform(), pts = [[x0,y0],[x0+w,y0],[x0,y1],[x0+w,y1]].map(([px,py])=>[m.a*px+m.c*py+m.e, m.b*px+m.d*py+m.f]);
    REC.push({ id: id || str, text: str, x0: Math.min(...pts.map(p=>p[0])), y0: Math.min(...pts.map(p=>p[1])),
               x1: Math.max(...pts.map(p=>p[0])), y1: Math.max(...pts.map(p=>p[1])) });
  }
  g.restore();
}
const NC = false;   // id=false: decorative (counters, ruler numbers): not a reading text

// ---------------- camera ----------------
function camSet(c){ g.setTransform(c.s,0,0,c.s, W/2 - c.s*c.x, H/2 - c.s*c.y); }
const CAM0 = { x:W/2, y:H/2, s:1 };
const camLerp = (a,b,k)=>({ x:lerp(a.x,b.x,k), y:lerp(a.y,b.y,k), s:a.s*Math.pow(b.s/a.s,k) });
// zoom into (or out of) a world point P: P travels from its screen spot to the screen centre while scale grows
function camZoomTo(c0, Pw, s1, k){ const s = c0.s*Math.pow(s1/c0.s,k);
  const sx0 = W/2 + c0.s*(Pw.x-c0.x), sy0 = H/2 + c0.s*(Pw.y-c0.y), sx = lerp(sx0,W/2,k), sy = lerp(sy0,H/2,k);
  return { x: Pw.x-(sx-W/2)/s, y: Pw.y-(sy-H/2)/s, s }; }

// ---------------- the ramp of S1 (also S2, S4) ----------------
const A={x:0,y:H}, B={x:W,y:410}, RL=Math.hypot(B.x-A.x,B.y-A.y);
const u={x:(B.x-A.x)/RL,y:(B.y-A.y)/RL}, n={x:(B.y-A.y)/RL,y:-(B.x-A.x)/RL}, TH=Math.atan2(B.y-A.y,B.x-A.x);
const on=(s,r=0)=>({x:A.x+u.x*s+n.x*r, y:A.y+u.y*s+n.y*r});
const rot=(v,a)=>({x:v.x*Math.cos(a)-v.y*Math.sin(a), y:v.x*Math.sin(a)+v.y*Math.cos(a)});
const R0=24, K=7, R1=R0*Math.pow(SQ2,K), S0=430, SE=1985, STEP=(SE-S0)/K, GA=Math.log(SQ2)/STEP;
const tickS = k => S0 + k*STEP;                          // one tick = 10 years
// a rolling ball that starts at sStart and doubles every STEP; precomputed rim path and phase
function makeRoll(sStart, endPhase){
  const Rs = s => R0*Math.exp(GA*(clamp(s,sStart,SE)-sStart));
  let tot=0; for (let s=sStart; s<=SE; s+=0.5) tot += 0.5/Rs(s);
  const PS=[]; let phi=endPhase-tot;
  for (let s=sStart; s<=SE+0.01; s+=0.5){ const R=Rs(s); phi += 0.5/R; const c=on(s,R), v=rot({x:-n.x,y:-n.y},phi); PS.push({phi, x:c.x+v.x*R, y:c.y+v.y*R}); }
  const at = s => { const R=Rs(s), i=clamp(Math.round((s-sStart)/0.5),0,PS.length-1), c=on(s,R), v=rot({x:-n.x,y:-n.y},PS[i].phi);
    return { R, i, T:{x:c.x+v.x*R, y:c.y+v.y*R}, d:{x:-v.x,y:-v.y} }; };
  return { Rs, PS, at, sStart };
}
const ROLL_A = makeRoll(S0, 1.05), ROLL_B = makeRoll(tickS(1), 1.05);
const RING = () => [P.red, P.yel, P.blue, P.paper, P.red, P.tint, P.blue, P.yel];
// rings by true area, newest outermost, all tangent at the core T. kmax = rings that exist; R = current outer radius
function ball(b, kmax, scale=1, ox=0, oy=0){
  const Kf = Math.log(b.R/R0)/Math.log(SQ2), top = Math.min(kmax, Math.ceil(Kf-1e-6)), RC = RING();
  for (let k=top;k>=0;k--){ const r=Math.min(R0*Math.pow(SQ2,k), b.R)*scale; disc(b.T.x+b.d.x*r+ox, b.T.y+b.d.y*r+oy, r, RC[k]); }
}
function pathTo(R, i, w=5, from=0){ const pts=[]; for (let j=from;j<=i;j++) pts.push([R.PS[j].x,R.PS[j].y]); if (pts.length>1) line(pts, P.ink, w); }
// text that slides out from under the ramp's top edge (k: 0 hidden → 1 in place)
function fromEdge(s0, w, draw){ const o=on(s0,0); g.save(); g.translate(o.x,o.y); g.rotate(TH); g.beginPath(); g.rect(-60,0,w,500); g.clip();
  g.rotate(-TH); g.translate(-o.x,-o.y); draw(); g.restore(); }
const along=(str,s,off,size,col,align='left',weight=700,fam=SANS,id=NC,track=0)=>{ const p=on(s,off); T(str,p.x,p.y,{size,weight,col,align,rot:TH,fam,track},id); };
const rollU = x => { x=clamp(x); return 1-Math.pow(1-Math.pow(x,1.4),2.2); };
function rollTimes(t0,t1,sStart,kN){ const sAt = t => sStart+(SE-sStart)*rollU((t-t0)/(t1-t0)); const out=[];
  for (let k=1;k<=kN;k++){ const sk=sStart+k*(SE-sStart)/kN; let lo=t0, hi=t1; for (let i=0;i<40;i++){ const m=(lo+hi)/2; if (sAt(m)<sk-1e-6) lo=m; else hi=m; } out.push(hi); }
  return { sAt, ring: out }; }

// ================================ S1 · title (0–11.6) ================================
const T1 = { gridIn:0.15, sq:0.7, sqEnd:1.35, ramp:1.15, rampEnd:1.95, C:1.95, oDrop:2.15, word:2.25, interest:2.65, zh:2.95,
             dot:3.15, roll0:3.55, roll1:7.35, label:3.7, gridOut:7.85 };
const R1T = rollTimes(T1.roll0, T1.roll1, S0, K);
const GRID1 = [ [0,96,760,96,0.00], [0,488,760,488,0.06], [352,0,352,620,0.12], [128,40,128,620,0.18],
  [0,330,1460,330,0.24], [0,H,W,410,0.30], [W,410,1100,410,0.36], [1460,250,1460,620,0.42] ];
function drawLines(L, t, tIn, tOut, w=2, col=P.ink){
  L.forEach((l,i)=>{ const b=eo(seg(t,tIn+l[4],tIn+l[4]+0.7)), a=ei(seg(t,tOut+l[4]*0.6,tOut+l[4]*0.6+0.55)); if (b<=a) return;
    const Pt=k=>[lerp(l[0],l[2],k), lerp(l[1],l[3],k)]; line([Pt(a),Pt(b)], col, w); });
}
// title block (yellow square + COMPOUND INTEREST + the Chinese title): drawn in S1, slides out left in S2
function titleBlock(t, dx=0){
  { const k=back(seg(t,T1.sq,T1.sqEnd),1.2); if (k>0) rect(lerp(-440,-40,k)+dx, 96, 392, 392, P.yel); }
  const fs=196, X0=128+dx, Y=330;
  const wC = measure('C',fs,800,SANS,-4), oR=fs*0.355, ox=X0+wC+oR+4, oy=Y-fs*0.355;
  const rise=(str,x,k,o,id)=>{ if (k<=0) return; g.save(); g.beginPath(); g.rect(x-10,Y-fs*0.8-20,measure(str,o.size,o.weight,SANS,o.track)+20,fs*0.8+22); g.clip();
    T(str,x,Y+(1-k)*fs*0.85,o,id); g.restore(); };
  rise('C', X0, eo(seg(t,T1.C,T1.C+0.32)), {size:fs,weight:800,track:-4}, 'title-C');
  let cx = ox+oR+6; const word='MPOUND';
  for (let i=0;i<word.length;i++){ rise(word[i], cx, eo(seg(t,T1.word+i*0.06,T1.word+i*0.06+0.3)), {size:fs,weight:800,track:-4}, 'title-'+i); cx+=measure(word[i],fs,800,SANS,-4); }
  { const k=seg(t,T1.oDrop,T1.oDrop+0.42); if (k>0){ const y=lerp(-oR-20, oy, ei(Math.min(1,k/0.7))); const sq = k<0.7?1:1-0.16*Math.sin((k-0.7)/0.3*Math.PI);
      g.save(); g.translate(ox,y+oR); g.scale(1/sq,sq); disc(0,-oR,oR,P.red); g.restore(); } }
  { const k=eo(seg(t,T1.interest,T1.interest+0.7)); if (k>0){ g.save(); g.beginPath(); g.rect(X0, Y+30, 1400*k, 140); g.clip();
      T('INTEREST', X0+6, Y+150, {size:118, weight:300, track:lerp(60,18,k)}, 'title-interest'); g.restore(); } }
  { const k=eo(seg(t,T1.zh,T1.zh+0.5)); if (k>0){ g.save(); g.beginPath(); g.rect(X0, Y+190, 900, 60); g.clip();
      T('复利是怎么滚起来的', X0+10, Y+232+(1-k)*56, {size:42, weight:700, fam:HEI, track:4}, 'title-zh'); g.restore(); } }
}
// the ramp group (ramp, path, ball, ramp labels). sink: 0..1 pushes the ramp labels back under the edge
function rampGroup(t, sink=0){
  // the ramp body, in its own frame (a long slab under the slope line); it swings up about the bottom-left corner
  { const k=back(seg(t,T1.ramp,T1.rampEnd),1.1); if (k>0){ g.save(); g.translate(A.x,A.y); g.rotate(-TH*(1-k)); g.translate(-A.x,-A.y);
      const q=[on(-1400,0),on(3000,0),on(3000,-2600),on(-1400,-2600)]; poly(q.map(p=>[p.x,p.y]), P.blue); g.restore(); } }
  const s = t<T1.roll0 ? S0 : R1T.sAt(t), b = ROLL_A.at(s);
  if (t>=T1.roll0) pathTo(ROLL_A, b.i);
  const sk = 1-eo(sink);
  if (sk>0){
    { const k=eo(seg(t,T1.dot+0.1,T1.dot+0.5))*sk; if (k>0) fromEdge(S0,160,()=>along('1', S0, -86+(1-k)*96, 72, P.light, 'center', 600)); }
    { const k=eo(seg(t,T1.label,T1.label+0.6))*sk, k2=eo(seg(t,T1.label+0.2,T1.label+0.8))*sk;
      if (k>0) fromEdge(700,640,()=>{ along('×2 every 10 years', 700, -70+(1-k)*80, 40, P.light, 'left', 600, SANS, 'x2');
        along('每10年翻一倍', 700, -124+(1-k2)*134, 36, P.light, 'left', 700, HEI, 'x2-zh'); }); }
    { let k=0; R1T.ring.forEach((rt,i)=>{ if (t>=rt) k=i+1; });
      if (k>0){ const pop=1+0.10*(1-eo(seg(t,R1T.ring[k-1],R1T.ring[k-1]+0.22)));
        fromEdge(1150, 900, ()=>{ const p=on(1290,-330+(1-sk)*360); g.save(); g.translate(p.x,p.y); g.rotate(TH); g.scale(pop,pop);
          T(String(2**k),0,0,{size:300,weight:700,col:P.light},NC); g.restore(); }); } }
  }
  if (t>=T1.dot){
    const kp = t<T1.roll0 ? back(seg(t,T1.dot,T1.dot+0.35),2.2) : 1;
    ball(b, K, kp);
    if (t>=T1.roll0){ const o=on(S0,R0); disc(o.x,o.y,R0+3,P.red); }
  }
  return b;
}
// ---------------- credit: style name + LemoLab × Claude Opus 5.5, set like every other label (a yellow block, a slot reveal) ----------------
const STYLE_EN = 'BAUHAUS SHAPES', STYLE_ZH = '包豪斯几何', CREDIT = 'LemoLab × Claude Opus 5.5';
let SIGN_T = null;      // short cuts: film second the credit appears (set by the page with ?sign=1)
function creditBlock(t, t0, x, y){
  const k1=eo(seg(t,t0,t0+0.45)), k2=eo(seg(t,t0+0.2,t0+0.65)), kb=back(seg(t,t0,t0+0.35),1.6);
  if (kb>0) rect(x, y-26-12*kb, 22*kb, 22*kb, P.yel);
  if (k1>0){ const w=measure(STYLE_EN,26,700,SANS,4); g.save(); g.beginPath(); g.rect(x+36,y-46,760*k1,58); g.clip();
    T(STYLE_EN, x+38, y+(1-k1)*50, {size:26,weight:700,track:4}, 'credit-style'); T(STYLE_ZH, x+38+w+18, y+3+(1-k1)*50, {size:34,weight:700,fam:HEI,track:3}, 'credit-style-zh'); g.restore(); }
  if (k2>0){ g.save(); g.beginPath(); g.rect(x+36,y+14,760*k2,52); g.clip();
    T(CREDIT, x+38, y+52+(1-k2)*50, {size:32,weight:600,track:0.5}, 'credit'); g.restore(); }
}

function S1(t){
  // a slow push toward the grown ball while the narration lands the number
  const k = eio(seg(t,7.6,11.6));
  camSet(camLerp(CAM0, {x:1010,y:520,s:1.045}, k));
  rect(-400,-400,W+800,H+800,P.paper);
  drawLines(GRID1, t, T1.gridIn, T1.gridOut);
  [[352,96],[352,488],[128,330],[1460,330]].forEach(([x,y],i)=>{ const q=Math.min(eo(seg(t,0.55+i*0.08,0.85+i*0.08)), 1-ei(seg(t,T1.gridOut,T1.gridOut+0.45))); if (q>0) cross(x,y,P.ink,14*q,2); });
  titleBlock(t);
  rampGroup(t);
  // short cut only: the credit sits under the title, in the paper between the title and the slope
  if (SIGN_T!==null && t>=SIGN_T) creditBlock(t, SIGN_T, 128, 660);
}

// ================================ S2 · simple vs compound: the grid as a ruler (11.6–21.0) ================================
const T2 = { t0:11.6, out0:11.6, out1:12.2, flat0:11.75, flat1:13.0, ticks:12.9, cols:13.3, sq0:13.7, sqDt:0.42, lab128:15.3, lab6:15.8, zh:16.3, zoom0:20.45, zoom1:21.0 };
const CAM2 = { x:1060, y:800, s:0.78 };
const SIMPLE = k => 1 + (Math.pow(2,0.1)-1)*10*k;       // simple interest at the same rate (7.177% a year), k = decades
const UNIT = Math.PI*R1*R1/128;                           // px² per unit of money (the 128 ball is 128 units)
// a world point after the ramp group has rotated flat by angle f·(−TH) about A
const flatPt = (p,f)=>{ const a=-TH*f, dx=p.x-A.x, dy=p.y-A.y; return { x:A.x+dx*Math.cos(a)-dy*Math.sin(a), y:A.y+dx*Math.sin(a)+dy*Math.cos(a) }; };
const ENDB = ROLL_A.at(SE);
const YEL_PT = { x: ENDB.T.x+ENDB.d.x*(2*R1-46), y: ENDB.T.y+ENDB.d.y*(2*R1-46) };   // a point in the outer (yellow) band
function S2(t){
  const f = eio(seg(t,T2.flat0,T2.flat1));
  let cam = camLerp({x:1010,y:520,s:1.045}, CAM2, eio(seg(t,T2.flat0,T2.flat1+0.3)));
  if (t>=T2.zoom0) cam = camZoomTo(CAM2, flatPt(YEL_PT,1), 34, ei(seg(t,T2.zoom0,T2.zoom1)));
  camSet(cam);
  rect(-3000,-3000,8000,8000,P.paper);
  // the ruler columns: construction lines rise from every tick (behind everything)
  const BY = A.y;                                          // the flat baseline
  // each column rises to the height of the compound ball at that decade (its diameter): the grid measures the curve
  for (let k=0;k<=7;k++){ const q=eo(seg(t,T2.cols+k*0.07,T2.cols+k*0.07+0.6)), x=A.x+tickS(k), h=2*R0*Math.pow(SQ2,k)+40;
    if (q>0){ line([[x,BY],[x,BY-h*q]], P.ink, 2); if (q>0.9) line([[x-12,BY-h],[x+12,BY-h]], P.ink, 2); } }
  // the ramp group falls flat around its bottom-left corner
  g.save(); g.translate(A.x,A.y); g.rotate(-TH*f); g.translate(-A.x,-A.y);
  rampGroup(t, seg(t,T2.out0,T2.out0+0.35));
  g.restore();
  // the title slides out to the left as one block
  if (t < T2.out1+0.05) titleBlock(t, -1300*ei(seg(t,T2.out0,T2.out1)));
  // ruler ticks and decades on the blue (which is now under the line)
  for (let k=0;k<=7;k++){ const q=eo(seg(t,T2.ticks+k*0.06,T2.ticks+k*0.06+0.3)), x=A.x+tickS(k);
    if (q>0){ line([[x,BY],[x,BY+30*q]], P.light, 4);
      g.save(); g.beginPath(); g.rect(x-90,BY+34,180,60); g.clip(); T(k===7?'70 YRS':String(k*10), x, BY+80+(1-q)*50, {size:34,weight:600,col:P.light,align:'center',track:2}, NC); g.restore(); } }
  // simple interest: one yellow square per decade, area = the money, hanging under the ruler
  for (let k=0;k<=7;k++){ const q=back(seg(t,T2.sq0+k*T2.sqDt,T2.sq0+k*T2.sqDt+0.3),1.6); if (q<=0) continue;
    const side=Math.sqrt(SIMPLE(k)*UNIT), x=A.x+tickS(k);
    rect(x-side/2, BY+110+(1-q)*-60, side, side, k===0?P.red:P.yel); }
  // labels: the comparison, whole and still
  { const q=eo(seg(t,T2.lab128,T2.lab128+0.45)); if (q>0){ const x=A.x+S0-14, y=560; g.save(); g.beginPath(); g.rect(x-10,y-150,800,170); g.clip();
      T('128', x, y+(1-q)*160, {size:170,weight:800,track:-3}, 's2-128'); g.restore();
      const q2=eo(seg(t,T2.lab128+0.25,T2.lab128+0.7)); if (q2>0){ g.save(); g.beginPath(); g.rect(x,y+10,800*q2,60); g.clip();
        T('COMPOUND · interest stays in', x+6, y+52, {size:32,weight:600,track:2}, 's2-compound'); g.restore(); } } }
  { const q=eo(seg(t,T2.lab6,T2.lab6+0.45)); if (q>0){ const x=A.x+S0-24, y=BY+330; g.save(); g.beginPath(); g.rect(x-10,y-130,560,150); g.clip();
      T('6.02', x, y+(1-q)*140, {size:130,weight:800,col:P.light,track:-2}, 's2-6'); g.restore();
      const q2=eo(seg(t,T2.lab6+0.25,T2.lab6+0.7)); if (q2>0){ const wx=measure('6.02',130,800,SANS,-2)+36; g.save(); g.beginPath(); g.rect(x+wx,y-40,700*q2,60); g.clip();
        T('SIMPLE · interest taken out', x+wx, y-6, {size:32,weight:600,col:P.light,track:2}, 's2-simple'); g.restore(); } } }
  { const q=eo(seg(t,T2.zh,T2.zh+0.5)); if (q>0){ const x=A.x+S0-14, y=700; g.save(); g.beginPath(); g.rect(x,y-50,900*q,70); g.clip();
      T('同样70年：复利128，单利6.02', x+6, y, {size:44,weight:700,fam:HEI,track:3}, 's2-zh'); g.restore(); } }
}

// ================================ S3 · the last ten years (21.0–32.7) ================================
const T3 = { t0:21.0, pull1:21.95, ring0:22.15, axis:22.9, out0:24.5, out1:25.6, tan0:25.0, lab64:25.5, eq:25.9, dot0:28.4, dot1:29.2, lab63:28.9, zh:26.2, whip0:32.15, whip1:32.75 };
const C3 = { x:760, y:520 }, RB = 360, D3 = { x:0.6, y:-0.8 };
const rk = k => RB/Math.pow(SQ2,7-k);
const T3c = { x:C3.x-D3.x*RB, y:C3.y-D3.y*RB };           // the core (where all rings touch)
const C6 = { x:T3c.x+D3.x*rk(6), y:T3c.y+D3.y*rk(6) };   // centre of the 64 disc (first 60 years)
const C6b = { x:1470, y:470 };                            // where it moves to
const YEL3 = { x:T3c.x+D3.x*(2*RB-50), y:T3c.y+D3.y*(2*RB-50) };
const OX4 = 2700;                                          // S4 sits to the right of S3 in the same world (whip pan)
function stack(Tc, kmin, kmax, skipCore=false){ const RC=RING(); for (let k=kmax;k>=kmin;k--){ if (skipCore && k===0) continue; const r=rk(k); disc(Tc.x+D3.x*r, Tc.y+D3.y*r, r, RC[k]); } }
function S3(t){
  let cam = camZoomTo(CAM0, YEL3, 34, 1-eio(seg(t,T3.t0,T3.pull1)));
  // a slow push on the ball while the narration sets up the question, eased back before the cut-out
  if (t>=T3.pull1 && t<T3.whip0){ const PU={x:700,y:560,s:1.07}; cam = t<24.3 ? camLerp(CAM0,PU,eio(seg(t,T3.pull1,24.3))) : camLerp(PU,CAM0,eio(seg(t,24.3,25.4))); }
  if (t>=T3.whip0) cam = camLerp(CAM0, {x:OX4+900, y:430, s:0.8}, eio(seg(t,T3.whip0,T3.whip1)));
  camSet(cam);
  rect(-3000,-3000,9000,8000,P.paper);
  // long construction lines across both scenes: they sell the whip pan
  { const q=eo(seg(t,31.6,32.3)); if (q>0){ line([[-200,150],[lerp(-200,OX4+2400,q),150]],P.ink,2); line([[OX4+2400,930],[lerp(OX4+2400,-200,q),930]],P.ink,2); } }
  const mv = eio(seg(t,T3.out0,T3.out1)), off = { x:(C6b.x-C6.x)*mv, y:(C6b.y-C6.y)*mv };
  // the whole ball; once the first 60 years leave, a paper hole stays behind
  disc(C3.x, C3.y, RB, RING()[7]);
  if (mv>0){ disc(C6.x, C6.y, rk(6), P.paper); }
  // compass: the 64 disc is circled before it is cut out
  { const q=eo(seg(t,T3.ring0,T3.ring0+0.8)); if (q>0 && t<T3.whip0+0.4){ g.strokeStyle=P.ink; g.lineWidth=3; g.beginPath(); g.arc(C6.x,C6.y,rk(6)+0.5,-Math.PI/2,-Math.PI/2+TAU*q); g.stroke(); cross(C6.x,C6.y,P.ink,14*q,2); } }
  // tangents: the line that says "this came out of there"
  { const q=eo(seg(t,T3.tan0,T3.tan0+1.0)); if (q>0){ const c1=C6, c2={x:C6.x+off.x,y:C6.y+off.y}, dx=c2.x-c1.x, dy=c2.y-c1.y, dd=Math.hypot(dx,dy)||1, nx=-dy/dd, ny=dx/dd, r=rk(6);
      for (const sg of [1,-1]){ const a={x:c1.x+nx*r*sg, y:c1.y+ny*r*sg}, b={x:c2.x+nx*r*sg, y:c2.y+ny*r*sg}; line([[a.x,a.y],[lerp(a.x,b.x,q),lerp(a.y,b.y,q)]], P.ink, 2); } } }
  // the first 60 years, moving out; its core dot (the 1) leaves later
  const dq = eio(seg(t,T3.dot0,T3.dot1)), Tm = { x:T3c.x+off.x, y:T3c.y+off.y };
  stack(Tm, 0, 6, dq>0);
  if (dq>0){ disc(Tm.x+D3.x*rk(0), Tm.y+D3.y*rk(0), rk(0), P.paper);
    const s0={x:Tm.x+D3.x*rk(0), y:Tm.y+D3.y*rk(0)}, s1={x:1480+measure('= 63 + ',80,500,SANS,0)+rk(0), y:850-30}; const p={x:lerp(s0.x,s1.x,dq), y:lerp(s0.y,s1.y,dq)-Math.sin(dq*Math.PI)*120};
    disc(p.x,p.y,rk(0),P.red); }
  // the axis: a construction line from the core through every ring, one tick per decade, then the 64 gets its compass circle
  { const q=eo(seg(t,T3.axis,T3.axis+0.9)), qo=ei(seg(t,T3.out0,T3.out0+0.5)); if (q>0 && qo<1){
      const L0=-40, L1=2*RB+40, a=lerp(L0,L1,qo), b=lerp(L0,L1,q), P0={x:T3c.x+D3.x*a,y:T3c.y+D3.y*a}, P1={x:T3c.x+D3.x*b,y:T3c.y+D3.y*b};
      if (b>a) line([[P0.x,P0.y],[P1.x,P1.y]], P.ink, 2);
      for (let k=0;k<=7;k++){ const r=2*rk(k); if (r>b || r<a) continue; const c={x:T3c.x+D3.x*r,y:T3c.y+D3.y*r}, nx=-D3.y*12, ny=D3.x*12; line([[c.x-nx,c.y-ny],[c.x+nx,c.y+ny]], P.ink, 2); } } }
  // labels
  { const q=eo(seg(t,T3.lab64,T3.lab64+0.45)); if (q>0){ const x=150, y=640;
      g.save(); g.beginPath(); g.rect(x-10,y-110,260,130); g.clip(); T('64', x, y+(1-q)*120, {size:110,weight:800,track:-2}, 's3-64a'); g.restore();
      const q2=eo(seg(t,T3.lab64+0.2,T3.lab64+0.6)); if (q2>0){ g.save(); g.beginPath(); g.rect(x,y+12,300*q2,40); g.clip(); T('LAST 10 YEARS', x+4, y+44, {size:24,weight:700,track:4}, 's3-last'); g.restore();
        const ex=C3.x-Math.sqrt(RB*RB-(y-40-C3.y)**2)+30; line([[x+150,y-40],[lerp(x+150,ex,q2),y-40]], P.ink, 3); disc(lerp(x+150,ex,q2),y-40,6,P.ink); } } }
  { const q=eo(seg(t,T3.lab64+0.35,T3.lab64+0.8)); if (q>0){ const x=1290, y=850; g.save(); g.beginPath(); g.rect(x-10,y-100,170,120); g.clip();
      T('64', x, y+(1-q)*110, {size:110,weight:800,track:-2}, 's3-64b'); g.restore();
      const q2=eo(seg(t,T3.lab64+0.55,T3.lab64+1.0)); if (q2>0){ g.save(); g.beginPath(); g.rect(1330,160,400*q2,50); g.clip(); T('FIRST 60 YEARS', 1334, 192, {size:24,weight:700,track:4}, 's3-first'); g.restore(); } } }
  // "=" between them: two blue bars snap onto the tangent band
  { const q=back(seg(t,T3.eq,T3.eq+0.35),1.4); if (q>0){ const mx=(C6.x+C6b.x)/2+40, my=(C6.y+C6b.y)/2-10; rect(mx-50*q, my-26, 100*q, 20, P.blue); rect(mx-50*q, my+6, 100*q, 20, P.blue); } }
  // 64 = 63 + 1
  { const q=eo(seg(t,T3.lab63,T3.lab63+0.5)); if (q>0){ const x=1480, y=850; g.save(); g.beginPath(); g.rect(x-10,y-100,500,120); g.clip();
      T('= 63 + ', x, y+(1-q)*110, {size:80,weight:500}, 's3-63'); g.restore();
      const q2=eo(seg(t,T3.lab63+0.3,T3.lab63+0.8)); if (q2>0){ g.save(); g.beginPath(); g.rect(x,y+14,760*q2,50); g.clip(); T('GROWTH + THE FIRST DOT', x+4, y+52, {size:20,weight:700,track:3}, 's3-growth'); g.restore(); } } }
  { const q=eo(seg(t,T3.zh,T3.zh+0.5)); if (q>0){ const x=128, y=150; g.save(); g.beginPath(); g.rect(x,y-50,900*q,70); g.clip();
      T('最后10年长出的，等于前60年的全部', x, y, {size:40,weight:700,fam:HEI,track:3}, 's3-zh'); g.restore(); } }
}

// ================================ S4 · start ten years later: the grid becomes the ramp's scale (32.7–40.5) ================================
const T4 = { ruler:33.0, drain0:34.0, drain1:34.45, mark0:34.6, mark1:35.6, roll0:35.8, roll1:37.3, lab:37.45, zh:37.6, push0:37.6, fall0:40.5 };
const R4T = rollTimes(T4.roll0, T4.roll1, tickS(1), 6);
const CAM4 = { x:OX4+900, y:430, s:0.8 }, CAM4b = { x:OX4+1250, y:400, s:0.85 };
const ENDB6 = ROLL_B.at(SE), LAB4X = 980;
// S4's construction lines, in S4 world coords; they become S5's type grid
function S4lines(){
  const r0=on(S0-40,18), r1=on(SE+60,18), m=on(tickS(1),0), mN={x:-n.x,y:-n.y};
  const ca=on(SE,0), topA=on(SE,2*R1), topB=on(SE,2*ENDB6.R);
  return [
    [r0.x+OX4, r0.y, r1.x+OX4, r1.y],                                         // the scale along the ramp      → row-2 baseline
    [m.x+OX4+n.x*130, m.y+n.y*130, m.x+OX4+mN.x*60, m.y+mN.y*60],              // the later start marker        → left edge
    [ca.x+OX4, ca.y, topA.x+OX4, topA.y-60],                                  // up from the contact point      → column edge
    [LAB4X+measure('128',110,800,SANS,-2)+24+OX4, topA.y, topA.x+OX4, topA.y],   // from the 128 label to the top of 128 → row-1 cap line
    [LAB4X+measure('64',110,800,SANS,-2)+24+OX4, topB.y, topB.x+OX4, topB.y],    // from the 64 label to the top of 64   → row-1 baseline
  ];
}
function S4scene(t, fall=0){
  // ramp (extended so it still meets the frame when the camera pulls out)
  const dy = k => ei(clamp(fall*1.6-k*0.18))*1500;
  g.save(); g.translate(OX4, dy(3));
  poly([[on(-1200,0).x,on(-1200,0).y],[on(2800,0).x,on(2800,0).y],[3200,2400],[-1600,2400]], P.blue);
  // decades along the edge
  for (let k=0;k<=7;k++){ const q=eo(seg(t,T4.ruler+k*0.06,T4.ruler+k*0.06+0.3)); if (q<=0) continue; const s=tickS(k), a=on(s,24), b=on(s,-30);
    line([[a.x,a.y],[lerp(a.x,b.x,q),lerp(a.y,b.y,q)]], k===1&&t>T4.mark1?P.light:P.light, 4);
    fromEdge(s-60, 200, ()=>along(k===7?'70 YRS':String(k*10), s, -46-(1-q)*-60, 30, P.light, 'center', 600)); }
  g.restore();
  // ball A: drains back to an outline (the 128 it would have been)
  g.save(); g.translate(OX4, dy(1));
  const dr = eo(seg(t,T4.drain0,T4.drain1));
  { const pts=ROLL_A.PS.map(p=>[p.x,p.y]); line(pts, dr>0.5?P.tint:P.ink, lerp(5,4,dr)); }   // A's path stays as a pale ghost
  if (dr<1) ball(ENDB, K, 1-dr);
  if (dr>0){ const c=on(SE,R1); g.strokeStyle=P.ink; g.lineWidth=4; g.beginPath(); g.arc(c.x,c.y,R1,0,TAU*Math.min(1,dr*1.2)); g.stroke(); }
  // origin dot and the start marker that slides one decade up the ramp
  const mq = eio(seg(t,T4.mark0,T4.mark1)), sm = lerp(S0, tickS(1), mq);
  if (t<T4.roll0){ const o=on(sm,R0); disc(o.x,o.y,R0+3,P.red); }
  else { const o=on(tickS(1),R0); disc(o.x,o.y,R0+3,P.red); }
  g.restore();
  // ball B: the same slope, ten years later
  g.save(); g.translate(OX4, dy(2));
  if (t>=T4.roll0){ const s=R4T.sAt(t), b=ROLL_B.at(s); pathTo(ROLL_B, b.i, 5); ball(b, 6); }
  g.restore();
  // labels
  g.save(); g.translate(OX4, dy(0));
  { const q=eo(seg(t,T4.lab,T4.lab+0.45)); if (q>0){ const x=LAB4X, y=on(SE,2*R1).y+36; g.save(); g.beginPath(); g.rect(x-10,y-120,520,140); g.clip(); T('128', x, y+(1-q)*130, {size:110,weight:800,track:-2}, 's4-128'); g.restore();
      const q2=eo(seg(t,T4.lab+0.2,T4.lab+0.6)); if (q2>0){ g.save(); g.beginPath(); g.rect(x,y+8,520*q2,44); g.clip(); T('STARTED ON TIME', x+4, y+38, {size:26,weight:700,track:4}, 's4-ontime'); g.restore(); } } }
  { const q=eo(seg(t,T4.lab+0.35,T4.lab+0.8)); if (q>0){ const x=LAB4X, y=on(SE,2*ENDB6.R).y+36; g.save(); g.beginPath(); g.rect(x-10,y-120,520,140); g.clip(); T('64', x, y+(1-q)*130, {size:110,weight:800,col:P.red,track:-2}, 's4-64'); g.restore();
      const q2=eo(seg(t,T4.lab+0.55,T4.lab+0.95)); if (q2>0){ g.save(); g.beginPath(); g.rect(x,y+8,520*q2,44); g.clip(); T('STARTED 10 YEARS LATE', x+4, y+38, {size:26,weight:700,track:4}, 's4-late'); g.restore(); } } }
  { const q=eo(seg(t,T4.zh,T4.zh+0.5)); if (q>0){ const x=LAB4X, y=on(SE,2*ENDB6.R).y+120; g.save(); g.beginPath(); g.rect(x,y-50,800*q,70); g.clip(); T('晚10年，只剩一半', x+4, y, {size:40,weight:700,fam:HEI,track:3}, 's4-zh'); g.restore(); } }
  g.restore();
  // marker label
  { const q=eo(seg(t,T4.mark0+0.2,T4.mark0+0.6)) * (1-eo(seg(t,T4.roll0+0.4,T4.roll0+0.8))); if (q>0){ const m=on(tickS(1)*1,150); g.save(); g.beginPath(); g.rect(m.x+OX4-20,m.y-60,360*q,80); g.clip(); T('+10 YEARS', m.x+OX4, m.y, {size:30,weight:700,track:3}, NC); g.restore(); } }
}
function S4(t){
  let cam = CAM4; if (t>=T4.push0) cam = camLerp(CAM4, CAM4b, eio(seg(t,T4.push0,40.4)));
  camSet(cam);
  rect(OX4-3000,-3000,9000,8000,P.paper);
  // its construction lines: the ramp's scale, the start marker, the measures of the two balls
  const L = S4lines();
  const lin = [[T4.ruler,0],[T4.mark0,1],[T4.lab-0.3,2],[T4.lab-0.2,3],[T4.lab-0.1,4]];
  lin.forEach(([t0,i])=>{ let q=eo(seg(t,t0,t0+0.6)); if (q<=0) return; const l=L[i];
    let x0=l[0], y0=l[1], x1=l[2], y1=l[3];
    if (i===1){ const mq=eio(seg(t,T4.mark0,T4.mark1)); const d=(tickS(1)-S0)*(mq-1); x0+=u.x*d; y0+=u.y*d; x1+=u.x*d; y1+=u.y*d; }
    line([[x0,y0],[lerp(x0,x1,q),lerp(y0,y1,q)]], P.ink, i===1?4:2); });
  S4scene(t);
}

// ================================ S5 · the rule of 72: the grid sets the type (40.5–50) ================================
const T5 = { fall0:40.5, morph0:40.75, morph1:41.55, n72:41.75, div:42.35, dots:42.6, n72b:43.05, col:43.9, eq:45.0, one:45.3, roll0:45.9, roll1:47.3, years:47.4, sig:47.6, credit:48.2, fold0:48.2, fold1:48.95 };
const Y1 = 470, Y2 = 880, FS = 300;
const G5 = [ [96,Y2,1200,Y2], [128,180,128,960], [1262,180,1262,960], [96,Y1-212,1200,Y1-212], [96,Y1,1200,Y1] ];
function S5(t){
  // the S4 world falls away under the S4 camera; its lines are mapped to screen space and re-set as the type grid
  const fallK = seg(t,T5.fall0,T5.fall0+0.9);
  if (fallK<1){ camSet(CAM4b); rect(OX4-3000,-3000,9000,8000,P.paper); S4scene(t, fallK); }
  g.setTransform(1,0,0,1,0,0);
  if (fallK>=1) rect(0,0,W,H,P.paper);
  const c=CAM4b, scr = (x,y)=>[W/2+c.s*(x-c.x), H/2+c.s*(y-c.y)];
  const L4 = S4lines();
  // geometry of the formula
  const w72 = measure('72',FS,800,SANS,-6), divX = 128+w72+40, divW = 120, x7 = divX+divW+40;
  const w7 = measure('7',FS,800,SANS,-6), w2 = measure('2',FS,800,SANS,-6), dotS = 46;
  const eqW = 150, oneX = 128+eqW+60, w1 = measure('1',FS*1.15,800,SANS,-6), RZ = 0.355*FS*1.15, zX = oneX+w1+20+RZ, zY = Y2-RZ;
  // the grid: morphs in from S4, folds into the zero at the end
  const mk = eio(seg(t,T5.morph0,T5.morph1)), fold = ei(seg(t,T5.fold0,T5.fold1));
  G5.forEach((G,i)=>{ const l=L4[i]; let a=scr(l[0],l[1]), b=scr(l[2],l[3]);
    let p0=[lerp(a[0],G[0],mk), lerp(a[1],G[1],mk)], p1=[lerp(b[0],G[2],mk), lerp(b[1],G[3],mk)];
    if (fold>0){ p0=[lerp(p0[0],zX,fold), lerp(p0[1],zY,fold)]; p1=[lerp(p1[0],zX,fold), lerp(p1[1],zY,fold)]; }
    if (fold<1) line([p0,p1], P.ink, 2); });
  const riseG=(str,x,y,size,k,col,id)=>{ if (k<=0) return; g.save(); g.beginPath(); g.rect(x-12,y-size*0.8,measure(str,size,800,SANS,-6)+24,size*0.8+8); g.clip(); T(str,x,y+(1-k)*size*0.85,{size,weight:800,col,track:-6},id); g.restore(); };
  // row 1: 72 ÷ 7.2
  riseG('7',128,Y1,FS,eo(seg(t,T5.n72,T5.n72+0.32)),P.ink,'f-7a'); riseG('2',128+measure('7',FS,800,SANS,-6),Y1,FS,eo(seg(t,T5.n72+0.1,T5.n72+0.42)),P.ink,'f-2a');
  { const k=back(seg(t,T5.div,T5.div+0.35),1.3); if (k>0) rect(lerp(-200,divX,k), Y1-106-13, divW, 26, P.blue); }
  { for (const [j,col,dyy] of [[0,P.red,-62],[1,P.yel,62]]){ const k=seg(t,T5.dots+j*0.14,T5.dots+j*0.14+0.4); if (k<=0) continue;
      const yy = Y1-106+dyy, y = lerp(-60, yy, ei(Math.min(1,k/0.7))), sq = k<0.7?1:1-0.18*Math.sin((k-0.7)/0.3*Math.PI);
      g.save(); g.translate(divX+divW/2, y+22); g.scale(1/sq,sq); disc(0,-22,22,col); g.restore(); } }
  riseG('7',x7,Y1,FS,eo(seg(t,T5.n72b,T5.n72b+0.32)),P.ink,'f-7b');
  { const k=back(seg(t,T5.n72b+0.12,T5.n72b+0.4),1.6); if (k>0) rect(x7+w7+8, Y1-dotS*k, dotS*k, dotS*k, P.ink); }
  riseG('2',x7+w7+dotS+16,Y1,FS,eo(seg(t,T5.n72b+0.2,T5.n72b+0.52)),P.ink,'f-2b');
  // row 2: = 10 YEARS, the zero is a ball that rolls in and doubles three times
  { const k=back(seg(t,T5.eq,T5.eq+0.35),1.3); if (k>0){ rect(lerp(-260,128,k), Y2-150-13-30, eqW, 26, P.blue); rect(lerp(-420,128,k), Y2-150-13+30, eqW, 26, P.blue); } }
  riseG('1',oneX,Y2,FS*1.15,eo(seg(t,T5.one,T5.one+0.32)),P.ink,'f-1');
  if (t>=T5.roll0){ const k=eio(seg(t,T5.roll0,T5.roll1)), x=lerp(1180,zX,k), r=RZ*Math.pow(SQ2,-3*(1-k));
    const ang = -(lerp(1180,zX,k)-1180)/RZ*0.8 + 2.2;   // rolls to the left
    const v={x:Math.cos(ang),y:Math.sin(ang)}, Tc={x:x+v.x*r, y:zY+(RZ-r)+v.y*r}, d={x:-v.x,y:-v.y};
    const RC=[P.red,P.yel,P.blue,P.yel]; const top=Math.min(3,Math.ceil(3*k+1e-6));
    for (let kk=top;kk>=0;kk--){ const rr=Math.min(r, RZ/Math.pow(SQ2,3-kk)); disc(Tc.x+d.x*rr, Tc.y+d.y*rr, rr, RC[kk]); } }
  { const k=eo(seg(t,T5.years,T5.years+0.5)); if (k>0){ g.save(); g.beginPath(); g.rect(zX+RZ+36, Y2-90, 400*k, 100); g.clip(); T('YEARS', zX+RZ+40, Y2, {size:76,weight:300,track:14}, 'f-years'); g.restore(); } }
  // the reading, right of the column line
  const col = [[T5.col,'RULE OF 72',300,{size:28,weight:700,track:6}],[T5.col+0.2,'72 ÷ yearly rate (%)',380,{size:46,weight:500}],
               [T5.col+0.4,'= years to double',444,{size:46,weight:500}],[T5.col+0.6,'72 ÷ 年利率 = 翻倍要的年数',530,{size:38,weight:700,fam:HEI,track:2}]];
  col.forEach(([t0,s,y,o],i)=>{ const k=eo(seg(t,t0,t0+0.5)); if (k<=0) return; g.save(); g.beginPath(); g.rect(1300,y-60,620*k,80); g.clip(); T(s,1306,y,o,'f-col'+i); g.restore(); });
  // signature: the title comes back small, its O is the same dot
  { const k=eo(seg(t,T5.sig,T5.sig+0.5)); if (k>0){ const x=1306, y=760, fs=64; g.save(); g.beginPath(); g.rect(x-6,y-60,620,80); g.clip();
      const yy=y+(1-k)*70, wC=measure('C',fs,800,SANS,-1), oR=fs*0.355; T('C',x,yy,{size:fs,weight:800,track:-1},'sig-c'); disc(x+wC+oR+2, yy-fs*0.355, oR, P.red); T('MPOUND',x+wC+2*oR+5,yy,{size:fs,weight:800,track:-1},'sig');
      g.restore(); const k2=eo(seg(t,T5.sig+0.25,T5.sig+0.7)); if (k2>0){ g.save(); g.beginPath(); g.rect(x,y+8,620*k2,60); g.clip(); T('INTEREST',x+2,y+50,{size:38,weight:300,track:12},'sig-i'); g.restore(); } } }
  creditBlock(t, T5.credit, 1306, 878);
}

// ---------------- subtitles: a paper block in the bottom-right corner, one Chinese line, one English line ----------------
let VO = [];   // [{id, t0, t1, zh, en}] set by init()
// fixed in screen space: the block never moves; only the green bar grows in as a cue starts
function subBox(t){
  const cue = VO.find(c=>t>=c.t0 && t<c.t1); if (!cue) return null;
  const wz = measure(cue.zh,36,700,HEI,2), we = measure(cue.en,30,500,SANS,0.5), w = Math.ceil(Math.max(wz,we))+56+48;
  return { cue, x0:W-w, y0:952, x1:W, y1:H, tx1: W-w+40+Math.max(wz,we) };
}
function subtitles(t){
  const b = subBox(t); if (!b) return;
  g.setTransform(1,0,0,1,0,0);
  const k = eo(seg(t,b.cue.t0,b.cue.t0+0.3));
  rect(b.x0, b.y0, b.x1-b.x0, b.y1-b.y0, P.paper);
  rect(b.x0, b.y1-(b.y1-b.y0)*k, 8, (b.y1-b.y0)*k, P.red);
  T(b.cue.zh, b.x0+40, b.y0+52, {size:36,weight:700,fam:HEI,track:2}, false);
  T(b.cue.en, b.x0+40, b.y0+100, {size:30,weight:500,track:0.5,col:P.ink}, false);
}

// ---------------- sound events (absolute film seconds) ----------------
function events(){
  const ev=[], E=(t,type,o={})=>ev.push({t:+t.toFixed(3),type,pan:0,...o});
  GRID1.forEach(l=>E(T1.gridIn+l[4],'grid',{d:0.7,pan:((l[0]+l[2])/2/W-0.5)}));
  E(T1.sqEnd-0.18,'snap',{pan:-0.7}); E(T1.rampEnd-0.2,'hinge',{pan:0.2}); E(T1.C+0.25,'block',{pan:-0.6});
  for (let i=0;i<6;i++) E(T1.word+i*0.06+0.24,'block',{pan:-0.4+i*0.08});
  E(T1.oDrop+0.29,'drop',{pan:-0.5}); E(T1.interest,'slide',{d:0.7,pan:-0.4}); E(T1.dot,'pop',{pan:-0.7});
  E(T1.roll0,'roll',{d:T1.roll1-T1.roll0}); R1T.ring.forEach((rt,i)=>E(rt,'ring',{k:i+1,pan:lerp(-0.6,0.7,(i+1)/7)}));
  E(T1.label,'slide',{d:0.6,pan:-0.1}); E(T1.gridOut,'retract',{d:0.9}); E(T1.roll1,'land',{key:'D'});
  // S2
  E(T2.out0,'slide',{d:0.6,pan:-0.8}); E(T2.flat0,'swing',{d:T2.flat1-T2.flat0}); E(T2.flat1-0.05,'hinge',{pan:0});
  for (let k=0;k<=7;k++) E(T2.ticks+k*0.06,'tick',{pan:lerp(-0.6,0.7,k/7)});
  E(T2.cols,'grid',{d:0.8,pan:0});
  for (let k=0;k<=7;k++) E(T2.sq0+k*T2.sqDt+0.12,'tock',{k,pan:lerp(-0.6,0.7,k/7)});
  E(T2.lab128,'accent',{key:'D'}); E(T2.lab6,'slide',{d:0.5,pan:0.5});
  E(T2.zoom0,'zoom',{d:T2.zoom1-T2.zoom0+0.9});
  // S3
  E(T3.ring0,'grid',{d:0.8,pan:-0.3}); E(T3.out0,'slide',{d:1.0,pan:0.3}); E(T3.out1-0.05,'snap',{pan:0.5}); E(T3.tan0,'grid',{d:1.0,pan:0});
  E(T3.eq+0.2,'block',{pan:0.1}); E(T3.lab64,'accent',{key:'G'}); E(T3.dot0,'pop',{pan:0.4}); E(T3.dot1-0.05,'drop',{pan:0.5});
  E(31.6,'grid',{d:0.7}); E(T3.whip0,'whip',{d:T3.whip1-T3.whip0});
  // S4
  for (let k=0;k<=7;k++) E(T4.ruler+k*0.06,'tick',{pan:lerp(-0.6,0.7,k/7)});
  E(T4.drain0,'drain',{pan:0.6}); E(T4.mark0,'slide',{d:1.0,pan:-0.5}); E(T4.mark1-0.05,'snap',{pan:-0.4});
  E(T4.roll0,'roll',{d:T4.roll1-T4.roll0}); R4T.ring.forEach((rt,i)=>E(rt,'ring',{k:i+2,pan:lerp(-0.4,0.7,(i+1)/6)}));
  E(T4.roll1,'land',{key:'Bm'}); E(T4.lab-0.3,'grid',{d:0.6,pan:0.3});
  // S5
  E(T5.fall0,'fall',{d:0.9}); E(T5.morph0,'grid',{d:0.8}); E(T5.morph0+0.15,'grid',{d:0.8,pan:0.4});
  E(T5.n72+0.25,'block',{pan:-0.6}); E(T5.n72+0.35,'block',{pan:-0.5}); E(T5.div+0.3,'snap',{pan:-0.3});
  E(T5.dots+0.29,'drop',{pan:-0.3}); E(T5.dots+0.43,'drop',{pan:-0.3});
  E(T5.n72b+0.25,'block',{pan:0}); E(T5.n72b+0.35,'block',{pan:0.05}); E(T5.n72b+0.45,'block',{pan:0.1});
  E(T5.col,'slide',{d:0.9,pan:0.6}); E(T5.eq+0.3,'snap',{pan:-0.6}); E(T5.one+0.25,'block',{pan:-0.5});
  E(T5.roll0,'roll',{d:T5.roll1-T5.roll0,small:1}); [0.33,0.66,0.99].forEach((f,i)=>E(T5.roll0+(T5.roll1-T5.roll0)*f,'ring',{k:i+3,pan:lerp(0.4,-0.3,f)}));
  E(T5.years,'slide',{d:0.5,pan:-0.1}); E(T5.fold0,'retract',{d:0.75}); E(T5.fold1,'final',{key:'D'}); E(T5.sig,'slide',{d:0.5,pan:0.6});
  // voice
  VO.forEach(c=>E(c.vt,'voice',{id:c.id}));
  return ev.sort((a,b)=>a.t-b.t);
}

function draw(t){
  g.setTransform(1,0,0,1,0,0);
  if (t<SHOTS.S2[0]) S1(t);
  else if (t<SHOTS.S3[0]) S2(t);
  else if (t<SHOTS.S4[0]) S3(t);
  else if (t<SHOTS.S5[0]) S4(t);
  else S5(t);
  g.setTransform(1,0,0,1,0,0);
}
return {
  FULL, SHOTS,
  setSign(t0){ SIGN_T = t0; },
  init(lines, dur){
    const ids = Object.keys(VO_T);
    VO = ids.map((id,i)=>{ const L = lines.find(l=>l.id===id), t0 = VO_T[id], d = dur[id], next = i+1<ids.length ? VO_T[ids[i+1]] : FULL;
      const c0 = t0-0.1, c1 = Math.min(next-0.25, Math.max(t0+d+0.9, c0+1.8));
      return { id, vt:t0, vd:d, t0:c0, t1:c1, zh:L.zh, en:L.en }; });
    return { ev: events(), cues: VO.map(c=>({t0:+c.t0.toFixed(2), t1:+c.t1.toFixed(2), text:`${c.zh}\n${c.en}`, vt:c.vt, vd:c.vd})) };
  },
  render(t, subs=true){ draw(t); finish(); if (subs) subtitles(t); },
  subBox(t){ const b=subBox(t); return b && { x0:b.x0, y0:b.y0, x1:b.x1, y1:b.y1, tx1:b.tx1 }; },
  texts(t){
    // camera transitions carry the old texts out of frame: they are not reading time
    if ([[11.6,13.0],[20.45,21.95],[32.15,32.75]].some(([a,b])=>t>=a && t<b)) return [];
    REC=[]; draw(t); const out=REC; REC=null;
    return out.filter(o=>o.x1>o.x0).map(o=>({ id:o.id, text:o.text, x0:Math.round(o.x0), y0:Math.round(o.y0), x1:Math.round(o.x1), y1:Math.round(o.y1) })); },
};
}
