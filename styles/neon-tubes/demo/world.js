// 《夜宵》 Midnight Snack: the street, in metres. x along the facade, y up from the pavement, z out from the wall toward the camera.
// Left to right: a closed shop, 药房 PHARMACY, 冰室 ICE CAFE (the cat's home: a goblet with water, 冰室, a neon clock),
// 旅馆 HOTEL (hanging box + arrow), 歌厅 KARAOKE, a dark alley, 金鱼 GOLDFISH (a fishbowl with a goldfish).
import { tubeFromStrokes, hanzi, latin, latinWidth } from './lib.js';

// gas colours (linear emission). Clear glass: neon = red-orange, argon + mercury = blue. Everything else is a phosphor coating.
export const GAS = {
  neon: [1.0, 0.11, 0.035], argon: [0.24, 0.46, 1.0],
  green: [0.22, 1.0, 0.36], white: [0.92, 0.9, 1.0], pink: [1.0, 0.24, 0.62], purple: [0.66, 0.28, 1.0],
  turq: [0.12, 0.95, 0.85], yellow: [1.0, 0.72, 0.16], leak: [0.72, 0.6, 1.0],
};
export const CLEAR = { neon: true, argon: true };
function T(strokes, gas, circ, opt = {}) { return tubeFromStrokes(strokes, { col: GAS[gas], coat: !CLEAR[gas], circ, gas, ...opt }); }
function tag(tubes, gas, circ) { for (const t of tubes) { t.col = GAS[gas]; t.coat = !CLEAR[gas]; t.circ = circ; t.gas = gas; } return tubes; }
// a tube from art.json points (local units), scaled and placed
export function artTube(tb, s, ox, oy, circ, opt = {}) {
  const sx = opt.flip ? -s : s;
  const P = tb.p.map(([x, y]) => [ox + x * sx, oy + y * s]);
  return tubeFromStrokes([P], { col: GAS[tb.c], coat: !CLEAR[tb.c], circ, gas: tb.c, fil: opt.fil ?? 0.004, D: opt.D ?? 0.016, z: opt.z ?? 0.05, ties: opt.ties ?? true, ends: opt.ends ?? true });
}

export const GOBLET = [5.5, 4.62];          // rim centre of the 冰室 goblet
export const BOWL = [22.75, 3.95];          // centre of the 金鱼 fishbowl (R = 0.5)
export const BOARD_TOP = { ice: 4.485, kara: 4.465, gold: 4.365 };

