// Fetch the demo's Google Fonts (OFL, see CREDITS) as woff2 slices into fonts/ and rewrite fonts.css to point at them.
// build.sh runs it when fonts/ is empty (the .woff2 files are gitignored). Run from demo/: node fetch_fonts.mjs
// Names: f0… for the frame template's five families (same order as halftone-dossier), fr0… for Fredoka.
import fs from 'fs';
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const fams=[['ZCOOL+KuaiLe','f'],['Noto+Serif+SC:wght@900','f'],['Bagel+Fat+One','f'],['JetBrains+Mono:wght@500;800','f'],['Noto+Sans+SC:wght@500;900','f'],['Fredoka:wght@600;700','fr']];
const n={};let out='';
for(const [f,pre] of fams){
  const res=await fetch(`https://fonts.googleapis.com/css2?family=${f}&display=block`,{headers:{'User-Agent':UA}});
  if(!res.ok) throw new Error(`Google Fonts: ${f}: HTTP ${res.status}`);
  let css=await res.text();
  const urls=[...new Set(css.match(/https:\/\/[^)]+\.woff2/g)||[])];
  if(!urls.length) throw new Error(`Google Fonts: ${f}: no woff2 in the stylesheet`);
  for(const u of urls){
    const r=await fetch(u); if(!r.ok) throw new Error(`${u}: HTTP ${r.status}`);
    const name=`${pre}${n[pre]=(n[pre]??-1)+1}.woff2`;
    fs.writeFileSync('fonts/'+name,Buffer.from(await r.arrayBuffer()));css=css.split(u).join('fonts/'+name);
  }
  out+=css;console.log(f,urls.length);
}
fs.writeFileSync('fonts.css',out);
