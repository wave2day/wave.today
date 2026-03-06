/* fog4-addon.js
   ONLY-FOG version
   - uses only #ambientBg
   - slow "ink in water" + plasma-lamp drift
   - colors are sampled from visible posters
*/
(() => {
  const grid = document.getElementById("eventsGrid");
  const ambient = document.getElementById("ambientBg");
  if (!grid || !ambient) return;

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const FOG_N = 4;
  let fogCurrent = Array.from({ length: FOG_N }, () => ({ r: 145, g: 85, b: 255 }));
  let fogTarget  = Array.from({ length: FOG_N }, () => ({ r: 145, g: 85, b: 255 }));
  let posCurrent = [
    { x: 24, y: 28, s: 60, a: 0.44 },
    { x: 76, y: 30, s: 58, a: 0.36 },
    { x: 38, y: 76, s: 66, a: 0.28 },
    { x: 82, y: 74, s: 62, a: 0.22 }
  ];
  let posTarget = JSON.parse(JSON.stringify(posCurrent));
  let nextDriftAt = 0;
  let raf = 0;
  let obs = null;
  let lastEntries = new Map();
  let timer = 0;
  const rgbCache = new Map();

  const rand = (min, max) => min + Math.random() * (max - min);

  function setFogVars() {
    for (let i = 0; i < FOG_N; i++) {
      const r = Math.round(fogCurrent[i].r);
      const g = Math.round(fogCurrent[i].g);
      const b = Math.round(fogCurrent[i].b);
      ambient.style.setProperty(`--fog${i + 1}`, `${r},${g},${b}`);
    }
  }

  function pickNewDriftTargets() {
    posTarget = [
      { x: rand(14, 34), y: rand(18, 38), s: rand(56, 72), a: 0.46 },
      { x: rand(64, 84), y: rand(18, 38), s: rand(54, 70), a: 0.38 },
      { x: rand(24, 46), y: rand(62, 84), s: rand(60, 78), a: 0.30 },
      { x: rand(70, 88), y: rand(62, 84), s: rand(56, 74), a: 0.24 }
    ];
  }

  function applyFog() {
    setFogVars();
    ambient.style.backgroundImage =
      `radial-gradient(circle at ${posCurrent[0].x}% ${posCurrent[0].y}%, rgba(var(--fog1), ${posCurrent[0].a}), transparent ${posCurrent[0].s}%),
       radial-gradient(circle at ${posCurrent[1].x}% ${posCurrent[1].y}%, rgba(var(--fog2), ${posCurrent[1].a}), transparent ${posCurrent[1].s}%),
       radial-gradient(circle at ${posCurrent[2].x}% ${posCurrent[2].y}%, rgba(var(--fog3), ${posCurrent[2].a}), transparent ${posCurrent[2].s}%),
       radial-gradient(circle at ${posCurrent[3].x}% ${posCurrent[3].y}%, rgba(var(--fog4), ${posCurrent[3].a}), transparent ${posCurrent[3].s}%)`;
  }

  function tick(now) {
    if (!nextDriftAt) nextDriftAt = now + 7000;
    if (now >= nextDriftAt) {
      pickNewDriftTargets();
      nextDriftAt = now + rand(6500, 9800);
    }
    for (let i = 0; i < FOG_N; i++) {
      fogCurrent[i].r += (fogTarget[i].r - fogCurrent[i].r) * 0.025;
      fogCurrent[i].g += (fogTarget[i].g - fogCurrent[i].g) * 0.025;
      fogCurrent[i].b += (fogTarget[i].b - fogCurrent[i].b) * 0.025;
      posCurrent[i].x += (posTarget[i].x - posCurrent[i].x) * 0.012;
      posCurrent[i].y += (posTarget[i].y - posCurrent[i].y) * 0.012;
      posCurrent[i].s += (posTarget[i].s - posCurrent[i].s) * 0.012;
      posCurrent[i].a += (posTarget[i].a - posCurrent[i].a) * 0.012;
    }
    applyFog();
    raf = requestAnimationFrame(tick);
  }

  function setTargets(list) {
    const base = { r: 145, g: 85, b: 255 };
    const L = (list && list.length) ? list : [base];
    for (let i = 0; i < FOG_N; i++) {
      const c = L[i] || L[L.length - 1] || base;
      fogTarget[i] = { r: clamp(c.r, 0, 255), g: clamp(c.g, 0, 255), b: clamp(c.b, 0, 255) };
    }
  }

  function getAvgRGB(imgUrl) {
    if (rgbCache.has(imgUrl)) return Promise.resolve(rgbCache.get(imgUrl));
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
            r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
          }
          const rgb = n ? { r: r / n, g: g / n, b: b / n } : { r: 145, g: 85, b: 255 };
          rgbCache.set(imgUrl, rgb);
          resolve(rgb);
        } catch (_e) {
          resolve({ r: 145, g: 85, b: 255 });
        }
      };
      img.onerror = () => resolve({ r: 145, g: 85, b: 255 });
      img.src = imgUrl;
    });
  }

  function schedulePick() { clearTimeout(timer); timer = setTimeout(pick, 240); }

  async function pick() {
    const entries = Array.from(lastEntries.values())
      .filter(e => e && e.isIntersecting && e.target)
      .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))
      .slice(0, FOG_N);

    const srcs = entries.map(e => {
      const img = e.target;
      return img ? (img.currentSrc || img.src) : null;
    }).filter(Boolean);

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
    }, { root: null, rootMargin: "220px 0px 220px 0px", threshold: [0.18, 0.28, 0.40, 0.55, 0.72] });

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

  applyFog();
  pickNewDriftTargets();
  if (!boot()) {
    setTimeout(boot, 250);
    setTimeout(boot, 700);
    setTimeout(boot, 1400);
  }
  new MutationObserver(() => boot()).observe(grid, { childList: true, subtree: true });
  window.addEventListener("scroll", schedulePick, { passive: true });
  if (!raf) raf = requestAnimationFrame(tick);
})();