export function buildStreet(G, A) {
  const signs = [];
  // ------------------------------------------------ 药房 PHARMACY + green cross
  {
    const c = [0.45, 3.56], a = 0.13, L = 0.4;
    const P = [[c[0] - a, c[1] + L], [c[0] + a, c[1] + L], [c[0] + a, c[1] + a], [c[0] + L, c[1] + a], [c[0] + L, c[1] - a], [c[0] + a, c[1] - a], [c[0] + a, c[1] - L],
      [c[0] - a, c[1] - L], [c[0] - a, c[1] - a], [c[0] - L, c[1] - a], [c[0] - L, c[1] + a], [c[0] - a, c[1] + a], [c[0] - a, c[1] + L - 0.02]];
    const a2 = 0.07, L2 = 0.32;
    const P2 = [[c[0] - a2, c[1] + L2], [c[0] + a2, c[1] + L2], [c[0] + a2, c[1] + a2], [c[0] + L2, c[1] + a2], [c[0] + L2, c[1] - a2], [c[0] + a2, c[1] - a2], [c[0] + a2, c[1] - L2],
      [c[0] - a2, c[1] - L2], [c[0] - a2, c[1] - a2], [c[0] - L2, c[1] - a2], [c[0] - L2, c[1] + a2], [c[0] - a2, c[1] + a2], [c[0] - a2, c[1] + L2 - 0.02]];
    const cross = [T([P], 'green', 'pharm.cross', { fil: 0.02 }), T([P2], 'green', 'pharm.cross2', { fil: 0.015 })];
    const s = 0.62, gap = 0.1, cx = 2.42, top = 4.06, w = 2 * s + gap;
    const zh = [...tag(hanzi(G, '药', cx - w / 2, top, s), 'white', 'pharm.zh'), ...tag(hanzi(G, '房', cx - w / 2 + s + gap, top, s), 'white', 'pharm.zh')];
    const eh = 0.12, ew = latinWidth(G, 'PHARMACY', eh);
    const en = tag(latin(G, 'PHARMACY', cx - ew / 2, 3.3, eh, { D: 0.01 }).tubes, 'green', 'pharm.en');
    signs.push({ id: 'pharm', z: 0, backer: { x0: 1.05, y0: 3.04, x1: 3.8, y1: 4.17, col: '#0c2219', trim: '#2c4a3c' }, backer2: { x0: -0.02, y0: 3.08, x1: 0.92, y1: 4.04, col: '#0d1a14', trim: '#2c4a3c' },
      tubes: [...cross, ...zh, ...en], xf: [3.95, 3.3] });
  }
  // ------------------------------------------------ 冰室 ICE CAFE: a goblet of iced water (the cat's home), 冰室, the clock
  {
    const g = A.goblet, [gx, gy] = GOBLET;
    const cup = [artTube(g.body, 1, gx, gy, 'ice.cup', { D: 0.017, fil: 0.01 })];
    const water = [artTube(g.water, 1, gx, gy, 'ice.water', { D: 0.014 })];
    const cubes = g.cubes.map(c => artTube(c, 1, gx, gy, 'ice.cubes', { D: 0.014, fil: 0.015 }));
    const straw = [artTube(g.straw, 1, gx, gy, 'ice.straw', { D: 0.014, fil: 0.04 })];
    const s = 0.8, gap = 0.12, x0 = 6.3, top = 4.3;
    const bing = tag(hanzi(G, '冰', x0, top, s), 'neon', 'ice.bing');
    const shi = tag(hanzi(G, '室', x0 + s + gap, top, s), 'neon', 'ice.shi');
    const eh = 0.13, ew = latinWidth(G, 'ICE CAFE', eh), ecx = x0 + s + gap / 2;
    const en = tag(latin(G, 'ICE CAFE', ecx - ew / 2, 3.33, eh).tubes, 'argon', 'ice.en');
    const ring = []; for (let a = 95; a <= 445; a += 5) ring.push([9.28 + 0.4 * Math.cos(a * Math.PI / 180), 3.66 + 0.4 * Math.sin(a * Math.PI / 180)]);
    const clock = T([ring], 'argon', 'clock.ring', { fil: 0.02 });
    signs.push({ id: 'ice', z: 0, backer: { x0: 4.95, y0: 2.99, x1: 8.6, y1: 4.45, col: '#2a0b0d', trim: '#5a2a24' },
      tubes: [...cup, ...water, ...cubes, ...straw, ...bing, ...shi, ...en, clock],
      zh: { text: '冰室', bb: [x0, top - s, x0 + 2 * s + gap, top] }, en: { text: 'ICE CAFE', bb: [ecx - ew / 2, 3.33 - eh, ecx + ew / 2, 3.33] },
      bingBB: [x0, top - s, x0 + s, top], xf: [8.75, 3.3], clock: [9.28, 3.66, 0.37] });
  }
  // ------------------------------------------------ 旅馆 HOTEL: hanging box in front of the facade + an arrow over the door with a head at each end
  {
    const z = 2.0, s = 0.6, cx = 11.85;
    const zh = [...tag(hanzi(G, '旅', cx - s / 2, 4.9, s, { z: z + 0.05 }), 'yellow', 'hotel.zh'), ...tag(hanzi(G, '馆', cx - s / 2, 4.2, s, { z: z + 0.05 }), 'yellow', 'hotel.zh')];
    const eh = 0.12, ew = latinWidth(G, 'HOTEL', eh);
    const en = tag(latin(G, 'HOTEL', cx - ew / 2, 3.42, eh, { z: z + 0.05, D: 0.01 }).tubes, 'pink', 'hotel.en');
    const ar = [];
    for (let k = 0; k < 3; k++) { const xa = 11.45 + k * 0.5; ar.push(T([[[xa, 2.42], [xa + 0.35, 2.42]]], 'neon', 'hotel.ar' + k, { ties: false })); }
    ar.push(T([[[11.3, 2.66], [11.06, 2.42], [11.3, 2.18]]], 'neon', 'hotel.arL', { fil: 0.02, ties: false }));
    ar.push(T([[[12.95, 2.66], [13.19, 2.42], [12.95, 2.18]]], 'neon', 'hotel.arR', { fil: 0.02, ties: false }));
    signs.push({ id: 'hotel', z, backer: { x0: 11.38, y0: 3.12, x1: 12.32, y1: 5.02, col: '#08080a', trim: '#a08a3a', hang: true },
      tubes: [...zh, ...en, ...ar], xf: [10.45, 2.6] });
  }
  // ------------------------------------------------ 歌厅 KARAOKE: microphone in two circuits (pink / blue), a long board the cat runs along
  {
    const mx = 14.62, my = 3.95;
    const mic = (r, dy) => { const P = []; for (let a = -90; a <= 270; a += 8) P.push([mx + r * Math.cos(a * Math.PI / 180), my + dy + r * 1.25 * Math.sin(a * Math.PI / 180)]); return P; };
    const micA = [T([mic(0.2, 0.08), [[mx, my + 0.08 - 0.25], [mx, my - 0.42], [mx - 0.16, my - 0.62], [mx + 0.16, my - 0.62]]], 'pink', 'kara.micA', { fil: 0.02 }),
      T([[[mx - 0.2, my + 0.12], [mx + 0.2, my + 0.12]], [[mx + 0.19, my + 0.0], [mx - 0.19, my + 0.0]]], 'pink', 'kara.micA', { fil: 0.02 })];
    const micB = [T([mic(0.29, 0.06)], 'argon', 'kara.micB', { fil: 0.02 }),
      T([[[mx - 0.3, my - 0.18], [mx - 0.26, my - 0.38], [mx, my - 0.5], [mx + 0.26, my - 0.38], [mx + 0.3, my - 0.18]]], 'argon', 'kara.micB', { fil: 0.03 })];
    const s = 0.72, gap = 0.12, cx = 17.2, top = 4.3, w = 2 * s + gap;
    const zh = [...tag(hanzi(G, '歌', cx - w / 2, top, s), 'purple', 'kara.ge'), ...tag(hanzi(G, '厅', cx - w / 2 + s + gap, top, s), 'purple', 'kara.ting')];
    const eh = 0.13, ew = latinWidth(G, 'KARAOKE', eh);
    const en = tag(latin(G, 'KARAOKE', cx - ew / 2, 3.42, eh).tubes, 'turq', 'kara.en');
    signs.push({ id: 'kara', z: 0, backer: { x0: 15.4, y0: 3.12, x1: 19.0, y1: 4.43, col: '#1a0a24', trim: '#4a2a5a' },
      tubes: [...micA, ...micB, ...zh, ...en], xf: [19.2, 3.3] });
  }
  // ------------------------------------------------ decorative frames round the karaoke's upper windows (pink / turquoise)
  {
    const deco = [];
    [[14.3, 15.7], [16.3, 17.7], [18.0, 19.2]].forEach(([a, b], i) => {
      const y0 = 5.05, y1 = 6.15;
      deco.push(T([[[a, y0 + 0.05], [a, y1], [b, y1], [b, y0], [a + 0.05, y0]]], i % 2 ? 'turq' : 'pink', 'deco.' + i, { fil: 0.05 }));
      deco.push(T([[[a + 0.08, y0 + 0.13], [a + 0.08, y1 - 0.08], [b - 0.08, y1 - 0.08], [b - 0.08, y0 + 0.08], [a + 0.13, y0 + 0.08]]], i % 2 ? 'pink' : 'turq', 'deco.' + i + 'b', { fil: 0.04 }));
    });
    signs.push({ id: 'deco', z: 0, tubes: deco });
  }
  // ------------------------------------------------ 金鱼 GOLDFISH: a round bowl breaking the top edge of a navy board
  {
    const B = A.bowl, [bx, by] = BOWL;
    const tubes = [];
    // the bowl body, kept as one polyline: the film splits it where the cat's paw cracks it
    tubes.push(artTube(B.body, 1, bx, by, 'gold.bowl', { D: 0.017 }));
    tubes.push(artTube(B.base, 1, bx, by, 'gold.bowl', { D: 0.015 }));
    B.water.forEach((w, i) => tubes.push(artTube(w, 1, bx, by, 'gold.water' + i, { D: 0.014 })));
    B.bubbles.forEach((b, i) => tubes.push(artTube(b, 1, bx, by, 'gold.bub' + i, { D: 0.011, ties: false })));
    for (const p of B.pebbles) tubes.push(artTube(p, 1, bx, by, 'gold.peb', { D: 0.011, ties: false }));
    tubes.push(artTube(B.weed, 1, bx, by, 'gold.weed', { D: 0.012 }));
    const s = 0.6, gap = 0.1, x0 = 23.42, top = 4.2;
    const zh = [...tag(hanzi(G, '金', x0, top, s), 'yellow', 'gold.zh'), ...tag(hanzi(G, '鱼', x0 + s + gap, top, s), 'yellow', 'gold.zh')];
    const eh = 0.13, ecx = x0 + s + gap / 2, ew = latinWidth(G, 'GOLDFISH', eh);
    const en = tag(latin(G, 'GOLDFISH', ecx - ew / 2, 3.42, eh).tubes, 'argon', 'gold.en');
    tubes.push(...zh, ...en);
    signs.push({ id: 'gold', z: 0, backer: { x0: 22.0, y0: 3.12, x1: 24.95, y1: 4.33, col: '#0a1626', trim: '#2c4058' },
      tubes, zh: { text: '金鱼', bb: [x0, top - s, x0 + 2 * s + gap, top] }, en: { text: 'GOLDFISH', bb: [ecx - ew / 2, 3.42 - eh, ecx + ew / 2, 3.42] }, xf: [25.2, 3.3] });
  }
  for (const sg of signs) sg.tubes.forEach(t => { if (t.z === undefined || t.z === 0.05) t.z = sg.z + 0.05; });
  const all = signs.flatMap(s => s.tubes);
  return { signs, all, bowl: all.find(t => t.circ === 'gold.bowl') };
}

