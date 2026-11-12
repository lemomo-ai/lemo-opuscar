// The README's pictures, in the Workbench look of the site (a long oak bench in a night studio, one lamp per station):
//   docs/readme/cover-<lang>-<theme>.webp       the cover: 4 s of the long take's opening (OPUSCAR in wood type), seamless loop
//   docs/readme/station-<NN>-<lang>-<theme>.webp one header per category: its station on the bench, number and name in the dark
//   docs/readme/cards/<slug>-<lang>-<theme>.webp one card per style: its poster and caption, linked to its page by the README
//   docs/readme/opuscar98-<lang>-<theme>.webp   OPUSCAR 98: the projector at the end of the bench
//   docs/readme/thanks/<id>-<lang>-<theme>.webp  the thank-you films, as cards
//   docs/readme/end-<lang>-<theme>.webp          the end plate: the bench's lamps still on, a star asked for (linked to the stargazers)
//   docs/cover.jpg, docs/social.jpg              the still cover (for clients without <picture>) and GitHub's social preview
// <lang> is en or zh, <theme> light (a page of paper: the photo is a printed plate) or dark (the photo sinks into the page).
// styleboard/build.py writes the Markdown that shows them; styleboard/art/readme.json holds what both must agree on.
//
//   node styleboard/art/readme.mjs                      everything that changed
//   node styleboard/art/readme.mjs --cats 2,5           only those stations and their cards (and the rest of the steps)
//   node styleboard/art/readme.mjs --steps cards,films  steps: cover, stations, cards, films, end, art (default: all)
//   node styleboard/art/readme.mjs --force              redraw everything
//   node styleboard/art/readme.mjs --sheets <dir>       also contact sheets of the 15 headers on GitHub's page colours, to check crops
//
// Incremental: docs/readme/manifest.json keeps a key per picture: everything that goes into it (its markup and CSS without
// the machine's paths, the hash of each poster and font, the scale, the encoder settings) and, apart, the hash of its source
// stills. A picture whose key hasn't changed is not redrawn and its file is left alone. A full run (all stations, all steps)
// also deletes pictures nothing makes any more.
// Sources: posters (styles/<slug>/poster.jpg) and thank-you posters (styleboard/img/thanks/) are in the repository. The
// station stills, the frames of the long take (its opening; the end plate's) and the projector frame are not: they are rendered for the site and
// will live on the site media release (not made yet). Until then pass the folder with --media or OPUSCAR_MEDIA (default:
// .release/site-source, which git ignores; a symlink does). Without them, pictures that need no redrawing are kept;
// one that does stops the run and names the file it needs.
// Sizes are CSS px as GitHub shows a README: the column is 838 px wide at any window of 1280 px or more, 570 px at 1012 px,
// 324 px on a 390 px phone (measured 2026-11-07). Headers and covers are drawn at 2×, cards at 1.5×.
// Needs: playwright-core's Chromium (npx playwright-core install chromium), ffmpeg, cwebp and img2webp (libwebp), python3.
// Fonts (all OFL), the site's: Source Serif 4, Source Sans 3 (labels, with tabular figures), Noto Serif SC and Noto Sans SC,
// all through styleboard/fonts/fetch.py (pinned, downloaded on first use).
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..');
const DOCS = path.join(ROOT, 'docs');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const MEDIA = path.resolve(arg('--media', process.env.OPUSCAR_MEDIA || path.join(ROOT, '.release/site-source')));
const FORCE = process.argv.includes('--force');
const LAYOUT = JSON.parse(fs.readFileSync(path.join(HERE, 'readme.json'), 'utf8'));
const RD = path.relative(DOCS, path.join(ROOT, LAYOUT.dir));   // "readme"
const url = p => pathToFileURL(p).href;
const SITE = 'https://lemomo-ai.github.io/lemo-opuscar/';

// ---------- layout ----------
const W = 838;          // README column, desktop
const S = 2;            // headers, covers: 2×
const CS = 1.5;         // cards: 1.5× (captions stay sharp; a third of the weight of 2×)
const HEAD_H = 279;     // station header: 3 : 1
const COVER = { w: 838, h: 419, frames: 80, ms: 50, travel: 32, cropY: 80, q: 75 };   // 2 : 1, 4 s, frames 0–32 of the long take
const O98_H = 381;      // OPUSCAR 98 plate: 2.2 : 1
const END_H = 320;      // end plate: 2.6 : 1
const END = { frame: 95, zoom: 1, dx: 0.1, y: 0.3 };   // the long take's frame with the lamps still on above the empty bench, and how it sits
const GAP = 18;         // between style cards
const TGAP = 14;        // between thank-you cards
const PLATE = 0.40;     // light theme: the photo starts at 40 % (the site's left column is 40 %)
const Q = { station: 72, card: 74, o98: 80, end: 72 };   // headers at 72: the dark README stays under 4 MB to open (release.py check)
const V = 1;            // bump to redraw everything after a change the keys can't see (an encoder upgrade)
const colsFor = n => LAYOUT.cols_by_count[n] || LAYOUT.cols;

