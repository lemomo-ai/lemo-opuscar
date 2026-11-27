import { makeFilm } from './film.js';
const cv = document.getElementById('c'), g = cv.getContext('2d');
await Promise.all(['500 40px Archivo', '800 40px Archivo', '900 40px Archivo', "500 40px 'Source Serif'", "600 40px 'Source Serif'", "700 40px 'Source Serif'", "italic 500 40px 'Source Serif'", "500 40px 'Plex Mono'", '600 40px Caveat', '700 40px Caveat'].map(f => document.fonts.load(f)));
const lines = await (await fetch('lines.json')).json(), dur = await (await fetch('voices/dur.json')).json();
const film = makeFilm(g, cv.width, cv.height, lines, dur), Q = new URLSearchParams(location.search);
window.DUR = film.DUR;
window.EV = film.events();
window.TEXTS = t => film.texts(t);
window.render = t => film.render(t, { nosub: Q.has('nosub'), poster: Q.has('poster') });   // ?nosub=1: no subtitle strip; ?poster=1: no credit line
window.READY = true;
