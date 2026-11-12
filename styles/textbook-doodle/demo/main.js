import { render, texts, DUR, EV, init } from './film.js';
const c = document.getElementById('c'); c.width = innerWidth; c.height = innerHeight;
const ctx = c.getContext('2d');
await document.fonts.ready; await Promise.all([...document.fonts].map(f => f.load()));   // every unicode-range block must be loaded first
await init();
window.DUR = DUR; window.EV = EV;
window.render = t => render(ctx, t, c.width, c.height);
window.TEXTS = t => texts(ctx, t, c.width, c.height);   // every readable line and its screen box, for core/render/readcheck.mjs
window.READY = true;
