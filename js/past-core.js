
  const DATA_URL = 'data/events.json';

  const grid = document.getElementById('eventsGrid');
  const ambient = document.getElementById('ambientBg');
  const ambientGlow = document.getElementById('ambientGlow');
  const ambientPoster = document.getElementById('ambientPoster');

  const modeButtons = Array.from(document.querySelectorAll('#wtModes .wtModeBtn'));

  // --- helpers
  const clamp = (n,a,b)=> Math.max(a, Math.min(b,n));
  function parseDate(s){
    const [y,m,d] = String(s||'').split('-').map(Number);
    return new Date(y||1970, (m||1)-1, d||1, 12, 0, 0);
  }

  // --- ambient: use averaged color (smoothly), poster image only as very subtle texture
  let ambCurrent = { r:145, g:85, b:255 };
  let ambTarget  = { r:145, g:85, b:255 };
  let ambRAF = 0;

  function applyAmbient(){
    const r = Math.round(ambCurrent.r);
    const g = Math.round(ambCurrent.g);
    const b = Math.round(ambCurrent.b);

    // CSS-var based purple base + poster-derived color.
    ambient.style.setProperty('--ambR', r);
    ambient.style.setProperty('--ambG', g);
    ambient.style.setProperty('--ambB', b);

    ambientGlow.style.background =
      `radial-gradient(circle at 50% 42%, rgba(${r},${g},${b},.38), transparent 58%)`;
  }

  function tickAmbient(){
    // critically damped-ish easing to avoid "skákání"
    ambCurrent.r += (ambTarget.r - ambCurrent.r) * 0.10;
    ambCurrent.g += (ambTarget.g - ambCurrent.g) * 0.10;
    ambCurrent.b += (ambTarget.b - ambCurrent.b) * 0.10;

    applyAmbient();

    const dr = Math.abs(ambTarget.r - ambCurrent.r);
    const dg = Math.abs(ambTarget.g - ambCurrent.g);
    const db = Math.abs(ambTarget.b - ambCurrent.b);
    if (dr + dg + db > 0.8){
      ambRAF = requestAnimationFrame(tickAmbient);
    } else {
      ambRAF = 0;
    }
  }

  function setAmbientTarget(rgb){
    ambTarget = {
      r: clamp(rgb.r, 0, 255),
      g: clamp(rgb.g, 0, 255),
      b: clamp(rgb.b, 0, 255),
    };
    if(!ambRAF) ambRAF = requestAnimationFrame(tickAmbient);
  }

  async function getAverageColor(img){
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d', { willReadFrequently:true });
    const w = 42, h = 42;
    c.width = w; c.height = h;

    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0,0,w,h).data;

    let r=0,g=0,b=0,count=0;
    for(let i=0;i<data.length;i+=4){
      const a = data[i+3];
      if(a < 24) continue;
      r += data[i];
      g += data[i+1];
      b += data[i+2];
      count++;
    }
    if(!count) return {r:145,g:85,b:255};
    return { r: r/count, g: g/count, b: b/count };
  }

  // very subtle poster texture (optional, not "viditelný plakát")
  function setPosterTexture(img){
    const src = img.currentSrc || img.src;
    ambientPoster.style.backgroundImage = `url('${src}')`;
  }

  // --- render
  let items = [];
  let currentMode = 'date';
  let observer = null;

  function posterEl(e, idx){
    const a = document.createElement(e.link ? 'a' : 'div');
    a.className = 'poster';
    a.dataset.key = String(idx);
    if(e.link) {
      a.href = e.link;
      a.target = '_blank';
      a.rel = 'noopener';
      // (no posterCard styling)
      // a.classList.add('posterCard');
    }

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.alt = e.title || '';
    img.src = e.image;

    a.appendChild(img);
    return a;
  }

  function updateActiveMode(mode){
    modeButtons.forEach(btn => {
      const is = btn.dataset.mode === mode;
      btn.classList.toggle('isActive', is);
    });
  }

  function shufflePosters(){
    const posters = Array.from(grid.querySelectorAll('.poster'));
    for(let i = posters.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = posters[i];
      posters[i] = posters[j];
      posters[j] = tmp;
    }
    posters.forEach(p => grid.appendChild(p));
  }

  function randomizeVars(){
    const posters = Array.from(grid.querySelectorAll('.poster'));
    // stronger "plutí" + overlap
    posters.forEach((el, i) => {
      const tx  = (Math.random()*2 - 1) * 14;     // -27..27 (mírnější rozkývání)
      const ty  = (Math.random()*2 - 1) * 22;     // -43..43 (mírnější rozkývání)
      const rot = (Math.random()*2 - 1) * 1.6;    // -3.1..3.1 deg
      const scl = 0.99 + Math.random()*0.05;      // 0.98..1.06 (méně rozdílů)
      const lift= 0;                              // (nepoužíváme layout lift – jen transform)
      const z   = 1 + Math.round(Math.random()*3);  // 1..7 (méně překryvů)

      el.style.setProperty('--tx', tx.toFixed(1)+'px');
      el.style.setProperty('--ty', ty.toFixed(1)+'px');
      el.style.setProperty('--rot', rot.toFixed(2)+'deg');
      el.style.setProperty('--scl', scl.toFixed(3));
      el.style.setProperty('--lift', lift+'px');
      el.style.setProperty('--z', z);
    });
  }

  function clearRandomVars(){
    const posters = Array.from(grid.querySelectorAll('.poster'));
    posters.forEach(el => {
      el.style.removeProperty('--tx');
      el.style.removeProperty('--ty');
      el.style.removeProperty('--rot');
      el.style.removeProperty('--scl');
      el.style.removeProperty('--lift');
      el.style.removeProperty('--z');
    });
  }

  function flipAnimate(before){
    const posters = Array.from(grid.querySelectorAll('.poster'));
    posters.forEach(el => {
      const key = el.dataset.key;
      const b = before.get(key);
      if(!b) return;
      const a = el.getBoundingClientRect();
      const dx = b.left - a.left;
      const dy = b.top - a.top;
      if(Math.abs(dx)+Math.abs(dy) < 0.5) return;

      el.style.setProperty('--flipX', dx.toFixed(1)+'px');
      el.style.setProperty('--flipY', dy.toFixed(1)+'px');
      el.style.willChange = 'transform';

      // next frame -> animate to 0
      requestAnimationFrame(() => {
        el.style.setProperty('--flipX', '0px');
        el.style.setProperty('--flipY', '0px');
        // cleanup will-change after transition
        setTimeout(() => { el.style.willChange = ''; }, 650);
      });
    });
  }

  function setMode(mode){
  const posters = Array.from(grid.querySelectorAll('.poster'));
  const before = new Map();
  posters.forEach(el => before.set(el.dataset.key, el.getBoundingClientRect()));

    // allow repeated clicks:
  // - random: reshuffle + re-randomize
  // - date: re-enforce true date order (useful after any DOM churn)
  if(mode === currentMode){
    if(mode === 'random'){
      shufflePosters();
      randomizeVars();
      requestAnimationFrame(() => flipAnimate(before));
    } else {
      // DATE MODE (re-apply)
      clearRandomVars();

      const posters = Array.from(grid.querySelectorAll('.poster'));
      const map = new Map();
      posters.forEach(p => map.set(Number(p.dataset.key), p));

      grid.innerHTML = '';
      items.forEach((_, idx) => {
        const el = map.get(idx);
        if(el) grid.appendChild(el);
      });

      requestAnimationFrame(() => flipAnimate(before));
    }
    return;
  }
currentMode = mode;
  grid.classList.toggle('randomMode', mode === 'random');
  updateActiveMode(mode);

  setPosterLinksEnabled(mode !== 'random');

  if(mode === 'random'){
    shufflePosters();
    randomizeVars();
  }else{
    // DATE MODE – vrátit skutečné pořadí podle data
    clearRandomVars();

    // znovu připojit postery podle pořadí v items
    const posters = Array.from(grid.querySelectorAll('.poster'));
    const map = new Map();
    posters.forEach(p => map.set(Number(p.dataset.key), p));

    grid.innerHTML = '';
    items.forEach((_, idx) => {
      const el = map.get(idx);
      if(el) grid.appendChild(el);
    });
  }

  requestAnimationFrame(() => flipAnimate(before));
}

  function setPosterLinksEnabled(enabled){
    // enabled=true: plakáty jsou normální odkazy (date mód)
    // enabled=false: v random módu odstraníme href, aby prohlížeč nikdy neskákal na # ani neotevíral link
    const posters = Array.from(grid.querySelectorAll('.poster'));
    posters.forEach(p => {
      if(p.tagName !== 'A') return;
      if(enabled){
        if(p.dataset.realHref){
          p.setAttribute('href', p.dataset.realHref);
          delete p.dataset.realHref;
        }
      }else{
        // ulož původní href a pak ho smaž
        const h = p.getAttribute('href');
        if(h){
          p.dataset.realHref = h;
        }
        p.removeAttribute('href');
      }
    });
  }

  // ===== HERO (odloupnutí plakátu) =====
  const heroOverlay = document.getElementById('heroOverlay');
  const heroCard = heroOverlay ? heroOverlay.querySelector('.heroCard') : null;

  let heroOpen = false;
  let heroFrom = null; // {left,top,width,height,borderRadius}
  let heroSrc = null;
  let heroJustOpenedAt = 0;

  function getPosterFromTarget(t){
    const el = t.closest && t.closest('.poster');
    return el || null;
  }

  function openHero(posterEl){
    if(!heroOverlay || !heroCard) return;
    const img = posterEl.querySelector('img');
    if(!img) return;

    const rect = img.getBoundingClientRect();
    heroFrom = { left: rect.left, top: rect.top, width: rect.width, height: rect.height, r: 18 };
    heroSrc = img.currentSrc || img.src;

    // lock scroll
    document.body.classList.add('heroOpen');
    heroOverlay.classList.add('isOpen');
    heroOverlay.setAttribute('aria-hidden', 'false');
    heroOpen = true;
    // Mobile "ghost click" guard: overlay se může objevit pod prstem a hned dostat klik -> okamžité zavření.
    heroJustOpenedAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

    // Build hero card content (roll/unroll)
    heroCard.innerHTML = '';
    heroCard.classList.remove('unrolling','rollingUp');
    const wrap = document.createElement('div');
    wrap.className = 'rollWrap';
    const hi = document.createElement('img');
    hi.alt = img.alt || '';
    hi.src = heroSrc;
    // init roll state (avoid stuck thin strip on some mobile compositors)
wrap.style.transform = 'scaleY(0.02)';
wrap.style.filter = 'blur(1.6px)';
wrap.appendChild(hi);
    heroCard.appendChild(wrap);
// force reflow so the unroll animation always triggers reliably
void wrap.offsetHeight;


    // Start at original rect
    heroCard.style.left = heroFrom.left + 'px';
    heroCard.style.top = heroFrom.top + 'px';
    heroCard.style.width = heroFrom.width + 'px';
    heroCard.style.height = heroFrom.height + 'px';
    heroCard.style.borderRadius = '0px';

    // Target size
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxW = Math.min(vw - 32, 980);
    const maxH = Math.min(vh - 96, 900);
    const natW = img.naturalWidth || rect.width;
    const natH = img.naturalHeight || rect.height;
    const scale = Math.min(maxW / natW, maxH / natH, 1.0);
    const tW = Math.max(240, Math.round(natW * scale));
    const tH = Math.max(240, Math.round(natH * scale));
    const tL = Math.round((vw - tW) / 2);
    const tT = Math.round((vh - tH) / 2);

    // Animate to center
    heroCard.style.transition = 'none';
    requestAnimationFrame(() => {
      heroCard.style.transition = 'left 360ms cubic-bezier(.2,.85,.2,1), top 360ms cubic-bezier(.2,.85,.2,1), width 360ms cubic-bezier(.2,.85,.2,1), height 360ms cubic-bezier(.2,.85,.2,1), border-radius 360ms ease';
      heroCard.style.left = tL + 'px';
      heroCard.style.top = tT + 'px';
      heroCard.style.width = tW + 'px';
      heroCard.style.height = tH + 'px';
      heroCard.style.borderRadius = '0px';
      // start "odrolování" efekt
      heroCard.classList.remove('rollingUp');
      heroCard.classList.add('unrolling');
    });

    // Optional: shift ambient to selected poster (jemně)
    if(img.complete){
      setPosterTexture(img);
      getAverageColor(img).then(setAmbientTarget).catch(()=>{});
    }
  }

  function closeHero(){
    if(!heroOverlay || !heroCard || !heroOpen || !heroFrom) return;

    // start roll-up immediately
    heroCard.classList.remove('unrolling');
    heroCard.classList.add('rollingUp');

    heroCard.style.transition = 'left 260ms cubic-bezier(.2,.8,.2,1), top 260ms cubic-bezier(.2,.8,.2,1), width 260ms cubic-bezier(.2,.8,.2,1), height 260ms cubic-bezier(.2,.8,.2,1), border-radius 260ms ease';
    heroCard.style.left = heroFrom.left + 'px';
    heroCard.style.top = heroFrom.top + 'px';
    heroCard.style.width = heroFrom.width + 'px';
    heroCard.style.height = heroFrom.height + 'px';
    heroCard.style.borderRadius = '0px';

    window.setTimeout(() => {
      heroOverlay.classList.remove('isOpen');
      heroOverlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('heroOpen');
      heroCard.classList.remove('unrolling','rollingUp');
      heroCard.innerHTML = '';
      heroOpen = false;
      heroFrom = null;
      heroSrc = null;
      heroJustOpenedAt = 0;
    }, 280);
  }

  if(heroOverlay){
    heroOverlay.addEventListener('click', (e) => {
      // ignoruj první klik hned po otevření (touch -> click na mobilu)
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      if(heroJustOpenedAt && (now - heroJustOpenedAt) < 380) return;
      // zavírej klikem na backdrop i na samotný plakát (rychlé toggle)
      const t = e.target;
      const isBackdrop = t && (t.getAttribute && t.getAttribute('data-hero-close') === '1');
      const isCard = t && (t.closest && t.closest('.heroCard'));
      if(isBackdrop || isCard) closeHero();
    });
    window.addEventListener('keydown', (e) => {
      if(e.key === 'Escape') closeHero();
    });
  }


  function setupAmbientObserver(){
    if(observer) observer.disconnect();

    const imgs = Array.from(grid.querySelectorAll('img'));
    if(!imgs.length) return;

    // initial
    imgs[0].addEventListener('load', async () => {
      setPosterTexture(imgs[0]);
      setAmbientTarget(await getAverageColor(imgs[0]));
    }, { once:true });

    // track the image closest to center via intersection ratio
    observer = new IntersectionObserver(async (entries) => {
      const best = entries
        .filter(e => e.isIntersecting)
        .sort((a,b)=> b.intersectionRatio - a.intersectionRatio)[0];
      if(!best) return;

      const img = best.target;
      if(!img.complete) return;

      // subtle texture + smooth color
      setPosterTexture(img);
      const rgb = await getAverageColor(img);
      setAmbientTarget(rgb);
    }, { threshold: [0.35, 0.55, 0.72] });

    imgs.forEach(img => {
      if(img.complete) observer.observe(img);
      else img.addEventListener('load', () => observer.observe(img), { once:true });
    });
  }

  async function init(){
    // fetch json
    const res = await fetch(DATA_URL, { cache:'no-store' });
    if(!res.ok) throw new Error('Nejde načíst '+DATA_URL+' (status '+res.status+')');
    const all = await res.json();

    const today = new Date(); today.setHours(0,0,0,0);
    items = (all||[])
      .filter(e => e && e.date && e.image && parseDate(e.date) < today)
      .sort((a,b)=> parseDate(b.date) - parseDate(a.date));

    if(!items.length){
      grid.innerHTML = '<div class="err">V JSONu nejsou žádné minulé akce.</div>';
      return;
    }

    // render once (stable DOM so FLIP works)
    grid.innerHTML = '';
    items.forEach((e, idx) => grid.appendChild(posterEl(e, idx)));

    // HERO click: jen v režimu random (toggle open/close na stejný plakát)
    // --- poster fullscreen (jen v random režimu) ---
    let lastHeroPointerUpAt = 0;

    function handlePosterActivate(ev){
  // LANDSCAPE (touch): v landscape neotvírat hero
  if (window.matchMedia('(orientation: landscape) and (pointer: coarse)').matches) return;

      const p = getPosterFromTarget(ev.target);
      if(!p) return;

      // jen v random režimu
      if(!grid.classList.contains('randomMode')) return;

      // v random režimu neodcházej pryč – otevři/zaklapni fullscreen
      if(ev.cancelable) ev.preventDefault();
      ev.stopPropagation();

      const img = p.querySelector('img');
      const src = img ? (img.currentSrc || img.src) : null;

      if(heroOpen){
        // klik na stejný plakát -> zavřít, klik na jiný -> přepnout na nový
        if(src && src === heroSrc){
          closeHero();
          return;
        }
      }
      openHero(p);
    }

    // Na mobilech je spolehlivější pointerup než click (a zabrání to i hash-jumpu na #)
    grid.addEventListener('pointerup', (ev) => {
      lastHeroPointerUpAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      handlePosterActivate(ev);
    }, { passive:false });

    // Click musí v random režimu vždy zastavit navigaci (u <a> je default až na click, ne na pointerup).
    // Proto i když click ignorujeme kvůli guardu (pointerup -> click), pořád uděláme preventDefault().
    grid.addEventListener('click', (ev) => {
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

      // když jsme v random režimu a klik je na plakát, vždy stopni default (jinak to skáče na # / otevírá link)
      if(grid.classList.contains('randomMode')){
        const p = getPosterFromTarget(ev.target);
        if(p){
          if(ev.cancelable) ev.preventDefault();
          ev.stopPropagation();
        }
      }

      // guard proti dvojitému vyvolání (pointerup -> click)
      if(now - lastHeroPointerUpAt < 450) return;

      handlePosterActivate(ev);
    }, { passive:false });

    // hook buttons
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    // default mode = date
    updateActiveMode('date');
    clearRandomVars();
    setPosterLinksEnabled(true);

    setupAmbientObserver();
    applyAmbient();
  }

  init().catch(err => {
    grid.innerHTML = '<div class="err">'+String(err.message || err)+'</div>';
  });


/* ===== LANDSCAPE ROTATE: CLOSE HERO IF OPEN =====
   Když je hero otevřený a otočíš do LANDSCAPE (touch), zavři ho.
   Tím zmizí ten problém „plakát vlevo/dole“.
*/
(() => {
  function isLandscapeTouch(){
    return window.matchMedia("(orientation: landscape) and (pointer: coarse)").matches;
  }
  function heroIsOpen(){
    try {
      if (typeof heroOpen !== "undefined") return !!heroOpen;
      const ov = document.getElementById("heroOverlay");
      return ov && ov.getAttribute("aria-hidden") === "false";
    } catch(e) { return false; }
  }
  function closeIfNeeded(){
    try {
      if (!isLandscapeTouch()) return;
      if (!heroIsOpen()) return;
      if (typeof closeHero === "function") closeHero();
    } catch(e) {}
  }
  window.addEventListener("orientationchange", () => setTimeout(closeIfNeeded, 80), { passive:true });
  window.addEventListener("resize", () => setTimeout(closeIfNeeded, 80), { passive:true });
})();