// How each station's still sits in its 3 : 1 header. y: where the window sits (0 top … 1 bottom); dx: the still moves right by
// this share of the column, so the props clear the 40 % line (the light theme's plate edge, the dark theme's fade) and the
// type never lands on them; zoom > 1 crops in. Checked one by one on contact sheets (--sheets).
const FRAME = {
  1: { y: 0.24, dx: 0.06 }, 2: { y: 0.22, dx: 0 }, 3: { y: 0.34, dx: 0.02 }, 4: { y: 0.28, dx: 0.1 }, 5: { y: 0.12, dx: 0.05 },
  6: { y: 0.46, dx: 0.06 }, 7: { y: 0.36, dx: 0.06 }, 8: { y: 0.52, dx: 0.1 }, 9: { y: 0.5, dx: 0.05 }, 10: { y: 0.24, dx: 0.11 },
  11: { y: 0.28, dx: 0.04 }, 12: { y: 0.3, dx: 0.06 }, 13: { y: 0.46, dx: 0.1 }, 14: { y: 0.26, dx: 0.1 }, 15: { y: 0.6, dx: 0.1 } };

// ---------- colour: the site's tokens, and their printed-on-paper twins ----------
const THEME = {
  dark: { page: '#0d1117', fg: '#efe7da', fg2: 'rgba(239,231,218,.72)', fg3: 'rgba(239,231,218,.56)', hair: 'rgba(239,231,218,.24)',
    lamp: '#e9b47c', edge: 'rgba(239,231,218,.14)', shadow: '0 12px 22px -12px rgba(0,0,0,.9)' },
  light: { page: '#ffffff', fg: '#1c1914', fg2: 'rgba(28,25,20,.74)', fg3: 'rgba(28,25,20,.62)', hair: 'rgba(28,25,20,.22)',
    lamp: '#9b5f22', edge: 'rgba(28,25,20,.12)', shadow: '0 1px 1px rgba(28,25,20,.06), 0 12px 18px -12px rgba(28,25,20,.42)' },
};

// ---------- data: the catalogue and styleboard/gallery.py ----------
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'styleboard/catalog.json'), 'utf8'));
const G = JSON.parse(execFileSync('python3', ['-I', '-c',
  `import sys, json; sys.path.insert(0, ${JSON.stringify(path.join(ROOT, 'styleboard'))}); import gallery as g
print(json.dumps({'new': sorted(g.NEW), 'thanks': g.THANKS, 'feature': g.FEATURE}, ensure_ascii=False))`], { encoding: 'utf8' }));
// stations are numbered over every category in the catalogue, as build.py numbers them; the README shows finished styles (with a STYLE.md)
const CATS = [];
for (const s of catalog) {
  let c = CATS.find(c => c.en === s.cat_en);
  if (!c) CATS.push(c = { n: CATS.length + 1, en: s.cat_en, zh: s.cat, styles: [] });
  if (fs.existsSync(path.join(ROOT, 'styles', s.slug, 'STYLE.md'))) c.styles.push(s);
}
const NS = CATS.reduce((n, c) => n + c.styles.length, 0), NC = CATS.length;   // counted, never typed
const nn = n => String(n).padStart(2, '0');
const mmss = d => d ? `${Math.floor(Math.round(d) / 60)}:${String(Math.round(d) % 60).padStart(2, '0')}` : '';   // as build.py writes it in the alt text
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isNew = s => G.new.includes(s.slug);
const THANKS = G.thanks.map(([id, dur, , [en, zh]]) => ({ id, dur, en, zh, poster: path.join(ROOT, 'styleboard/img/thanks', `${id}.jpg`) }));
const media = rel => path.join(MEDIA, rel);

// ---------- fonts ----------
const FDIR = path.join(ROOT, 'styleboard/fonts'), FETCH = path.join(FDIR, 'fetch.py');
const FONTS = ['SourceSerif4', 'SourceSerif4Italic', 'SourceSans3', 'NotoSerifSC', 'NotoSansSC'];
let BASE = null;   // built on the first drawing, so a run with nothing to draw never downloads the fonts
function base() {
  if (BASE) return BASE;
  const [se, sei, sa, serif, sans] = FONTS.map(n => url(execFileSync('python3', [FETCH, n], { encoding: 'utf8' }).trim()));
  return BASE = `
@font-face{font-family:Serif;src:url(${se});font-weight:200 900}
@font-face{font-family:Serif;font-style:italic;src:url(${sei});font-weight:200 900}
@font-face{font-family:Sans;src:url(${sa});font-weight:200 900}
@font-face{font-family:SerifSC;src:url(${serif});font-weight:200 900}
@font-face{font-family:SansSC;src:url(${sans});font-weight:100 900}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:transparent}
body{font-synthesis:none;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.serif{font-family:Serif,SerifSC,serif;font-optical-sizing:auto}
.sc{font-family:SerifSC,serif;font-weight:600}
.mono{font-family:Sans,SansSC,sans-serif;font-variant-numeric:tabular-nums;font-weight:500;letter-spacing:.14em;text-transform:uppercase}`;
}

