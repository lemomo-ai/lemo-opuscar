import fs from 'fs';
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const fams=['ZCOOL+KuaiLe','Noto+Serif+SC:wght@900','Bagel+Fat+One','JetBrains+Mono:wght@500;800','Noto+Sans+SC:wght@500;900'];
let out='';let n=0;fs.mkdirSync('fonts',{recursive:true});
for(const f of fams){
  let css=await (await fetch(`https://fonts.googleapis.com/css2?family=${f}&display=block`,{headers:{'User-Agent':UA}})).text();
  const urls=[...new Set(css.match(/https:\/\/[^)]+\.woff2/g)||[])];
  for(const u of urls){const name=`f${n++}.woff2`;const b=Buffer.from(await (await fetch(u)).arrayBuffer());fs.writeFileSync('fonts/'+name,b);css=css.split(u).join('fonts/'+name);}
  out+=css;console.log(f,urls.length);
}
fs.writeFileSync('fonts.css',out);
