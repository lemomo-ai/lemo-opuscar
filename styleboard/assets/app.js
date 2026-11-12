/* The Workbench: scroll = the camera moving along the bench. Reads media/manifest.json (the long take, rendered for the site; in the site media).
   html.film: scrubs the long take on a canvas (assets/engines.js), stretches every station's pin frame over a length of scroll,
   swaps in the 2560 stop still when the camera is at rest, and floats that station's cards on the left.
   html.stack: the same sections, one under the other (phones, reduced motion, Save-Data). Rules: styleboard/DESIGN.md.
   Also: the old site's anchors land on their station (home.py's legacy map, from styleboard/anchors.json; an old ?use=<tag> is
   dropped); the screening room plays OPUSCAR 98 in the site's player (assets/player.js).
   Every style page (html.runon) runs this too: its film and sheet on top, then the take from its own station (data-from) to the end.
   It carries no bench of its own: the language's bench (data-bench, media/bench-<lang>.json, cached across pages) is fetched and
   put under the sheet first. Scroll positions there are offset by the sheet (BASE) and the take's start (U0), and a card opens its
   film in place (swapTo: the page's film and sheet swapped, the address pushed, Back brings the last one back). */
(() => {
  'use strict';
  const d = document, H = d.documentElement, $ = (s, r = d) => r.querySelector(s), $$ = (s, r = d) => [...r.querySelectorAll(s)];
  if (H.dataset.bench) {   // a style page: its bench first (no bench, no harm: the page is still its film and sheet)
    fetch(H.dataset.bench).then(r => { if (!r.ok) throw r.status; return r.json(); }).then(b => {
      $('main > .sheet').insertAdjacentHTML('afterend', b.stops);
      d.body.insertAdjacentHTML('beforeend', b.after);
      run(b.idx);
    }).catch(e => console.warn('the bench did not load', e));
  } else run(JSON.parse($('#idx').textContent));

  function run(IDX) {
  const W = IDX.w;
  // the old site's anchors (#painting-illustration, #how, #new, #<slug> …) → a station, the top, a card lit; ?use=<tag> (the bench by
  // use, gone) is dropped from the address
  let litSlug = null;
  (() => {
    const p = new URLSearchParams(location.search);
    if (p.has('use')) { p.delete('use'); history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : '') + location.hash); }
    let raw = location.hash.slice(1); try { raw = decodeURIComponent(raw); } catch (e) { }
    if (!raw || /^s\d\d$/.test(raw)) return;
    const to = (W.legacy || {})[raw] || (W.legacy || {})[raw.toLowerCase()];
    if (!to || to === raw) return;
    let hash = '';
    if (to.startsWith('style:')) { litSlug = to.slice(6); const r = IDX.rows.find(x => x[0] === litSlug); if (r) hash = '#s' + String(r[2]).padStart(2, '0'); }
    else if (to !== 'top') hash = '#' + to;
    history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : '') + hash);
  })();
  const R = H.dataset.root || '', Q = new URLSearchParams(location.search), FILM = H.classList.contains('film');
  const RUNON = H.classList.contains('runon');
  let FROM = RUNON ? +H.dataset.from : 0, SLUG = H.dataset.slug || '';
  const STOPS = $$('main > .stop');                     // 0 hero, 1..15 stations, 16 finale
  const RAIL = $('.rail'), TICKS = $$('.rail a'), CAM = $('.rail .cam'), NEXT = $('.rail .next');
  const mouse = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const pad2 = n => String(n).padStart(2, '0');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const store = (k, v) => { try { v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch (e) { } };
  let MAN = null, missingClip = new Set();

  /* ---------------------------------------------------------------- language switch keeps the place and remembers the choice */
  const lang = $('.lang');
  for (const a of $$('.lang-m')) a.addEventListener('click', () => store('opuscar-lang', a.dataset.lang));   // the phone's menu

  /* the phone's menu closes on a tap outside it, and with Escape */
  for (const d of $$('.top .menu')) {
    document.addEventListener('click', e => { if (d.open && !d.contains(e.target)) d.open = false; });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && d.open) { d.open = false; d.querySelector('summary').focus(); } });
  }
  if (!RUNON) lang.addEventListener('click', () => {   // the other language opens at the same station
    store('opuscar-lang', lang.dataset.lang);
    const n = current();
    lang.href = lang.getAttribute('href').split('#')[0] + (n > 0 ? '#' + STOPS[n].id : '');
  });

  /* ---------------------------------------------------------------- picture-space helpers (frame = 1280 x 720 layout px) */
  // one rule for every note: a dot on the thing, a short leader up and to the right, the words sitting on its end (DESIGN.md)
  function placeNote(n, x, y, s) {
    const L = NOTE_LEAD * s;
    n.style.left = x + L + 'px'; n.style.top = (n.classList.contains('down') ? y + L : y - L) + 'px';   // its bottom-left corner (CSS lifts it by its height); .down: its top-left
    $('.lead-line', n).style.width = L * Math.SQRT2 + 'px';
    n.classList.add('placed');
  }
  const NOTE_LEAD = 22;   // frame px, each way
  function coverBox(w, h) { const s = Math.max(w / 1280, h / 720); return { s, ox: (w - 1280 * s) / 2, oy: (h - 720 * s) / 2 }; }
  function placeNotes() {
    for (const st of STOPS) {
      const box = FILM ? coverBox(innerWidth, innerHeight) : coverBox(st.clientWidth, st.clientWidth * 9 / 16);
      const wide = FILM || innerWidth >= 1024;
      for (const n of $$('.note', st)) {
        if (!wide) { n.classList.remove('placed'); continue; }
        const [px, py] = n.dataset.at.split(',').map(Number);
        let x = px * box.s + box.ox, y = py * box.s + box.oy;
        if (!FILM) {   // stacked: the note is placed inside its card column, so take the column's offset off
          const o = n.offsetParent, or = o.getBoundingClientRect(), sr = st.getBoundingClientRect(); x -= or.left - sr.left; y -= or.top - sr.top;
        }
        placeNote(n, x, y, box.s);
      }
      for (const b of $$('.screen', st)) {
        const [x0, y0, x1, y1] = b.dataset.box.split(',').map(Number);
        Object.assign(b.style, { left: x0 * box.s + box.ox + 'px', top: y0 * box.s + box.oy + 'px', width: (x1 - x0) * box.s + 'px', height: (y1 - y0) * box.s + 'px' });
        b.classList.add('placed');
      }
    }
  }

  /* ---------------------------------------------------------------- a station's column always clears the rail: long names wrap
     (never "…"), and if that makes the column too tall for a 16:9 screen, the whole column is set a little smaller */
  function fit(st) {
    const ov = $('.ov', st); if (!ov || !ov.offsetParent && !FILM) return;
    const grid = $('.cards', ov);
    ov.style.removeProperty('--u'); ov.style.removeProperty('width'); if (grid) { grid.classList.remove('scroll'); grid.style.maxHeight = ''; }
    if (!FILM && innerWidth < 1024) return;
    if (FILM && st.classList.contains('station')) {   // a station's column: its right edge stays in the picture's dark left 40 % (x 512 of 1280; the finale's caption sits right of the ruler, on its own dark): on a 16:10 window the picture is cropped and its props move left
      const cb = coverBox(innerWidth, innerHeight), edge = cb.ox + 512 * cb.s, r = ov.getBoundingClientRect();
      if (r.width && r.right > edge) ov.style.width = Math.max(240, edge - r.left) + 'px';
    }
    const base = FILM ? Math.min(2.4, Math.max(.8, Math.min(innerWidth / 1280, innerHeight / 720))) : innerWidth / 1280;
    const kids = [...ov.children].filter(k => !k.classList.contains('note') && !/fixed|absolute/.test(getComputedStyle(k).position));
    if (!kids.length || !kids[0].getClientRects().length) return;
    const top = ov.getBoundingClientRect().top, bottom = Math.max(...kids.map(k => k.getBoundingClientRect().bottom));
    const limit = FILM ? (st.classList.contains('finale') ? innerHeight - 14 * base : $('.rail ol').getBoundingClientRect().top - 12 * base)   // the finale's caption is right of the ruler
                       : st.getBoundingClientRect().bottom - 22 * base;
    const low = () => Math.max(...kids.map(c => c.getBoundingClientRect().bottom));
    let k = (limit - top) / (bottom - top);
    if (k >= 1) return;
    const lo = FILM && innerHeight < 800 ? .64 : .78;   // short windows: the floors give way (app.css), so the column may go smaller
    for (let i = 0; i < 5 && k > lo; i++) {   // first the whole column a little smaller (text may re-wrap at the new size, so check again) ...
      ov.style.setProperty('--u', (base * Math.max(lo, k)).toFixed(4) + 'px');
      const t2 = ov.getBoundingClientRect().top, b2 = low();
      if (b2 <= limit) return;
      k *= (limit - t2) / (b2 - t2);
    }
    ov.style.setProperty('--u', (base * lo).toFixed(4) + 'px');
    if (grid && low() > limit) {   // ... and on a really short screen the cards scroll inside the column
      grid.classList.add('scroll'); grid.style.maxHeight = Math.max(80, limit - grid.getBoundingClientRect().top) + 'px';
    }
  }
  const fitAll = () => STOPS.forEach(fit);

  /* ---------------------------------------------------------------- stills fade in only once decoded */
  for (const p of $$('.stop .still')) {
    const img = $('img', p), ok = () => p.classList.add('ok');
    if (img.complete && img.naturalWidth) ok(); else img.addEventListener('load', ok, { once: true });
  }

  /* ---------------------------------------------------------------- hover: the style's short clip */
  if (mouse && !reduce && !saveData) {
    let timer = 0;
    d.addEventListener('pointerover', e => {
      const card = e.target.closest('.card'); if (!card || card.contains(e.relatedTarget)) return;
      const slug = card.dataset.slug; if (missingClip.has(slug)) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        const pic = $('.pic', card); let v = $('video', pic);
        if (!v) { v = d.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto'; pic.appendChild(v); }
        v.src = `${R}media/clip/${slug}.mp4`;
        v.play().then(() => pic.classList.add('playing')).catch(() => { });
      }, 140);
    });
    d.addEventListener('pointerout', e => {
      const card = e.target.closest('.card'); if (!card || card.contains(e.relatedTarget)) return;
      clearTimeout(timer);
      const pic = $('.pic', card), v = $('video', pic);
      if (v) { pic.classList.remove('playing'); setTimeout(() => { if (!pic.classList.contains('playing')) { v.pause(); v.removeAttribute('src'); v.load(); } }, 260); }
    });
  }

  /* ---------------------------------------------------------------- the screening room (OPUSCAR 98) */
  const room = $('#room'), rv = $('video', room);
  const RP = () => { const p = $('.player', room); return p && p.ocPlayer; };
  d.addEventListener('click', e => {
    const b = e.target.closest('[data-film]'); if (!b) return;
    e.preventDefault(); room.showModal();
    const p = RP(); if (p) { p.play(); p.bPlay.focus({ preventScroll: true }); } else rv.play().catch(() => { });
  });
  const shut = () => { const p = RP(); if (p) p.pause(); else rv.pause(); if (room.open) room.close(); };
  $('.x', room).addEventListener('click', shut);
  room.addEventListener('close', () => { const p = RP(); if (p) p.pause(); else rv.pause(); });
  room.addEventListener('click', e => { if (e.target === room) shut(); });

  /* ================================================================ search */
  const find = $('#find'), qin = $('#q'), res = $('#res');
  const norm = s => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[\s·・\-–—_:：,，.。!！?？'’"“”《》()（）&/]/g, '');
  const ROWS = IDX.rows.map(r => ({ slug: r[0], num: r[1], cat: r[2], cn: r[3], en: r[4], film: r[5], film2: r[6], uses: r[7], isNew: r[8], dur: r[9],
    k: [norm(r[3]), norm(r[4]), norm(r[5]), norm(r[6]), norm(r[0]), norm(r[7])] }));
  const ZH = H.lang.startsWith('zh');
  const CATS = Object.entries(W.cats).map(([n, [cn, en]]) => ({ n: +n, cn, en, k: [norm(cn), norm(en)] }));
  let hits = [], sel = 0;
  // q at the start of a word; Chinese has no spaces between words, so there any place counts
  const at = (s, q) => /[\u3400-\u9fff]/.test(q) ? s.includes(q) : new RegExp('(^|[^a-z0-9])' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(s);
  function score(q) {
    const out = [];
    if (!q) { CATS.forEach(c => out.push({ st: c, s: 100 - c.n })); return out; }
    const dig = /^\d+$/.test(q) ? +q : -1;
    for (const c of CATS) { const s = c.k[0].startsWith(q) || c.k[1].startsWith(q) ? 97 : c.k[0].includes(q) || c.k[1].includes(q) ? 88 : dig === c.n ? 50 : 0; if (s) out.push({ st: c, s }); }
    for (const r of ROWS) {
      const [cn, en, f1, f2, sl, us] = r.k;
      let s = 0;
      if (dig >= 0 && dig === r.num) s = 99;
      else if (cn === q || en === q) s = 98;
      else if (cn.startsWith(q) || en.startsWith(q)) s = 90;
      else if (at(en, q)) s = 80;                                  // a word of the name begins with it
      else if (cn.includes(q) || en.includes(q)) s = 75;
      else if (at(f1, q) || at(f2, q)) s = 55;                     // titles, folder, uses: only where a word begins ("ink" isn't "Think")
      else if (at(sl, q)) s = 45;
      else if (at(us, q)) s = 30;
      if (s) out.push({ r, s: s - r.num / 1000 });
    }
    return out.sort((a, b) => b.s - a.s).slice(0, 40);
  }
  function hl(text, q) {
    if (!q) return esc(text);
    const i = norm(text).indexOf(q); if (i < 0 || norm(text).length !== text.replace(/[\s·・\-–—_:：,，.。!！?？'’"“”《》()（）&/]/g, '').length) return esc(text);
    // map the normalised index back onto the original string (skipping the characters norm() drops)
    let k = 0, a = -1, b = -1;
    for (let j = 0; j < text.length; j++) { if (norm(text[j]) === '') continue; if (k === i) a = j; k++; if (k === i + q.length) { b = j + 1; break; } }
    return a < 0 || b < 0 ? esc(text) : esc(text.slice(0, a)) + '<mark>' + esc(text.slice(a, b)) + '</mark>' + esc(text.slice(b));
  }
  function render() {
    const q = norm(qin.value);
    hits = score(q); sel = 0;
    if (!hits.length) { res.innerHTML = `<li class="empty" role="option" aria-disabled="true">${esc(W.search_empty)}</li>`; return; }
    res.innerHTML = hits.map((h, i) => {
      if (h.st) {
        const c = h.st, nm = ZH ? c.cn : c.en, alt = ZH ? c.en : c.cn, n = ROWS.filter(r => r.cat === c.n).length;
        return `<li role="option" id="o${i}" data-stop="${c.n}"><span class="th stn">${pad2(c.n)}</span><span class="tx"><span class="a"><b>${hl(nm, q)}</b><em>${esc(alt)}</em></span>`
          + `<span class="b">${esc(W.search_go)}</span></span><span class="c">${esc(W.search_station)}<b>${pad2(c.n)} · ${n}</b></span></li>`;
      }
      const r = h.r, nm = ZH ? r.cn : r.en, alt = ZH ? r.en : '', film = ZH ? `《${r.film}》` : r.film;
      return `<li role="option" id="o${i}" data-slug="${r.slug}"><span class="th" data-bg="${R}media/thumb/${r.slug}-480.webp">${r.isNew ? `<i class="new">${esc(W.new)}</i>` : ''}</span><span class="tx">`
        + `<span class="a"><b>${hl(nm, q)}</b>${alt ? `<em>${hl(alt, q)}</em>` : ''}</span><span class="b">${hl(film, q)}</span></span>`
        + `<span class="c">No.${pad2(r.num)}<b>${pad2(r.cat)} · ${r.dur}</b></span></li>`;
    }).join('');
    $$('.th[data-bg]', res).forEach(t => { t.style.backgroundImage = `url("${t.dataset.bg}")`; });
    mark();
  }
  function mark() {
    $$('li[role="option"]', res).forEach((li, i) => li.setAttribute('aria-selected', i === sel ? 'true' : 'false'));
    const li = $(`#o${sel}`, res); if (li) { li.scrollIntoView({ block: 'nearest' }); qin.setAttribute('aria-activedescendant', li.id); }
  }
  function choose(i) {   // a station: go there; a style: go to its station and light up its card (Enter on the card then opens its page)
    const h = hits[i]; if (!h) return;
    find.close();
    if (RUNON && !h.st) { swapTo(h.r.slug, { push: true }); return; }
    if (h.st) { go(h.st.n, { push: true }); return; }
    const card = $(`#s${pad2(h.r.cat)} .card[data-slug="${h.r.slug}"]`);
    Promise.resolve(go(h.r.cat, { push: true })).then(() => setTimeout(() => {
      if (!card) return;
      $$('.card.hit').forEach(c => c.classList.remove('hit'));
      card.classList.add('hit'); card.focus({ preventScroll: true });
      setTimeout(() => card.classList.remove('hit'), 2600);
    }, FILM ? 480 : 650));
  }
  function openFind() { if (find.open) return; find.showModal(); qin.value = ''; render(); qin.focus(); }
  $('.top .search').addEventListener('click', openFind);
  qin.addEventListener('input', render);
  qin.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { sel = Math.min(hits.length - 1, sel + 1); mark(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); mark(); e.preventDefault(); }
    else if (e.key === 'Enter') { choose(sel); e.preventDefault(); }
  });
  res.addEventListener('pointermove', e => { const li = e.target.closest('li[role="option"]'); if (!li || !li.id) return; const i = +li.id.slice(1); if (i !== sel) { sel = i; mark(); } });
  res.addEventListener('click', e => { const li = e.target.closest('li[role="option"]'); if (li && li.id) choose(+li.id.slice(1)); });
  find.addEventListener('click', e => { if (e.target === find) find.close(); });

  function light(slug) {   // a card asked for by an old link (#<slug>): lit, focused, as when it is picked in search
    const card = $(`.card[data-slug="${slug}"]`); if (!card) return;
    $$('.card.hit').forEach(c => c.classList.remove('hit'));
    card.classList.add('hit'); card.focus({ preventScroll: true });
    setTimeout(() => card.classList.remove('hit'), 2600);
  }

  /* ================================================================ keys */
  d.addEventListener('keydown', e => {
    if (e.target.closest('input, textarea, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '/') { e.preventDefault(); openFind(); return; }
    if (find.open || room.open || e.defaultPrevented || (RUNON && !inBench())) return;
    if (e.key === 'ArrowRight' || e.key === ']') { e.preventDefault(); go(Math.min(STOPS.length - 1, current() + 1)); }
    else if (e.key === 'ArrowLeft' || e.key === '[') { e.preventDefault(); const n = current() - 1; go(RUNON && n < FROM ? 0 : Math.max(0, n)); }
  });
  RAIL.addEventListener('click', e => { const a = e.target.closest('a[data-stop]'); if (!a) return; e.preventDefault(); go(+a.dataset.stop, { push: true }); });
  const TOC = $('.hero .toc');
  if (TOC) {
    TOC.addEventListener('click', e => { const a = e.target.closest('a[data-stop]'); if (!a || !FILM) return; e.preventDefault(); go(+a.dataset.stop, { push: true }); });
    const warmUp = e => { const a = e.target.closest('a[data-stop]'); if (a && FILM && MAN) { extra = +a.dataset.stop; near(stopOfFrame(Math.round(curF)), true); } };
    TOC.addEventListener('pointerover', warmUp); TOC.addEventListener('focusin', warmUp);
  }
  if (!RUNON) $('.mark').addEventListener('click', e => { e.preventDefault(); go(0); });
  for (const a of $$('a.totop')) a.addEventListener('click', e => { e.preventDefault(); go(0); });
  const railKeys = e => {   // inside the rail: ← → move between ticks (one tab stop for the whole rail)
    const i = TICKS.indexOf(d.activeElement); if (i < 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); const j = Math.max(0, Math.min(TICKS.length - 1, i + (e.key === 'ArrowRight' ? 1 : -1))); TICKS[j].focus(); }
  };
  RAIL.addEventListener('keydown', railKeys, true);

  function setTick(n) {   // n = 1..15 lights a tick, anything else none
    TICKS.forEach((a, i) => { if (i + 1 === n) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); a.tabIndex = (i + 1 === (n >= 1 && n <= 15 ? n : 1)) ? 0 : -1; });
  }

  /* ================================================================ stack mode */
  let current = () => 0, go = n => {
    if (RUNON && n < FROM) { leave(n); return; }
    const el = STOPS[n]; if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); history.replaceState(history.state, '', n ? '#' + el.id : location.pathname + location.search);
  };
  let inBench = () => true;

  /* ================================================================ a style page that runs on into the bench */
  // a station before this one is on the home page; 0 (the start) is the top of this page, its film
  function leave(n) {
    if (n > 0) { location.href = R + (ZH ? 'zh/' : '') + '#s' + pad2(n); return; }
    scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); history.replaceState(history.state, '', location.pathname + location.search);
  }
  // a card on the bench opens its film here: the page's film and sheet are swapped for that style's (fetched once, kept for Back),
  // the address and the language switch follow, and the bench below starts again from that style's station
  const kept = new Map();
  const pageOf = slug => R + (ZH ? 'zh/' : '') + 'styles/' + slug + '/';
  const snapshot = () => ({ plate: $('main > .plate'), sheet: $('main > .sheet'), title: d.title, from: FROM,
    desc: ($('meta[name="description"]') || {}).content, twin: lang.getAttribute('href') });
  let onSwap = y => scrollTo(0, y);
  async function swapTo(slug, o = {}) {
    if (!RUNON) return;
    if (slug === SLUG) { leave(0); return; }
    let next = kept.get(slug);
    if (!next) {
      let doc;
      try { doc = new DOMParser().parseFromString(await fetch(pageOf(slug)).then(r => { if (!r.ok) throw r.status; return r.text(); }), 'text/html'); }
      catch (e) { location.href = pageOf(slug); return; }
      const row = IDX.rows.find(r => r[0] === slug);
      next = { plate: d.adoptNode(doc.querySelector('main > .plate')), sheet: d.adoptNode(doc.querySelector('main > .sheet')), title: doc.title,
               desc: (doc.querySelector('meta[name="description"]') || {}).content, twin: doc.querySelector('.top .lang').getAttribute('href'), from: row ? row[2] : FROM };
    }
    if (o.push) history.replaceState({ ...(history.state || {}), slug: SLUG, y: scrollY }, '');   // Back returns to this place on the bench
    const now = snapshot();
    for (const p of $$('.player', now.plate)) { const x = p.ocPlayer; if (x) x.pause(); else { const v = $('video', p); if (v) v.pause(); } }
    kept.set(SLUG, now);
    now.plate.replaceWith(next.plate); now.sheet.replaceWith(next.sheet);
    if (window.OCPlayer) OCPlayer.init(next.plate);
    if (window.OCPage) OCPage.init(d);
    d.title = next.title; if (next.desc) $('meta[name="description"]').content = next.desc;
    lang.setAttribute('href', next.twin); for (const a of $$('.lang-m')) a.setAttribute('href', next.twin);
    const url = new URL(pageOf(slug), location.href).href;
    for (const l of $$('link[rel="canonical"], meta[property="og:url"]')) l.setAttribute(l.tagName === 'LINK' ? 'href' : 'content', l.tagName === 'LINK' ? l.href.replace(/styles\/[^/]+\//, `styles/${slug}/`) : l.content.replace(/styles\/[^/]+\//, `styles/${slug}/`));
    for (const l of $$('link[rel="alternate"][hreflang]')) l.href = l.href.replace(/styles\/[^/]+\//, `styles/${slug}/`);
    SLUG = slug; FROM = next.from; H.dataset.slug = slug; H.dataset.from = FROM;
    hideBefore();
    if (o.push) history.pushState({ slug, y: 0 }, '', url);
    onSwap(o.y || 0);   // the top of the new film; Back: the place on the bench where the reader left it
    if (!o.pop) { const h = $('#style-h'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
  }
  function hideBefore() { STOPS.forEach((s, i) => { if (!s.classList.contains('gone')) s.hidden = i > 0 && i < FROM && i < STOPS.length - 1; }); }
  if (RUNON) {
    hideBefore();
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    history.replaceState({ ...(history.state || {}), slug: SLUG }, '', location.href);
    d.addEventListener('click', e => {
      const a = e.target.closest('a.card'); if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault(); swapTo(a.dataset.slug, { push: true });
    });
    addEventListener('popstate', e => { if (e.state && e.state.slug && e.state.slug !== SLUG) swapTo(e.state.slug, { pop: true, y: e.state.y || 0 }); });
    if (!FILM) {   // phones: the bench's ruler waits until the bench is on screen
      const first = () => STOPS.find(s => !s.hidden && s.classList.contains('station'));
      const sheetOn = () => { const f = first(); H.classList.toggle('in-sheet', !!f && f.getBoundingClientRect().top > innerHeight * .5); };
      addEventListener('scroll', sheetOn, { passive: true }); addEventListener('resize', sheetOn); sheetOn();
    }
  }
  if (!FILM) {
    let cur = 0;
    current = () => cur;
    const io = new IntersectionObserver(es => {
      for (const e of es) if (e.isIntersecting) { cur = +e.target.dataset.stop; setTick(cur); }
    }, { rootMargin: '-45% 0px -50% 0px' });
    STOPS.forEach(s => io.observe(s));
    const relayout = () => { fitAll(); placeNotes(); };
    relayout(); addEventListener('resize', relayout); d.fonts && d.fonts.ready.then(relayout);
    fetch(R + 'media/manifest.json').then(r => r.json()).then(m => { MAN = m; missingClip = new Set(m.missing.films); }).catch(() => { });
    setTick(0);
    if (location.hash) { const el = $(location.hash.replace(/[^#\w-]/g, '')); if (el) setTimeout(() => { el.scrollIntoView(); if (litSlug) setTimeout(() => light(litSlug), 500); }, 60); }
    return;
  }

  /* ================================================================ film mode */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const canvas = $('#seq'), track = $('.track');
  let vh = innerHeight, keys = [], total = 0, eng = null, curF = 0, shownF = -1, lastT = performance.now(), active = -1, holdAt = -1, nearSet = '';
  // scroll px <-> the take's position (u, in screen heights). A style page's bench starts where its sheet ends (BASE) and its take at
  // the station it starts from (U0); above BASE the camera waits there.
  let BASE = 0, U0 = 0;
  const U = y => RUNON ? Math.max(U0, U0 + (y - BASE) / vh) : y / vh;
  const Y = u => Math.round(RUNON ? BASE + (u - U0) * vh : u * vh);
  inBench = () => !RUNON || scrollY > BASE - vh * .5;
  let dbg = Q.has('debug') ? d.body.appendChild(Object.assign(d.createElement('div'), { className: 'debug' })) : null;

  function sizeCanvas() {   // backing pixels: about one per source pixel once cover-fitted, never more than the screen has
    const cw = Math.max(innerWidth, innerHeight * 16 / 9), k = Math.min(devicePixelRatio || 1, Math.max(.75, 1920 / cw));
    const w = Math.round(innerWidth * k), h = Math.round(innerHeight * k);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; if (eng) eng.redraw(); }
  }
  function layout() {
    const was = total && (!RUNON || scrollY > BASE) ? U(scrollY) : 0;
    vh = innerHeight; total = keys.length ? keys[keys.length - 1][0] : 0;
    if (RUNON) U0 = MAN.stops[FROM].y0;
    track.style.display = 'block'; track.style.height = ((total - U0) * vh + vh) + 'px';
    if (RUNON) BASE = track.offsetTop;
    if (was) scrollTo(0, Y(was));
    sizeCanvas(); STOPS.forEach(s => { if (s.classList.contains('near')) fit(s); }); placeNotes();
  }
  function frameAt(y) {   // scroll px -> fractional frame
    const u = U(y);
    if (u <= keys[0][0]) return keys[0][1];
    let lo = 0, hi = keys.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (keys[m][0] <= u) lo = m; else hi = m; }
    const [u0, f0] = keys[lo], [u1, f1] = keys[hi];
    return u >= u1 ? f1 : f0 + (f1 - f0) * (u - u0) / (u1 - u0 || 1);
  }
  const stopAt = y => { const u = U(y); return MAN.stops.findIndex(s => u >= s.y0 - .001 && u <= s.y1 + .001); };
  const stopOfFrame = f => {   // the station whose stretch of the take contains f (0 = opening, 16 = finale)
    if (f < MAN.segs[1][0]) return 0;
    for (let i = 1; i < MAN.segs.length; i++) if (f <= MAN.segs[i][1]) return i;
    return MAN.segs.length - 1;
  };
  current = () => { if (!MAN) return 0; const u = U(scrollY); let best = 0; MAN.stops.forEach((s, i) => { if (u >= s.y0 - .3) best = i; }); return best; };

  // ---------- going somewhere (contents, rail, search, keys, back button):
  //   fast-forward: about a second of the camera racing along the bench, when every segment on the way is already loaded;
  //   otherwise a cut through black onto the station's pin frame. Either way the scroll position ends on the station's hold.
  let ffing = false;
  const yOf = n => { const s = MAN.stops[n]; return Y(n === 0 ? 0 : s.y0 + (s.y1 - s.y0) * .22); };
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function fastForward(y1, ms) {
    return new Promise(res => {
      const y0 = scrollY, t0 = performance.now(); ffing = true;
      const step = now => { const t = Math.min(1, (now - t0) / ms); scrollTo(0, Math.round(y0 + (y1 - y0) * ease(t))); if (t < 1) requestAnimationFrame(step); else { ffing = false; res(); } };
      requestAnimationFrame(step);
    });
  }
  const onTheWay = (fa, fb) => { if (!eng || !eng.loaded) return false; for (let i = stopOfFrame(Math.min(fa, fb)); i <= stopOfFrame(Math.max(fa, fb)); i++) if (!eng.loaded(i)) return false; return true; };
  let going = 0;
  go = async (n, o = {}) => {
    const s = MAN && MAN.stops[n]; if (!s) return;
    if (RUNON && n < FROM) { leave(n); return; }
    if (RUNON && !eng) begin();
    const y = yOf(n), id = ++going, url = n ? '#' + STOPS[n].id : location.pathname + location.search;
    if (o.push && url !== (location.hash || location.pathname + location.search)) history.pushState({ stop: n }, '', url); else if (!o.pop) history.replaceState({ stop: n }, '', url);
    const fa = frameAt(scrollY), fb = frameAt(y), how = Q.get('jump') || (reduce ? 'cut' : onTheWay(fa, fb) && Math.abs(fb - fa) <= 400 ? 'ff' : 'fade');
    extra = n; near(n, true); wake();
    if (how === 'ff') { await fastForward(y, 450 + Math.min(550, Math.abs(fb - fa) * 1.6)); return; }
    if (how === 'cut') { scrollTo(0, y); curF = frameAt(y); tick(performance.now(), true); return; }
    H.classList.add('cut');
    await new Promise(r => setTimeout(r, 250));
    if (id !== going) return;
    scrollTo(0, y); curF = frameAt(y); tick(performance.now(), true);
    const img = $('.still img', STOPS[n]);
    await Promise.race([img && img.decode ? img.decode().catch(() => { }) : Promise.resolve(), new Promise(r => setTimeout(r, 1400))]);
    if (id !== going) return;
    requestAnimationFrame(() => H.classList.remove('cut'));
  };
  addEventListener('popstate', e => {   // the back button returns to where the jump started from (the opening, or the station before)
    if (RUNON && e.state && e.state.slug && e.state.slug !== SLUG) return;   // swapTo brings that film back
    const h = location.hash.slice(1), n = h ? STOPS.findIndex(s => s.id === h) : 0;
    if (n >= 0 && MAN) go(n, { pop: true });
  });

  // ---------- settle: stopping just short of (or just past) a station glides onto it
  let settleT = 0, lastInput = 0;
  for (const ev of ['wheel', 'touchmove', 'keydown']) addEventListener(ev, () => { lastInput = performance.now(); }, { passive: true });
  function settle() {
    if (performance.now() - lastInput > 1200 || H.classList.contains('cut')) return;
    if (!inBench()) return;
    const u = U(scrollY), z = .26;
    for (const s of MAN.stops) {
      if (u > s.y0 - z && u < s.y0) { scrollTo({ top: Y(s.y0 + .015) + 1, behavior: 'smooth' }); return; }
      if (u > s.y1 && u < s.y1 + z * .6) { scrollTo({ top: Y(s.y1 - .015) - 1, behavior: 'smooth' }); return; }
    }
  }
  addEventListener('scroll', () => { clearTimeout(settleT); settleT = setTimeout(settle, 170); }, { passive: true });

  let warm = false, extra = -1, begun = false, begin = () => { };   // nothing but the first screen loads before the page's load event; extra = a station asked for (contents hover, a jump)
  function near(n, force) {   // lets the stills around the camera start loading (display:none keeps the others from downloading)
    if (!warm && !force) return;
    const want = [...new Set([n - 1, n, n + 1, n + 2, extra])].filter(i => i >= 0 && i < STOPS.length).join();
    if (want === nearSet && !force) return; nearSet = want;
    const set = new Set(want.split(',').map(Number));
    STOPS.forEach((s, i) => { const was = s.classList.contains('near'), now = set.has(i) || i === 0; s.classList.toggle('near', now); if (now && !was) fit(s); });
    placeNotes();
  }

  // ---------- every animation frame
  function tick(now, hard) {
    const dt = Math.min(80, now - lastT); lastT = now;
    const y = scrollY, tgt = frameAt(y);
    if (hard || ffing || Math.abs(tgt - curF) > 120) curF = tgt;
    else { curF += (tgt - curF) * (1 - Math.exp(-dt / 70)); if (Math.abs(tgt - curF) < .02) curF = tgt; }
    const f = Math.round(curF);
    if (eng && f !== shownF) shownF = eng.draw(f) === f ? f : -1;
    else if (eng && shownF < 0) shownF = eng.draw(f) === f ? f : -1;

    // which stop, and is the camera at rest on it?
    const k = stopAt(y), st = k >= 0 ? MAN.stops[k] : null;
    const rest = st && Math.abs(curF - st.pin) < .5;
    const at = stopOfFrame(f);
    if (k !== active) {
      STOPS.forEach((s, i) => { s.classList.toggle('on', i === k); });
      active = k;
    }
    STOPS.forEach((s, i) => s.classList.toggle('lit', i === k && rest));
    // the hero's words leave as soon as the camera does
    if (!RUNON && y < MAN.stops[0].y1 * vh + vh * .6) {
      const o = Math.max(0, Math.min(1, 1 - (y / vh - MAN.stops[0].y1 + .1) / .55));
      $('.ov', STOPS[0]).style.opacity = o; $('.toc', STOPS[0]).style.opacity = o; STOPS[0].classList.toggle('on', o > 0);
    }
    H.classList.toggle('at-top', RUNON ? y < BASE - vh * .2 : y < vh * .25);
    if (RUNON) H.classList.toggle('in-sheet', y < BASE - vh * .2);   // the sheet still covers the screen: the bench's words wait
    H.classList.toggle('at-stop', !!(st && k > 0 && k < STOPS.length - 1));
    H.classList.toggle('at-finale', k === STOPS.length - 1);
    H.classList.toggle('moving', !st && at < STOPS.length - 1);
    near(st ? k : at);

    // the rail: the camera's place between the ticks
    const pins = MAN.stations.map(s => s.pin);
    let x;
    if (f <= pins[0]) x = -.5 + .5 * Math.max(0, f - MAN.segs[0][1] + 40) / 40;
    else if (f >= pins[pins.length - 1]) x = 14 + Math.min(1, (f - pins[pins.length - 1]) / 60) * .6;
    else { let i = 0; while (f > pins[i + 1]) i++; x = i + (f - pins[i]) / (pins[i + 1] - pins[i]); }
    CAM.style.transform = `translateX(${(Math.max(0, x) / 14) * RAIL.clientWidth}px)`;
    CAM.style.opacity = x < 0 ? 0 : 1;
    const tickN = st && k >= 1 && k <= 15 ? k : (at >= 1 && at <= 15 && Math.abs(x - (at - 1)) < .5 ? at : 0);
    if (tickN !== holdAt) { setTick(tickN); holdAt = tickN; }
    if (!st) {   // between stations: name the next one
      const nx = pins.findIndex(p => p > curF);
      const txt = nx >= 0 ? `${esc(W.next)}<b>${pad2(nx + 1)}</b><em>${esc(W.cats[nx + 1][ZH ? 0 : 1])}</em>` : `${esc(W.end)}<b>·</b><em>OPUSCAR 98</em>`;
      if (NEXT.dataset.t !== txt) { NEXT.innerHTML = txt; NEXT.dataset.t = txt; }
    }
    RAIL.classList.toggle('wait', !!eng && !rest && shownF < 0 && f > 0);
    if (dbg) {
      const src = MAN.sources, kind = ['final', 'previz', 'placeholder'].find(t => src[t].some(([a, b]) => f >= a && f <= b));
      const s = eng ? eng.stats() : {};
      dbg.textContent = `frame ${f} (${curF.toFixed(1)} → ${tgt.toFixed(1)}) ${kind}\nengine ${eng ? eng.constructor.name + ' ' + (eng.codec || '') : '–'}  shown ${eng ? eng.shown : '-'}\n`
        + `stop ${k} rest ${!!rest}  y ${(y / vh).toFixed(2)} vh / ${total}\nloaded ${((s.bytes || 0) / 1e6).toFixed(1)} MB in ${s.reqs || 0}` + (s.seekMs && s.seekMs.length ? `  seek ${s.seekMs[s.seekMs.length - 1].toFixed(1)} ms` : '');
    }
  }
  // the loop runs only while something moves: once the camera has settled on a drawn frame it stops, and scrolling,
  // resizing, a jump or a segment arriving wakes it again (a page at rest costs nothing but the grain on the compositor)
  let running = false, still = 0, lastY = -1;
  function loop(now) {
    tick(now);
    const y = scrollY, settled = y === lastY && !ffing && Math.abs(frameAt(y) - curF) < .01 && (!eng || shownF === Math.round(curF));
    lastY = y; still = settled ? still + 1 : 0;
    if (still > 20) { running = false; return; }
    requestAnimationFrame(loop);
  }
  function wake() { if (running || !MAN) return; running = true; still = 0; lastT = performance.now(); requestAnimationFrame(loop); }
  for (const ev of ['scroll', 'resize', 'wheel', 'keydown', 'popstate', 'pointerdown', 'touchmove']) addEventListener(ev, wake, { passive: true });
  // for tests and the screenshot script: put the camera on frame f
  if (d.fonts) d.fonts.ready.then(() => { STOPS.forEach(s => { if (s.classList.contains('near')) fit(s); }); placeNotes(); });
  window.WB = { go: n => go(n), fitAll, toFrame: f => { for (let i = 1; i < keys.length; i++) { const [u0, f0] = keys[i - 1], [u1, f1] = keys[i]; if (f1 > f0 && f >= f0 && f <= f1) { scrollTo(0, Y(u0 + (f - f0) / (f1 - f0) * (u1 - u0))); return; } } },
    state: () => ({ frame: Math.round(curF), shown: eng ? eng.shown : -1, codec: eng && eng.codec, ready: !!eng, running, stats: eng ? eng.stats() : null }) };

  // ---------- start: the hero is up from the HTML; the take loads after the page has
  fetch(R + 'media/manifest.json').then(r => r.json()).then(async m => {
    MAN = m; keys = m.keys; missingClip = new Set(m.missing.films);
    layout();
    addEventListener('resize', () => { layout(); });
    const hash = location.hash.slice(1), hn = hash ? STOPS.findIndex(s => s.id === hash) : -1;
    const toHash = () => { if (hn > 0 && hn >= FROM) { const s = m.stops[hn]; layout(); scrollTo(0, Y(s.y0 + (s.y1 - s.y0) * .22)); curF = frameAt(scrollY); near(hn, true); } };
    toHash(); if (d.readyState !== 'complete') addEventListener('load', () => setTimeout(toHash, 0), { once: true });   // Safari scrolls to the (empty) anchor on load
    if (litSlug) setTimeout(() => light(litSlug), 1600);
    curF = frameAt(scrollY);
    wake();
    const start = async () => {
      warm = true; near(stopOfFrame(Math.round(curF)), true);
      const want = Q.get('engine') || m.engine;
      const segUrl = c => i => `${R}media/${c.dir}/seg${pad2(i)}.mp4`;
      if (want === 'img' && m.seq) {
        eng = new Scrub.ImgEngine({ canvas, frames: m.frames, segs: m.segs, fps: m.fps, start: Math.round(curF), onReady: () => wake(), url: i => `${R}media/${m.seq.dir}/f_${String(i).padStart(4, '0')}.${m.seq.ext}` });
      } else {
        const probe = d.createElement('video');
        let pick = null;
        for (const c of m.video.codecs) {
          if (Q.get('codec') && Q.get('codec') !== c.id) continue;
          if (!probe.canPlayType(c.mime)) continue;
          if (navigator.mediaCapabilities && c.id === 'av1') {
            try {
              const r = await navigator.mediaCapabilities.decodingInfo({ type: 'file', video: { contentType: c.mime, width: c.w, height: c.w * 9 / 16, bitrate: 3e6, framerate: m.fps } });
              if (!r.supported || !r.smooth || !r.powerEfficient) continue;   // AV1 only where it is decoded in hardware; otherwise H.264
            } catch (e) { }
          }
          pick = c; break;
        }
        pick = pick || m.video.codecs[m.video.codecs.length - 1];
        eng = new Scrub.VideoEngine({ canvas, frames: m.frames, segs: m.segs, fps: m.fps, start: Math.round(curF), url: segUrl(pick), onLoad: () => wake() });
        eng.codec = pick.id;
      }
      sizeCanvas(); wake();
    };
    begin = () => { if (!begun) { begun = true; start(); } };
    // a style page: nothing of the take loads while the reader is on the film and its sheet; it starts a screen and a half before the bench
    const kick = () => { if (scrollY > BASE - vh * 1.5) { removeEventListener('scroll', kick); begin(); } };
    const go1 = () => { if (RUNON) { addEventListener('scroll', kick, { passive: true }); kick(); } else begin(); };
    if (d.readyState === 'complete') setTimeout(go1, 60); else addEventListener('load', () => setTimeout(go1, 60), { once: true });
    if (RUNON) {   // the sheet's height changes (fonts, a swapped film): the bench moves with it
      const ro = new ResizeObserver(() => { if (MAN) { layout(); wake(); } });
      ro.observe($('main'));
      onSwap = y => {
        layout(); scrollTo(0, y); active = -1; STOPS.forEach(s => s.classList.remove('on', 'lit'));
        curF = frameAt(scrollY); if (warm) near(Math.max(FROM, current()), true); tick(performance.now(), true); wake();
      };
    }
  }).catch(() => { H.className = 'stack'; });

  // leaving the wide layout (or getting reduced motion) mid-visit: reload into the other layout at the same station
  const mq = matchMedia('(min-width: 1024px) and (min-height: 560px)');
  const swap = () => { if (!mq.matches) { const n = MAN ? current() : 0; location.replace(location.pathname + location.search + (n ? '#' + STOPS[n].id : '')); } };
  mq.addEventListener ? mq.addEventListener('change', swap) : mq.addListener(swap);
  }
})();
