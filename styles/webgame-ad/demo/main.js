// Page contract (core/README.md): window.READY, window.render(t), window.DUR, window.EV, window.TEXTS(t).
import { render, texts, DUR, EV, init } from './film.js';
const c = document.getElementById('c'); c.width = innerWidth; c.height = innerHeight;
const ctx = c.getContext('2d');
await document.fonts.ready; await Promise.all([...document.fonts].map(f => f.load()));   // every unicode-range chunk has to be loaded first
await init();
window.DUR = DUR; window.EV = EV;
window.render = t => render(ctx, t, c.width, c.height);
window.TEXTS = t => { render(ctx, t, c.width, c.height); return texts(); };
window.READY = true;
