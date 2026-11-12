// Subtitle export: node styles/paper-popup/demo/make_srt.mjs [out.srt]   (default ../paper-popup.srt)
// Reads the narration cues (voCues: VO, split by VO_SPLIT) / bubbles BUB from story.js and voices/dur.json directly; time ranges match what hud.js displays:
//   narration drawSubs: fades in at t0-.15 … starts fading out at t0+dur+.25 → use [t0, t0+dur+.4]; a part followed by another part of
//   the same line ends where the next one starts
//   bubbles drawBubbles: pop up at t0 … start closing at t1 (.2 s)   → use [t0, t1+.2]
// Two lines per cue: English + Chinese (same as the bilingual subtitles in the film); chapter banners and the end card are not in the srt
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
// package.json is commonjs, so story.js is loaded as an ES module through a data: URL
const { voCues, BUB } = await import('data:text/javascript;base64,' + fs.readFileSync(path.join(HERE, 'story.js')).toString('base64'));
const dur = JSON.parse(fs.readFileSync(path.join(HERE, 'voices/dur.json'), 'utf8'));
const cues = [
  ...voCues(dur).map(({ t0, t1, en, zh, last }) => ({ t0, t1: last ? t1 + .4 : t1, text: `${en}\n${zh}` })),
  ...BUB.map(([who, t0, t1, en, zh]) => ({ t0, t1: t1 + .2, text: `${en}\n${zh}` })),
].sort((a, b) => a.t0 - b.t0);
for (let k = 0; k < cues.length - 1; k++) cues[k].t1 = Math.min(cues[k].t1, cues[k + 1].t0);
const fmt = s => { const ms = Math.round(s * 1000); return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
const out = process.argv[2] ? path.resolve(process.argv[2]) : path.join(HERE, '../paper-popup.srt');
fs.writeFileSync(out, cues.map((c, i) => `${i + 1}\n${fmt(c.t0)} --> ${fmt(c.t1)}\n${c.text}\n`).join('\n'));
console.log(out, cues.length, 'cues');