// buildings along the facade: [x0, x1, type (0 brick, 1 mosaic tile, 2 plaster), seed], tint. The alley is a near-black slot.
export const BUILDINGS = [
  [[-15, -0.45, 0, 2], [0.24, 0.14, 0.12]], [[-0.45, 4.45, 1, 3], [0.40, 0.49, 0.44]], [[4.45, 10.3, 2, 4], [0.45, 0.40, 0.33]], [[10.3, 13.8, 0, 5], [0.21, 0.135, 0.12]],
  [[13.8, 19.5, 1, 6], [0.42, 0.46, 0.52]], [[19.5, 21.0, 2, 9], [0.035, 0.035, 0.04]], [[21.0, 27, 2, 7], [0.33, 0.33, 0.35]], [[27, 40, 0, 8], [0.25, 0.16, 0.14]],
];
// shopfronts: [x0, y0, x1, y1, kind, light colour, group]   kind: win (glass + frame), door, shutter
export const FRONTS = [
  [-7.7, 0.0, -2.1, 2.4, 'shutter', null, 'none'],
  [-0.1, 0.32, 2.2, 2.4, 'win', [0.16, 0.22, 0.24], 'pharm'], [2.4, 0.0, 3.4, 2.4, 'door', [0.16, 0.22, 0.24], 'pharm'], [3.55, 0.32, 4.25, 2.4, 'win', [0.16, 0.22, 0.24], 'pharm'],
  [4.95, 0.35, 8.6, 2.4, 'win', [0.36, 0.22, 0.1], 'ice'], [8.8, 0.0, 9.9, 2.4, 'door', [0.33, 0.2, 0.09], 'ice'],
  [10.6, 0.0, 11.45, 2.15, 'door', [0.2, 0.12, 0.06], 'hotel'], [12.0, 0.9, 13.4, 2.1, 'win', [0.0, 0.0, 0.0], 'hotel'],
  [14.2, 0.0, 15.3, 2.35, 'door', [0.2, 0.06, 0.24], 'kara'], [15.5, 0.35, 19.2, 2.35, 'win', [0.12, 0.04, 0.16], 'kara'],
  [21.3, 0.35, 24.5, 2.4, 'win', [0.05, 0.17, 0.2], 'gold'], [24.75, 0.0, 25.85, 2.4, 'door', [0.05, 0.15, 0.18], 'gold'],
  [-14.5, 0.0, -8.9, 2.4, 'shutter', null, 'none'], [27.5, 0.0, 33, 2.4, 'shutter', null, 'none'],
];
export const UPPER = [];
{
  const xs = [[-14, -12.6], [-11.6, -10.2], [-7.6, -6.4], [-5.2, -4.0], [-2.6, -1.4], [0.3, 1.5], [2.6, 3.8], [5.4, 6.6], [7.6, 8.8], [10.9, 11.9], [12.6, 13.4], [21.6, 22.8], [23.4, 24.6], [25.2, 26.4], [28, 29.2], [30.4, 31.6]];
  xs.forEach(([a, b], i) => {
    for (const [y0, y1] of [[5.05, 6.15], [6.85, 7.95]]) {
      const lit = (i * 7 + Math.round(y0)) % 5 === 1 ? [0.3, 0.2, 0.1] : (i * 3 + Math.round(y0)) % 7 === 2 ? [0.12, 0.16, 0.2] : null;
      UPPER.push([a, y0, b, y1, lit, i]);
    }
  });
}
export const AC = [[-5.9, 4.55], [2.0, 4.6], [9.9, 5.4], [13.0, 4.7], [25.6, 4.7], [-10.6, 4.7], [24.6, 6.4]];