// ---------- incremental ----------
const MANIFEST = path.join(ROOT, LAYOUT.dir, 'manifest.json');
const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
const made = new Set(), stat = { drawn: 0, kept: 0, keptWithoutMedia: 0 };
const sha1 = b => createHash('sha1').update(b).digest('hex');
const hashes = new Map();
const fhash = f => { if (!hashes.has(f)) hashes.set(f, sha1(fs.readFileSync(f))); return hashes.get(f); };
const FONTS_KEY = sha1(FONTS.map(n => execFileSync('python3', [FETCH, '--sha', n], { encoding: 'utf8' }).trim()).join());
const norm = s => s.split(url(MEDIA)).join('$MEDIA').split(url(ROOT)).join('$ROOT');   // no machine paths in a key (the media folder first: it may be inside the repository)
const key = (...parts) => sha1(JSON.stringify([V, FONTS_KEY, ...parts])).slice(0, 20);
// null when the picture is up to date; else what to record once it is drawn. `src` are its sources outside the repository:
// when they are here their hash must match too; when they aren't, an unchanged key is enough to keep the picture.
function todo(rel, k, src = []) {
  made.add(rel);
  const e = manifest[rel], here = src.every(f => fs.existsSync(f));
  const m = src.length && here ? sha1(src.map(fhash).join()) : null;
  if (!FORCE && e && e.k === k && fs.existsSync(path.join(DOCS, rel)) && (!src.length || !here || e.m === m)) {
    stat.kept++; if (src.length && !here) stat.keptWithoutMedia++; return null;
  }
  if (!here) throw new Error(`${rel} has to be redrawn but its source is missing: ${src.filter(f => !fs.existsSync(f)).map(f => path.relative(MEDIA, f)).join(', ')}` +
    ` (in ${MEDIA}; pass the folder with --media or OPUSCAR_MEDIA)`);
  return m ? { k, m } : { k };
}
const record = (rel, e) => { manifest[rel] = e; stat.drawn++; };

// ---------- rendering ----------
let browser;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'readme-art-'));
async function page(html, w, h, scale = S) {
  browser ||= await chromium.launch();
  const f = path.join(tmp, `p${Math.random().toString(36).slice(2)}.html`);
  fs.writeFileSync(f, `<!doctype html><meta charset="utf-8"><style>${base()}</style>${html}`);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  const p = await ctx.newPage();
  await p.goto(url(f), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => 0))));
  return { p, close: () => ctx.close() };
}
function webp(png, out, q) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  execFileSync('cwebp', ['-quiet', '-q', String(q), '-m', '6', '-sharp_yuv', '-alpha_q', '100', png, '-o', out]);
  return fs.statSync(out).size;
}
const kb = n => `${Math.round(n / 1024)} KB`;
const log = (...a) => console.log(...a);
const out = rel => path.join(DOCS, rel);

// ---------- station header ----------
function stationHTML(c, lang, theme) {
  const t = THEME[theme], fr = { zoom: 1, dx: 0, y: 0.42, ...(FRAME[c.n] || {}) };
  const iw = W * fr.zoom, ih = iw * 9 / 16, top = -(ih - HEAD_H) * fr.y, left = -(iw - W) + fr.dx * W;
  const still = media(`frames/clean/s${nn(c.n)}.png`);
  const count = c.styles.length;
  const meta = lang === 'zh'
    ? `<span>工位 ${nn(c.n)} / ${NC}</span><i></i><span>${count} 种风格</span>`
    : `<span>Station ${nn(c.n)} / ${NC}</span><i></i><span>${count} styles</span>`;
  const name = lang === 'zh'
    ? `<div class="name sc">${esc(c.zh)}</div><div class="sub serif it">${esc(c.en)}</div>`
    : `<div class="name serif">${esc(c.en).replace(' &amp; ', ' &amp;<br>')}</div><div class="sub sc">${esc(c.zh)}</div>`;
  const ticks = Array.from({ length: NC }, (_, i) => `<b class="${i + 1 === c.n ? 'on' : ''}" style="left:${(i / (NC - 1) * 100).toFixed(3)}%"></b>`).join('');
  // end labels 01 and 15, the station's own number under its tick; an end label too close to it steps aside
  const labels = (c.n > 3 ? `<em class="l">01</em>` : '') + (c.n < NC - 2 ? `<em class="r">${nn(NC)}</em>` : '') +
    `<em class="on${c.n === 1 ? ' l' : c.n === NC ? ' r' : ''}" style="left:${((c.n - 1) / (NC - 1) * 100).toFixed(3)}%">${nn(c.n)}</em>`;
  return { still, html: `<style>
  .hd{position:relative;width:${W}px;height:${HEAD_H}px;overflow:hidden;color:${t.fg}}
  .ph{position:absolute;inset:0}
  .ph img{position:absolute;width:${iw}px;height:${ih}px;left:${left.toFixed(1)}px;top:${top.toFixed(1)}px}
  /* the left fade rides on the still itself, so a still moved right (dx) starts fully transparent: no edge */
  .dark .ph img{-webkit-mask-image:linear-gradient(90deg,transparent 0,rgba(0,0,0,.16) ${20 - fr.dx * 100}%,rgba(0,0,0,.72) ${42 - fr.dx * 100}%,#000 ${58 - fr.dx * 100}%)}
  .dark .ph{-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 16%,#000 84%,transparent 100%),linear-gradient(270deg,transparent 0,#000 5%);
    -webkit-mask-composite:source-in;mask-composite:intersect}
  .light .ph{clip-path:inset(0 0 0 ${PLATE * 100}%)}
  .tx{position:absolute;left:0;top:30px;width:${Math.round(W * (PLATE - 0.035))}px}
  .meta{display:flex;align-items:center;gap:10px;font-size:11.5px;color:${t.fg3}}
  .meta i{flex:0 0 34px;height:1px;background:${t.hair}}
  .zh .meta{letter-spacing:.12em}
  .title{display:flex;align-items:flex-start;gap:14px;margin-top:28px}
  .no{font-family:Serif;font-size:66px;line-height:.74;letter-spacing:-.01em}
  .name{font-size:29px;line-height:1.08}
  .zh .name{font-size:34px;line-height:1.05;letter-spacing:.04em}
  .sub{margin-top:9px;color:${t.fg2}}
  .en .sub{font-size:13px;letter-spacing:.32em}
  .zh .sub{font-size:16.5px;font-style:italic}
  .ruler{position:absolute;left:0;bottom:32px;width:${Math.round(W * 0.30)}px;height:1px;background:${t.hair}}
  .ruler b{position:absolute;bottom:0;width:1px;height:5px;margin-left:-.5px;background:${t.hair}}
  .ruler b.on{height:12px;background:${t.lamp}}
  .ruler em{position:absolute;top:8px;transform:translateX(-50%);font:500 10px/1 Sans;font-variant-numeric:tabular-nums;letter-spacing:.06em;color:${t.fg3};font-style:normal}
  .ruler em.on{color:${t.lamp}}
  .ruler em.l{left:0;transform:none} .ruler em.r{left:auto;right:0;transform:none}
  </style>
  <div class="hd ${theme} ${lang}" id="hd"><div class="ph"><img src="${url(still)}"></div>
    <div class="tx"><div class="meta mono">${meta}</div>
      <div class="title"><div class="no">${nn(c.n)}</div><div>${name}</div></div></div>
    <div class="ruler">${ticks}${labels}</div></div>` };
}
async function stations(cats) {
  for (const c of cats.filter(c => c.styles.length)) for (const lang of ['en', 'zh']) for (const theme of ['light', 'dark']) {
    const { still, html } = stationHTML(c, lang, theme), rel = `${RD}/station-${nn(c.n)}-${lang}-${theme}.webp`;
    const e = todo(rel, key('station', norm(html), S, Q.station), [still]);
    if (!e) continue;
    const { p, close } = await page(html, W, HEAD_H);
    const png = path.join(tmp, 'h.png');
    await p.locator('#hd').screenshot({ path: png, omitBackground: true }); await close();
    log(`  ${rel}: ${kb(webp(png, out(rel), Q.station))}`); record(rel, e);
  }
}

