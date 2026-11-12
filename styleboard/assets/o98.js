/* The Workbench · OPUSCAR 98 (opuscar98/): the end of the bench. Uses assets/player.js (chapters, controls under the picture).
   The player sits on the projector's throw in the frame (rest). Playing grows it off the wall into the room while the lights go down
   (theatre). Scrolling into the book while it plays sends it to the corner (dock), with the film it is on, "loop this film" and ×;
   back at the top it is large again. A frame in the book plays that film: in the theatre when the top is on screen, in the corner
   otherwise, looping it until the loop is turned off or the ruler is moved elsewhere. The book: search, 2D / 2.5D / 3D, a decade ruler,
   copy a prompt. Words: <script id="pg">. Rules: styleboard/DESIGN.md §10. */
(() => {
  'use strict';
  const d = document, H = d.documentElement, $ = (s, r = d) => r.querySelector(s), $$ = (s, r = d) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const wide = matchMedia('(min-width: 1024px) and (min-height: 560px)');
  const T = $('.theatre'); if (!T) return;
  const screen = $('.proj', T), root = $('.player', screen);
  const dnow = $('.dnow', screen), dloop = $('.dloop', screen);
  const P = () => root.ocPlayer;
  let mode = 'rest', seen = 1, loopOn = false, loopSpan = null;

  /* ---------------------------------------------------------------- rest / theatre / dock */
  function setMode(m) {
    if (m === mode) return;
    const was = mode; mode = m;
    T.dataset.mode = m;
    H.classList.toggle('dim', m === 'theatre' && wide.matches);
    if (m === 'dock' && !reduce.matches) { screen.classList.remove('arrive'); void screen.offsetWidth; screen.classList.add('arrive'); }
    if (was === 'dock' || m === 'dock') { const p = P(); if (p) requestAnimationFrame(() => p.paint()); }
  }
  const watch = (t, opts = {}) => {
    const p = P(); if (!p) return;
    if (opts.loop) { loopSpan = opts.loop; setLoop(true); } else { loopSpan = null; setLoop(false); }
    if (t != null) p.seek(t, true); else p.play();
    setMode(seen > .35 || !wide.matches ? 'theatre' : 'dock');
  };
  function setLoop(on) {
    loopOn = on && !!loopSpan;
    dloop.setAttribute('aria-pressed', String(loopOn));
    dloop.hidden = !loopSpan;
    const p = P(); if (p) p.setLoop(loopOn ? loopSpan[0] : null, loopOn ? loopSpan[1] : null);
  }
  dloop.addEventListener('click', () => setLoop(!loopOn));
  $('.dclose', screen).addEventListener('click', () => { const p = P(); if (p) p.pause(); setLoop(false); setMode('rest'); });
  $('.leave', screen).addEventListener('click', () => { const p = P(); if (p) p.pause(); setMode('rest'); });
  $('.back-screen', T).addEventListener('click', () => T.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth' }));
  for (const b of $$('[data-watch]')) b.addEventListener('click', () => watch(null));

  root.addEventListener('oc:state', e => {
    const s = e.detail.state;
    if (s === 'playing' && mode === 'rest') setMode(seen > .35 || !wide.matches ? 'theatre' : 'dock');
    if (s === 'ended') setMode('rest');
    if (mode === 'theatre') H.classList.toggle('dim', s === 'playing' && wide.matches);
  });
  root.addEventListener('oc:idle', e => H.classList.toggle('ctl', !e.detail.idle));
  // dragging the ruler out of the looped film ends the loop
  root.addEventListener('seeked', () => {
    const p = P(); if (!p || !loopOn || !loopSpan) return;
    const t = p.v.currentTime; if (t < loopSpan[0] - .2 || t > loopSpan[1] + .2) setLoop(false);
  }, true);
  if ('IntersectionObserver' in window) new IntersectionObserver(es => {
    seen = es[0].intersectionRatio;
    const p = P(), playing = p && p.state === 'playing';
    if (!wide.matches) { if (playing && seen < .2 && mode !== 'dock') setMode('dock'); else if (seen > .5 && mode === 'dock') setMode('theatre'); return; }
    if (mode === 'theatre' && seen < .35 && playing) setMode('dock');
    else if (mode === 'dock' && seen > .6) setMode('theatre');
    else if (mode === 'theatre' && seen < .35 && !playing) setMode('rest');
  }, { threshold: [0, .2, .35, .5, .6, .8, 1] }).observe(T);

  /* ---------------------------------------------------------------- the film on the screen: its line in the book, the corner's title */
  const arts = $$('.film');
  const byT = arts.map(a => [+a.dataset.t0, a]).sort((x, y) => x[0] - y[0]);
  let nowArt = null;
  const showChapter = c => {
    let a = null; for (const [t0, x] of byT) if (Math.abs(t0 - c[0]) < .01) a = x;
    if (a !== nowArt) { if (nowArt) nowArt.removeAttribute('aria-current'); nowArt = a; if (a) a.setAttribute('aria-current', 'true'); }
    dnow.textContent = c[1];
    dnow.href = a ? '#' + a.id : '#styles';
  };
  root.addEventListener('oc:chapter', e => showChapter(e.detail.chapter));
  { const p = P(); if (p && p.ch) showChapter(p.ch.spans[Math.max(0, p.chapterAt(p.v.currentTime || 0))]); }   // the player was set up before this script

  /* ---------------------------------------------------------------- the book */
  for (const b of $$('.film .shot')) b.addEventListener('click', () => {
    const a = b.closest('.film'), t0 = +a.dataset.t0, dur = +a.dataset.dur;
    watch(t0 + .02, { loop: [t0, t0 + dur] });
  });
  // filters: words, 2D/2.5D/3D, a decade
  const q = $('#q98'), count = $('#count98'), heads = $$('.decade');
  const norm = s => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
  let kind = 'all', ch = 'all';
  const nWord = count.textContent.replace(/\d+/, '{n}');
  function filter() {
    const w = norm(q.value.trim());
    let n = 0;
    for (const a of arts) {
      const ok = (kind === 'all' || a.dataset.k === kind) && (ch === 'all' || a.dataset.ch === ch) && (!w || a.dataset.words.includes(w));
      a.hidden = !ok; if (ok) n++;
    }
    for (const h of heads) {     // a decade shows only when a film of it does, with the count of those
      const k = arts.filter(a => !a.hidden && a.dataset.ch === h.dataset.ch).length, c = h.querySelector('.c');
      h.hidden = !k; if (c) c.textContent = nWord.replace('{n}', k);
    }
    count.textContent = nWord.replace('{n}', n);
    const none = $('#none98'); if (none) none.hidden = n > 0;
  }
  q.addEventListener('input', filter);
  for (const b of $$('.kinds button')) b.addEventListener('click', () => {
    kind = b.dataset.k; $$('.kinds button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); filter();
  });
  for (const b of $$('.decades button')) b.addEventListener('click', () => {
    ch = b.dataset.ch === ch && ch !== 'all' ? 'all' : b.dataset.ch;
    $$('.decades button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.ch === ch)));
    filter();
    const h = ch === 'all' ? $('#styles') : $(`.decade[data-ch="${ch}"]`);
    if (h && h.getBoundingClientRect().top < 0) h.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
  });
  // copy: the prompt alone, or headed with its style ("Copy prompt" in a film's line)
  const W = (JSON.parse(($('#pg') || {}).textContent || '{}').w) || {};
  async function copy(text, btn) {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
      const ta = Object.assign(d.createElement('textarea'), { value: text }); ta.style.cssText = 'position:fixed;opacity:0'; d.body.appendChild(ta); ta.select();
      try { ok = d.execCommand('copy'); } catch (e2) { } ta.remove();
    }
    if (!ok) return;
    const lab = $('span', btn), was = lab.textContent; btn.classList.add('done'); lab.textContent = W.copied || '✓';
    clearTimeout(btn._t); btn._t = setTimeout(() => { btn.classList.remove('done'); lab.textContent = was; }, 1600);
  }
  const promptOf = a => $('.prompt p', a).textContent.trim();
  for (const b of $$('[data-pcopy]')) b.addEventListener('click', () => copy(promptOf(b.closest('.film')), b));
  for (const b of $$('[data-qcopy]')) b.addEventListener('click', () => copy(b.dataset.head + '\n\n' + promptOf(b.closest('.film')), b));

  // an old link to one film (#no-37) opens its line; the film starts there when asked
  const open = () => { const a = location.hash && $(location.hash); if (a && a.classList.contains('film')) { a.hidden = false; $$('details', a)[0].open = true; } };
  addEventListener('hashchange', open); open();
})();
