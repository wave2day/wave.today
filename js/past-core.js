(function(){
      // block long-press menu only on topBar
      const topBar = document.querySelector('.topBar');
      if(topBar){
        topBar.addEventListener('contextmenu', (e)=> e.preventDefault(), {capture:true});
        topBar.addEventListener('selectstart', (e)=> e.preventDefault(), {capture:true});
        topBar.addEventListener('dragstart', (e)=> e.preventDefault(), {capture:true});
      }

      const DATA_URL = 'data/events.json';

      const grid = document.getElementById('eventsGrid');
      const ambient = document.getElementById('ambientBg');
      const ambientGlow = document.getElementById('ambientGlow');
      const ambientPoster = document.getElementById('ambientPoster');

      const modeButtons = Array.from(document.querySelectorAll('#wtModes .wtModeBtn'));

      const heroOverlay = document.getElementById('heroOverlay');
      const heroCard = heroOverlay ? heroOverlay.querySelector('.heroCard') : null;

      if(!grid || !ambient || !ambientGlow || !ambientPoster || !heroOverlay || !heroCard){
        console.error('[past] missing required DOM nodes', {grid, ambient, ambientGlow, ambientPoster, heroOverlay, heroCard});
        return;
      }

      function parseDate(s){
        const [y,m,d] = String(s||'').split('-').map(Number);
        return new Date(y||1970, (m||1)-1, d||1, 12, 0, 0);
      }

      // ===== Ambient color tween =====
      let ambCurrent = { r:145, g:85, b:255 };
      let ambTarget  = { r:145, g:85, b:255 };
      let ambRAF = 0;

      function applyAmbient(){
        const r = Math.round(ambCurrent.r);
        const g = Math.round(ambCurrent.g);
        const b = Math.round(ambCurrent.b);

        ambient.style.setProperty('--ambR', r);
        ambient.style.setProperty('--ambG', g);
        ambient.style.setProperty('--ambB', b);

        ambientGlow.style.background =
          `radial-gradient(circle at 50% 42%, rgba(${r},${g},${b},.38), transparent 58%)`;
      }

      function tickAmbient(){
        ambCurrent.r += (ambTarget.r - ambCurrent.r) * 0.08;
        ambCurrent.g += (ambTarget.g - ambCurrent.g) * 0.08;
        ambCurrent.b += (ambTarget.b - ambCurrent.b) * 0.08;
        applyAmbient();
        ambRAF = requestAnimationFrame(tickAmbient);
      }

      function setAmbientTarget(rgb){
        ambTarget = rgb || { r:145, g:85, b:255 };
        if(!ambRAF) ambRAF = requestAnimationFrame(tickAmbient);
      }

      async function getAvgRGB(imgUrl){
        return new Promise((resolve)=>{
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            try{
              const c = document.createElement('canvas');
              const ctx = c.getContext('2d', { willReadFrequently: true });
              const w = 32, h = 32;
              c.width = w; c.height = h;
              ctx.drawImage(img, 0, 0, w, h);
              const data = ctx.getImageData(0,0,w,h).data;
              let r=0,g=0,b=0,n=0;
              for(let i=0;i<data.length;i+=4){
                const a = data[i+3];
                if(a < 32) continue;
                r += data[i]; g += data[i+1]; b += data[i+2];
                n++;
              }
              if(!n) return resolve({r:145,g:85,b:255});
              resolve({ r: r/n, g: g/n, b: b/n });
            }catch(e){
              resolve({r:145,g:85,b:255});
            }
          };
          img.onerror = ()=> resolve({r:145,g:85,b:255});
          img.src = imgUrl;
        });
      }

      // ===== HERO overlay =====
      let heroOpen = false;

      function openHero(src){
        if(heroOpen) return;
        heroOpen = true;

        heroOverlay.classList.add('isOpen');
        heroOverlay.setAttribute('aria-hidden','false');

        heroCard.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.className = 'rollWrap';

        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        wrap.appendChild(img);
        heroCard.appendChild(wrap);

        heroCard.classList.remove('rollingUp');
        heroCard.classList.add('unrolling');
        setTimeout(()=> heroCard.classList.remove('unrolling'), 560);
      }

      function closeHero(){
        if(!heroOpen) return;

        heroCard.classList.remove('unrolling');
        heroCard.classList.add('rollingUp');

        setTimeout(()=>{
          heroOpen = false;
          heroOverlay.classList.remove('isOpen');
          heroOverlay.setAttribute('aria-hidden','true');
          heroCard.classList.remove('rollingUp');
          heroCard.innerHTML = '';
        }, 280);
      }

      // close by clicking anywhere in overlay (includes poster)
      heroOverlay.addEventListener('click', ()=> closeHero());
      document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeHero(); });

      // ===== Render / modes =====
      let items = [];
      let currentMode = 'date';

      function updateActiveMode(mode){
        modeButtons.forEach(btn => btn.classList.toggle('isActive', btn.dataset.mode === mode));
      }

      function setPosterLinksEnabled(enabled){
        const posters = Array.from(grid.querySelectorAll('.poster'));
        posters.forEach(p => {
          if(p.tagName !== 'A') return;
          if(enabled){
            if(p.dataset.realHref){
              p.setAttribute('href', p.dataset.realHref);
              delete p.dataset.realHref;
            }
          }else{
            const h = p.getAttribute('href');
            if(h) p.dataset.realHref = h;
            p.removeAttribute('href');
          }
        });
      }

      function shufflePosters(){
        const posters = Array.from(grid.querySelectorAll('.poster'));
        for(let i=posters.length-1;i>0;i--){
          const j = (Math.random()*(i+1))|0;
          grid.insertBefore(posters[j], posters[i]);
          [posters[i], posters[j]] = [posters[j], posters[i]];
        }
      }

      function randomizeVars(){
        Array.from(grid.querySelectorAll('.poster')).forEach((el) => {
          const tx  = (Math.random()*2 - 1) * 14;
          const ty  = (Math.random()*2 - 1) * 22;
          const rot = (Math.random()*2 - 1) * 1.6;
          const scl = 0.99 + Math.random()*0.05;
          const z   = 1 + Math.round(Math.random()*3);

          el.style.setProperty('--tx', tx.toFixed(1)+'px');
          el.style.setProperty('--ty', ty.toFixed(1)+'px');
          el.style.setProperty('--rot', rot.toFixed(2)+'deg');
          el.style.setProperty('--scl', scl.toFixed(3));
          el.style.setProperty('--z', z);
        });
      }

      function clearRandomVars(){
        Array.from(grid.querySelectorAll('.poster')).forEach(el => {
          el.style.removeProperty('--tx');
          el.style.removeProperty('--ty');
          el.style.removeProperty('--rot');
          el.style.removeProperty('--scl');
          el.style.removeProperty('--z');
        });
      }

      async function setAmbientFromImg(src){
        if(!src) return;
        ambientPoster.style.backgroundImage = `url('${src}')`;
        const rgb = await getAvgRGB(src);
        setAmbientTarget(rgb);
      }

      function makePoster(item, idx){
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

        // ambient updates on hover/focus always
        const prime = ()=> { if(img.src) setAmbientFromImg(img.src); };
        a.addEventListener('mouseenter', prime);
        a.addEventListener('focus', prime);

        // in random mode posters open hero (href removed)
        function activate(ev){
          if(a.getAttribute('href')) return; // date mode -> normal link
          ev.preventDefault();
          ev.stopPropagation();
          if(img.src) openHero(img.src);
        }
        a.addEventListener('click', activate);
        a.addEventListener('pointerup', (ev)=> activate(ev), { passive:false });

        return a;
      }

      function restoreOrder(){
        const posters = Array.from(grid.querySelectorAll('.poster'));
        const map = new Map();
        posters.forEach(p => map.set(Number(p.dataset.key), p));
        grid.innerHTML = '';
        items.forEach((_, idx) => {
          const el = map.get(idx);
          if(el) grid.appendChild(el);
        });
      }

      function setMode(mode){
        if(mode === currentMode){
          if(mode === 'random'){ shufflePosters(); randomizeVars(); }
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
          clearRandomVars();
          restoreOrder();
        }
      }

      async function init(){
        const res = await fetch(DATA_URL, { cache: 'no-store' });
        if(!res.ok) throw new Error('Failed to load '+DATA_URL);

        const raw = await res.json();
        const arr = Array.isArray(raw) ? raw : (raw.events || raw.items || []);
        items = arr
          .map(it => ({ ...it, _date: parseDate(it.date || it.when || it.day) }))
          .sort((a,b)=> b._date - a._date);

        grid.innerHTML = '';
        items.forEach((it, idx) => grid.appendChild(makePoster(it, idx)));

        // buttons
        modeButtons.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));

        // default: date
        updateActiveMode('date');
        setPosterLinksEnabled(true);
        clearRandomVars();
        applyAmbient();

        // IMPORTANT: ambient should be visible even before first hover
        const firstImg = grid.querySelector('.poster img');
        if(firstImg && firstImg.getAttribute('src')){
          setAmbientFromImg(firstImg.getAttribute('src'));
        }

        // fallback when leaving the grid
        grid.addEventListener('mouseleave', ()=>{
          // keep last poster texture; only soften color back slightly
          setAmbientTarget({r:145,g:85,b:255});
        });
      }

      init().catch(err => {
        console.error(err);
        grid.innerHTML = '<div class="err">'+String(err.message || err)+'</div>';
      });
    })();