// ---------- cards: a picture with its caption, laid out flush in the README column ----------
// Each card carries its share of the gutters (the first column flush left, the last flush right) and the README puts no
// whitespace between them, so the grid lines up with the column at any width. A card's picture therefore depends on its
// column and, a row being as tall as its tallest caption, on its row: both are in its key. Renaming a style redraws its
// cards (and its row's, if the row's height changes); adding one redraws the cards after it in its station, whose columns move.
const CARD_CSS = t => `
  .grid{display:grid;width:${W}px;color:${t.fg}}
  .card{padding-bottom:14px}
  .th{aspect-ratio:16/9;box-shadow:${t.shadow};outline:1px solid ${t.edge};outline-offset:-1px;position:relative}
  .th img{display:block;width:100%;height:100%;object-fit:cover}
  .l1{display:flex;align-items:baseline;gap:10px;margin-top:11px}
  .l2{display:flex;align-items:baseline;gap:10px;margin-top:3px;color:${t.fg2}}
  .nm{flex:1;font-size:16.5px;line-height:1.22}
  .sc.nm{font-size:15.5px;letter-spacing:.02em}
  .film{flex:1;font-style:italic;font-size:14px;line-height:1.25}
  .film-zh{font-family:SansSC,sans-serif;font-size:12.5px;line-height:1.4}
  .du{flex:none;font-size:11px;letter-spacing:.06em;color:${t.fg3};font-weight:400}
  .new{font:500 8.5px/1 Sans;letter-spacing:.12em;text-transform:uppercase;color:${t.lamp};margin-left:5px;vertical-align:.7em}
  .zh .new{font-family:SerifSC;font-size:10px;letter-spacing:0}
  .ty .l1{margin-top:9px} .ty .stars{font-size:9.5px;color:${t.fg3};letter-spacing:.12em}
  .ty .nm{font-size:14.5px} .ty .sc.nm{font-size:13.5px}`;
