// Print the machine-time plan of the plot (node tools/timing.mjs from the film folder)
import fs from 'fs';
import { buildProgram } from '../plot.js';
const D = JSON.parse(fs.readFileSync(new URL('../plot.json', import.meta.url)));
const G = buildProgram(D);
const f = s => (s / 60).toFixed(1) + ' min';
console.log('total', f(G.T), 'ops', G.ops.length);
for (const [k, v] of Object.entries(G.marks)) if (!k.startsWith('txtEnd') && !k.startsWith('lv')) console.log(k.padEnd(28), v.toFixed(2));
for (const s of G.swaps) console.log('swap', s.from, '→', s.to, s.t0.toFixed(2), 'at', s.tAt.toFixed(2), 'grip', s.tGrip.toFixed(2), 'end', s.t1.toFixed(2));
console.log('park', G.park);
const lv = Object.entries(G.marks).filter(([k]) => k.startsWith('lv')).map(([k, v]) => k.slice(2) + ':' + v.toFixed(0)); console.log(lv.join(' '));