(() => {
  const mq = window.matchMedia("(max-width: 768px)");
  let t = null;

  function isRndm(){
    const g = document.getElementById("eventsGrid");
    return !!(g && g.classList.contains("randomMode"));
  }

  function onScroll(){
    if (!mq.matches || !isRndm()) return;
    document.body.classList.add("v21Scrolling");
    clearTimeout(t);
    t = setTimeout(() => document.body.classList.remove("v21Scrolling"), 170);
  }

  window.addEventListener("scroll", onScroll, { passive:true });
})();

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
  // ===== HERO: keep centered on orientation change / resize =====
  // Problém: heroCard dostane při otevření left/top/width/height, ale po otočení telefonu se to nepřepočítá,
  // takže plakát ujede mimo viewport. Navíc CSS používá inset:0, které je v konfliktu s left/top.
  function recenterHeroCard(){
    try{
      if(!heroOpen || !heroCard) return;
      const hi = heroCard.querySelector('img');
      if(!hi) return;

      const vv = window.visualViewport;
      const vw = vv ? vv.width : window.innerWidth;
      const vh = vv ? vv.height : window.innerHeight;
      const offL = vv ? vv.offsetLeft : 0;
      const offT = vv ? vv.offsetTop : 0;

      const maxW = Math.min(vw - 32, 980);
      const maxH = Math.min(vh - 96, 900);

      const natW = hi.naturalWidth || parseFloat(heroCard.style.width) || vw;
      const natH = hi.naturalHeight || parseFloat(heroCard.style.height) || vh;

      const scale = Math.min(maxW / natW, maxH / natH, 1.0);
      const tW = Math.max(240, Math.round(natW * scale));
      const tH = Math.max(240, Math.round(natH * scale));

      const tL = Math.round(offL + (vw - tW) / 2);
      const tT = Math.round(offT + (vh - tH) / 2);

      // zruš konflikt s CSS inset:0
      heroCard.style.inset = 'auto';
      heroCard.style.right = 'auto';
      heroCard.style.bottom = 'auto';

      heroCard.style.transition = 'none';
      heroCard.style.left = tL + 'px';
      heroCard.style.top = tT + 'px';
      heroCard.style.width = tW + 'px';
      heroCard.style.height = tH + 'px';

      // když se viewport hne (adresní řádek), tak ať se to chytí hned
      requestAnimationFrame(()=>{ heroCard.style.transition = ''; });
    }catch(_e){}
  }

  let _heroResizeRaf = 0;
  function scheduleHeroRecenter(){
    if(!_heroResizeRaf){
      _heroResizeRaf = requestAnimationFrame(()=>{
        _heroResizeRaf = 0;
        recenterHeroCard();
      });
    }
  }

  window.addEventListener('resize', scheduleHeroRecenter, { passive:true });
  window.addEventListener('orientationchange', () => {
    // na některých mobilech přijde nejdřív orientationchange a až pak resize; udělej obojí
    scheduleHeroRecenter();
    setTimeout(scheduleHeroRecenter, 60);
    setTimeout(scheduleHeroRecenter, 180);
  }, { passive:true });

  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', scheduleHeroRecenter, { passive:true });
    window.visualViewport.addEventListener('scroll', scheduleHeroRecenter, { passive:true });
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