function styleCaption(s, lang) {
  const nw = isNew(s) ? `<sup class="new">${lang === 'zh' ? '新' : 'New'}</sup>` : '';
  return lang === 'zh'
    ? `<div class="l1"><span class="nm sc">${esc(s.cn)}${nw}</span><span class="du mono">${mmss(s.dur)}</span></div><div class="l2 film-zh">《${esc(s.film_cn || s.film)}》</div>`
    : `<div class="l1"><span class="nm serif">${esc(s.en)}${nw}</span></div><div class="l2"><span class="film serif">${esc(s.film)}</span><span class="du mono">${mmss(s.dur)}</span></div>`;
}
function thanksCaption(f, lang) {
  const [stars, title] = (lang === 'zh' ? f.zh : f.en).split(' · ');
  return `<div class="l1"><span class="stars mono">${esc(stars)}</span></div>` +
    `<div class="l1" style="margin-top:3px"><span class="nm ${lang === 'zh' ? 'sc' : 'serif'}">${esc(title)}</span><span class="du mono">${f.dur}</span></div>`;
}
// items: [{rel, thumb, cap}] → one picture per item; the page is only opened when something needs drawing
async function cardRow(items, cols, gap, theme, lang, cls = '') {
  const t = THEME[theme], cw = W / cols, css = CARD_CSS(t);
  const cells = items.map((it, i) => {
    const col = i % cols, l = col * gap / cols, r = (cols - 1 - col) * gap / cols;
    return `<div class="card" id="c${i}" style="padding-left:${l}px;padding-right:${r}px"><div class="th"><img src="${url(it.thumb)}"></div>${it.cap}</div>`;
  });
  // a row's height comes from its captions, so a card's key names the captions of its row-mates (not their pixels)
  const rowOf = i => cells.slice(i - i % cols, i - i % cols + cols).map(c => norm(c).replace(/<img[^>]*>/, ''));
  const keys = items.map((it, i) => key('card', norm(css), cls, norm(cells[i]), cols, rowOf(i), fhash(it.thumb), CS, Q.card));
  const need = items.map((it, i) => todo(it.rel, keys[i]));
  let drawn = 0, total = 0;
  if (need.some(Boolean)) {
    const html = `<style>${css}</style><div class="grid ${lang} ${cls}" style="grid-template-columns:repeat(${cols},${cw}px)">${cells.join('')}</div>`;
    const { p, close } = await page(html, W, 1600, CS);
    for (const [i, it] of items.entries()) if (need[i]) {
      const png = path.join(tmp, 'c.png');
      await p.locator(`#c${i}`).screenshot({ path: png, omitBackground: true });
      webp(png, out(it.rel), Q.card); record(it.rel, need[i]); drawn++;
    }
    await close();
  }
  for (const it of items) total += fs.statSync(out(it.rel)).size;
  return { total, drawn };
}
async function cards(cats) {
  for (const c of cats.filter(c => c.styles.length)) for (const lang of ['en', 'zh']) for (const theme of ['light', 'dark']) {
    const items = c.styles.map(s => ({ rel: `${RD}/cards/${s.slug}-${lang}-${theme}.webp`, thumb: path.join(ROOT, 'styles', s.slug, 'poster.jpg'), cap: styleCaption(s, lang) }));
    const { total, drawn } = await cardRow(items, colsFor(items.length), GAP, theme, lang);
    if (drawn) log(`  cards ${nn(c.n)} ${lang} ${theme}: ${drawn} drawn, ${items.length} × ≈${kb(total / items.length)}`);
  }
}

// ---------- OPUSCAR 98 (the projector at the end of the bench) and the thank-you cards ----------
function o98HTML(lang, theme) {
  const fin = media('frames/clean/finale.png'), ih = W * 9 / 16, top = -(ih - O98_H) * 0.12;
  const meta = lang === 'zh' ? `<span>特别放映</span><i></i><span>${G.feature.dur.replace(':', ' 分 ')} 秒</span>` : `<span>Feature presentation</span><i></i><span>${G.feature.dur}</span>`;
  const cta = lang === 'zh' ? `<span class="sc">▶ 看这支片</span>` : `<span class="serif it">▶ Watch the film</span>`;
  return { still: fin, html: `<style>
  .o{position:relative;width:${W}px;height:${O98_H}px;overflow:hidden;color:#efe7da}
  .o img{position:absolute;left:0;top:${top.toFixed(1)}px;width:${W}px;height:${ih}px}
  .dark.o img{-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 12%,#000 86%,transparent),linear-gradient(90deg,transparent 0,#000 6%,#000 94%,transparent);
    -webkit-mask-composite:source-in;mask-composite:intersect}
  .tx{position:absolute;right:30px;bottom:34px;text-align:right}
  .meta{display:flex;align-items:center;justify-content:flex-end;gap:10px;font-size:11.5px;color:rgba(239,231,218,.62)}
  .meta i{width:34px;height:1px;background:rgba(239,231,218,.3)}
  .cta{margin-top:12px;font-size:21px} .cta .it{font-style:italic} .cta .sc{font-size:17px;letter-spacing:.08em}
  </style><div class="o ${theme}" id="o"><img src="${url(fin)}"><div class="tx"><div class="meta mono">${meta}</div><div class="cta">${cta}</div></div></div>` };
}
async function films() {
  for (const lang of ['en', 'zh']) for (const theme of ['light', 'dark']) {
    const { still, html } = o98HTML(lang, theme), rel = `${RD}/opuscar98-${lang}-${theme}.webp`;
    const e = todo(rel, key('o98', norm(html), S, Q.o98), [still]);
    if (e) {
      const { p, close } = await page(html, W, O98_H);
      const png = path.join(tmp, 'o.png');
      await p.locator('#o').screenshot({ path: png, omitBackground: true }); await close();
      log(`  ${rel}: ${kb(webp(png, out(rel), Q.o98))}`); record(rel, e);
    }
    const items = THANKS.map(f => ({ rel: `${RD}/thanks/${f.id}-${lang}-${theme}.webp`, thumb: f.poster, cap: thanksCaption(f, lang) }));
    const { total, drawn } = await cardRow(items, items.length, TGAP, theme, lang, 'ty');
    if (drawn) log(`  thank-you cards ${lang} ${theme}: ${drawn} drawn, ${kb(total)}`);
  }
}

