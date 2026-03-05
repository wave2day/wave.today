
(() => {
  // ===== CONFIG =====
  const DATA_URL = 'data/events.json';

  // ===== DOM =====
  const grid = document.getElementById('eventsGrid');
  const ambient = document.getElementById('ambientBg');
  const ambientGlow = document.getElementById('ambientGlow');
  const ambientPoster = document.getElementById('ambientPoster');

  const modeButtons = Array.from(document.querySelectorAll('#wtModes .wtModeBtn'));

  const heroOverlay = document.getElementById('heroOverlay');
  const heroCard = heroOverlay ? heroOverlay.querySelector('.heroCard') : null;

  if (!grid || !ambient || !ambientGlow || !ambientPoster || !heroOverlay || !heroCard) {
    console.error('[past] missing required DOM nodes', { grid, ambient, ambientGlow, ambientPoster, heroOverlay, heroCard });
    return;
  }

  // Block long-press menu only on topBar
  const topBar = document.querySelector('.topBar');
  if (topBar) {
    topBar.addEventListener('contextmenu', (e) => e.preventDefault(), { capture: true });
    topBar.addEventListener('selectstart', (e) => e.preventDefault(), { capture: true });
    topBar.addEventListener('dragstart', (e) => e.preventDefault(), { capture: true });
  }

  // ===== HELPERS =====
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function parseDate(s) {
    const [y, m, d] = String(s || '').split('-').map(Number);
    return new Date(y || 1970, (m || 1) - 1, d || 1, 12, 0, 0);
  }

  // IMPORTANT: rect MUST be taken from the same element that has transforms applied.
  // In this solution transforms are applied to IMG (not .poster, not #eventsGrid).
  function getPosterImgRect(posterEl) {
    if (!posterEl) return null;
    const img = posterEl.querySelector('img');
    if (!img) return null;
    const r = img.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  }

  // DATE: jump to newest (first poster)
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

  // ===== AMBIENT (smooth tween) =====
  let ambCurrent = { r: 145, g: 85, b: 255 };
  let ambTarget = { r: 145, g: 85, b: 255 };
  let ambRAF = 0;

  function applyAmbient() {
    const r = Math.round(ambCurrent.r);
    const g = Math.round(ambCurrent.g);
    const b = Math.round(ambCurrent.b);

    ambient.style.setProperty('--ambR', r);
    ambient.style.setProperty('--ambG', g);
    ambient.style.setProperty('--ambB', b);

    ambientGlow.style.background =
      `radial-gradient(circle at 50% 42%, rgba(${r},${g},${b},.38), transparent 58%)`;
  }

  function tickAmbient() {
    ambCurrent.r += (ambTarget.r - ambCurrent.r) * 0.10;
    ambCurrent.g += (ambTarget.g - ambCurrent.g) * 0.10;
    ambCurrent.b += (ambTarget.b - ambCurrent.b) * 0.10;

    applyAmbient();

    const dr = Math.abs(ambTarget.r - ambCurrent.r);
    const dg = Math.abs(ambTarget.g - ambCurrent.g);
    const db = Math.abs(ambTarget.b - ambCurrent.b);
    if (dr + dg + db > 0.8) {
      ambRAF = requestAnimationFrame(tickAmbient);
    } else {
      ambRAF = 0;
    }
  }

  function setAmbientTarget(rgb) {
    ambTarget = {
      r: clamp(rgb.r, 0, 255),
      g: clamp(rgb.g, 0, 255),
      b: clamp(rgb.b, 0, 255),
    };
    if (!ambRAF) ambRAF = requestAnimationFrame(tickAmbient);
  }

  async function getAvgRGB(imgUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          const ctx = c.getContext('2d', { willReadFrequently: true });
          const w = 32, h = 32;
          c.width = w; c.height = h;
          ctx.drawImage(img, 0, 0, w, h);
          const data = ctx.getImageData(0, 0, w, h).data;
          let r = 0, g = 0, b = 0, n = 0;
          for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3];
            if (a < 32) continue;
            r += data[i]; g += data[i + 1]; b += data[i + 2];
            n++;
          }
          if (!n) return resolve({ r: 145, g: 85, b: 255 });
          resolve({ r: r / n, g: g / n, b: b / n });
        } catch (_e) {
          resolve({ r: 145, g: 85, b: 255 });
        }
      };
      img.onerror = () => resolve({ r: 145, g: 85, b: 255 });
      img.src = imgUrl;
    });
  }

  async function setAmbientFromImg(src) {
    if (!src) return;
    ambientPoster.style.backgroundImage = `url('${src}')`;
    const rgb = await getAvgRGB(src);
    setAmbientTarget(rgb);
  }

  // ===== DATA / MODES =====
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

  // === RANDOM ORDER ===
  function shufflePosters() {
    const posters = Array.from(grid.querySelectorAll('.poster'));
    for (let i = posters.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      grid.insertBefore(posters[j], posters[i]);
      [posters[i], posters[j]] = [posters[j], posters[i]];
    }
  }

  // Small seeded noise (stable-ish per poster) to avoid "all bulge the same side"
  function seeded01(seed) {
    const r = Math.sin(seed * 12.9898) * 43758.5453;
    return r - Math.floor(r);
  }

  // === RANDOM LAYOUT (alive but NOT stupid) ===
  // Key goals:
  // - no 15° nonsense
  // - avoid monotone same-direction bulge
  // - allow overlap (via z + negative margins in CSS)
  function randomizeVars() {
    const posters = Array.from(grid.querySelectorAll('.poster'));
    posters.forEach((el, i) => {
      const key = Number(el.dataset.key) || (i + 1);

      // base alternating sign but with extra wobble to break symmetry
      const sA = (i % 2 === 0) ? 1 : -1;
      const sB = (Math.floor(i / 2) % 2 === 0) ? 1 : -1;

      const u1 = seeded01(key * 3.1 + 17);
      const u2 = seeded01(key * 7.7 + 41);
      const u3 = seeded01(key * 11.9 + 9);

      // translate (px): enough to create life + occasional overlap, not chaos
      const tx = (u1 * 2 - 1) * 18 + sB * 4;          // ~ -22..+22
      const ty = (u2 * 2 - 1) * 26 + sA * 6;          // ~ -32..+32

      // rotation (deg): typically around 0.6..1.7 with alternating sign + jitter
      const rotMag = 0.55 + u3 * 1.15;                // 0.55..1.70
      const rotJit = (seeded01(key * 5.3 + 101) * 2 - 1) * 0.35; // -0.35..+0.35
      const rot = (sA * rotMag) + rotJit;             // ~ -2.05..+2.05

      // scale: tiny, not "zoom party"
      const scl = 0.992 + seeded01(key * 2.9 + 33) * 0.05; // 0.992..1.042

      // z: correlate with ty a bit so overlaps look intentional
      const z = 1 + clamp(Math.round((ty + 40) / 20), 0, 5); // 1..6

      el.style.setProperty('--tx', tx.toFixed(1) + 'px');
      el.style.setProperty('--ty', ty.toFixed(1) + 'px');
      el.style.setProperty('--rot', rot.toFixed(2) + 'deg');
      el.style.setProperty('--scl', scl.toFixed(3));
      el.style.setProperty('--z', String(z));
    });
  }

  // DATE: subtle deterministic tilt (very small)
  function applyTiltVarsDateMode() {
    const posters = Array.from(grid.querySelectorAll('.poster'));
    posters.forEach((el, i) => {
      const seed = Number(el.dataset.key) || (i + 1);
      const u = seeded01(seed * 9.17 + 13);
      const rot = (u * 2 - 1) * 0.28; // about -0.28..+0.28
      el.style.setProperty('--tx', '0px');
      el.style.setProperty('--ty', '0px');
      el.style.setProperty('--rot', rot.toFixed(2) + 'deg');
      el.style.setProperty('--scl', '1');
      el.style.setProperty('--z', '1');
    });
  }

  function clearVars() {
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
      if (mode === 'date') { restoreOrder(); scrollToFirstPoster(); }
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
      clearVars();
      restoreOrder();
      applyTiltVarsDateMode();
      scrollToFirstPoster();
    }
  }

  // ===== HERO overlay (centered + recenter on rotate) + ROLL BACK INTO TILE =====
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

    document.body.classList.add('heroOpen');

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

    // start EXACTLY at the clicked tile img rect
    heroCard.style.inset = 'auto';
    heroCard.style.right = 'auto';
    heroCard.style.bottom = 'auto';

    heroCard.style.transition = 'none';
    heroCard.style.left = from.left + 'px';
    heroCard.style.top = from.top + 'px';
    heroCard.style.width = from.width + 'px';
    heroCard.style.height = from.height + 'px';

    // CSS "unroll"
    heroCard.classList.remove('rollingUp');
    heroCard.classList.add('unrolling');
    setTimeout(() => heroCard.classList.remove('unrolling'), 560);

    requestAnimationFrame(() => recenterHeroCard(false));
  }

  function closeHero() {
    if (!heroOpen) return;

    // animate back INTO the clicked poster img rect
    const to = getPosterImgRect(heroPosterEl);
    if (!to) {
      heroOpen = false;
      heroOverlay.classList.remove('isOpen');
      heroOverlay.setAttribute('aria-hidden', 'true');
      heroCard.innerHTML = '';
      heroPosterEl = null;
      heroJustOpenedAt = 0;
      document.body.classList.remove('heroOpen');
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
      document.body.classList.remove('heroOpen');
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
    } catch (_e) { /* ignore */ }
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

  // Posters in random mode open hero (href removed)
  function handlePosterActivate(ev) {
    const a = ev.target && ev.target.closest ? ev.target.closest('.poster') : null;
    if (!a) return;

    if (!grid.classList.contains('randomMode')) return;

    if (ev.cancelable) ev.preventDefault();
    ev.stopPropagation();

    openHero(a);
  }

  // pointerup is more reliable on mobile
  let lastPointerUpAt = 0;
  grid.addEventListener('pointerup', (ev) => {
    lastPointerUpAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    handlePosterActivate(ev);
  }, { passive: false });

  // click must always prevent default in random mode
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

  // ===== SCROLL STABILITY CLASS (only random mode) =====
  let _scrollTO = 0;
  function setScrolling(on) {
    if (on) grid.classList.add('isScrolling');
    else grid.classList.remove('isScrolling');
  }
  window.addEventListener('scroll', () => {
    if (!grid.classList.contains('randomMode')) return;
    if (document.body.classList.contains('heroOpen')) return; // do not mess with transforms while hero is open
    setScrolling(true);
    clearTimeout(_scrollTO);
    _scrollTO = setTimeout(() => setScrolling(false), 140);
  }, { passive: true });

  // ===== RENDER =====
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

    // ambient updates on hover/focus
    const prime = () => { if (img.src) setAmbientFromImg(img.src); };
    a.addEventListener('mouseenter', prime);
    a.addEventListener('focus', prime);

    return a;
  }

  async function init() {
    const res = await fetch(DATA_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load ' + DATA_URL);

    const raw = await res.json();
    const arr = Array.isArray(raw) ? raw : (raw.events || raw.items || []);
    items = arr
      .map(it => ({ ...it, _date: parseDate(it.date || it.when || it.day) }))
      .sort((a, b) => b._date - a._date);

    grid.innerHTML = '';
    items.forEach((it, idx) => grid.appendChild(makePoster(it, idx)));

    modeButtons.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));

    // default: date
    updateActiveMode('date');
    setPosterLinksEnabled(true);
    clearVars();
    applyTiltVarsDateMode();
    applyAmbient();

    // initial ambient to first poster
    const firstImg = grid.querySelector('.poster img');
    if (firstImg && firstImg.getAttribute('src')) {
      setAmbientFromImg(firstImg.getAttribute('src'));
    }

    // date: jump to newest on load
    scrollToFirstPoster();

    // soften when leaving the grid
    grid.addEventListener('mouseleave', () => setAmbientTarget({ r: 145, g: 85, b: 255 }));
  }

  init().catch(err => {
    console.error(err);
    grid.innerHTML = '<div class="err">' + String(err.message || err) + '</div>';
  });
})();