/* ===== FORCE-2COL controller (no overlay) ===== */
(function(){
  const html = document.documentElement;
  const isTouch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || ('ontouchstart' in window);
  if(isTouch) html.classList.add('isTouch');

  const grid = document.getElementById('eventsGrid');
  if(!grid) return;

  function apply(){
    const on = grid.classList.contains('randomMode');
    grid.classList.toggle('force2col', on && isTouch);
  }

  // Repaint nudge on scroll (helps "half poster disappears")
  let raf=0;
  function nudge(){
    if(!(isTouch && grid.classList.contains('randomMode'))) return;
    grid.classList.add('paintNudge');
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(()=> grid.classList.remove('paintNudge'));
  }

  window.addEventListener('scroll', ()=>{ if(isTouch) nudge(); }, {passive:true});

  // Observe mode changes (date <-> rndm)
  new MutationObserver(apply).observe(grid, {attributes:true, attributeFilter:['class']});
  window.addEventListener('resize', apply, {passive:true});
  window.addEventListener('orientationchange', apply, {passive:true});

  // Initial
  apply();
})();

/* ===== PATCH: DATE button should jump to the first (top) poster =====
   Requirement: when user clicks "date", scroll to the first poster in date order.
   This is intentionally isolated and does not change the existing engine logic.
*/
(() => {
  function scrollToFirstPoster(){
    const grid = document.getElementById('eventsGrid');
    if(!grid) return;
    // only in date mode (i.e., not randomMode)
    if(grid.classList.contains('randomMode')) return;
    const first = grid.querySelector('.poster');
    if(!first) return;
    // scroll the page so the first poster is aligned below the fixed topBar
    const topBar = document.querySelector('.topBar');
    const barH = topBar ? topBar.getBoundingClientRect().height : 0;
    const y = window.scrollY + first.getBoundingClientRect().top - (barH + 12);
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }

  // Run once after initial render (default is date)
  window.addEventListener('load', () => {
    // small delay to ensure posters are rendered
    setTimeout(scrollToFirstPoster, 60);
  });

  // On clicking DATE mode button, jump to first poster
  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('#wtModes .wtModeBtn[data-mode="date"]');
    if(!btn) return;
    setTimeout(scrollToFirstPoster, 60);
  }, { capture: true });
})();