// ---------- the end plate: the bench's lamps still on, and a star asked for (the README's last picture) ----------
// Set like a station header (words on the dark left, the photo from the 40 % line), with the ruler of the 15 stations and
// one more mark past the last: a lamp-coloured star. The README links the whole plate to the stargazers; other links stay text.
function endHTML(lang, theme) {
  const t = THEME[theme], still = media(`long/frames/f_${String(END.frame).padStart(4, '0')}.png`);
  const iw = W * END.zoom, ih = iw * 9 / 16, top = -(ih - END_H) * END.y, left = -(iw - W) + END.dx * W;
  const zh = lang === 'zh';
  const meta = zh ? `<span>工作台到头了</span><i></i><span>LemoLab</span>` : `<span>End of the bench</span><i></i><span>LemoLab</span>`;
  const title = zh ? `<div class="h sc">哪支片子打动了你，<br>就点一颗星。</div>` : `<div class="h serif">If a film here was worth it,<br>leave a star.</div>`;
  const cta = zh ? `<div class="cta"><b>★</b><span class="sc">去 GitHub 点星</span></div>` : `<div class="cta"><b>★</b><span class="serif it">Star it on GitHub</span></div>`;
  const ticks = Array.from({ length: NC }, (_, i) => `<b style="left:${(i / NC * 100).toFixed(3)}%"></b>`).join('');
  return { still, html: `<style>
  .e{position:relative;width:${W}px;height:${END_H}px;overflow:hidden;color:${t.fg}}
  .ph{position:absolute;inset:0}
  .ph img{position:absolute;width:${iw}px;height:${ih}px;left:${left.toFixed(1)}px;top:${top.toFixed(1)}px}
  .dark .ph img{-webkit-mask-image:linear-gradient(90deg,transparent 0,rgba(0,0,0,.16) ${20 - END.dx * 100}%,rgba(0,0,0,.72) ${42 - END.dx * 100}%,#000 ${58 - END.dx * 100}%)}
  .dark .ph{-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 16%,#000 84%,transparent 100%),linear-gradient(270deg,transparent 0,#000 5%);
    -webkit-mask-composite:source-in;mask-composite:intersect}
  .light .ph{clip-path:inset(0 0 0 ${PLATE * 100}%)}
  .tx{position:absolute;left:0;top:30px;width:${Math.round(W * (PLATE - 0.035))}px}
  .meta{display:flex;align-items:center;gap:10px;font-size:11.5px;color:${t.fg3};white-space:nowrap}
  .meta i{flex:0 0 34px;height:1px;background:${t.hair}}
  .zh .meta{letter-spacing:.12em}
  .h{margin-top:34px;font-size:27px;line-height:1.2;letter-spacing:-.005em}
  .zh .h{font-size:25px;line-height:1.45;letter-spacing:.04em}
  .cta{display:flex;align-items:baseline;gap:10px;margin-top:18px;font-size:18px;color:${t.fg2}}
  .cta b{font:400 15px/1 Sans;color:${t.lamp}} .cta .it{font-style:italic} .cta .sc{font-size:15px;letter-spacing:.1em}
  .ruler{position:absolute;left:0;bottom:32px;width:${Math.round(W * 0.30)}px;height:1px;background:${t.hair}}
  .ruler b{position:absolute;bottom:0;width:1px;height:5px;margin-left:-.5px;background:${t.hair}}
  .ruler em{position:absolute;top:8px;font:500 10px/1 Sans;font-variant-numeric:tabular-nums;letter-spacing:.06em;color:${t.fg3};font-style:normal}
  .ruler em.l{left:0} .ruler em.r{left:${((NC - 1) / NC * 100).toFixed(3)}%;transform:translateX(-50%)}
  .ruler .st{position:absolute;left:100%;bottom:-5px;transform:translateX(-50%);font:400 11px/1 Sans;color:${t.lamp}}
  </style>
  <div class="e ${theme} ${lang}" id="e"><div class="ph"><img src="${url(still)}"></div>
    <div class="tx"><div class="meta mono">${meta}</div>${title}${cta}</div>
    <div class="ruler">${ticks}<em class="l">01</em><em class="r">${nn(NC)}</em><span class="st">★</span></div></div>` };
}
async function end() {
  for (const lang of ['en', 'zh']) for (const theme of ['light', 'dark']) {
    const { still, html } = endHTML(lang, theme), rel = `${RD}/end-${lang}-${theme}.webp`;
    const e = todo(rel, key('end', norm(html), S, Q.end), [still]);
    if (!e) continue;
    const { p, close } = await page(html, W, END_H);
    const png = path.join(tmp, 'e.png');
    await p.locator('#e').screenshot({ path: png, omitBackground: true }); await close();
    log(`  ${rel}: ${kb(webp(png, out(rel), Q.end))}`); record(rel, e);
  }
}

