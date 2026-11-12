// One timeline for the whole film, 《三套系统走时》 Three systems keep the time (52 s).
// The page, the sound events, the subtitles and the score all read these numbers.
// Music: 150 bpm, 4/4 (bar = 1.6 s). Real watch: 18 000 beats/h = 5 beats/s = eighth notes at 150 bpm;
// shown at 1/4 speed a beat lands every 0.8 s (half notes).
export const FULL = 52.0;                 // 49.6 s of story + the credit card held on the last shot
export const BPM = 150, BEAT = 60 / BPM, BAR = 4 * BEAT;

// shots (film seconds)
export const SHOTS = [
  { id: 'SH1', t0: 0.0,  t1: 6.6,  name: 'Hook: a dial, no battery' },
  { id: 'SH2', t0: 6.6,  t1: 11.0, name: 'Cut open: three systems' },
  { id: 'SH3', t0: 11.0, t1: 13.8, name: 'Power: the spring' },
  { id: 'SH4', t0: 13.8, t1: 18.9, name: 'Follow the force through the gears' },
  { id: 'SH5', t0: 18.9, t1: 23.8, name: '4,800×' },
  { id: 'SH6', t0: 23.8, t1: 33.0, name: 'Explode: the train runs free, the escapement catches it' },
  { id: 'SH7', t0: 33.0, t1: 42.2, name: 'The tick' },
  { id: 'SH8', t0: 42.2, t1: 52.0, name: 'Pull out: the whole watch, then the title block (credit)' },
];

// narration (Kokoro bm_george; durations come from voice/dur.json) and bilingual subtitles
export const VO = [
  { id: 'v01', t: 0.8,  en: 'This watch has no battery.', zh: '这块表没有电池。' },
  { id: 'v02', t: 3.7,  en: 'Yet it drifts only a few seconds a day.', zh: '可它一天只差几秒。' },
  { id: 'v03', t: 7.45,  en: 'Open it up, and three systems share the work.', zh: '打开看，三套系统在分工。' },
  { id: 'v04', t: 11.6, en: 'A wound spring stores the power.', zh: '上紧的发条存着动力。' },
  { id: 'v05', t: 14.8, en: 'A train of gears passes it on, faster at every step.', zh: '一串齿轮把它传下去，一级比一级快。' },
  { id: 'v06', t: 19.75, en: 'In this teaching movement, 4,800 times faster.', zh: '在这台教学机芯里，快了 4800 倍。' },
  { id: 'v07', t: 25.0, en: 'Left alone, the spring would empty in a single rush.', zh: '不加约束，发条会一口气泄光。' },
  { id: 'v08', t: 29.6, en: 'So the escapement lets it out, half a tooth at a time.', zh: '所以擒纵机构每次只放过半个齿。' },
  { id: 'v09', t: 34.15, en: 'The balance swings back and forth, five beats every second.', zh: '摆轮来回摆，每秒五拍。' },
  { id: 'v10', t: 39.6, en: 'Each beat is one tick.', zh: '每一拍，就是一声滴答。' },
  { id: 'v11', t: 43.4, en: 'Spring, gears, balance. That is how it keeps time.', zh: '发条、齿轮、摆轮：表就是这样走时的。' },
];

// how fast the watch runs (1 = real time). Smoothstep between keys; watch time is its integral.
export const SPEED = [
  [0, 1], [6.6, 1], [8.2, .25],          // real time on the dial; slowed 4× once we are inside
  [23.9, .25], [24.8, 0],                 // explode: the escapement is lifted, the balance coasts to a stop
  [29.5, 0], [30.3, .25],                 // reassembled: the balance picks up again
  [37.2, .25], [38.4, .025], [39.7, .025], [40.7, .25],   // the tick, at 1/40 speed
  [52.0, .25],
];
export const TICK_ANCHOR = 39.2;          // a centre crossing of the balance lands exactly here (the climax tick)

// cues
export const CUE = {
  question: 3.2,        // "How does it keep time?"
  dialCut: 7.0,         // the dial and case are cut open (150° wedge, 0.9 s)
  title: 7.6,           // "Three systems."
  lift: 9.7,            // case and dial lift away
  barrelCut: 11.3,      // the barrel cover is cut
  power: 11.45,         // yellow from the barrel arbor
  train: 14.2,          // green, wheel by wheel as the camera passes
  reg: 16.2,            // blue-violet: escape wheel, fork, balance
  ratio: 18.9,          // hard cut to the plate from above: 4,800× (hold to 23.6)
  explode: 24.0,        // systems lift apart (bridges first)
  rush0: 25.4, rush1: 29.55,   // the train runs free; stops dead when the fork lands
  rejoin: 28.3,         // layers come back down, landing at 29.55
  accent: 29.55,        // the escape wheel turns accent red
  closeup: 33.0,        // match cut to the escapement
  tick: TICK_ANCHOR,
  descend: 42.5,        // case and dial come back down (already cut open)
  final: 45.2,          // "One tick at a time."
  credit: 47.75,        // the drawing's title block: title, style, LemoLab × Claude Opus 5.5 (held to 52.0)
};

// dye: each group of parts takes its system colour from a point, spreading out over `dur` seconds
export const DYE = [
  { g: 'power',   t0: CUE.power,      dur: 0.70, from: 'barrelHub', sys: 'power' },
  { g: 'center',  t0: CUE.train,      dur: 0.60, from: 'meshBC',    sys: 'trans' },
  { g: 'third',   t0: CUE.train + 0.8, dur: 0.60, from: 'meshCT',   sys: 'trans' },
  { g: 'fourth',  t0: CUE.train + 1.6, dur: 0.60, from: 'meshTF',   sys: 'trans' },
  { g: 'escape',  t0: CUE.reg,        dur: 0.45, from: 'meshFE',    sys: 'reg' },
  { g: 'pallet',  t0: CUE.reg + 0.4,  dur: 0.40, from: 'meshEP',    sys: 'reg' },
  { g: 'balance', t0: CUE.reg + 0.8,  dur: 0.65, from: 'pin',       sys: 'reg' },
];

// explode: layer heights (as in style frame 2) and when each starts to lift; it all comes back in reverse order
export const LAYER = { frame: 0, power: 5.5, trans: 10.5, reg: 16, bridge: 21.5 };   // tighter than style frame 2 so the stack fills the frame
export const LIFT_ORDER = { bridge: 0, reg: .18, trans: .32, power: .42, frame: 0 };