/* ===== PORTRAIT PATCH FROM past-eventsl.html ===== */
(() => {
  const mq = window.matchMedia("(max-width: 768px)");
  let t = null;

  function isRndm(){
    const g = document.getElementById("eventsGrid");
    return !!(g && g.classList.contains("randomMode"));
  }

  function onScroll(){
    if (!mq.matches || !isRndm()) return;
    document.body.classList.add("v21Scrolling");
    clearTimeout(t);
    t = setTimeout(() => document.body.classList.remove("v21Scrolling"), 170);
  }

  window.addEventListener("scroll", onScroll, { passive:true });
})

(() => {
  const mq = window.matchMedia("(max-width: 768px)");
  let t = null;
  function onScroll(){
    if (!mq.matches) return;
    const grid = document.querySelector("#eventsGrid.randomMode");
    if (!grid) return;
    grid.classList.add("isScrolling");
    clearTimeout(t);
    t = setTimeout(() => grid.classList.remove("isScrolling"), 180);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
})

(() => {
  const mq = window.matchMedia("(max-width: 560px) and (orientation: portrait)");
  function grid(){ return document.getElementById("eventsGrid"); }
  function isRndm(){ const g = grid(); return !!(g && g.classList.contains("randomMode")); }

  function apply(){
    if (!mq.matches || !isRndm()) return;
    const g = grid();
    if (!g) return;
    g.querySelectorAll(".poster img").forEach(img => {
      img.loading = "eager";
      img.decoding = "sync"; // prefer full decode over incremental paints
      try { img.fetchPriority = "high"; } catch(e){}
    });
  }

  function hook(){
    apply();
    const g = grid();
    if (g){
      new MutationObserver(apply).observe(g, { attributes:true, attributeFilter:["class"], childList:true, subtree:true });
    }
    mq.addEventListener?.("change", apply);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook, { once:true });
  else hook();
})

(() => {
  const mq = window.matchMedia("(max-width: 560px) and (orientation: portrait)");

  function grid(){ return document.getElementById("eventsGrid"); }
  function isRndm(){ const g = grid(); return !!(g && g.classList.contains("randomMode")); }

  async function decodeImg(img){
    try{
      img.loading = "eager";
      img.decoding = "async";
      if (img.decode) await img.decode();
    }catch(e){}
  }

  function attachObserver(){
    const g = grid();
    if (!g) return;

    const io = new IntersectionObserver(async (entries) => {
      if (!mq.matches || !isRndm()) return;

      for (const e of entries){
        const poster = e.target;

        if (!e.isIntersecting){
          // allow re-trigger next time (but don't hide while leaving)
          poster.classList.remove("rndmReveal");
          continue;
        }

        const img = poster.querySelector("img");
        if (img) await decodeImg(img);

        // show pixels only after decode attempt
        poster.classList.add("rndmImgReady");

        // re-trigger reveal each time it enters
        poster.classList.remove("rndmReveal");
        void poster.offsetWidth;
        poster.classList.add("rndmReveal");
      }
    }, {
      root: null,
      rootMargin: "260px 0px 260px 0px",
      threshold: 0.01
    });

    function observeAll(){
      g.querySelectorAll(".poster").forEach(p => io.observe(p));
    }
    observeAll();

    new MutationObserver(() => observeAll()).observe(g, { childList:true, subtree:true });
    new MutationObserver(() => observeAll()).observe(g, { attributes:true, attributeFilter:["class"] });
  }

  function boot(){
    if (!mq.matches) return;
    attachObserver();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once:true });
  else boot();
})

