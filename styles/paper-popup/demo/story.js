// Story timeline: narration, bubbles, chapter banners (seconds)
export const DUR = 133.0;

// Narration: [id, start, English, Chinese]; durations are in voices/dur.json
export const VO = [
  ['v01', 1.6, 'On a quiet desk, in a quiet room, sat a book that nobody had opened in a very long time.', '安静的书桌上，安静的房间里，有一本很久很久没人翻开的书。'],
  ['v02', 8.3, 'Until one evening… somebody did.', '直到某个傍晚……有人翻开了它。'],
  ['v03', 17.0, 'Inside, in a land made entirely of paper, lived a little sprite named Pip.', '书里有一片全用纸做成的土地，住着一个叫皮普的小精灵。'],
  ['v04', 25.8, 'Pip loved Papervale. The cardboard hills. The paper sun on its wooden stick. And the river, that went swish… swish… swish.', '皮普喜欢纸片谷：硬纸板的山丘，插在木棍上的纸太阳，还有那条哗啦、哗啦、哗啦的小河。'],
  ['v05', 36.5, 'But every evening, when the sun went down, another light came on. A big, warm light, from somewhere beyond the edge of the page.', '可每到傍晚太阳落下，另一盏灯就会亮起——又大又暖的光，从书页边缘之外的某个地方照进来。'],
  ['v06', 52.2, 'So Pip set off, through the Whispering Woods,', '于是皮普出发了，穿过窃窃私语森林，'],
  ['v07', 63.4, 'where Pip learned that a grumpy crumple… just needs someone to smooth things out.', '在那里皮普明白了：皱巴巴的坏脾气，只是需要有人帮它抚平。'],
  ['v08', 75.2, 'Together, they sailed the Swish-Swash Sea,', '他们一起驶过哗啦哗啦海，'],
  ['v09', 83.2, 'on through the night, beneath the stars on their strings,', '穿过夜色，在一颗颗挂在线上的星星下，'],
  ['v10', 90.2, 'until they reached the very last page. Nothing else was drawn there. Just two words. The End.', '直到最后一页。那里什么都还没画，只有两个词：The End（全书完）。'],
  ['v11', 97.0, 'Pip had never been off the page before. It was a little bit scary.', '皮普从没离开过书页。有一点点害怕。'],
  ['v12', 103.3, 'But the best adventures always are.', '可最好的冒险，总是这样。'],
  ['v13', 113.2, 'And that is how Pip found out where the big, warm light came from.', '就这样，皮普找到了那束又大又暖的光从哪里来。'],
  ['v14', 117.3, 'A reading lamp… and someone, reading along.', '一盏台灯……还有一个正在读故事的人。'],
  ['v15', 124.5, 'The end? Or maybe… just the beginning.', '结束了？也许……才刚刚开始。'],
];

// Narration subtitle parts. A line too wide for one English subtitle line (hud.js wraps at 1720 px) is shown in parts, one
// English line each, switched in the pause between two words (word times from faster-whisper on voices/vNN.wav, see words.py):
// id -> [[offset from the line's start (s), English, Chinese], ...]; the first part starts at 0, the last one ends with the voice
export const VO_SPLIT = {
  v04: [[0, 'Pip loved Papervale. The cardboard hills. The paper sun on its wooden stick.', '皮普喜欢纸片谷：硬纸板的山丘，插在木棍上的纸太阳，'],
        [5.23, 'And the river, that went swish… swish… swish.', '还有那条哗啦、哗啦、哗啦的小河。']],         // "stick." ends 4.92, "And" 5.38
  v05: [[0, 'But every evening, when the sun went down, another light came on.', '可每到傍晚太阳落下，另一盏灯就会亮起。'],
        [3.95, 'A big, warm light, from somewhere beyond the edge of the page.', '又大又暖的光，从书页边缘之外的某个地方照进来。']],   // "on." ends 3.82, "A" 4.48
};
// Narration subtitle cues for hud.js drawSubs and make_srt.mjs: [{id, t0, t1, en, zh, first, last}];
// t1 = when the next part takes over, or the end of the voice (t0 + dur) for a line's last part
export const voCues = dur => VO.flatMap(([id, t0, en, zh]) => {
  const parts = VO_SPLIT[id] || [[0, en, zh]], end = t0 + (dur[id] || 3);
  return parts.map(([o, e, z], k) => ({ id, t0: t0 + o, t1: k + 1 < parts.length ? t0 + parts[k + 1][0] : end, en: e, zh: z, first: k === 0, last: k + 1 === parts.length }));
});

// Character bubbles: [who, start, end, English, Chinese]
export const BUB = [
  ['pip', 22.4, 25.4, 'Good morning, Papervale!', '早上好，纸片谷！'],
  ['pip', 45.2, 48.5, "I'm going to find out where it comes from!", '我要去找到它从哪里来！'],
  ['crumple', 57.8, 60.9, 'Hmph! Nobody gets past ME!', '哼！谁也别想过去！'],
  ['fold', 68.6, 71.5, "Wheee! I'm Fold! Let's go!", '呜呼！我叫折折！出发吧！'],
  ['pip', 101.1, 103.1, 'Here goes!', '冲啦！'],
  ['pip', 120.3, 123.2, 'Hello, big world!', '你好，大大的世界！'],
];

export const CHAPTERS = [
  [15.2, 18.8, 'Chapter 1', 'Papervale', '第一章 · 纸片谷'],
  [51.6, 55.2, 'Chapter 2', 'The Whispering Woods', '第二章 · 窃窃私语森林'],
  [74.6, 78.2, 'Chapter 3', 'The Swish-Swash Sea', '第三章 · 哗啦哗啦海'],
  [89.9, 93.3, 'Final Chapter', 'The Last Page', '最终章 · 最后一页'],
];

export const TITLE_CN = '小精灵冒险记';
export const CREDITS = [
  'Music: “Dreamy Flashback” · “Jaunty Gumption” · “Heartwarming” — Kevin MacLeod (incompetech.com) · CC BY 4.0',
  'Room, desk & props: Poly Haven (CC0) · Voice: Kokoro TTS',
  '音乐：Kevin MacLeod · 场景素材：Poly Haven · 配音：Kokoro',
];

// Book mechanism timings
export const OPEN = [10.0, 12.6];                                  // cover opens
export const TURNS = [[48.6, 51.4], [71.6, 74.4], [86.8, 89.6]];   // three page turns
