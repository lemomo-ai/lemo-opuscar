/* The Workbench · the pages under the bench (a style page; later OPUSCAR 98 and the thank-you films). Uses assets/player.js.
   The language switch, search (the home page's dialog; picking a style opens its page), the sentence to copy, the install tabs,
   stills that start the film where they were cut, "house lights down" while the first screen's film plays, card clips on hover,
   and binds a film and sheet app.js swaps in. Words and paths: <script id="pg">, written by styleboard/pages.py. Rules: styleboard/DESIGN.md §10. */
(() => {
  'use strict';
  const d = document, H = d.documentElement, $ = (s, r = d) => r.querySelector(s), $$ = (s, r = d) => [...r.querySelectorAll(s)];
  const ZH = /^zh/i.test(H.lang);
  const PG = JSON.parse(((ZH && $('#pg-zh')) || $('#pg') || {}).textContent || '{}'), W = PG.w || {};   // the 404 page carries both languages
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const wide = matchMedia('(min-width: 1024px) and (min-height: 560px)');
  const mouse = matchMedia('(hover: hover) and (pointer: fine)');
  const pad2 = n => String(n).padStart(2, '0');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { } return null; };
  const page = slug => PG.styles + slug + '/';
  if (ZH) for (const a of $$('a[data-zh]')) a.setAttribute('href', a.dataset.zh);   // the 404 page's links in Chinese

  /* ---------------------------------------------------------------- language: the switch remembers the choice */
  // (the 404 page carries both languages: its switch goes to the other one's home)
  for (const a of $$('.top .lang, .top .lang-m')) a.addEventListener('click', () => store('opuscar-lang', a.dataset.lang || (ZH ? 'en' : 'zh')));

  /* the phone's menu closes on a tap outside it, and with Escape */
  for (const d of $$('.top .menu')) {
    document.addEventListener('click', e => { if (d.open && !d.contains(e.target)) d.open = false; });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && d.open) { d.open = false; d.querySelector('summary').focus(); } });
  }

  /* ---------------------------------------------------------------- the film and its sheet: bound by init(root), once per element,
     so app.js can bind a film and sheet it swaps in (window.OCPage.init) */
  const copyText = async (text, btn, ok) => {
    let done = false;
    try { await navigator.clipboard.writeText(text); done = true; } catch (e) {
      const ta = Object.assign(d.createElement('textarea'), { value: text }); ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0';
      d.body.appendChild(ta); ta.select(); try { done = d.execCommand('copy'); } catch (e2) { } ta.remove();
    }
    if (!done) return;
    btn.classList.add('done'); const lab = $('span', btn), was = lab.textContent; lab.textContent = W.copied;
    if (ok) ok.textContent = '';
    clearTimeout(btn._t); btn._t = setTimeout(() => { btn.classList.remove('done'); lab.textContent = was; }, 1800);
  };
  const once = (el, k) => { if (!el || el.dataset[k]) return false; el.dataset[k] = '1'; return true; };
  function init(root = d) {
    /* the film on the first screen */
    const plate = $('.plate', root), fp = plate && $('.player', plate);
    const P = () => fp && fp.ocPlayer;
    if (plate && once(plate, 'bound')) {
      let plateSeen = 1;
      const lights = () => {   // house lights down while the film plays on the wide layout and is mostly on screen
        const p = P(), on = !!p && p.state === 'playing' && wide.matches && plateSeen > .55 && plate.isConnected;
        H.classList.toggle('dim', on);
        if (!on) H.classList.remove('ctl');
      };
      if (fp) {
        fp.addEventListener('oc:state', lights);
        fp.addEventListener('oc:idle', e => H.classList.toggle('ctl', !e.detail.idle));
        if ('IntersectionObserver' in window) new IntersectionObserver(es => { plateSeen = es[0].intersectionRatio; lights(); }, { threshold: [0, .3, .55, .8, 1] }).observe(plate);
        wide.addEventListener && wide.addEventListener('change', lights);
      }
      const playFilm = t => {
        const p = P();
        if (!p) { const v = fp && $('video', fp); if (v) { if (t != null) v.currentTime = t; v.play(); } return; }
        if (t != null) p.seek(t, true); else p.play();
      };
      // the label fades while the film plays, so the focus moves to the player's own play button (Space then pauses)
      for (const b of $$('[data-play]', plate)) b.addEventListener('click', () => { playFilm(); const p = P(); if (p) p.bPlay.focus({ preventScroll: true }); });
      const sheet = plate.parentNode && $('.sheet', plate.parentNode);
      for (const b of sheet ? $$('.stills [data-seek]', sheet) : []) b.addEventListener('click', () => {
        const t = +b.dataset.seek;
        plate.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
        playFilm(t);
      });
    }

    /* the sentence to say to your agent */
    const say = $('.say', root);
    if (say && once(say, 'bound')) {
      const input = $('input', say), btn = $('[data-say]', say), ok = $('.ok', say);
      const sentence = () => say.dataset.tpl.replace('{style}', say.dataset.style).replace('{topic}', input.value.trim() || say.dataset.slot);
      btn.addEventListener('click', () => copyText(sentence(), btn, ok));
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); copyText(sentence(), btn, ok); } });
      if (!CSS.supports || !CSS.supports('field-sizing', 'content')) {   // the blank grows with what is typed (where CSS can't do it)
        const fit = () => { input.style.width = Math.max(9, (input.value || input.placeholder).length * (ZH ? 1.05 : .52) + 1) + 'em'; };
        input.addEventListener('input', fit); fit();
      }
    }
    for (const b of $$('.cmd [data-copy]', root)) if (once(b, 'bound')) b.addEventListener('click', () => copyText($$('code span', b.parentNode).map(s => s.textContent).join('\n'), b));

    /* install tabs (arrow keys move between them) */
    const tabs = $$('[role="tab"]', root);
    const pick = t => { for (const x of tabs) { const on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; d.getElementById(x.getAttribute('aria-controls')).hidden = !on; } };
    for (const t of tabs) {
      if (!once(t, 'bound')) continue;
      t.addEventListener('click', () => pick(t));
      t.addEventListener('keydown', e => {
        const i = tabs.indexOf(t), j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -9;
        if (j === -9) return; e.preventDefault(); const n = tabs[(j + tabs.length) % tabs.length]; pick(n); n.focus();
      });
    }
  }
  init();
  window.OCPage = { init };
  // a style page runs on into the home page's bench: app.js runs its search, card clips and long take
  const RUNON = H.classList.contains('runon');

  /* ---------------------------------------------------------------- hover: a card's short clip (the home page's) */
  if (!RUNON && mouse.matches && !reduce.matches && !(navigator.connection && navigator.connection.saveData)) {
    let timer = 0;
    d.addEventListener('pointerover', e => {
      const card = e.target.closest('.card'); if (!card || card.contains(e.relatedTarget)) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        const pic = $('.pic', card); let v = $('video', pic);
        if (!v) { v = Object.assign(d.createElement('video'), { muted: true, loop: true, playsInline: true, preload: 'auto' }); v.setAttribute('playsinline', ''); pic.appendChild(v); }
        v.src = PG.clip + card.dataset.slug + '.mp4';
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

  /* ================================================================ search: the home page's dialog; a style opens its page, a station the bench */
  const find = $('#find'), qin = $('#q'), res = $('#res');
  if (!find || RUNON) return;
  const norm = s => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[\s·・\-–—_:：,，.。!！?？'’"“”《》()（）&/]/g, '');
  let ROWS = null, CATS = [], hits = [], sel = 0;
  const load = () => ROWS ? Promise.resolve() : fetch(PG.idx).then(r => r.json()).then(j => {
    ROWS = j.rows.map(r => ({ slug: r[0], num: r[1], cat: r[2], cn: r[3], en: r[4], film: r[5], filmCn: r[6], uses: r[7], isNew: r[8], dur: r[9],
      k: [norm(r[3]), norm(r[4]), norm(r[5]), norm(r[6]), norm(r[0]), norm(r[7])] }));
    CATS = Object.entries(j.cats).map(([n, [cn, en]]) => ({ n: +n, cn, en, k: [norm(cn), norm(en)] }));
  }).catch(() => { ROWS = []; });
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
    const i = norm(text).indexOf(q); if (i < 0) return esc(text);
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
        return `<li role="option" id="o${i}"><span class="th stn">${pad2(c.n)}</span><span class="tx"><span class="a"><b>${hl(nm, q)}</b><em>${esc(alt)}</em></span>`
          + `<span class="b">${esc(W.search_go)}</span></span><span class="c">${esc(W.search_station)}<b>${pad2(c.n)} · ${n}</b></span></li>`;
      }
      const r = h.r, nm = ZH ? r.cn : r.en, alt = ZH ? r.en : '', film = ZH ? `《${r.filmCn}》` : r.film;
      return `<li role="option" id="o${i}"><span class="th" style="background-image:url('${PG.thumb}${r.slug}-480.webp')">${r.isNew ? `<i class="new">${esc(W.new)}</i>` : ''}</span><span class="tx">`
        + `<span class="a"><b>${hl(nm, q)}</b>${alt ? `<em>${hl(alt, q)}</em>` : ''}</span><span class="b">${hl(film, q)}</span></span>`
        + `<span class="c">No.${pad2(r.num)}<b>${pad2(r.cat)} · ${r.dur}</b></span></li>`;
    }).join('');
    mark();
  }
  function mark() {
    $$('li[role="option"]', res).forEach((li, i) => li.setAttribute('aria-selected', i === sel ? 'true' : 'false'));
    const li = $(`#o${sel}`, res); if (li) { li.scrollIntoView({ block: 'nearest' }); qin.setAttribute('aria-activedescendant', li.id); }
  }
  function choose(i) {
    const h = hits[i]; if (!h) return;
    location.href = h.st ? `${PG.home}#s${pad2(h.st.n)}` : page(h.r.slug);
  }
  function openFind(q = '') {
    if (find.open) { qin.value = q; render(); return; }
    find.showModal(); qin.value = q; qin.focus();
    res.innerHTML = ''; load().then(render);
  }
  $('.top .search').addEventListener('click', () => openFind());
  for (const b of $$('[data-find]')) b.addEventListener('click', () => openFind());
  qin.addEventListener('input', () => { if (ROWS) render(); });
  qin.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); find.close(); return; }   // a search field would only clear itself
    if (e.key === 'ArrowDown') { sel = Math.min(hits.length - 1, sel + 1); mark(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); mark(); e.preventDefault(); }
    else if (e.key === 'Enter') { choose(sel); e.preventDefault(); }
  });
  res.addEventListener('pointermove', e => { const li = e.target.closest('li[role="option"]'); if (!li || !li.id) return; const i = +li.id.slice(1); if (i !== sel) { sel = i; mark(); } });
  res.addEventListener('click', e => { const li = e.target.closest('li[role="option"]'); if (li && li.id) choose(+li.id.slice(1)); });
  find.addEventListener('click', e => { if (e.target === find) find.close(); });
  d.addEventListener('keydown', e => {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;
    e.preventDefault(); openFind();
  });
})();