(() => {
  const isTouch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || ('ontouchstart' in window);
  if (!isTouch) return;

  const grid = document.getElementById('eventsGrid');
  if (!grid) return;

  const mq = window.matchMedia("(orientation: portrait)");

  function active(){
    return mq.matches && grid.classList.contains('randomMode');
  }

  function nudge(){
    const prev = grid.style.transform;
    grid.style.transform = 'translateZ(0)';
    requestAnimationFrame(() => { grid.style.transform = prev || 'none'; });
  }

  let t = 0;
  function onScroll(){
    if (!active()) return;
    clearTimeout(t);
    t = setTimeout(() => {
      document.body.classList.add('v29MicroRepaint');
      nudge();
      setTimeout(() => document.body.classList.remove('v29MicroRepaint'), 120);
    }, 140);
  }

  function sync(){
    if (!active()){
      document.body.classList.remove('v29MicroRepaint');
    } else {
      nudge();
    }
  }

  new MutationObserver(sync).observe(grid, { attributes:true, attributeFilter:['class'] });
  mq.addEventListener?.('change', sync);
  window.addEventListener('orientationchange', sync, { passive:true });
  window.addEventListener('pageshow', sync, { passive:true });
  window.addEventListener('scroll', onScroll, { passive:true });

  sync();
})

