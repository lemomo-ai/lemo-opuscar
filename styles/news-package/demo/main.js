// LEMO AI NEWS · 本周 AI 四件事 ("four AI stories this week", 2026-10-12 to 10-18) — Broadcast News Package library demo
// Canvas 2D, deterministic render(t). Cuts land on a 120 BPM beat grid with beat 0 = 1.5 s (shot list in DEMO.md).
// No burned-in subtitles, no ticker: the strap stays at the bottom from the first story to the recap; subtitles only as a sidecar .srt (CUES → tools/subs.py).
const W = 1920, H = 1080, DUR = 53.5;
const cv = document.getElementById('out'); let ctx = cv.getContext('2d');

// —— Palette (LemoLab's own brand colours) ——
const C = {
  ink: '#121417', ink2: '#1B1E23', ink3: '#22262C', line: '#454B55',
  lemon: '#F2CF1D', lemonL: '#F8DE4A', lemonD: '#D8B30C', gold: '#D4B064',
  paper: '#F4F1E8', orange: '#FE6B3D', white: '#FFFFFF', grey: '#C9CCD2', grey2: '#7D838D',
};
const F = {
  sc9: s => `900 ${s}px SansSC`, sc7: s => `700 ${s}px SansSC`,
  b8: s => `800 ${s}px Barlow`, b6: s => `600 ${s}px Barlow`, b6i: s => `italic 600 ${s}px Barlow`, mono: s => `500 ${s}px Plex`,
};

// —— Helpers ——
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const eo = x => 1 - Math.pow(1 - x, 3);
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const back = (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function mixc(a, b, k) { const pa = a.match(/\w\w/g).map(h => parseInt(h, 16)), pb = b.match(/\w\w/g).map(h => parseInt(h, 16)); return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], k))).join(',')})`; }

const IM = {};
let EU = null;
function loadImg(src) { return new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(src); i.src = src; }); }

// —— Text registry (TEXTS is used by readcheck) ——
let TX = [];
function text(s, x, y, font, color, align = 'left', ls = 0, id = null) {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = ls + 'px'; ctx.fillText(s, x, y);
  const w = ctx.measureText(s).width; ctx.letterSpacing = '0px';
  if (id) { const m = ctx.getTransform(); const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2; const fs = parseInt(font.match(/(\d+)px/)[1]);
    const p0 = m.transformPoint({ x: x0, y: y - fs }), p1 = m.transformPoint({ x: x0 + w, y: y + 8 });
    TX.push({ id, text: s, x0: Math.min(p0.x, p1.x), y0: Math.min(p0.y, p1.y), x1: Math.max(p0.x, p1.x), y1: Math.max(p0.y, p1.y) }); }
  return w;
}
function tw(s, font, ls = 0) { ctx.font = font; ctx.letterSpacing = ls + 'px'; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w; }

// Cover-fit an image into a rectangle: source point (fx,fy) lands at the rectangle's centre
function photo(img, fx, fy, s, rx = 0, ry = 0, rw = W, rh = H, filter = null) {
  s = Math.max(s, rw / img.width, rh / img.height);
  let ox = rx + rw / 2 - fx * s, oy = ry + rh / 2 - fy * s;
  ox = Math.min(rx, Math.max(rx + rw - img.width * s, ox)); oy = Math.min(ry, Math.max(ry + rh - img.height * s, oy));
  ctx.save(); ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip();
  if (filter) ctx.filter = filter;
  ctx.drawImage(img, ox, oy, img.width * s, img.height * s);
  ctx.restore();
  return { ox, oy, s };
}
function vignette(a = .5) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .95);
  g.addColorStop(0, 'rgba(8,9,11,0)'); g.addColorStop(1, `rgba(8,9,11,${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
// Picture-layer grain (only over the illustrative plates; not on the wrapper layers or data graphics)
const GR = [];
function makeGrain() {
  for (let k = 0; k < 6; k++) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    const d = g.createImageData(256, 256);
    for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (hash(i * .37 + k * 9.1) + hash(i * .11 + k) - 1) * 150; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0); GR.push(c);
  }
}
function grain(t, a = .07) {
  const f = Math.floor(t * 30), c = GR[f % GR.length];
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = a;
  const ox = -Math.floor(hash(f) * 256), oy = -Math.floor(hash(f + 7) * 256);
  for (let x = ox; x < W; x += 256) for (let y = oy; y < H; y += 256) ctx.drawImage(c, x, y);
  ctx.restore();
}

// —— Station logo: lemon-yellow parallelogram + black/gold vertical bars on the left + "LEMO" ——
function plate(cx, cy, s, glint = -1, drop = 1) {
  const w = 520 * s, h = 180 * s, k = h * .28;
  ctx.save(); ctx.translate(cx, cy);
  const path = new Path2D(); path.moveTo(-w / 2 + k, -h / 2); path.lineTo(w / 2 + k, -h / 2); path.lineTo(w / 2 - k, h / 2); path.lineTo(-w / 2 - k, h / 2); path.closePath();
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, C.lemonL); g.addColorStop(1, C.lemonD);
  ctx.fillStyle = g; ctx.fill(path);
  ctx.save(); ctx.clip(path);
  const gx = -w / 2 - k;
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(gx + 2 * k, -h / 2); ctx.lineTo(gx + 2 * k + w * .085, -h / 2); ctx.lineTo(gx + w * .085, h / 2); ctx.lineTo(gx, h / 2); ctx.fill();
  ctx.fillStyle = C.gold; ctx.beginPath(); ctx.moveTo(gx + 2 * k + w * .085, -h / 2); ctx.lineTo(gx + 2 * k + w * .11, -h / 2); ctx.lineTo(gx + w * .11, h / 2); ctx.lineTo(gx + w * .085, h / 2); ctx.fill();
  const letters = ['L', 'E', 'M', 'O']; ctx.font = F.b8(h * .8); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  let x = -w * .25;
  letters.forEach((L, i) => {
    const d = clamp(drop * 4 - i); const yy = h * .29 + (1 - eo(d)) * -h * 1.1;
    ctx.globalAlpha *= 1; ctx.save(); ctx.globalAlpha = ctx.globalAlpha * clamp(d * 3); ctx.fillStyle = C.ink; ctx.fillText(L, x, yy); ctx.restore();
    x += ctx.measureText(L).width - h * .01;
  });
  if (glint >= 0 && glint <= 1) {
    const gx2 = lerp(-w, w, glint); const gg = ctx.createLinearGradient(gx2 - 80 * s, 0, gx2 + 80 * s, 0);
    gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(.5, 'rgba(255,255,255,.6)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gg; ctx.fillRect(-w, -h, w * 2, h * 2);
  }
  ctx.restore(); ctx.restore();
}
function wordmark(x, y, size, align = 'center', id = null) {
  const parts = [['LEMO ', C.white], ['AI ', C.lemon], ['NEWS', C.white]], ls = size * .14;
  const tot = parts.reduce((a, [s]) => a + tw(s, F.b8(size), ls), 0);
  let cx = align === 'center' ? x - tot / 2 : align === 'right' ? x - tot : x;
  for (const [s, c] of parts) cx += text(s, cx, y, F.b8(size), c, 'left', ls);
  if (id) TX.push({ id, text: 'LEMO AI NEWS', x0: cx - tot, y0: y - size, x1: cx, y1: y + 8 });
}

// ============ Wrapper elements ============
// Lower-third strap: stays at the bottom from the first story (7.5) to the recap (43.5), flips vertically when its content changes; does not retract during bumpers either
const STRAP = [
  { out: 45.0, items: [
    { a: 6.0, tab: ['模型', 'MODELS'], cn: '谷歌向全部开发者开放 Gemini 4 Argon', en: 'GOOGLE OPENS GEMINI 4 ARGON TO EVERY DEVELOPER' },
    { a: 13.0, tab: ['市场', 'MARKETS'], cn: '韩国 Kospi 单日跌 7.57%，跌入熊市', en: 'KOSPI PLUNGES 7.57% IN A DAY AND ENTERS A BEAR MARKET' },
    { a: 20.0, tab: ['市场', 'MARKETS'], cn: '利率与 AI 担忧，芯片重挫', en: 'CHIP STOCKS SINK ON AI AND RATE FEARS' },
    { a: 24.0, tab: ['监管', 'POLICY'], cn: '欧盟 AI 办公室向 OpenAI、Anthropic 发出问询', en: 'EU AI OFFICE SENDS QUESTIONS TO OPENAI AND ANTHROPIC' },
    { a: 30.5, tab: ['人物', 'PROFILE'], cn: 'Henna Virkkunen · 欧盟委员会执行副主席', en: 'EXECUTIVE VICE-PRESIDENT, EUROPEAN COMMISSION' },
    { a: 35.5, tab: ['开放权重', 'OPEN WEIGHTS'], cn: 'Meta 开放 Muse Spark Open 模型权重', en: 'META RELEASES THE WEIGHTS OF MUSE SPARK OPEN' }] },
]
// Content-layer downward offset: with no subtitles or ticker, the content sits lower as a whole, leaving no empty band above the bottom strap
const DY = { rundown: 110, type: 60, price: 60, kospi: 60, chips: 70, eu: 60 };
// The strap is always there; its content switches as a block at transitions (vertical-band wipe: old and new sides each draw their own strap, so the band sweeping past is the text change; hard cut: swaps on the same frame), no flip cards, no overlapping text
function strap(t) {
  const G = STRAP.find(g => t >= g.items[0].a && t < g.out); if (!G) return;
  let S = G.items[0]; for (const it of G.items) if (t >= it.a) S = it;
  const x0 = 96, ty = 856, by = 904, bh = 104, bw = 1250;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x0 + 8, by + 8, bw, bh);
  ctx.fillStyle = C.paper; ctx.fillRect(x0, by, bw, bh);
  ctx.fillStyle = C.lemon; ctx.fillRect(x0, by, 14, bh);
  ctx.fillStyle = C.ink; ctx.fillRect(x0 + bw, by, 120, bh); ctx.fillStyle = C.lemon; ctx.fillRect(x0 + bw, by, 120, 6); text('LEMO', x0 + bw + 60, by + 68, F.b8(40), C.lemon, 'center', 1);
  ctx.save(); ctx.beginPath(); ctx.rect(x0 + 14, by, bw - 14, bh); ctx.clip();
  text(S.cn, x0 + 44, by + 58, F.sc9(50), C.ink, 'left', 0, 'strap'); text(S.en, x0 + 46, by + 92, F.b6(27), '#6E5A1E', 'left', 1.5, 'strape');
  ctx.restore();
  const tabW = 40 + tw(S.tab[0], F.sc9(30)) + 14 + tw(S.tab[1], F.b8(30), 2);
  ctx.fillStyle = C.lemon; ctx.fillRect(x0, ty, tabW, by - ty);
  const w1 = text(S.tab[0], x0 + 20, ty + 37, F.sc9(30), C.ink); text(S.tab[1], x0 + 20 + w1 + 14, ty + 37, F.b8(30), C.ink, 'left', 2);
  ctx.restore();
}