// ---------- cover: the long take's opening, frames 0–32 eased out and back (1 − cos), 4 s, seamless ----------
// light: the frame as it is; dark: its edges sink into GitHub's dark page. The site's top bar is set on both; it carries no
// count, so adding a style never redraws the covers (the headline under the cover has the number).
function mastHTML(lang, w, h, k = 1) {
  const sub = lang === 'zh' ? `<span class="sc wb">电影工坊</span>` : `<span class="serif it wb">The Workbench</span>`;
  const right = lang === 'zh' ? '用代码做的影片风格' : 'Film styles, made in code';
  return `<style>.m{position:absolute;left:${28 * k}px;right:${28 * k}px;top:${24 * k}px;display:flex;align-items:center;gap:${14 * k}px;color:#efe7da}
  .mk{font-family:Serif;font-weight:500;font-size:${15 * k}px;letter-spacing:.24em}
  .wb{font-size:${14 * k}px;color:rgba(239,231,218,.74)} .it{font-style:italic}
  .sc.wb{font-size:${12.5 * k}px;letter-spacing:.3em}
  .ln{flex:1;height:1px;background:rgba(239,231,218,.26)}
  .r{font-size:${10 * k}px;color:rgba(239,231,218,.62)}</style>
  <div style="position:relative;width:${w}px;height:${h}px" id="m"><div class="m"><span class="mk">OPUSCAR</span>${sub}<i class="ln"></i><span class="mono r">${right}</span></div></div>`;
}
function fadeHTML(w, h, color) {
  return `<div id="f" style="width:${w}px;height:${h}px;background:
    linear-gradient(180deg,transparent 78%,${color} 100%),
    linear-gradient(90deg,${color} 0,transparent 12%,transparent 88%,${color} 100%),
    linear-gradient(0deg,transparent 88%,${color}cc 100%)"></div>`;
}
async function overlay(html, w, h, sel, file) {
  const { p, close } = await page(html, w, h);
  await p.locator(sel).screenshot({ path: file, omitBackground: true }); await close();
}
async function cover() {
  const dir = path.join(tmp, 'cover'); fs.mkdirSync(dir, { recursive: true });
  const pw = COVER.w * S, ph = COVER.h * S, N = COVER.frames;
  const src = Array.from({ length: COVER.travel + 1 }, (_, i) => media(`long/frames/f_${String(i).padStart(4, '0')}.png`));
  const jobs = [];
  for (const lang of ['en', 'zh']) for (const theme of ['light', 'dark']) {
    const rel = `${RD}/cover-${lang}-${theme}.webp`;
    const e = todo(rel, key('cover', COVER, norm(mastHTML(lang, COVER.w, COVER.h)), theme === 'dark' ? fadeHTML(COVER.w, COVER.h, THEME.dark.page) : ''), src);
    if (e) jobs.push({ lang, theme, rel, e });
  }
  if (!jobs.length) return;
  for (let k = 0; k < N; k++) {   // neighbouring frames blended for the in-betweens
    const pos = COVER.travel / 2 * (1 - Math.cos(2 * Math.PI * k / N)), i = Math.floor(pos), j = Math.min(i + 1, COVER.travel), f = (pos - i).toFixed(4);
    execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-y', '-i', src[i], '-i', src[j], '-lavfi',
      `[0][1]blend=all_expr='A*(1-${f})+B*${f}',crop=1920:960:0:${COVER.cropY},scale=${pw}:${ph}:flags=lanczos`, path.join(dir, `b${String(k).padStart(3, '0')}.png`)]);
  }
  await overlay(fadeHTML(COVER.w, COVER.h, THEME.dark.page), COVER.w, COVER.h, '#f', path.join(dir, 'fade.png'));
  for (const { lang, theme, rel, e } of jobs) {
    const mast = path.join(dir, `mast-${lang}.png`);
    if (!fs.existsSync(mast)) await overlay(mastHTML(lang, COVER.w, COVER.h), COVER.w, COVER.h, '#m', mast);
    const fr = path.join(dir, `${lang}-${theme}`); fs.mkdirSync(fr, { recursive: true });
    for (let i = 0; i < N; i++) {
      const b = path.join(dir, `b${String(i).padStart(3, '0')}.png`), o = path.join(fr, `o${String(i).padStart(3, '0')}.png`);
      const ins = theme === 'dark' ? ['-i', b, '-i', path.join(dir, 'fade.png'), '-i', mast] : ['-i', b, '-i', mast];
      execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-y', ...ins, '-lavfi', theme === 'dark' ? '[0][1]overlay[a];[a][2]overlay' : '[0][1]overlay', o]);
    }
    const list = fs.readdirSync(fr).sort().map(n => path.join(fr, n));
    fs.mkdirSync(path.dirname(out(rel)), { recursive: true });
    execFileSync('img2webp', ['-loop', '0', '-lossy', '-q', String(COVER.q), '-m', '6', '-d', String(COVER.ms), ...list, '-o', out(rel)], { stdio: 'ignore' });
    log(`  ${rel}: ${N} frames, ${N * COVER.ms / 1000} s, ${kb(fs.statSync(out(rel)).size)}`); record(rel, e);
  }
}

