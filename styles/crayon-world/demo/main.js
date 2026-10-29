// Page contract (core/README.md): window.READY, window.render(t), window.DUR, window.TEXTS(t).
const M = await import('./film.js');
await M.init();
const Q = new URLSearchParams(location.search);
window.DUR = +(Q.get('to') ?? M.DUR);   // ?to=<seconds> renders only the start of the film (a quick look)
window.render = t => M.frame(t);
window.TEXTS = t => M.texts(t);
window.READY = true;