// Corner tag: illustration / diagram (top left). TAGS is completed by kospiTag() once the Kospi data is fixed
const TAGS = [[6.0, 13.0, 'ILLUSTRATION', '示意 · AI 生成画面'], [20.0, 24.0, 'ILLUSTRATION', '示意 · AI 生成画面']];
function cornerTag(t) {
  const A = TAGS.find(r => t >= r[0] && t < r[1]); if (!A) return;
  const x = 96, y = 56, h = 64, w = 330;
  ctx.fillStyle = 'rgba(18,20,23,.82)'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = C.gold; ctx.fillRect(x, y, 8, h);
  text(A[2], x + 26, y + 28, F.mono(18), C.gold, 'left', 2, 'tag');
  text(A[3], x + 26, y + 54, F.sc7(20), C.white, 'left', 0, 'tagc');
}

function bug(t) {
  if (t < 1.45 || t > 47.4) return;
  ctx.globalAlpha = .95; plate(1739, 86, .327, -1, 1);
  text('AI NEWS', 1650, 96, F.b8(26), C.white, 'right', 3); ctx.globalAlpha = 1;
}

// Sidecar subtitles (.srt): one Chinese line / one English line; nothing burned into the picture. Timings cut to the English narration (vo/words.json)
const CUES = [
  [1.6, 4.8, '这里是 Lemo AI 新闻，本周 AI 四件事。', 'This is Lemo AI News: four stories from the week in AI.'],
  [6.1, 9.3, '谷歌向全部开发者开放了 Gemini 4 Argon，', 'Google has opened Gemini 4 Argon to every developer,'],
  [9.3, 12.8, '入门价每百万输入 token 2 美元，12 月起翻倍。', 'at $2 per million input tokens, doubling from December.'],
  [13.1, 17.0, '在首尔，韩国综合股价指数单日跌超 7.5%，', 'In Seoul, the Kospi fell more than 7.5% in a day,'],
  [17.0, 19.8, '较 9 月高点跌去两成多，跌入熊市。', 'over 20% below its September high: a bear market.'],
  [20.1, 23.4, '三星和 SK 海力士单日都跌了 9% 以上。', 'Samsung and SK hynix each lost more than 9%.'],
  [24.1, 27.6, '欧盟 AI 办公室向 OpenAI 和 Anthropic 发出问询，', "The EU's AI Office has sent questions to OpenAI and Anthropic,"],
  [27.6, 29.4, '据欧洲新闻台报道。', 'Euronews reports.'],
  [30.6, 31.9, '维尔库宁在都柏林说：', 'In Dublin, Virkkunen said:'],
  [31.9, 34.8, 'AI 办公室已开始执行这些规则。', '"Our AI Office has started enforcing these rules."'],
  [35.6, 38.2, 'Meta 开放了 Muse Spark Open 的权重，', 'Meta has released the weights of Muse Spark Open:'],
  [38.2, 40.2, '总参数 8160 亿，', '816B parameters in total,'],
  [40.2, 42.3, '每个 token 只激活 420 亿，', 'only 42B active per token,'],
  [42.3, 43.9, '两台 Mac Studio 就能跑。', 'and it runs on two Mac Studios.'],
  [45.1, 48.0, '本周就到这里。这里是 Lemo AI 新闻。', "That's the week. This is Lemo AI News."],
]
let t_ = 0;
// Small source credit: bottom right, on the same line as the strap
const CREDITS_ON = [
  [6.0, 13.0, 'SOURCE: GOOGLE GEMINI API CHANGELOG', '来源：Google · Gemini API 更新日志'],
  [13.0, 20.0, 'KRX DATA VIA NAVER · KOREA HERALD', '韩国交易所数据 · Korea Herald'],
  [20.0, 24.0, 'SOURCE: KOREA HERALD · BLOOMBERG', '来源：Korea Herald · Bloomberg'],
  [24.0, 30.5, 'REPORTED BY EURONEWS · NATURAL EARTH', '据 Euronews 报道 · 地图 Natural Earth'],
  [30.5, 35.5, 'SOURCE: EUROPEAN COMMISSION SPEECH', '来源：欧盟委员会 讲话全文'],
  [35.5, 45.0, 'SOURCE: META AI RESEARCH BLOG', '来源：Meta AI 研究博客'],
]
function credit(t) {
  const R = CREDITS_ON.find(r => t >= r[0] && t < r[1]); if (!R) return;
  ctx.save(); ctx.globalAlpha = .75; text(R[2], 1836, 950, F.mono(13), C.paper, 'right', .5); text(R[3], 1836, 978, F.sc7(16), C.paper, 'right', .5); ctx.restore();
}

// ============ Shots ============
function studioBg(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const rg = ctx.createRadialGradient(1300, 380, 60, 1300, 380, 1100); rg.addColorStop(0, 'rgba(242,207,29,.16)'); rg.addColorStop(1, 'rgba(242,207,29,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  // Diagonal light bands (slow parallax drift)
  ctx.save();
  for (let i = 0; i < 7; i++) {
    const x = ((i * 380 + t * (30 + i * 6)) % 2600) - 400, w = 40 + hash(i) * 120;
    ctx.fillStyle = `rgba(242,207,29,${.025 + hash(i + 9) * .035})`;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w, 0); ctx.lineTo(x + w - 500, H); ctx.lineTo(x - 500, H); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(244,241,232,.05)';
  for (let x = 40 - (t * 12) % 48; x < W; x += 48) for (let y = 24; y < H; y += 48) ctx.fillRect(x, y, 2, 2);
}

function shotSting(t) {
  studioBg(t);
  [[.04, .3, 22, -60], [.1, .36, 8, 40]].forEach(([a, b, h, dy]) => {
    const k = seg(t, a, b); if (k <= 0 || k >= 1) return;
    ctx.save(); ctx.translate(960, 470 + dy); ctx.rotate(-.14);
    const x = lerp(-1900, 1900, eio(k)); ctx.fillStyle = C.lemon; ctx.fillRect(x - 700, -h / 2, 1400, h); ctx.restore();
  });
}
function stingLogo(t) {
  if (t > 1.5) return;
  const k = seg(t, .16, .42), fly = eio(seg(t, 1.12, 1.45));
  const shake = t > .42 && t < .7 ? Math.sin(t * 90) * 14 * (1 - seg(t, .42, .7)) : 0;
  const cx = lerp(960, 1739, fly) + shake, cy = lerp(450, 86, fly);
  const s = lerp(back(k, 2.2), .327, fly);
  if (k > 0) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate((1 - eo(k)) * -.12 * (1 - fly)); ctx.translate(-cx, -cy);
    plate(cx, cy, s, seg(t, .85, 1.12) || -1, seg(t, .3, .7)); ctx.restore();
  }
  const r = seg(t, .42, .8); if (r > 0 && r < 1) { ctx.strokeStyle = `rgba(242,207,29,${1 - r})`; ctx.lineWidth = 6 * (1 - r) + 1; ctx.beginPath(); ctx.ellipse(960, 450, 300 + r * 700, 120 + r * 300, 0, 0, Math.PI * 2); ctx.stroke(); }
  const wa = seg(t, .5, .8), wo = 1 - seg(t, 1.05, 1.18);
  if (wa > 0 && wo > 0) {
    ctx.save(); ctx.globalAlpha = wo; ctx.beginPath(); ctx.rect(960 - 520 * eo(wa), 560, 1040 * eo(wa), 160); ctx.clip();
    wordmark(960, 640, 70, 'center');
    text('WEEK 42 · 12–18 OCT 2026', 960, 690, F.mono(22), C.gold, 'center', 3);
    ctx.restore();
  }
}

