import fs from 'fs';
const get = async (u, o) => { const r = await fetch(u, o); if (!r.ok) throw new Error(`${u}: HTTP ${r.status}`); return r; };   // an error page must not end up as a font file
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const fams=['ZCOOL+KuaiLe','Noto+Serif+SC:wght@900','Bagel+Fat+One','JetBrains+Mono:wght@500;800','Noto+Sans+SC:wght@500;900'];
let out='';let n=0;fs.mkdirSync('fonts',{recursive:true});
for(const f of fams){
  let css=await (await get(`https://fonts.googleapis.com/css2?family=${f}&display=block`,{headers:{'User-Agent':UA}})).text();
  const urls=[...new Set(css.match(/https:\/\/[^)]+\.woff2/g)||[])];
  for(const u of urls){const name=`f${n++}.woff2`;const b=Buffer.from(await (await get(u)).arrayBuffer());fs.writeFileSync('fonts/'+name,b);css=css.split(u).join('fonts/'+name);}
  out+=css;console.log(f,urls.length);
}
// fonts.css is in git. Keep it when Google Fonts still slices the families the same way and each slice still covers at
// least the characters it did (line endings aside: a Windows checkout has CRLF) (a unicode-range only grew), so a build on a fresh clone leaves git clean.
const ranges = css => [...css.matchAll(/unicode-range:([^;]*);/g)].map(m => m[1].split(',').map(r => r.trim().slice(2).split('-').map(h => parseInt(h, 16))).map(([a, b = a]) => [a, b]));
const covers = (nw, od) => !!nw && od.every(([a, b]) => { for (let c = a; c <= b; c++) if (!nw.some(([x, y]) => c >= x && c <= y)) return false; return true; });
const old = fs.existsSync('fonts.css') ? fs.readFileSync('fonts.css', 'utf8').replace(/\r\n/g, '\n') : '', shape = s => s.replace(/unicode-range:[^;]*;/g, '');
const ro = ranges(old), rn = ranges(out);
if (shape(old) !== shape(out) || ro.length !== rn.length || !ro.every((r, i) => covers(rn[i], r))) { fs.writeFileSync('fonts.css', out); console.log('fonts.css rewritten: Google Fonts slices these families differently now (commit it with the demo)'); }
