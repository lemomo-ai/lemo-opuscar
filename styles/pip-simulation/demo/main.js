// Blob Simulation demo: the whole film is film.js. ?a=&b= renders only that stretch (window.DUR = b − a, render(t) draws film second a + t).
const QS = new URLSearchParams(location.search);
await Promise.all(['600 40px Fredoka', '500 40px Fredoka', '500 20px Inter', '600 20px Inter', '400 20px Inter', '500 20px "Noto Sans SC"'].map(f => document.fonts.load(f, 'Aa中')));
const mod = await import('./film.js');
const R = await mod.build(QS);
const a = +(QS.get('a') ?? 0), b = +(QS.get('b') ?? mod.DUR);
window.render = t => { R.render(a + (t || 0)); };
window.DUR = b - a;
window.EV = (window.EV || []).filter(e => e.t >= a && e.t < b).map(e => ({ ...e, t: +(e.t - a).toFixed(3) }));
window.READY = true;