// Rundown (the same object opens and closes the film)
const ROWS = [
  ['01', '谷歌 Gemini 4 Argon 全面开放', 'GOOGLE OPENS GEMINI 4 ARGON TO ALL DEVELOPERS', 'TUE 13 OCT'],
  ['02', '韩国 Kospi 跌入熊市', 'KOSPI SLIDES INTO A BEAR MARKET', 'THU 15 OCT'],
  ['03', '欧盟 AI 办公室问询两家实验室', 'EU AI OFFICE QUESTIONS OPENAI AND ANTHROPIC', 'WED 14 OCT'],
  ['04', 'Meta 开放 Muse Spark Open 权重', 'META RELEASES MUSE SPARK OPEN WEIGHTS', 'THU 15 OCT'],
];
function rundown(t, close) {
  studioBg(t);
  ctx.save(); ctx.translate(0, DY.rundown);
  const zs = close ? lerp(1.04, 1.0, eo(seg(t, 36.2, 37.2))) : lerp(1.0, 1.03, seg(t, 1.5, 6.0));
  ctx.save(); ctx.translate(960, 420); ctx.scale(zs, zs); ctx.translate(-960, -420);
  const A0 = close ? 36.2 : 1.6;
  const m = (a, b) => close ? 1 : eo(seg(t, a, b));
  // Left column
  const x = 120, ta = m(A0, A0 + .25);
  const tabTxt = close ? ['本周回顾', 'RECAP'] : ['本周头条', 'TOP STORIES'];
  const tabW = 40 + tw(tabTxt[0], F.sc9(30)) + 14 + tw(tabTxt[1], F.b8(30), 2);
  ctx.fillStyle = C.lemon; ctx.fillRect(x, 170, tabW * ta, 50);
  if (ta > .9) { const w1 = text(tabTxt[0], x + 20, 208, F.sc9(30), C.ink, 'left', 0, 'rtab'); text(tabTxt[1], x + 20 + w1 + 14, 208, F.b8(30), C.ink, 'left', 2); }
  const r = (y, h, k, fn) => { if (k <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(0, y - h, 800, h + 24); ctx.clip(); ctx.translate(0, (1 - k) * (h + 24)); fn(); ctx.restore(); };
  r(390, 170, m(2.0, 2.3), () => text('12–18', x - 6, 390, F.b8(180), C.white, 'left', 2, 'rdate'));
  r(480, 90, m(2.2, 2.5), () => text('OCT 2026', x, 480, F.b8(84), C.lemon, 'left', 4, 'rmon'));
  ctx.globalAlpha = m(2.5, 2.8); text('WEEK 42 · 第 42 周', x, 532, F.mono(22), C.gold, 'left', 3, 'rwk'); ctx.globalAlpha = 1;
  r(626, 64, m(2.6, 2.9), () => text('本周 AI 四件事', x, 626, F.sc9(56), C.white, 'left', 2, 'rtt'));
  ctx.globalAlpha = m(2.75, 3.0); text('THE WEEK IN AI · 4 STORIES', x + 2, 668, F.b6(28), C.grey, 'left', 3); ctx.globalAlpha = 1;
  // Right column: three rows
  const X0 = 800, RW = 1024, RH = 120;
  ROWS.forEach(([n, cn, en, d], i) => {
    const a = close ? 0 : 3.0 + i * .4, y = 150 + i * 140;
    const k = close ? 1 : seg(t, a, a + .3); if (k <= 0) return;
    const sy = close ? 1 : back(k, 2.0);
    ctx.save(); ctx.translate(0, y); ctx.scale(1, Math.max(.02, sy)); ctx.translate(0, -y);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(X0 + 10, y + 10, RW, RH);
    ctx.fillStyle = C.ink2; ctx.fillRect(X0, y, RW, RH);
    ctx.fillStyle = C.lemon; ctx.fillRect(X0, y, 140, RH);
    text(n, X0 + 70, y + 90, F.b8(84), C.ink, 'center', 0);
    text(cn, X0 + 176, y + 58, F.sc9(40), C.white, 'left', 0, 'row' + i);
    text(en, X0 + 178, y + 96, F.b6(23), C.gold, 'left', 1.5, 'rowe' + i);
    text(d, X0 + RW - 26, y + 96, F.mono(18), C.grey2, 'right', 2);
    // Light sweep on arrival
    const sw = close ? 0 : seg(t, a + .05, a + .45);
    if (sw > 0 && sw < 1) { const gx = X0 + 140 + (RW - 140) * eio(sw); const g = ctx.createLinearGradient(gx - 160, 0, gx, 0); g.addColorStop(0, 'rgba(242,207,29,0)'); g.addColorStop(1, 'rgba(242,207,29,.28)'); ctx.fillStyle = g; ctx.fillRect(Math.max(X0 + 140, gx - 160), y, Math.min(160, gx - X0 - 140), RH); }
    // Close: tick off row by row
    if (close) {
      const ck = seg(t, 37.0 + i * .4, 37.0 + i * .4 + .22);
      if (ck > 0) {
        const s = back(ck, 2.6), cx = X0 + RW - 64, cy = y + 44;
        ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
        ctx.fillStyle = C.lemon; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-13, 1); ctx.lineTo(-3, 11); ctx.lineTo(15, -10); ctx.stroke(); ctx.restore();
      }
    }
    ctx.restore();
  });
  // Open: the first row gets a highlight frame, signalling "this one first"
  if (!close) {
    const hl = seg(t, 5.1, 5.35);
    if (hl > 0) { ctx.strokeStyle = C.lemon; ctx.lineWidth = 5; ctx.globalAlpha = .6 + .4 * Math.cos((t - 5.1) * Math.PI * 4); ctx.strokeRect(X0 - 4, 146, RW * eo(hl) + 8, RH + 8); ctx.globalAlpha = 1; }
  }
  ctx.restore();
  ctx.restore();
}

// ① Gemini 4 Argon: big-type layout
function shotType(t) {
  photo(IM.datacenter, 836, 470, lerp(1.17, 1.26, seg(t, 5.7, 9.0)));
  const g = ctx.createLinearGradient(0, 0, 1500, 0); g.addColorStop(0, 'rgba(14,16,19,.92)'); g.addColorStop(.55, 'rgba(14,16,19,.62)'); g.addColorStop(1, 'rgba(14,16,19,.25)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  vignette(.55); grain(t);
  ctx.save(); ctx.translate(0, DY.type);
  const x = 150;
  ctx.globalAlpha = eo(seg(t, 6.2, 6.4)); text('GEMINI API · 13 OCT 2026', x + 4, 214, F.mono(24), C.gold, 'left', 4, 'k1'); ctx.globalAlpha = 1;
  // Gemini: slides in from the right, with speed lines
  const k1 = eo(seg(t, 6.2, 6.45)), dx = (1 - k1) * 520;
  if (k1 > 0) {
    if (k1 < 1) { ctx.fillStyle = 'rgba(242,207,29,.5)'; for (let i = 0; i < 5; i++) ctx.fillRect(x + 300 + dx, 280 + i * 26, 500 * (1 - k1), 4); }
    ctx.globalAlpha = clamp(k1 * 3); text('Gemini', x + dx, 410, F.b8(210), C.white, 'left', 2, 'gm'); ctx.globalAlpha = 1;
  }
  const gw = tw('Gemini', F.b8(210), 2);
  const k2 = seg(t, 6.5, 6.72);
  if (k2 > 0) { const s = back(k2, 2.6); ctx.save(); ctx.translate(x + gw + 30 + 55, 340); ctx.scale(s, s); text('4', -55, 70, F.b8(210), C.lemon, 'left', 0, 'g4'); ctx.restore(); }
  const k3 = eo(seg(t, 7.0, 7.3));
  if (k3 > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 430, 1400, 180); ctx.clip(); text('Argon', x, 600 + (1 - k3) * 180, F.b8(210), C.white, 'left', 2, 'ga'); ctx.restore(); }
  // "正式开放 GA" (general availability) stamp
  const aw = tw('Argon', F.b8(210), 2);
  const k4 = seg(t, 7.5, 7.68);
  if (k4 > 0) {
    const s = 1 + .8 * (1 - eo(k4)); ctx.save(); ctx.translate(x + aw + 200, 528); ctx.rotate(-.06); ctx.scale(s, s); ctx.globalAlpha = clamp(k4 * 3);
    ctx.fillStyle = C.lemon; ctx.fillRect(-150, -46, 300, 92);
    const w1 = tw('正式开放', F.sc9(40)), w2 = tw('GA', F.b8(46), 2), st = -(w1 + 18 + w2) / 2;
    text('正式开放', st, 16, F.sc9(40), C.ink, 'left', 0); text('GA', st + w1 + 18, 17, F.b8(46), C.ink, 'left', 2);
    ctx.restore();
  }
  // Model ID typed out
  if (t >= 8.0) {
    const full = 'model = "gemini-4-argon"', n = Math.floor(seg(t, 8.0, 8.6) * full.length);
    ctx.fillStyle = 'rgba(27,30,35,.92)'; ctx.fillRect(x, 628, 660, 60); ctx.fillStyle = C.lemon; ctx.fillRect(x, 628, 6, 60);
    const vis = full.slice(0, n); const w = text(vis, x + 28, 668, F.mono(28), C.paper);
    if (Math.floor(t * 4) % 2 === 0 || n < full.length) { ctx.fillStyle = C.lemon; ctx.fillRect(x + 32 + w, 642, 14, 34); }
  }
  ctx.restore();
}

