import fs from 'fs';
const get = async (u, o) => { const r = await fetch(u, o); if (!r.ok) throw new Error(`${u}: HTTP ${r.status}`); return r; };   // an error page must not end up as a font file
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const src = fs.readFileSync('scene.js', 'utf8') + fs.readFileSync('main.js', 'utf8');
const chars = [...new Set([...src].filter(c => c.charCodeAt(0) > 0x2e80))].join('') + '·—，。、：（）';
const fams = [
  `family=Noto+Serif+SC:wght@400&text=${encodeURIComponent(chars)}`,
  `family=Cormorant+Garamond:ital,wght@0,500;1,400;1,500`,
  `family=Caveat:wght@500;600`,
  `family=IBM+Plex+Mono:wght@400`,
];
let out = '', n = 0; fs.mkdirSync('fonts', { recursive: true });
for (const f of fams) {
  let css = await (await get(`https://fonts.googleapis.com/css2?${f}&display=block`, { headers: { 'User-Agent': UA } })).text();
  for (const u of [...new Set(css.match(/https:\/\/[^)]+/g) || [])]) {
    const name = `f${n++}.woff2`;
    fs.writeFileSync('fonts/' + name, Buffer.from(await (await get(u)).arrayBuffer()));
    css = css.split(u).join('fonts/' + name);
  }
  out += css;
}
// fonts.css is in git. Keep it when Google Fonts still slices the families the same way and each slice still covers at
// least the characters it did (line endings aside: a Windows checkout has CRLF) (a unicode-range only grew) and none of the added characters is in the source, so a build on
// a fresh clone leaves git clean. New characters in the story make the text subset grow: then it is rewritten.
const ranges = css => [...css.matchAll(/unicode-range:([^;]*);/g)].map(m => m[1].split(',').map(r => r.trim().slice(2).split('-').map(h => parseInt(h, 16))).map(([a, b = a]) => [a, b]));
const covers = (nw, od) => !!nw && od.every(([a, b]) => { for (let c = a; c <= b; c++) if (!nw.some(([x, y]) => c >= x && c <= y)) return false; return true; });
const old = fs.existsSync('fonts.css') ? fs.readFileSync('fonts.css', 'utf8').replace(/\r\n/g, '\n') : '', shape = s => s.replace(/unicode-range:[^;]*;/g, '');
const ro = ranges(old), rn = ranges(out);
const inR = (rs, c) => rs.some(([x, y]) => c >= x && c <= y), used = [...new Set([...src])].map(ch => ch.codePointAt(0));
const gained = () => ro.some((r, i) => used.some(c => inR(rn[i], c) && !inR(r, c)));
if (shape(old) !== shape(out) || ro.length !== rn.length || !ro.every((r, i) => covers(rn[i], r)) || gained()) { fs.writeFileSync('fonts.css', out); console.log('fonts.css rewritten: the characters in the source or Google Fonts\' slicing changed (commit it with the demo)'); } console.log('font files', n, 'cjk chars', chars.length);