// ---------- docs/cover.jpg (the cover, still) and docs/social.jpg (GitHub's social preview, also the site's share card) ----------
function heroHTML(w, h, social) {
  const hero = media('frames/clean/hero.png'), k = w / COVER.w, ih = w * 9 / 16, top = -COVER.cropY / 1080 * ih;
  if (!social) return { still: hero, html: `<div id="a" style="position:relative;width:${w}px;height:${h}px;overflow:hidden">
    <img src="${url(hero)}" style="position:absolute;left:0;top:${top}px;width:${w}px;height:${ih}px">
    ${mastHTML('en', w, h, k).replace(/id="m"/, '').replace('position:relative', 'position:absolute;inset:0')}</div>` };
  // read at 400–600 px wide in a feed: few words, big
  return { still: hero, html: `<style>
    .s{position:relative;width:${w}px;height:${h}px;overflow:hidden;color:#efe7da}
    .s>img{position:absolute;left:-40px;top:${-0.06 * ih}px;width:${w + 40}px;height:${(w + 40) * 9 / 16}px}
    .sc2{position:absolute;inset:0;background:linear-gradient(90deg,rgba(12,10,9,.86) 0,rgba(12,10,9,.62) 34%,rgba(12,10,9,0) 62%),
      linear-gradient(180deg,rgba(12,10,9,.35) 0,transparent 30%);
      -webkit-mask-image:linear-gradient(180deg,#000 0,#000 58%,transparent 76%)}   /* the type below keeps its light */
    .t{position:absolute;left:72px;top:64px}
    .meta{display:flex;align-items:center;gap:16px;font-size:15px;color:rgba(239,231,218,.66)}
    .meta i{width:46px;height:1px;background:rgba(239,231,218,.3)}
    h1{font-family:Serif;font-weight:400;font-size:66px;line-height:1.02;letter-spacing:-.012em;margin-top:30px}
    h1 em{font-style:italic;color:#efe7da}
    .u{margin-top:30px;font-size:15px;color:rgba(239,231,218,.62);text-transform:none;letter-spacing:.04em}
  </style><div class="s" id="a"><img src="${url(hero)}"><div class="sc2"></div>
    <div class="t"><div class="meta mono"><span>Lemo-Opuscar</span><i></i><span>${NS} film styles · ${NC} stations</span></div>
      <h1>Pick a style.<br>Bring your story.<br><em>Your agent makes the film.</em></h1>
      <div class="u mono">github.com/lemomo-ai/lemo-opuscar</div></div></div>` };
}
async function art() {
  for (const [name, w, h, scale, social, limit] of [['cover', 1200, 600, 2, false, 500e3], ['social', 1280, 640, 1, true, 300e3]]) {
    const { still, html } = heroHTML(w, h, social), rel = `${name}.jpg`;
    const e = todo(rel, key('art', norm(html), scale, limit), [still]);
    if (!e) continue;
    const { p, close } = await page(html, w, h, scale);
    const png = path.join(tmp, name + '.png');
    await p.locator('#a').screenshot({ path: png }); await close();
    for (let q = 2; q <= 12; q++) { execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-q:v', String(q), out(rel)]); if (fs.statSync(out(rel)).size <= limit) break; }
    log(`  docs/${rel} ${w * scale}×${h * scale}: ${kb(fs.statSync(out(rel)).size)}`); record(rel, e);
  }
}

// ---------- contact sheets of the station headers on GitHub's page colours (checking crops by eye) ----------
function sheets(dir) {
  fs.mkdirSync(dir, { recursive: true });
  for (const lang of ['en', 'zh']) for (const theme of ['light', 'dark']) {
    const bg = theme === 'light' ? 'white' : '0x0d1117', ins = [], fc = [];
    CATS.forEach((c, i) => {
      ins.push('-i', out(`${RD}/station-${nn(c.n)}-${lang}-${theme}.webp`));
      fc.push(`color=${bg}:s=${W * S}x${HEAD_H * S}[g${i}];[g${i}][${i}]overlay=format=auto,pad=${W * S}:${HEAD_H * S + 40}:0:0:${bg}[v${i}]`);
    });
    const lay = CATS.map((_, i) => `${(i % 3) * (W * S + 40)}_${Math.floor(i / 3) * (HEAD_H * S + 40)}`).join('|');
    const f = path.join(dir, `stations-${lang}-${theme}.jpg`);
    execFileSync('ffmpeg', ['-v', 'error', '-y', ...ins, '-filter_complex', `${fc.join(';')};${CATS.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${NC}:layout=${lay}:fill=${bg},scale=iw/2:-1`, '-frames:v', '1', '-q:v', '3', f]);
    log(`  ${f}`);
  }
}

// ---------- run ----------
const ALL = ['cover', 'stations', 'cards', 'films', 'end', 'art'];
const steps = arg('--steps', ALL.join(',')).split(',');
const sel = arg('--cats', 'all');
const cats = sel === 'all' ? CATS : sel.split(',').map(n => CATS[+n - 1]);
try {
  for (const st of ALL) if (steps.includes(st)) {
    log(st);
    if (st === 'stations') await stations(cats);
    if (st === 'cards') await cards(cats);
    if (st === 'films') await films();
    if (st === 'end') await end();
    if (st === 'art') await art();
    if (st === 'cover') await cover();
  }
  if (arg('--sheets')) sheets(path.resolve(arg('--sheets')));
  if (sel === 'all' && ALL.every(s => steps.includes(s)))   // a full run clears out pictures nothing makes any more
    for (const rel of Object.keys(manifest)) if (!made.has(rel)) {
      fs.rmSync(out(rel), { force: true }); delete manifest[rel]; log(`  removed docs/${rel}`);
    }
  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 1) + '\n');
  log(`${stat.drawn} drawn, ${stat.kept} unchanged` + (stat.keptWithoutMedia ? ` (${stat.keptWithoutMedia} kept without their source stills, whose keys are unchanged)` : ''));
} finally { if (browser) await browser.close(); fs.rmSync(tmp, { recursive: true, force: true }); }