// Flip-card digits
function flipTile(x, y, w, h, from, to, t0, t, font, col) {
  const p = from === null ? 1 : seg(t, t0, t0 + .26);
  ctx.save();
  const half = (s, top, sc = 1) => {
    if (s === null) return;
    ctx.save(); ctx.beginPath(); ctx.rect(x, top ? y : y + h / 2, w, h / 2); ctx.clip();
    ctx.translate(0, y + h / 2); ctx.scale(1, sc); ctx.translate(0, -(y + h / 2));
    ctx.fillStyle = top ? '#2B3038' : '#262A31'; ctx.fillRect(x, y, w, h);
    text(s, x + w / 2, y + h * .76, font, col, 'center');
    ctx.restore();
  };
  if (p >= 1) { half(to, true); half(to, false); }
  else if (p <= 0) { half(from, true); half(from, false); }
  else {
    half(to, true); half(from, false);
    if (p < .5) half(from, true, 1 - p * 2); else half(to, false, (p - .5) * 2);
  }
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x, y + h / 2 - 1.5, w, 3);
  ctx.restore();
}
function shotPrice(t) {
  photo(IM.datacenter, 836, 470, 1.3, 0, 0, W, H, 'blur(14px) brightness(.5)');
  ctx.fillStyle = 'rgba(14,16,19,.45)'; ctx.fillRect(0, 0, W, H); grain(t, .05);
  ctx.save(); ctx.translate(0, DY.price);
  const k = seg(t, 9.0, 9.3), b = back(k, 1.3);
  ctx.save(); ctx.translate(660, 420 + (1 - b) * 80); ctx.rotate(lerp(-.045, -.014, eo(seg(t, 9.0, 13.0))));
  ctx.globalAlpha = clamp(k * 4);
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(-500 + 18, -265 + 22, 1000, 530);
  ctx.fillStyle = C.ink2; ctx.fillRect(-500, -265, 1000, 530); ctx.fillStyle = C.lemon; ctx.fillRect(-500, -265, 1000, 6);
  const w1 = text('每百万 token 价格', -450, -190, F.sc9(40), C.white, 'left', 0, 'ph'); text('PRICE PER 1M TOKENS', -450 + w1 + 20, -192, F.b6(26), C.gold, 'left', 2);
  text('Gemini 4 Argon', 450, -192, F.mono(18), C.grey2, 'right', 1);
  ctx.fillStyle = C.line; ctx.fillRect(-450, -160, 900, 2);
  const col = (cx, cn, en) => { const a = tw(cn, F.sc7(26)), b2 = tw(en, F.b6(22), 2), s0 = cx - (a + 10 + b2) / 2; text(cn, s0, -100, F.sc7(26), C.white); text(en, s0 + a + 10, -101, F.b6(22), C.grey, 'left', 2); };
  col(-10, '输入', 'INPUT'); col(270, '输出', 'OUTPUT');
  const row = (y, cn, en) => { text(cn, -450, y + 66, F.sc9(36), C.white, 'left', 0, 'rl' + y); text(en, -450, y + 100, F.b6(22), C.grey, 'left', 2); };
  row(-70, '入门价', 'INTRO · TO 30 NOV');
  flipTile(-120, -70, 220, 130, null, '$2', 0, t >= 9.2 ? 9 : -1, F.b8(104), C.lemon);
  flipTile(160, -70, 220, 130, null, '$10', 0, t >= 9.4 ? 9 : -1, F.b8(104), C.lemon);
  if (t < 9.2) { ctx.fillStyle = '#262A31'; ctx.fillRect(-120, -70, 220, 130); }
  if (t < 9.4) { ctx.fillStyle = '#262A31'; ctx.fillRect(160, -70, 220, 130); }
  const r2 = eo(seg(t, 9.65, 9.85));
  ctx.globalAlpha = clamp(k * 4) * r2;
  row(90, '之后', 'THEN · FROM 1 DEC');
  flipTile(-120, 90, 220, 130, '$2', '$4', 9.9, t, F.b8(104), C.white);
  flipTile(160, 90, 220, 130, '$10', '$20', 10.1, t, F.b8(104), C.white);
  ctx.restore(); ctx.globalAlpha = 1;
  // Price doubles
  const bk = seg(t, 10.3, 10.55);
  if (bk > 0) {
    const s = back(bk, 2.2); ctx.save(); ctx.translate(1520, 400); ctx.scale(s, s);
    text('×2', 0, 40, F.b8(220), C.lemon, 'center', 0, 'x2');
    text('价格翻倍', 0, 120, F.sc9(48), C.white, 'center', 0, 'x2c');
    text('PRICE DOUBLES', 0, 162, F.b6(28), C.gold, 'center', 3);
    ctx.restore();
    const ak = eio(seg(t, 10.3, 10.65));
    ctx.strokeStyle = C.lemon; ctx.lineWidth = 5; ctx.setLineDash([14, 10]); ctx.beginPath(); ctx.moveTo(1190, 470); ctx.lineTo(1190 + 150 * ak, 470); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.restore();
}

// ② Kospi: real daily closes (Korea Exchange data, fetched through the Naver Finance API; the 19 closes are written here), plotted as the drop from the 23 September high
const KDATA = [['15 SEP', 6627.26], ['16 SEP', 6717.97], ['17 SEP', 6715.41], ['18 SEP', 6894.23], ['21 SEP', 7007.72], ['22 SEP', 7017.91], ['23 SEP', 7080.92],
  ['28 SEP', 6889.74], ['29 SEP', 6870.81], ['30 SEP', 6838.04], ['1 OCT', 6971.35], ['2 OCT', 7003.74],
  ['6 OCT', 6941.39], ['7 OCT', 6803.90], ['8 OCT', 6625.93], ['12 OCT', 6384.24], ['13 OCT', 6035.35], ['14 OCT', 6008.81], ['15 OCT', 5554.22]];
const PK = 6, ST = 11, KPEAK = KDATA[PK][1];   // peak index; KPTS[ST + d] = day d of the losing streak
const KX0 = 210, KX1 = 1180, KY = v => 190 + (-v) / 25 * 430;
const KPTS = KDATA.map(([d, c], i) => { const v = (c / KPEAK - 1) * 100; return [lerp(KX0, KX1, i / (KDATA.length - 1)), KY(v), v]; });
const KT = (() => { const T = []; for (let i = 0; i <= ST; i++) T.push(12.75 + i * .07); for (let d = 1; d <= 6; d++) T.push(14.15 + (d - 1) * .3); T.push(16.5); return T; })();
function shotKospi(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(0, DY.kospi);
  const sh = t > 16.5 && t < 16.9 ? (1 - seg(t, 16.5, 16.9)) : 0;
  ctx.save(); ctx.translate(Math.sin(t * 83) * 14 * sh, Math.cos(t * 71) * 10 * sh);
  const zs = lerp(1.0, 1.05, eio(seg(t, 13.0, 16.4))); ctx.translate(700, 400); ctx.scale(zs, zs); ctx.translate(-700, -400);
  // Grid and axes
  const ga = eo(seg(t, 12.6, 12.8));
  ctx.globalAlpha = ga;
  ctx.strokeStyle = 'rgba(244,241,232,.08)'; ctx.lineWidth = 1;
  for (let v = 0; v >= -25; v -= 5) { ctx.beginPath(); ctx.moveTo(KX0, KY(v)); ctx.lineTo(KX1 + 40, KY(v)); ctx.stroke(); }
  [[0, '0%'], [-10, '−10%']].forEach(([v, s]) => text(s, KX0 - 16, KY(v) + 7, F.mono(18), C.grey2, 'right'));
  text('KOSPI · 距 9 月高点 FROM SEPTEMBER HIGH', KX0, 140, F.mono(20), C.gold, 'left', 2, 'kax');
  for (let d = 1; d <= 7; d++) { const p = KPTS[ST + d]; text(String(d), p[0], 650, F.mono(18), t >= KT[ST + d] ? C.paper : C.grey2, 'center'); }
  [[0, 680], [PK, 680], [ST + 1, 680], [KDATA.length - 1, 680]].forEach(([i, y]) => text(KDATA[i][0], KPTS[i][0], y, F.mono(16), C.grey2, 'center', 1, 'kd' + i));
  text('连跌 DAY', KPTS[ST + 1][0] - 34, 650, F.mono(16), C.grey2, 'right', 1);
  ctx.globalAlpha = 1;
  // Bear-market line
  const bl = eio(seg(t, 12.8, 13.3)), bf = t > 16.5 && t < 17.1 ? .5 + .5 * Math.cos((t - 16.5) * 30) : 0;
  ctx.strokeStyle = bf > 0 ? mixc('D4B064', 'FFFFFF', bf) : C.gold; ctx.lineWidth = 3; ctx.setLineDash([16, 12]);
  ctx.beginPath(); ctx.moveTo(KX0, KY(-20)); ctx.lineTo(lerp(KX0, KX1 + 40, bl), KY(-20)); ctx.stroke(); ctx.setLineDash([]);
  if (bl > .9) { ctx.globalAlpha = eo(seg(t, 13.2, 13.4)); const w1 = text('熊市线 −20%', KX0 + 8, KY(-20) + 36, F.sc7(24), C.gold, 'left', 0, 'kbl'); text('BEAR MARKET LINE', KX0 + 8 + w1 + 12, KY(-20) + 35, F.b6(22), C.gold, 'left', 2); ctx.globalAlpha = 1; }
  // Price line
  let last = null; const pts = [];
  for (let i = 0; i < KPTS.length; i++) {
    const ta = KT[i], dur = i === KPTS.length - 1 ? .14 : (i <= ST ? .06 : .18);
    if (i === 0) { if (t >= ta) pts.push(KPTS[0]); continue; }
    const k = seg(t, ta, ta + dur); if (k <= 0) break;
    const a = KPTS[i - 1], b = KPTS[i];
    pts.push([lerp(a[0], b[0], k), lerp(a[1], b[1], k)]);
  }
  if (pts.length > 1) {
    const ag = ctx.createLinearGradient(0, KY(0), 0, KY(-25)); ag.addColorStop(0, 'rgba(242,207,29,.14)'); ag.addColorStop(1, 'rgba(242,207,29,0)');
    ctx.fillStyle = ag; ctx.beginPath(); ctx.moveTo(pts[0][0], KY(-25)); pts.forEach(p => ctx.lineTo(p[0], p[1])); ctx.lineTo(pts[pts.length - 1][0], KY(-25)); ctx.fill();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = C.paper; ctx.lineWidth = 5; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
    // Segment below the line: lemon yellow
    if (t >= 16.5) { const a = KPTS[KPTS.length - 2], p = pts[pts.length - 1]; ctx.strokeStyle = C.lemon; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); }
    last = pts[pts.length - 1];
    const blink = t > 15.8 && t < 16.5 ? (Math.floor(t * 8) % 2 ? 1 : .3) : 1;
    ctx.globalAlpha = blink; ctx.fillStyle = t >= 16.5 ? C.lemon : C.paper; ctx.beginPath(); ctx.arc(last[0], last[1], 10, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  }
  // Peak
  const pk = eo(seg(t, 13.2, 13.4));
  if (pk > 0) { const p = KPTS[PK]; ctx.globalAlpha = pk; ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(p[0], p[1], 8, 0, Math.PI * 2); ctx.fill(); text('高点 PEAK 7,080.92', p[0] + 16, p[1] - 16, F.mono(18), C.gold, 'left', 1, 'kpk'); ctx.globalAlpha = 1; }
  // Burst ring
  const rb = seg(t, 16.62, 17.2); if (rb > 0 && rb < 1) { const p = KPTS[KPTS.length - 1]; ctx.strokeStyle = `rgba(242,207,29,${1 - rb})`; ctx.lineWidth = 8 * (1 - rb) + 1; ctx.beginPath(); ctx.arc(p[0], p[1], 20 + rb * 260, 0, Math.PI * 2); ctx.stroke(); }
  // Losing-streak counter (next to the line's head)
  let nd = 0; for (let d = 1; d <= 7; d++) if (t >= KT[ST + d]) nd = d;
  if (nd > 0 && last) {
    const pop = 1 + .25 * (1 - eo(seg(t, KT[ST + nd], KT[ST + nd] + .2)));
    const lw0 = 24 + tw('连跌 ' + nd + ' 日', F.sc9(28)) + 10 + tw('DAY ' + nd, F.b8(26), 2) + 20;
    ctx.save(); ctx.translate(KX1 + 40, 150); ctx.scale(pop, pop); ctx.translate(0, 0);
    const lw = 24 + tw('连跌 ' + nd + ' 日', F.sc9(28)) + 10 + tw('DAY ' + nd, F.b8(26), 2) + 20;
    ctx.fillStyle = nd === 7 ? C.lemon : 'rgba(27,30,35,.95)'; ctx.fillRect(-lw, -24, lw, 46);
    const w1 = text('连跌 ' + nd + ' 日', -lw + 14, 10, F.sc9(28), nd === 7 ? C.ink : C.white);
    text('DAY ' + nd, -lw + 14 + w1 + 10, 10, F.b8(26), nd === 7 ? C.ink : C.lemon, 'left', 2);
    ctx.restore();
  }
  // Bear-market stamp
  const sk = seg(t, 17.35, 17.53);
  if (sk > 0) {
    const s = 1 + 1.0 * (1 - eo(sk)); ctx.save(); ctx.translate(640, 440); ctx.rotate(-.07); ctx.scale(s, s); ctx.globalAlpha = clamp(sk * 3);
    ctx.fillStyle = C.lemon; ctx.fillRect(-180, -48, 360, 96); ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.strokeRect(-170, -38, 340, 76);
    const w1 = tw('熊市', F.sc9(46)), w2 = tw('BEAR MARKET', F.b8(40), 2), st = -(w1 + 16 + w2) / 2;
    text('熊市', st, 16, F.sc9(46), C.ink, 'left', 0, 'kst'); text('BEAR MARKET', st + w1 + 16, 15, F.b8(40), C.ink, 'left', 2);
    ctx.restore();
  }
  ctx.restore();
  // Readout panel (right)
  const pa = eo(seg(t, 16.55, 16.8));
  if (pa > 0) {
    const X = 1300 + (1 - pa) * 600, Y = 150;
    ctx.fillStyle = 'rgba(27,30,35,.97)'; ctx.fillRect(X, Y, 520, 560); ctx.fillStyle = C.lemon; ctx.fillRect(X, Y, 520, 6);
    text('KOSPI · 15 OCT 2026', X + 40, Y + 58, F.mono(22), C.gold, 'left', 2, 'kp0');
    const v = (Math.round(seg(t, 16.6, 17.0) * 757) / 100).toFixed(2);
    text('−' + v + '%', X + 34, Y + 196, F.b8(150), C.lemon, 'left', 0); TX.push({ id: 'kpv', text: '−7.57%', x0: X, y0: Y + 60, x1: X + 520, y1: Y + 200 });
    const w1 = text('单日跌幅', X + 40, Y + 244, F.sc7(28), C.white, 'left', 0, 'kp1'); text('ONE-DAY DROP', X + 40 + w1 + 14, Y + 243, F.b6(24), C.grey, 'left', 2);
    ctx.fillStyle = C.line; ctx.fillRect(X + 40, Y + 276, 440, 2);
    const ck = eo(seg(t, 16.8, 17.05));
    ctx.save(); ctx.beginPath(); ctx.rect(X, Y + 290, 520, 100); ctx.clip();
    text('5,554.22', X + 36, Y + 370 + (1 - ck) * 90, F.b8(84), C.white, 'left', 1, 'kp2'); ctx.restore();
    const w2 = text('收盘', X + 40, Y + 416, F.sc7(26), C.white, 'left', 0, 'kp3'); text('CLOSE', X + 40 + w2 + 14, Y + 415, F.b6(24), C.grey, 'left', 2);
    ctx.globalAlpha = eo(seg(t, 16.95, 17.2));
    const w3 = text('连跌 7 个交易日', X + 40, Y + 462, F.sc7(26), C.lemon, 'left', 0, 'kp4'); text('7 STRAIGHT LOSING DAYS', X + 40 + w3 + 14, Y + 461, F.b6(22), C.grey, 'left', 1.5);
    ctx.globalAlpha = eo(seg(t, 17.25, 17.5));
    const w4 = text('较 9 月高点 −21.56%', X + 40, Y + 516, F.sc7(26), C.white, 'left', 0, 'kp5'); text('FROM SEPT HIGH', X + 40 + w4 + 14, Y + 515, F.b6(22), C.grey, 'left', 1.5);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ② Chip stocks: two falling bars
function shotChips(t) {
  photo(IM.wafer, 900, 470, lerp(1.17, 1.24, seg(t, 20.0, 24.0)));
  const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(14,16,19,.93)'); g.addColorStop(.4, 'rgba(14,16,19,.8)'); g.addColorStop(1, 'rgba(14,16,19,.6)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); vignette(.5); grain(t);
  ctx.save(); ctx.translate(0, DY.chips);
  const x = 150;
  ctx.globalAlpha = eo(seg(t, 20.1, 20.3)); text('15 OCT 2026 · 单日涨跌', x, 214, F.mono(20), C.gold, 'left', 2, 'c0'); ctx.globalAlpha = 1;
  const tk = eo(seg(t, 20.15, 20.45));
  ctx.save(); ctx.beginPath(); ctx.rect(0, 230, 760, 100); ctx.clip(); text('芯片股领跌', x, 310 + (1 - tk) * 90, F.sc9(76), C.white, 'left', 2, 'c1'); ctx.restore();
  ctx.globalAlpha = tk; text('CHIPMAKERS LEAD THE FALL', x + 2, 360, F.b6(32), C.lemon, 'left', 3, 'c2'); ctx.globalAlpha = 1;
  const Z = 260, PX = 27.5;
  const zl = eio(seg(t, 20.1, 20.4));
  ctx.fillStyle = C.paper; ctx.fillRect(780, Z - 1, 900 * zl, 3);
  text('0%', 768, Z + 7, F.mono(18), C.grey, 'right');
  const BARS = [[820, '三星电子', 'SAMSUNG ELECTRONICS', 9.48, 20.3], [1290, 'SK 海力士', 'SK HYNIX', 11.06, 20.8]];
  // −9% reference line (drawn after the bars)
  const rl = eio(seg(t, 21.3, 21.6));
  if (rl > 0) {
    ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.setLineDash([14, 10]); ctx.beginPath(); ctx.moveTo(780, Z + 9 * PX); ctx.lineTo(780 + 900 * rl, Z + 9 * PX); ctx.stroke(); ctx.setLineDash([]);
    text('−9%', 768, Z + 9 * PX + 7, F.mono(18), C.gold, 'right');
  }
  BARS.forEach(([bx, cn, en, v, a]) => {
    const k = eio(seg(t, a, a + .45)); const la = eo(seg(t, a - .15, a + .1));
    ctx.globalAlpha = la; text(cn, bx, Z - 52, F.sc9(36), C.white, 'left', 0, 'bn' + bx); text(en, bx, Z - 16, F.b6(22), C.grey, 'left', 2); ctx.globalAlpha = 1;
    if (k <= 0) return;
    const h = v * PX * k;
    const bg = ctx.createLinearGradient(0, Z, 0, Z + h); bg.addColorStop(0, C.lemonD); bg.addColorStop(1, C.lemon);
    ctx.fillStyle = bg; ctx.fillRect(bx, Z + 2, 280, h);
    const vv = (Math.round(v * k * 100) / 100).toFixed(2);
    text('−' + vv + '%', bx, Z + h + 82, F.b8(84), C.white, 'left', 0);
    if (k >= 1) TX.push({ id: 'bv' + bx, text: '−' + v.toFixed(2) + '%', x0: bx, y0: Z + h + 10, x1: bx + 300, y1: Z + h + 90 });
  });
  if (rl > 0) {
    ctx.strokeStyle = 'rgba(18,20,23,.75)'; ctx.lineWidth = 3; ctx.setLineDash([14, 10]);
    BARS.forEach(([bx]) => { ctx.beginPath(); ctx.moveTo(bx, Z + 9 * PX); ctx.lineTo(bx + 280 * rl, Z + 9 * PX); ctx.stroke(); }); ctx.setLineDash([]);
    const ck = seg(t, 21.5, 21.72);
    if (ck > 0) {
      const s = back(ck, 2.4); ctx.save(); ctx.translate(1660, Z + 9 * PX); ctx.scale(s, s);
      const w1 = tw('都超过 9%', F.sc9(28)), w2 = tw('BOTH OVER 9%', F.b8(24), 2), lw = w1 + w2 + 50;
      ctx.fillStyle = C.gold; ctx.fillRect(-lw / 2, -26, lw, 52);
      text('都超过 9%', -lw / 2 + 16, 10, F.sc9(28), C.ink, 'left', 0, 'b9'); text('BOTH OVER 9%', -lw / 2 + 32 + w1, 9, F.b8(24), C.ink, 'left', 2);
      ctx.restore();
    }
  }
  ctx.restore();
}

// ③ Europe map in one continuous shot: Brussels (AI Office) lights up → push in → pan right → two information requests fly out of Brussels (per Euronews)
let MP = null;
const EUT = { light: 23.75, city: 24.05, push: [24.55, 25.45], label: 24.95, pan: [25.35, 26.05], docs: [25.45, 26.2] };
function buildMap() {
  MP = [];
  const [dx, dy] = EU.brussels;
  for (const id in EU.countries) {
    const c = EU.countries[id], p = new Path2D(); let sx = 0, sy = 0, n = 0;
    for (const r of c.rings) { r.forEach(([x, y], i) => { i ? p.lineTo(x, y) : p.moveTo(x, y); sx += x; sy += y; n++; }); p.closePath(); }
    MP.push({ id, eu: c.eu, be: c.name === 'Belgium', p, d: Math.hypot(sx / n - dx, sy / n - dy) });
  }
}
function euView(t) {
  const [bx, by] = EU.brussels;
  const z = eio(seg(t, ...EUT.push)), pn = eio(seg(t, ...EUT.pan));
  const S = lerp(lerp(.29, 1.0, z), .86, pn);
  const F0 = [lerp(250, bx, z), lerp(-120, by, z)];
  const O = [lerp(lerp(960, 900, z), 470, pn), lerp(lerp(440, 430, z), 440, pn)];
  return { S, F: F0, O, tf: (x, y) => [O[0] + (x - F0[0]) * S, O[1] + (y - F0[1]) * S] };
}
const DOCS = [{ org: 'OpenAI' }, { org: 'Anthropic' }];
function doc(t, side) {
  const a = EUT.docs[side], k = seg(t, a, a + .5); if (k <= 0) return;
  const D0 = DOCS[side], V = euView(t), B = V.tf(...EU.brussels), e = eio(k);
  const tx = side ? 1590 : 1170, ty = 395;
  const cx = lerp(B[0], tx, e), cy = lerp(B[1], ty, e) - Math.sin(e * Math.PI) * 140;
  const s = lerp(.08, 1, eo(k)), rot = lerp(side ? .5 : -.5, side ? .02 : -.025, eo(k));
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(s, s); ctx.translate(-190, -245);
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(14, 18, 380, 490);
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, 380, 490);
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, 380, 92);
  const id = k >= 1;
  text('信息调取', 28, 48, F.sc9(36), C.lemon, 'left', 2, id ? 'dh' + side : null);
  text('REQUEST FOR INFORMATION', 28, 78, F.b6(20), C.paper, 'left', 2);
  text('致 TO', 28, 134, F.mono(16), C.grey2, 'left', 2);
  text(D0.org, 26, 192, F.b8(60), C.ink, 'left', 0, id ? 'do' + side : null);
  ctx.fillStyle = '#D9D4C5'; ctx.fillRect(28, 214, 324, 2);
  // Body: grey placeholder text lines (no actual wording — the content of the requests has not been made public)
  const lk = seg(t, a + .4, a + 1.2);
  [324, 300, 316, 240, 310, 280].forEach((w, i) => { const k = clamp(lk * 6 - i); if (k > 0) { ctx.fillStyle = '#CFC9B8'; ctx.fillRect(28, 246 + i * 26, w * k, 10); } });
  ctx.fillStyle = '#D9D4C5'; ctx.fillRect(28, 412, 324, 2);
  text('EU AI OFFICE · 14 OCT 2026', 28, 446, F.mono(15), C.grey2, 'left', 1.5);
  text('据 EURONEWS 报道', 28, 472, F.sc7(16), C.grey2, 'left', 1);
  ctx.restore();
}
function shotEU(t) {
  ctx.fillStyle = '#0D0F12'; ctx.fillRect(0, 0, W, H);
  const V = euView(t);
  ctx.save(); ctx.setTransform(V.S, 0, 0, V.S, V.O[0] - V.F[0] * V.S, V.O[1] - V.F[1] * V.S + DY.eu);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(244,241,232,.04)'; ctx.lineWidth = 1 / V.S;
  for (let x = -4000; x <= 4000; x += 500) { ctx.beginPath(); ctx.moveTo(x, -3000); ctx.lineTo(x, 3000); ctx.stroke(); }
  for (let y = -3000; y <= 3000; y += 500) { ctx.beginPath(); ctx.moveTo(-4000, y); ctx.lineTo(4000, y); ctx.stroke(); }
  for (const c of MP) {
    let fill = C.ink3;
    if (c.eu) { const ft = EUT.light + c.d / 3600 * .8, k = seg(t, ft, ft + .12); fill = mixc('22262C', '4A4426', k); }
    if (c.be) { const k = seg(t, EUT.city, EUT.city + .15); fill = k > 0 ? mixc('FFFFFF', 'F2CF1D', seg(t, EUT.city, EUT.city + .35)) : fill; }
    ctx.fillStyle = fill; ctx.fill(c.p);
    ctx.strokeStyle = c.be && t > EUT.city ? 'rgba(18,20,23,.9)' : 'rgba(150,156,166,.55)'; ctx.lineWidth = 1.1 / V.S; ctx.stroke(c.p);
  }
  ctx.restore();
  ctx.save(); ctx.translate(0, DY.eu);
  const B = V.tf(...EU.brussels), ct = EUT.city;
  const da = eo(seg(t, ct, ct + .25));
  if (da > 0) {
    const rb = seg(t, ct, ct + .55); if (rb < 1) { ctx.strokeStyle = `rgba(242,207,29,${1 - rb})`; ctx.lineWidth = 6 * (1 - rb) + 1; ctx.beginPath(); ctx.arc(B[0], B[1], 20 + rb * 300, 0, Math.PI * 2); ctx.stroke(); }
    const pr = ((t - ct) * 1.3) % 1; ctx.strokeStyle = `rgba(242,207,29,${1 - pr})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(B[0], B[1], 12 + pr * 34, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(B[0], B[1], 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(B[0], B[1], 7, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = da;
    const lw = 26 + tw('布鲁塞尔', F.sc9(32)) + 12 + tw('BRUSSELS', F.b8(28), 2) + 20, lx = B[0] - lw - 30, ly = B[1] + 36;
    ctx.fillStyle = 'rgba(18,20,23,.92)'; ctx.fillRect(lx, ly, lw, 52); ctx.fillStyle = C.lemon; ctx.fillRect(lx, ly, 6, 52);
    const w1 = text('布鲁塞尔', lx + 22, ly + 38, F.sc9(32), C.white, 'left', 0, 'bru'); text('BRUSSELS', lx + 22 + w1 + 12, ly + 37, F.b8(28), C.lemon, 'left', 2);
    ctx.globalAlpha = 1;
  }
  const lg = eo(seg(t, ct + .1, ct + .35)) * (1 - eo(seg(t, 27.0, 27.25)));
  if (lg > 0) { ctx.globalAlpha = lg; ctx.fillStyle = '#4A4426'; ctx.fillRect(150, 636, 26, 18); ctx.strokeStyle = 'rgba(150,156,166,.7)'; ctx.lineWidth = 1; ctx.strokeRect(150, 636, 26, 18); const w1 = text('欧盟成员国', 188, 653, F.sc7(22), C.grey, 'left', 0, 'leg'); text('EU MEMBER STATES', 188 + w1 + 10, 652, F.b6(20), C.grey2, 'left', 2); ctx.globalAlpha = 1; }
  // AI Office callout
  const ca = eo(seg(t, EUT.label, EUT.label + .3));
  if (ca > 0) {
    const bx = Math.max(110, B[0] - 520), by = B[1] - 260;
    ctx.strokeStyle = C.lemon; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(B[0] - 6, B[1] - 8); ctx.lineTo(lerp(B[0], bx + 470, ca), lerp(B[1], by + 120, ca)); ctx.stroke();
    ctx.globalAlpha = ca;
    ctx.fillStyle = 'rgba(27,30,35,.95)'; ctx.fillRect(bx, by, 520, 120); ctx.fillStyle = C.lemon; ctx.fillRect(bx, by, 520, 5);
    const w1 = text('欧盟 AI 办公室', bx + 26, by + 56, F.sc9(34), C.white, 'left', 0, 'aio'); text('EU AI OFFICE', bx + 26 + w1 + 14, by + 55, F.b8(28), C.lemon, 'left', 2);
    const w2 = text('隶属欧盟委员会', bx + 26, by + 98, F.sc7(24), C.grey, 'left', 0, 'act'); text('WITHIN THE EUROPEAN COMMISSION', bx + 26 + w2 + 12, by + 97, F.b6(22), C.grey2, 'left', 1.5);
    ctx.globalAlpha = 1;
  }
  const dk = eio(seg(t, EUT.pan[0], EUT.pan[0] + .6));
  if (dk > 0) { const g = ctx.createLinearGradient(820, 0, 1100, 0); g.addColorStop(0, 'rgba(13,15,18,0)'); g.addColorStop(1, `rgba(13,15,18,${.7 * dk})`); ctx.fillStyle = g; ctx.fillRect(820, -DY.eu, W - 820, H + DY.eu); }
  doc(t, 0); doc(t, 1);
  ctx.restore();
}

// ④ Meta releases the Muse Spark Open weights: spec card (ratio bar of total vs active parameters + context) + the unified memory of two Mac Studios
const S4 = { title: 35.25, stamp: 36.0, bar1: 36.9, bar2: 38.2, ctx: 39.0, macs: 40.0, bracket: 41.2, bw: 41.7 };
function shotStory4(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(244,241,232,.035)';
  for (let x = 40 - (t * 8) % 48; x < W; x += 48) for (let y = 24; y < H; y += 48) ctx.fillRect(x, y, 2, 2);
  ctx.save(); ctx.translate(0, 40);
  const zs = lerp(1.0, 1.025, eio(seg(t, 35.5, 44.7))); ctx.translate(960, 420); ctx.scale(zs, zs); ctx.translate(-960, -420);
  const x = 150;
  ctx.globalAlpha = eo(seg(t, S4.title, S4.title + .2)); text('META · AI RESEARCH BLOG · 15 OCT 2026', x + 4, 150, F.mono(22), C.gold, 'left', 3, 's4k'); ctx.globalAlpha = 1;
  // Model name: pushed up through a mask
  const k1 = eo(seg(t, S4.title, S4.title + .35));
  if (k1 > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 160, 1100, 140); ctx.clip(); text('Muse Spark Open', x - 4, 272 + (1 - k1) * 140, F.b8(124), C.white, 'left', 1, 's4t'); ctx.restore(); }
  // "Open weights" stamp
  const sk = seg(t, S4.stamp, S4.stamp + .18);
  if (sk > 0) {
    const s = 1 + .8 * (1 - eo(sk)), w1 = tw('开放权重', F.sc9(36)), w2 = tw('OPEN WEIGHTS', F.b8(34), 2), lw = w1 + w2 + 54;
    ctx.save(); ctx.translate(x + lw / 2, 340); ctx.rotate(-.04); ctx.scale(s, s); ctx.globalAlpha = clamp(sk * 3);
    ctx.fillStyle = C.lemon; ctx.fillRect(-lw / 2, -30, lw, 60);
    text('开放权重', -lw / 2 + 18, 13, F.sc9(36), C.ink, 'left', 0, 's4st'); text('OPEN WEIGHTS', -lw / 2 + 36 + w1, 12, F.b8(34), C.ink, 'left', 2);
    ctx.restore();
  }
  // Ratio bar: 816B total parameters (full width) vs 42B active per token
  const BW = 860, by1 = 440, by2 = 560, unit = BW / 816;
  const bar = (y, label, en, v, a, col, id) => {
    const la = eo(seg(t, a - .15, a + .1)); if (la <= 0) return;
    ctx.globalAlpha = la; const w1 = text(label, x, y - 16, F.sc9(32), C.white, 'left', 0, id); text(en, x + w1 + 14, y - 17, F.b6(24), C.grey, 'left', 2); ctx.globalAlpha = 1;
    ctx.fillStyle = '#22262C'; ctx.fillRect(x, y, BW, 56);
    const k = eio(seg(t, a, a + .5)), w = Math.max(4, v * unit * k);
    const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, col === C.lemon ? C.lemonD : '#B9B4A6'); g.addColorStop(1, col);
    ctx.fillStyle = g; ctx.fillRect(x, y, w, 56);
    const num = Math.round(v * k) + 'B';
    text(num, x + Math.max(w, 0) + 20, y + 46, F.b8(56), col, 'left', 0);
    if (k >= 1) TX.push({ id: id + 'v', text: v + 'B', x0: x + w, y0: y, x1: x + w + 160, y1: y + 56 });
  };
  bar(by1, '总参数', 'TOTAL PARAMETERS', 816, S4.bar1, C.paper, 's4b1');
  bar(by2, '每个 token 激活', 'ACTIVE PER TOKEN', 42, S4.bar2, C.lemon, 's4b2');
  // ≈5% badge
  const pk = seg(t, S4.bar2 + .45, S4.bar2 + .65);
  if (pk > 0) {
    const s = back(pk, 2.4), w1 = tw('约 5%', F.sc9(30)), w2 = tw('ABOUT 1/20', F.b8(26), 2), lw = w1 + w2 + 50;
    ctx.save(); ctx.translate(x + 300 + lw / 2, by2 + 28); ctx.scale(s, s);
    ctx.fillStyle = C.gold; ctx.fillRect(-lw / 2, -26, lw, 52);
    text('约 5%', -lw / 2 + 16, 11, F.sc9(30), C.ink, 'left', 0, 's4p'); text('ABOUT 1/20', -lw / 2 + 34 + w1, 10, F.b8(26), C.ink, 'left', 2);
    ctx.restore();
  }
  // Context
  const ck = eo(seg(t, S4.ctx, S4.ctx + .3));
  if (ck > 0) {
    ctx.globalAlpha = ck; const y = 700;
    ctx.fillStyle = 'rgba(27,30,35,.95)'; ctx.fillRect(x, y - 52, 520, 72); ctx.fillStyle = C.lemon; ctx.fillRect(x, y - 52, 6, 72);
    const w1 = text('上下文', x + 26, y - 4, F.sc9(32), C.white, 'left', 0, 's4c'); const w2 = text('CONTEXT', x + 26 + w1 + 12, y - 5, F.b6(24), C.grey, 'left', 2);
    text('1M token', x + 26 + w1 + w2 + 28, y - 2, F.b8(46), C.lemon, 'left', 1, 's4cv');
    ctx.globalAlpha = 1;
  }
  // Right column: two Mac Studios, 512 GB unified memory each → about 1 TB together
  const RX = 1180, units = [[300, 0], [480, 1]];
  units.forEach(([y, i]) => {
    const a = S4.macs + i * .25, k = eo(seg(t, a, a + .35)); if (k <= 0) return;
    ctx.save(); ctx.translate((1 - k) * 500, 0); ctx.globalAlpha = clamp(k * 2);
    // Body: flat rounded box + two ports on the front panel
    ctx.fillStyle = '#2B3038'; ctx.beginPath(); ctx.roundRect(RX, y, 420, 130, 22); ctx.fill();
    ctx.fillStyle = '#353B44'; ctx.beginPath(); ctx.roundRect(RX, y, 420, 18, [22, 22, 0, 0]); ctx.fill();
    ctx.fillStyle = '#16191D'; ctx.beginPath(); ctx.roundRect(RX + 30, y + 90, 26, 8, 4); ctx.fill(); ctx.beginPath(); ctx.roundRect(RX + 66, y + 90, 26, 8, 4); ctx.fill();
    text('Mac Studio · M5 Ultra', RX + 30, y + 62, F.b6(28), C.paper, 'left', 1, i ? null : 's4m');
    // Memory cells: 8 cells light up one by one
    const mk = seg(t, a + .35, a + .85);
    for (let j = 0; j < 8; j++) { ctx.fillStyle = j < Math.floor(mk * 8.999) ? C.lemon : '#1C1F24'; ctx.fillRect(RX + 300 + (j % 4) * 26, y + 40 + Math.floor(j / 4) * 30, 20, 22); }
    ctx.restore();
    if (mk >= 1) { text('512 GB', RX + 440, y + 80, F.b8(44), C.white, 'left', 0); if (i === 0) TX.push({ id: 's4g', text: '512 GB', x0: RX + 440, y0: y + 36, x1: RX + 600, y1: y + 88 }); }
  });
  // Bracket: about 1 TB together
  const bk = eio(seg(t, S4.bracket, S4.bracket + .3));
  if (bk > 0) {
    const yA = 300, yB = 610, bx = RX + 610;
    ctx.strokeStyle = C.lemon; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(bx - 20, yA); ctx.lineTo(bx, yA); ctx.lineTo(bx, lerp(yA, yB, bk)); if (bk >= 1) ctx.lineTo(bx - 20, yB); ctx.stroke();
    const tk = seg(t, S4.bracket + .2, S4.bracket + .4);
    if (tk > 0) {
      const s = back(tk, 2.2); ctx.save(); ctx.translate(bx - 20, 755); ctx.scale(s, s);
      text('≈ 1 TB', -600, 0, F.b8(110), C.lemon, 'left', 0, 's4tb');
      ctx.restore();
    }
    ctx.globalAlpha = eo(seg(t, S4.bracket + .35, S4.bracket + .6));
    const w1 = text('统一内存', RX, 812, F.sc9(32), C.white, 'left', 0, 's4u'); text('UNIFIED MEMORY', RX + w1 + 14, 811, F.b6(24), C.grey, 'left', 2);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ============ Quote card: official words verbatim + source ============
// QUOTE is filled in once verified (see FACTS.md); the quote mark lands first, then the text pushes in line by line from below
let QUOTE = {
  a: 30.45, stamp: 33.9, ul: 33.3,
  lines: ['Our AI Office has started', 'enforcing these rules …'],
  cn: '欧盟 AI 办公室已开始执行这些规则',
  who: 'HENNA VIRKKUNEN · EUROPEAN COMMISSION',
  src: 'SPEECH · INTERNATIONAL AI SUMMIT, DUBLIN · 14 OCT 2026',
};
function shotQuote(t) {
  studioBg(t);
  if (!QUOTE) return;
  const zq = lerp(1, 1.035, eio(seg(t, 30.5, 35.5)));
  ctx.save(); ctx.translate(900, 420); ctx.scale(zq, zq); ctx.translate(-900, -420);
  // When the narration says 「执行」 ("enforce"), a lemon-yellow underline sweeps under "enforcing" on the second line
  const ul = eio(seg(t, QUOTE.ul, QUOTE.ul + .35));
  if (ul > 0) { ctx.fillStyle = C.lemon; ctx.fillRect(370, 300 + 120 + 18, tw('enforcing', F.b8(112), 1) * ul, 10); }
  const a = QUOTE.a, x = 220;
  const qk = seg(t, a, a + .25);
  if (qk > 0) { const s = back(qk, 2.4); ctx.save(); ctx.translate(x - 40, 250); ctx.scale(s, s); text('“', -30, 150, F.b8(340), C.lemon, 'left'); ctx.restore(); }
  QUOTE.lines.forEach((L, i) => {
    const k = eo(seg(t, a + .2 + i * .18, a + .5 + i * .18)); if (k <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 190 + i * 120, W, 130); ctx.clip();
    text(L, x + 150, 300 + i * 120 + (1 - k) * 120, F.b8(112), C.white, 'left', 1, 'q' + i); ctx.restore();
  });
  const n = QUOTE.lines.length, ya = 300 + n * 120 + 10;
  const zk = eo(seg(t, a + .6, a + .9));
  ctx.globalAlpha = zk; text(QUOTE.cn, x + 150, ya + 20, F.sc9(44), C.lemon, 'left', 1, 'qcn');
  ctx.fillStyle = C.gold; ctx.fillRect(x + 150, ya + 60, 60 * zk, 4);
  text(QUOTE.who, x + 150, ya + 110, F.b8(34), C.paper, 'left', 2, 'qwho');
  text(QUOTE.src, x + 150, ya + 150, F.mono(20), C.grey2, 'left', 2, 'qsrc');
  ctx.globalAlpha = 1;
  if (QUOTE.stamp) {
    const sk = seg(t, QUOTE.stamp, QUOTE.stamp + .16);
    if (sk > 0) {
      const s = 1 + .9 * (1 - eo(sk)); ctx.save(); ctx.translate(1530, 640); ctx.rotate(-.1); ctx.scale(s, s); ctx.globalAlpha = clamp(sk * 3);
      ctx.fillStyle = 'rgba(18,20,23,.94)'; ctx.fillRect(-230, -54, 460, 108);
      ctx.strokeStyle = C.lemon; ctx.lineWidth = 4; ctx.strokeRect(-220, -44, 440, 88); ctx.lineWidth = 1.5; ctx.strokeRect(-212, -36, 424, 72);
      const w1 = tw('已开始执法', F.sc9(46)), w2 = tw('ENFORCING', F.b8(44), 3), st = -(w1 + 18 + w2) / 2;
      text('已开始执法', st, 16, F.sc9(46), C.lemon, 'left', 0); text('ENFORCING', st + w1 + 18, 15, F.b8(44), C.paper, 'left', 3);
      ctx.restore();
      const rr = seg(t, QUOTE.stamp + .05, QUOTE.stamp + .5); if (rr < 1) { ctx.strokeStyle = `rgba(242,207,29,${.8 * (1 - rr)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(1530, 640, 200 + rr * 160, 70 + rr * 60, -.1, 0, Math.PI * 2); ctx.stroke(); }
    }
  }
  ctx.restore();
}

