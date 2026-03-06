(() => {
  const DATA_URL = 'data/events.json';
  const grid = document.getElementById('eventsGrid');
  const modeButtons = Array.from(document.querySelectorAll('#wtModes .wtModeBtn'));
  const heroOverlay = document.getElementById('heroOverlay');
  const heroCard = heroOverlay ? heroOverlay.querySelector('.heroCard') : null;

  if (!grid || !heroOverlay || !heroCard) {
    console.error('[past] missing required DOM nodes', { grid, heroOverlay, heroCard });
    return;
  }

  const topBar = document.querySelector('.topBar');
  if (topBar) {
    topBar.addEventListener('contextmenu', (e) => e.preventDefault(), { capture: true });
    topBar.addEventListener('selectstart', (e) => e.preventDefault(), { capture: true });
    topBar.addEventListener('dragstart', (e) => e.preventDefault(), { capture: true });
  }

  function parseDate(s) {
    const [y, m, d] = String(s || '').split('-').map(Number);
    return new Date(y || 1970, (m || 1) - 1, d || 1, 12, 0, 0);
  }

  function getPosterImgRect(posterEl) {
    if (!posterEl) return null;
    const img = posterEl.querySelector('img');
    if (!img) return null;
    const r = img.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  }

  function scrollToFirstPoster() {
    const first = grid.querySelector('.poster');
    if (!first) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const bar = document.querySelector('.topBar');
    const barH = bar ? bar.getBoundingClientRect().height : 0;
    const y = window.scrollY + first.getBoundingClientRect().top - (barH + 12);
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }

  let items = [];
  let currentMode = 'date';

  function updateActiveMode(mode) {
    modeButtons.forEach(btn => btn.classList.toggle('isActive', btn.dataset.mode === mode));
  }

  function setPosterLinksEnabled(enabled) {
    const posters = Array.from(grid.querySelectorAll('.poster'));
    posters.forEach(p => {
      if (p.tagName !== 'A') return;
      if (enabled) {
        if (p.dataset.realHref) {
          p.setAttribute('href', p.dataset.realHref);
          delete p.dataset.realHref;
        }
      } else {
        const h = p.getAttribute('href');
        if (h) p.dataset.realHref = h;
        p.removeAttribute('href');
      }
    });
  }

  function shufflePosters() {
    const posters = Array.from(grid.querySelectorAll('.poster'));
    for (let i = posters.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      grid.insertBefore(posters[j], posters[i]);
      [posters[i], posters[j]] = [posters[j], posters[i]];
    }
  }

  function randomizeVars() {
    Array.from(grid.querySelectorAll('.poster')).forEach((el) => {
      const tx  = (Math.random() * 2 - 1) * 1;
      const ty  = (Math.random() * 2 - 1) * 1;
      const rot = (Math.random() * 2 - 1) * 2;
      const scl = 0.99 + Math.random() * 0.05;
      const z   = 1 + Math.round(Math.random() * 1);
      el.style.setProperty('--tx', tx.toFixed(1) + 'px');
      el.style.setProperty('--ty', ty.toFixed(1) + 'px');
      el.style.setProperty('--rot', rot.toFixed(2) + 'deg');
      el.style.setProperty('--scl', scl.toFixed(3));
      el.style.setProperty('--z', z);
    });
  }

  function applyTiltVarsDateMode() {
    const posters = Array.from(grid.querySelectorAll('.poster'));
    posters.forEach((el, i) => {
      const seed = Number(el.dataset.key) || (i + 1);
      const r = (Math.sin(seed * 12.9898) * 43758.5453);
      const u = r - Math.floor(r);
      const rot = (u * 2 - 1) * 0.28;
      el.style.setProperty('--tx', '0px');
      el.style.setProperty('--ty', '0px');
      el.style.setProperty('--rot', rot.toFixed(2) + 'deg');
      el.style.setProperty('--scl', '1');
      el.style.setProperty('--z', '1');
    });
  }

  function clearRandomVars() {
    Array.from(grid.querySelectorAll('.poster')).forEach(el => {
      el.style.removeProperty('--tx');
      el.style.removeProperty('--ty');
      el.style.removeProperty('--rot');
      el.style.removeProperty('--scl');
      el.style.removeProperty('--z');
    });
  }

  function restoreOrder() {
    const posters = Array.from(grid.querySelectorAll('.poster'));
    const map = new Map();
    posters.forEach(p => map.set(Number(p.dataset.key), p));
    grid.innerHTML = '';
    items.forEach((_, idx) => {
      const el = map.get(idx);
      if (el) grid.appendChild(el);
    });
  }

  function setMode(mode) {
    if (mode === currentMode) {
      if (mode === 'random') { shufflePosters(); randomizeVars(); }
      if (mode === 'date') { restoreOrder(); applyTiltVarsDateMode(); scrollToFirstPoster(); }
      return;
    }
    currentMode = mode;
    grid.classList.toggle('randomMode', mode === 'random');
    updateActiveMode(mode);
    setPosterLinksEnabled(mode !== 'random');
    if (mode === 'random') {
      shufflePosters();
      randomizeVars();
    } else {
      clearRandomVars();
      restoreOrder();
      applyTiltVarsDateMode();
      scrollToFirstPoster();
    }
  }

  let heroOpen = false;
  let heroPosterEl = null;
  let heroJustOpenedAt = 0;

  function openHero(posterEl) {
    if (heroOpen) return;
    const img = posterEl.querySelector('img');
    if (!img) return;
    heroPosterEl = posterEl;
    const from = getPosterImgRect(posterEl);
    if (!from) return;

    heroOverlay.classList.add('isOpen');
    heroOverlay.setAttribute('aria-hidden', 'false');
    heroOpen = true;
    heroJustOpenedAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

    heroCard.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'rollWrap';
    const hi = document.createElement('img');
    hi.alt = img.alt || '';
    hi.src = img.currentSrc || img.src;
    wrap.appendChild(hi);
    heroCard.appendChild(wrap);

    heroCard.style.inset = 'auto';
    heroCard.style.right = 'auto';
    heroCard.style.bottom = 'auto';
    heroCard.style.transition = 'none';
    heroCard.style.left = from.left + 'px';
    heroCard.style.top = from.top + 'px';
    heroCard.style.width = from.width + 'px';
    heroCard.style.height = from.height + 'px';

    heroCard.classList.remove('rollingUp');
    heroCard.classList.add('unrolling');
    setTimeout(() => heroCard.classList.remove('unrolling'), 560);
    requestAnimationFrame(() => recenterHeroCard(false));
  }

  function closeHero() {
    if (!heroOpen) return;
    const to = getPosterImgRect(heroPosterEl);
    if (!to) {
      heroOpen = false;
      heroOverlay.classList.remove('isOpen');
      heroOverlay.setAttribute('aria-hidden', 'true');
      heroCard.innerHTML = '';
      heroPosterEl = null;
      heroJustOpenedAt = 0;
      return;
    }
    heroCard.classList.remove('unrolling');
    heroCard.classList.add('rollingUp');
    heroCard.style.transition = 'all 280ms cubic-bezier(.2,.8,.2,1)';
    heroCard.style.left = to.left + 'px';
    heroCard.style.top = to.top + 'px';
    heroCard.style.width = to.width + 'px';
    heroCard.style.height = to.height + 'px';
    setTimeout(() => {
      heroOpen = false;
      heroOverlay.classList.remove('isOpen');
      heroOverlay.setAttribute('aria-hidden', 'true');
      heroCard.classList.remove('rollingUp');
      heroCard.innerHTML = '';
      heroCard.style.transition = '';
      heroPosterEl = null;
      heroJustOpenedAt = 0;
    }, 300);
  }

  function recenterHeroCard(noTransition) {
    try {
      if (!heroOpen || !heroCard) return;
      const hi = heroCard.querySelector('img');
      if (!hi) return;

      const vv = window.visualViewport;
      const vw = vv ? vv.width : window.innerWidth;
      const vh = vv ? vv.height : window.innerHeight;
      const offL = vv ? vv.offsetLeft : 0;
      const offT = vv ? vv.offsetTop : 0;
      const maxW = Math.min(vw - 32, 980);
      const maxH = Math.min(vh - 96, 900);
      const natW = hi.naturalWidth || 1200;
      const natH = hi.naturalHeight || 1600;
      const scale = Math.min(maxW / natW, maxH / natH, 1.0);
      const tW = Math.max(240, Math.round(natW * scale));
      const tH = Math.max(240, Math.round(natH * scale));
      const tL = Math.round(offL + (vw - tW) / 2);
      const tT = Math.round(offT + (vh - tH) / 2);

      heroCard.style.inset = 'auto';
      heroCard.style.right = 'auto';
      heroCard.style.bottom = 'auto';
      heroCard.style.transition = noTransition ? 'none' : 'all 360ms cubic-bezier(.2,.85,.2,1)';
      heroCard.style.left = tL + 'px';
      heroCard.style.top = tT + 'px';
      heroCard.style.width = tW + 'px';
      heroCard.style.height = tH + 'px';
      if (noTransition) requestAnimationFrame(() => { heroCard.style.transition = ''; });
    } catch (_e) {}
  }

  let _heroResizeRaf = 0;
  function scheduleHeroRecenter() {
    if (!_heroResizeRaf) {
      _heroResizeRaf = requestAnimationFrame(() => {
        _heroResizeRaf = 0;
        recenterHeroCard(true);
      });
    }
  }

  window.addEventListener('resize', scheduleHeroRecenter, { passive: true });
  window.addEventListener('orientationchange', () => {
    scheduleHeroRecenter();
    setTimeout(scheduleHeroRecenter, 60);
    setTimeout(scheduleHeroRecenter, 180);
  }, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleHeroRecenter, { passive: true });
    window.visualViewport.addEventListener('scroll', scheduleHeroRecenter, { passive: true });
  }

  heroOverlay.addEventListener('click', () => {
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    if (heroJustOpenedAt && (now - heroJustOpenedAt) < 380) return;
    closeHero();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeHero(); });

  function handlePosterActivate(ev) {
    const a = ev.target && ev.target.closest ? ev.target.closest('.poster') : null;
    if (!a) return;
    if (!grid.classList.contains('randomMode')) return;
    if (ev.cancelable) ev.preventDefault();
    ev.stopPropagation();
    openHero(a);
  }

  let lastPointerUpAt = 0;
  grid.addEventListener('pointerup', (ev) => {
    lastPointerUpAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    handlePosterActivate(ev);
  }, { passive: false });

  grid.addEventListener('click', (ev) => {
    if (grid.classList.contains('randomMode')) {
      const a = ev.target && ev.target.closest ? ev.target.closest('.poster') : null;
      if (a) {
        if (ev.cancelable) ev.preventDefault();
        ev.stopPropagation();
      }
    }
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    if (now - lastPointerUpAt < 450) return;
    handlePosterActivate(ev);
  }, { passive: false });

  function makePoster(item, idx) {
    const a = document.createElement('a');
    a.className = 'poster';
    a.dataset.key = String(idx);
    a.href = item.link || item.href || '#';
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = item.image || item.img || item.poster || '';
    img.alt = item.title || '';
    a.appendChild(img);
    return a;
  }

  async function init() {
    const res = await fetch(DATA_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load ' + DATA_URL);
    const raw = await res.json();
    const arr = Array.isArray(raw) ? raw : (raw.events || raw.items || []);
    items = arr.map(it => ({ ...it, _date: parseDate(it.date || it.when || it.day) }))
      .sort((a, b) => b._date - a._date);

    grid.innerHTML = '';
    items.forEach((it, idx) => grid.appendChild(makePoster(it, idx)));
    modeButtons.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));

    updateActiveMode('date');
    setPosterLinksEnabled(true);
    clearRandomVars();
    applyTiltVarsDateMode();
    scrollToFirstPoster();
  }

  init().catch(err => {
    console.error(err);
    grid.innerHTML = '<div class="err">' + String(err.message || err) + '</div>';
  });
})();