(function(){
  const html = document.documentElement;
  const isTouch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || ('ontouchstart' in window);
  if(isTouch) html.classList.add('isTouch');

  const grid = document.getElementById('eventsGrid');
  if(!grid) return;

  function apply(){
    const on = grid.classList.contains('randomMode');
    grid.classList.toggle('force2col', on && isTouch);
  }

  // Repaint nudge on scroll (helps "half poster disappears")
  let raf=0;
  function nudge(){
    if(!(isTouch && grid.classList.contains('randomMode'))) return;
    grid.classList.add('paintNudge');
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(()=> grid.classList.remove('paintNudge'));
  }

  window.addEventListener('scroll', ()=>{ if(isTouch) nudge(); }, {passive:true});

  // Observe mode changes (date <-> rndm)
  new MutationObserver(apply).observe(grid, {attributes:true, attributeFilter:['class']});
  window.addEventListener('resize', apply, {passive:true});
  window.addEventListener('orientationchange', apply, {passive:true});

  // Initial
  apply();
})

/* ===== PORTRAIT STABILITY PATCH (anti díry/půlky při scrollu) ===== */
(() => {
  const mq = window.matchMedia("(max-width: 768px) and (orientation: portrait)");
  let t = null, raf1 = 0, raf2 = 0;

  function tick(){
    if (!mq.matches) return;
    const grid = document.querySelector("#eventsGrid.randomMode");
    if (!grid) return;

    grid.classList.add("isScrolling");
    clearTimeout(t);
    t = setTimeout(() => grid.classList.remove("isScrolling"), 180);

    cancelAnimationFrame(raf1);
    cancelAnimationFrame(raf2);
    raf1 = requestAnimationFrame(() => {
      grid.classList.add("paintNudge");
      raf2 = requestAnimationFrame(() => grid.classList.remove("paintNudge"));
    });
  }

  window.addEventListener("scroll", tick, { passive: true });
  window.addEventListener("orientationchange", () => setTimeout(tick, 60), { passive: true });
  window.addEventListener("resize", () => setTimeout(tick, 60), { passive: true });
})();

/* ===== PORTRAIT IMGREADY FALLBACK (prevents invisible posters) ===== */
(() => {
  const mq = window.matchMedia("(max-width: 768px) and (orientation: portrait)");
  function markReady(){
    if (!mq.matches) return;
    const posters = document.querySelectorAll("#eventsGrid.randomMode .poster");
    posters.forEach(p => {
      const img = p.querySelector("img");
      if (!img) return;
      // If image is already available, force reveal
      if (img.complete) p.classList.add("rndmImgReady");
    });
  }
  window.addEventListener("load", () => setTimeout(markReady, 120), { passive: true });
  window.addEventListener("orientationchange", () => setTimeout(markReady, 180), { passive: true });
  window.addEventListener("resize", () => setTimeout(markReady, 180), { passive: true });
  // Also run periodically for a short time (covers async JSON render)
  let n = 0;
  const iv = setInterval(() => {
    markReady();
    n += 1;
    if (n >= 15) clearInterval(iv); // ~3s total
  }, 200);
})();


/* ===== Mobile half-poster repaint fix (no layout/background changes) =====
   Symptom: on some Android Chrome builds + heavy compositing, posters can render "half" / disappear while scrolling,
   even though they exist in DOM. Workaround: force a tiny layer/paint refresh for visible posters on scroll/resize.
   References: multicol/paint bugs often mitigated by translateZ(0) / GPU layer promotion. */