// End slate
function shotEnd(t) {
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1A1D22'); g.addColorStop(1, '#0E1013');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(244,241,232,.04)';
  for (let x = 40 - (t * 10) % 48; x < W; x += 48) for (let y = 24; y < H; y += 48) ctx.fillRect(x, y, 2, 2);
  ctx.fillStyle = C.lemon; ctx.beginPath(); ctx.moveTo(1260, 0); ctx.lineTo(1290, 0); ctx.lineTo(1150, 790); ctx.lineTo(1120, 790); ctx.fill();
  ctx.fillStyle = C.gold; ctx.beginPath(); ctx.moveTo(1300, 0); ctx.lineTo(1306, 0); ctx.lineTo(1166, 790); ctx.lineTo(1160, 790); ctx.fill();
  const m = (a, b) => eo(seg(t, a, b));
  const r = (y, h, k, fn) => { if (k <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(0, y - h, 1120, h + 30); ctx.clip(); ctx.translate(0, (1 - k) * (h + 30)); fn(); ctx.restore(); };
  const x = 150;
  ctx.globalAlpha = m(39.1, 39.3); text('LEMO AI NEWS · WEEK 42 · 12–18 OCT 2026', x, 210, F.mono(24), C.gold, 'left', 3, 'e0'); ctx.globalAlpha = 1;
  r(350, 130, m(39.12, 39.42), () => text('本周 AI 四件事', x - 4, 350, F.sc9(120), C.white, 'left', 4, 'e1'));
  r(440, 80, m(39.25, 39.52), () => text('The Week in AI', x, 440, F.b6i(76), C.lemon, 'left', 2, 'e2'));
  const lk = eio(seg(t, 39.4, 39.7)); ctx.fillStyle = C.lemon; ctx.fillRect(x, 482, 880 * lk, 2);
  ctx.globalAlpha = m(39.55, 39.8); text('LEMO AI NEWS · 电视新闻包装 BROADCAST NEWS PACKAGE', x, 548, F.sc7(30), C.white, 'left', 1, 'e3'); ctx.globalAlpha = 1;
  ctx.globalAlpha = m(39.65, 39.9); text('LemoLab × Claude Opus 5.5', x, 604, F.b6(38), C.gold, 'left', 1.5, 'e4'); ctx.globalAlpha = 1;
  const sm = m(39.8, 40.1); ctx.globalAlpha = sm;
  ctx.fillStyle = C.line; ctx.fillRect(x, 816, 1620, 1);
  [['新闻来源：Google · Meta · Korea Herald · Bloomberg · Euronews', 'e5'], ['数据：韩国交易所 · 讲话原文：欧盟委员会', 'e5b'],
   ['配乐采样 VSCO 2 CE、VCSL（CC0）· 地图 Natural Earth（公有领域）', 'e6'], ['字体 Noto Sans SC、Barlow Condensed、IBM Plex Mono（OFL）', 'e6b'],
   ['配音：豆包语音合成 2.0（解说小明）', 'e7'], ['机房、晶圆背景为 AI 生成示意图', 'e7b']].forEach(([s, id], i) => text(s, x, 854 + i * 31, F.sc7(20), C.grey, 'left', 0, id));
  ctx.globalAlpha = 1;
  // Station logo
  const la = m(39.3, 39.6); ctx.globalAlpha = la;
  plate(1600, 360, .62, seg(t, 40.0, 40.45) || -1, seg(t, 39.3, 39.8));
  wordmark(1600, 520, 48, 'center', 'e8');
  ctx.globalAlpha = 1;
}

// ============ Compositing ============
function wipeBand(bx) { ctx.fillStyle = C.lemon; ctx.fillRect(bx - 84, 0, 84, H); ctx.fillStyle = C.ink; ctx.fillRect(bx, 0, 5, H); ctx.fillStyle = C.gold; ctx.fillRect(bx + 5, 0, 14, H); }
// One picture = a shot + its own wrapper layers (corner tag, source credit, strap); the wrapper layers are drawn in their state at time tov
function layer(fn, t, tov) { fn(t); cornerTag(tov); credit(tov); strap(tov); }
// Vertical-band wipe: right of the band is the old picture (wrapper layers frozen just before the wipe starts), left is the new picture (wrapper layers already on the new story) — the strap's text gets "brushed" over by the band
function wipe(t, a, b, oldFn, newFn) {
  const bx = lerp(-140, W + 140, eio(seg(t, a, b)));
  // Reading check: before the band is halfway, count the old picture's text; after, the new picture's (never register both on the same frame)
  const n0 = TX.length; layer(newFn, t, b + .001); const NEW = TX.splice(n0);
  ctx.save(); ctx.beginPath(); ctx.rect(bx, 0, W, H); ctx.clip(); layer(oldFn, t, a - .001); ctx.restore();
  const OLD = TX.splice(n0); TX.push(...(seg(t, a, b) < .5 ? OLD : NEW));
  wipeBand(bx);
}
// Only three transitions: vertical-band wipe (to a new story), hard cut (within one story), slanted wipe (into the end slate)
// The new picture's entrance animation starts early, during the wipe, so there is already content underneath when the band sweeps past
const OPEN = t => rundown(t + .7, false), TYPE = t => shotType(t + .4);
const RECAP = t => rundown(t - 8.8, true), END = t => shotEnd(t - 8.2);
const SCENES = [
  [1.5, OPEN], [6.0, TYPE], [9.0, shotPrice], [13.0, shotKospi], [20.0, shotChips],
  [24.0, shotEU], [30.5, shotQuote], [35.5, shotStory4], [45.0, RECAP], [47.5, END],
];
const WIPES = [[1.2, 1.5], [5.7, 6.0], [12.7, 13.0], [23.7, 24.0], [35.2, 35.5], [44.7, 45.0]];
function scene(t) {
  if (t < 1.5) {
    if (t >= 1.2) wipe(t, 1.2, 1.5, shotSting, SCENES[0][1]); else layer(shotSting, t, t);
    stingLogo(t); return;
  }
  const w = WIPES.find(([a, b]) => t >= a && t < b);
  if (w) { const i = SCENES.findIndex(s => Math.abs(s[0] - w[1]) < .01); wipe(t, w[0], w[1], SCENES[i - 1][1], SCENES[i][1]); return; }
  if (t >= 47.25 && t < 47.5) {   // slanted wipe into the end slate (the end-slate content is already moving)
    layer(RECAP, t, t);
    const k = eio(seg(t, 47.25, 47.5)); const x = W - k * (W + 340);
    ctx.save(); ctx.beginPath(); ctx.moveTo(x + 340, 0); ctx.lineTo(W + 340, 0); ctx.lineTo(W + 340, H); ctx.lineTo(x, H); ctx.closePath(); ctx.clip(); END(t); ctx.restore();
    ctx.fillStyle = C.lemon; ctx.beginPath(); ctx.moveTo(x + 340, 0); ctx.lineTo(x + 380, 0); ctx.lineTo(x + 40, H); ctx.lineTo(x, H); ctx.fill();
    return;
  }
  let fn = SCENES[0][1]; for (const [a, f] of SCENES) if (t >= a) fn = f;
  layer(fn, t, t);
}
function render(t) {
  TX = []; t_ = t;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
  scene(t);
  bug(t);
  if (t > 52.7) { ctx.fillStyle = `rgba(0,0,0,${seg(t, 52.7, 53.4)})`; ctx.fillRect(0, 0, W, H); }
}

// —— Events (sound effects / narration), exported by events.mjs for mix.py ——
const sh = (d, L) => L.map(e => ({ ...e, t: Math.round((e.t + d) * 1000) / 1000 }));
const EV = [
  { t: .04, type: 'swish' }, { t: .4, type: 'stab' }, { t: .9, type: 'glint' }, { t: 1.2, type: 'whoosh' },
  { t: 1.3, type: 'slide' }, { t: 1.9, type: 'slide' },
  { t: 2.3, type: 'row' }, { t: 2.7, type: 'row' }, { t: 3.1, type: 'row' }, { t: 3.5, type: 'row' }, { t: 4.4, type: 'blip' }, { t: 5.7, type: 'whoosh' },
  { t: 6.0, type: 'hit' }, { t: 6.1, type: 'slam' }, { t: 6.6, type: 'slam' }, { t: 7.1, type: 'stamp' },
  ...Array.from({ length: 24 }, (_, i) => ({ t: 7.6 + i * (.6 / 24), type: 'key' })),
  { t: 9.0, type: 'card' }, { t: 9.2, type: 'flap' }, { t: 9.4, type: 'flap' }, { t: 9.9, type: 'flap' }, { t: 9.9, type: 'swap' }, { t: 10.1, type: 'flap' }, { t: 10.3, type: 'ding' },
  { t: 12.7, type: 'whoosh' }, { t: 12.7, type: 'market', dur: 7.3 },
  { t: 13.0, type: 'hit' }, { t: 12.75, type: 'draw' },
  ...[1, 2, 3, 4, 5, 6].map(d => ({ t: 14.15 + (d - 1) * .3, type: 'drop', d })),
  { t: 16.5, type: 'boom' }, ...Array.from({ length: 10 }, (_, i) => ({ t: 16.6 + i * .04, type: 'roll' })), { t: 17.35, type: 'stamp' },
  { t: 20.0, type: 'card' }, { t: 20.05, type: 'swap' }, { t: 20.3, type: 'fall' }, { t: 20.8, type: 'fall' }, { t: 21.5, type: 'ding' },
  { t: 23.7, type: 'whoosh' }, { t: 24.0, type: 'hit' }, { t: 24.05, type: 'pulse' }, { t: 24.55, type: 'zoom' }, { t: 24.95, type: 'pop' }, { t: 25.35, type: 'zoom' },
  { t: 25.45, type: 'paper' }, { t: 26.2, type: 'paper' }, { t: 25.85, type: 'type' }, { t: 26.6, type: 'type' },
  { t: 30.5, type: 'card' }, { t: 30.45, type: 'quote' }, { t: 33.3, type: 'mark' }, { t: 33.9, type: 'stamp_big' },
  { t: 35.2, type: 'whoosh' }, { t: 35.5, type: 'hit' }, { t: 36.0, type: 'stamp' },
  { t: 44.7, type: 'whoosh' }, ...sh(8.8, [0, 1, 2, 3].map(i => ({ t: 37.0 + i * .4, type: 'tick_ok', i }))),
  { t: 47.25, type: 'whoosh' }, { t: 47.5, type: 'end' },
];
const VO_AT = { v1: 1.6, v2: 6.1, v3: 13.1, v4: 20.1, v5: 24.1, v6: 30.6, v7: 35.6, v8: 45.1 };
for (const id in VO_AT) EV.push({ t: VO_AT[id], type: 'vo', id });

window.DUR = DUR; window.EV = EV; window.render = render; window.TEXTS = t => { render(t); return TX; };
(async () => {
  makeGrain();
  const names = ['datacenter', 'wafer'];
  const [imgs, eu] = await Promise.all([Promise.all(names.map(n => loadImg(`assets/plate_${n}.jpg`))), fetch('assets/europe.json').then(r => r.json())]);
  names.forEach((n, i) => IM[n] = imgs[i]); EU = eu;
  buildMap();
  for (const c of MP) if (c.eu) EV.push({ t: Math.round((EUT.light + c.d / 3600 * .8) * 1000) / 1000, type: 'tick' });
  await Promise.all([F.sc9(40), F.sc7(40), F.b8(40), F.b6(40), F.b6i(40), F.mono(40)].map(f => document.fonts.load(f, '本周 Aa')));
  render(0); window.READY = true;
})();
