// Bilingual subtitles from the page's SUBS table: node styles/comic-history/demo/tools/srt.mjs [from=0] [to=51] > out.srt
// Each cue: one Chinese line, one English line (the same cues are burned into the picture as caption boxes).
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = fs.readFileSync(path.join(HERE, 'index.html'), 'utf8');
const src = html.slice(html.indexOf('const SUBS = ['), html.indexOf('];', html.indexOf('const SUBS = [')) + 2);
const SUBS = new Function(src.replace('const SUBS =', 'return') )();
const from = +(process.argv[2] || 0), to = +(process.argv[3] || 51);
const ts = s => { const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
let n = 0, out = '';
for (const [a, b, zh, en] of SUBS) { if (b <= from || a >= to) continue; out += `${++n}\n${ts(Math.max(a, from) - from)} --> ${ts(Math.min(b, to) - from)}\n${zh}\n${en}\n\n`; }
process.stdout.write(out);