(function(){
  const isMobile = () => window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
  const isPortrait = () => window.matchMedia && window.matchMedia("(orientation: portrait)").matches;
  const prefersFix = () => isMobile() && isPortrait();

  let rafId = 0;
  let scrollEndT = 0;

  function getViewportRect(){
    const vv = window.visualViewport;
    if (vv) return { left: 0, top: 0, right: vv.width, bottom: vv.height, width: vv.width, height: vv.height };
    return { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight, width: window.innerWidth, height: window.innerHeight };
  }

  function inView(el, vp){
    const r = el.getBoundingClientRect();
    // generous margins to catch near-viewport tiles
    const m = 120;
    return (r.bottom >= -m && r.top <= vp.bottom + m && r.right >= -m && r.left <= vp.right + m);
  }

  function forceRepaintVisiblePosters(){
    if (!prefersFix()) return;
    const grid = document.getElementById("eventsGrid");
    if (!grid) return;

    // Inject minimal CSS once (no file edits needed)
    if (!document.getElementById("rpFixStyle")){
      const st = document.createElement("style");
      st.id = "rpFixStyle";
      st.textContent = `
        /* Force compositor re-paint without visible change */
        #eventsGrid[data-rp="1"]{ transform: translateZ(0); }
        #eventsGrid[data-rp="0"]{ transform: translateZ(0.01px); }
        #eventsGrid[data-rp] .poster{ backface-visibility: hidden; transform-style: preserve-3d; }
        #eventsGrid[data-rp] img{ backface-visibility: hidden; }
      `;
      document.head.appendChild(st);
    }

    // 1) Force a grid-level repaint (this is the "whole page refresh" effect you described)
    try{
      const cur = grid.getAttribute("data-rp") === "1" ? "1" : "0";
      const next = cur === "1" ? "0" : "1";
      grid.setAttribute("data-rp", next);

      // Also toggle an inline 3D transform to force compositor repaint on some Android builds
      grid.style.webkitTransform = (next === "1") ? "translate3d(0,0,0)" : "translate3d(0,0.1px,0)";
      grid.style.transform = grid.style.webkitTransform;
      void grid.offsetHeight;


      // Nudge multicol layout to repaint as well (no visual difference)
      const gap = window.getComputedStyle(grid).columnGap || "";
      if (gap){
        grid.style.columnGap = gap;
        // force style flush
        void grid.offsetHeight;
        grid.style.columnGap = gap;
      } else {
        void grid.offsetHeight;
      }
    } catch(e){}

    // 2) Also repaint visible posters (cheaper than repainting all)
    const vp = getViewportRect();
    const posters = grid.querySelectorAll(".poster");
    posters.forEach((p) => {
      if (!inView(p, vp)) return;
      const prev = p.style.transform;
      const prevWC = p.style.willChange;

      p.style.willChange = "transform";
      // toggle between two transforms to force repaint; keep any existing rotate set elsewhere
      p.style.transform = (prev && prev.includes("translateZ")) ? prev.replace(/translateZ\([^)]+\)/g, "translateZ(0)") : (prev ? prev + " translateZ(0)" : "translateZ(0)");

      // Force flush
      void p.offsetHeight;

      // restore quickly
      setTimeout(() => {
        p.style.willChange = prevWC || "";
        p.style.transform = prev || "";
      }, 0);
    });
  }

  function scheduleFix(){
    if (!prefersFix()) return;
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      forceRepaintVisiblePosters();
    });
  }

  function onScroll(){
    if (!prefersFix()) return;
    scheduleFix();
    clearTimeout(scrollEndT);
    scrollEndT = setTimeout(() => {
      // one more pass after scroll settles
      forceRepaintVisiblePosters();
    }, 90);
  }

  // Attach listeners (passive to not block scroll)
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { scheduleFix(); }, { passive: true });
  window.addEventListener("orientationchange", () => { setTimeout(scheduleFix, 50); }, { passive: true });

  if (window.visualViewport){
    window.visualViewport.addEventListener("scroll", onScroll, { passive: true });
    window.visualViewport.addEventListener("resize", () => { scheduleFix(); }, { passive: true });
  }

  // initial pass after content loads
  setTimeout(() => { try { forceRepaintVisiblePosters(); } catch(e){} }, 300);
})()
