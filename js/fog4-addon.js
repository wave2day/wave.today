/* fog4-addon.js
   FOG4: mlha ze 4 barev
   - Scroll: mění jen barvy (FOG), NIKDY nepřepisuje #ambientGlow
   - Klik v randomMode: může nastavit #ambientPoster (volitelná stopa)
*/

(() => {

  const grid = document.getElementById("eventsGrid");
  const ambient = document.getElementById("ambientBg");
  const ambientPoster = document.getElementById("ambientPoster");

  if (!grid || !ambient) {
    console.error("[fog4] missing DOM", { grid, ambient });
    return;
  }

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const FOG_N = 4;

  let fogCurrent = Array.from({ length: FOG_N }, () => ({ r: 145, g: 85, b: 255 }));
  let fogTarget  = Array.from({ length: FOG_N }, () => ({ r: 145, g: 85, b: 255 }));
  let raf = 0;

  function setFogVars() {
    for (let i = 0; i < FOG_N; i++) {
      const r = Math.round(fogCurrent[i].r);
      const g = Math.round(fogCurrent[i].g);
      const b = Math.round(fogCurrent[i].b);
      ambient.style.setProperty(`--fog${i + 1}`, `${r},${g},${b}`);
    }
  }

  function applyFog() {
    setFogVars();

    // FOG kreslíme na #ambientBg (past-core.js nepřepisuje backgroundImage tohoto prvku)
    ambient.style.backgroundImage =
      `radial-gradient(circle at 30% 35%, rgba(var(--fog1), .34), transparent 58%),
       radial-gradient(circle at 70% 32%, rgba(var(--fog2), .30), transparent 60%),
       radial-gradient(circle at 42% 72%, rgba(var(--fog3), .26), transparent 62%),
       radial-gradient(circle at 78% 76%, rgba(var(--fog4), .22), transparent 64%)`;
  }

  function tick() {
    for (let i = 0; i < FOG_N; i++) {
      fogCurrent[i].r += (fogTarget[i].r - fogCurrent[i].r) * 0.10;
      fogCurrent[i].g += (fogTarget[i].g - fogCurrent[i].g) * 0.10;
      fogCurrent[i].b += (fogTarget[i].b - fogCurrent[i].b) * 0.10;
    }

    applyFog();

    let d = 0;
    for (let i = 0; i < FOG_N; i++) {
      d += Math.abs(fogTarget[i].r - fogCurrent[i].r);
      d += Math.abs(fogTarget[i].g - fogCurrent[i].g);
      d += Math.abs(fogTarget[i].b - fogCurrent[i].b);
    }

    if (d > 2.0) raf = requestAnimationFrame(tick);
    else raf = 0;
  }

  function setTargets(list) {
    const base = { r: 145, g: 85, b: 255 };
    const L = (list && list.length) ? list : [base];

    for (let i = 0; i < FOG_N; i++) {
      const c = L[i] || L[L.length - 1] || base;
      fogTarget[i] = {
        r: clamp(c.r, 0, 255),
        g: clamp(c.g, 0, 255),
        b: clamp(c.b, 0, 255),
      };
    }

    if (!raf) raf = requestAnimationFrame(tick);
  }

  function getAvgRGB(imgUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          const c = document.createElement("canvas");
          const ctx = c.getContext("2d", { willReadFrequently: true });
          const w = 32, h = 32;
          c.width = w; c.height = h;

          ctx.drawImage(img, 0, 0, w, h);
          const data = ctx.getImageData(0, 0, w, h).data;

          let r = 0, g = 0, b = 0, n = 0;
          for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3];
            if (a < 32) continue;
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
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

  // ===== scroll palette picking =====
  let obs = null;
  let lastEntries = new Map();
  let timer = 0;

  function schedulePick() {
    clearTimeout(timer);
    timer = setTimeout(pick, 220);
  }

  async function pick() {
    const entries = Array.from(lastEntries.values())
      .filter(e => e && e.isIntersecting && e.target)
      .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))
      .slice(0, FOG_N);

    const srcs = entries
      .map(e => {
        const img = e.target;
        return img ? (img.currentSrc || img.src) : null;
      })
      .filter(Boolean);

    if (!srcs.length) return;

    const rgbs = [];
    for (const s of srcs) {
      try { rgbs.push(await getAvgRGB(s)); } catch {}
    }
    if (rgbs.length) setTargets(rgbs);
  }

  function setupObserver() {
    if (obs) { try { obs.disconnect(); } catch {} }
    lastEntries = new Map();

    const imgs = Array.from(grid.querySelectorAll(".poster img"));
    if (!imgs.length) return false;

    obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e && e.target) lastEntries.set(e.target, e); });
      schedulePick();
    }, {
      root: null,
      rootMargin: "220px 0px 220px 0px",
      threshold: [0.18, 0.28, 0.40, 0.55, 0.72]
    });

    imgs.forEach(img => {
      if (img.complete) obs.observe(img);
      else img.addEventListener("load", () => { try { obs.observe(img); } catch {} }, { once: true });
    });

    return true;
  }

  function boot() {
    const hasPosters = grid.querySelector(".poster img");
    if (!hasPosters) return false;
    if (setupObserver()) schedulePick();
    return true;
  }

  // start
  applyFog();

  if (!boot()) {
    setTimeout(boot, 250);
    setTimeout(boot, 700);
    setTimeout(boot, 1400);
  }

  // když se grid přerenderuje / změní DOM
  new MutationObserver(() => boot()).observe(grid, { childList: true, subtree: true });

  // scroll trigger
  window.addEventListener("scroll", schedulePick, { passive: true });

  // volitelně: “stopa plakátu” jen při kliku v randomMode
  grid.addEventListener("click", (ev) => {
    if (!ambientPoster) return;
    const poster = ev.target && ev.target.closest ? ev.target.closest(".poster") : null;
    if (!poster) return;
    if (!grid.classList.contains("randomMode")) return;

    const img = poster.querySelector("img");
    const src = img ? (img.currentSrc || img.src) : null;
    if (!src) return;

    ambientPoster.style.backgroundImage = `url('${src}')`;
  }, { passive: true });

})();
