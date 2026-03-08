/* fog4-addon.js — stronger 4-color cumulative fog */
(() => {
  const grid = document.getElementById("eventsGrid");
  const ambient = document.getElementById("ambientBg");
  if (!grid || !ambient) return;

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const N = 4;
  const base = { r: 188, g: 144, b: 236 };
  let cur = Array.from({ length: N }, () => ({ ...base }));
  let tgt = Array.from({ length: N }, () => ({ ...base }));
  let posCur = [
    { x: 18, y: 26, s: 78, a: 0.86 },
    { x: 78, y: 28, s: 72, a: 0.76 },
    { x: 34, y: 76, s: 88, a: 0.62 },
    { x: 82, y: 72, s: 82, a: 0.56 },
  ];
  let posTgt = JSON.parse(JSON.stringify(posCur));
  let obs = null, timer = 0, raf = 0, nextDrift = 0;
  let lastEntries = new Map();
  const cache = new Map();
  const rand = (a, b) => a + Math.random() * (b - a);

  function stylize(rgb) {
    const avg = (rgb.r + rgb.g + rgb.b) / 3;
    return {
      r: clamp(avg + (rgb.r - avg) * 2.55 + 22, 0, 255),
      g: clamp(avg + (rgb.g - avg) * 2.20 + 16, 0, 255),
      b: clamp(avg + (rgb.b - avg) * 2.65 + 24, 0, 255),
    };
  }

  function applyFog() {
    ambient.style.backgroundImage =
      `radial-gradient(circle at ${posCur[0].x}% ${posCur[0].y}%, rgba(${Math.round(cur[0].r)},${Math.round(cur[0].g)},${Math.round(cur[0].b)},${posCur[0].a}), transparent ${posCur[0].s}%),
       radial-gradient(circle at ${posCur[1].x}% ${posCur[1].y}%, rgba(${Math.round(cur[1].r)},${Math.round(cur[1].g)},${Math.round(cur[1].b)},${posCur[1].a}), transparent ${posCur[1].s}%),
       radial-gradient(circle at ${posCur[2].x}% ${posCur[2].y}%, rgba(${Math.round(cur[2].r)},${Math.round(cur[2].g)},${Math.round(cur[2].b)},${posCur[2].a}), transparent ${posCur[2].s}%),
       radial-gradient(circle at ${posCur[3].x}% ${posCur[3].y}%, rgba(${Math.round(cur[3].r)},${Math.round(cur[3].g)},${Math.round(cur[3].b)},${posCur[3].a}), transparent ${posCur[3].s}%),
       linear-gradient(180deg, rgba(250,246,255,.08), rgba(238,232,247,.04))`;
  }

  function pickDrift() {
    posTgt = [
      { x: rand(12, 30), y: rand(16, 34), s: rand(74, 90), a: rand(0.82, 0.90) },
      { x: rand(70, 88), y: rand(18, 36), s: rand(68, 84), a: rand(0.72, 0.80) },
      { x: rand(20, 42), y: rand(62, 86), s: rand(84, 98), a: rand(0.58, 0.66) },
      { x: rand(68, 90), y: rand(58, 84), s: rand(78, 94), a: rand(0.52, 0.60) },
    ];
  }

  function tick(now) {
    if (!nextDrift) nextDrift = now + 5600;
    if (now >= nextDrift) {
      pickDrift();
      nextDrift = now + rand(4800, 7600);
    }
    for (let i = 0; i < N; i++) {
      cur[i].r += (tgt[i].r - cur[i].r) * 0.024;
      cur[i].g += (tgt[i].g - cur[i].g) * 0.024;
      cur[i].b += (tgt[i].b - cur[i].b) * 0.024;
      posCur[i].x += (posTgt[i].x - posCur[i].x) * 0.013;
      posCur[i].y += (posTgt[i].y - posCur[i].y) * 0.013;
      posCur[i].s += (posTgt[i].s - posCur[i].s) * 0.013;
      posCur[i].a += (posTgt[i].a - posCur[i].a) * 0.013;
    }
    applyFog();
    raf = requestAnimationFrame(tick);
  }

  function mixTargets(list) {
    const L = (list && list.length) ? list : [base];
    for (let i = 0; i < N; i++) {
      const incoming = stylize(L[i] || L[L.length - 1] || base);
      tgt[i] = {
        r: tgt[i].r * 0.56 + incoming.r * 0.44,
        g: tgt[i].g * 0.56 + incoming.g * 0.44,
        b: tgt[i].b * 0.56 + incoming.b * 0.44,
      };
    }
  }

  function getAvgRGB(src) {
    if (cache.has(src)) return Promise.resolve(cache.get(src));
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const c = document.createElement("canvas");
          const ctx = c.getContext("2d", { willReadFrequently: true });
          c.width = 32; c.height = 32;
          ctx.drawImage(img, 0, 0, 32, 32);
          const data = ctx.getImageData(0, 0, 32, 32).data;
          let r = 0, g = 0, b = 0, n = 0;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 32) continue;
            r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
          }
          const rgb = n ? { r: r / n, g: g / n, b: b / n } : base;
          cache.set(src, rgb);
          resolve(rgb);
        } catch {
          resolve(base);
        }
      };
      img.onerror = () => resolve(base);
      img.src = src;
    });
  }

  function schedulePick() {
    clearTimeout(timer);
    timer = setTimeout(pick, 150);
  }

  async function pick() {
    const entries = Array.from(lastEntries.values())
      .filter(e => e && e.isIntersecting && e.target)
      .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))
      .slice(0, N);
    const srcs = entries.map(e => e.target ? (e.target.currentSrc || e.target.src) : null).filter(Boolean);
    if (!srcs.length) return;

    const rgbs = [];
    for (const s of srcs) {
      try { rgbs.push(await getAvgRGB(s)); } catch {}
    }
    if (rgbs.length) mixTargets(rgbs);
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
      threshold: [0.18, 0.30, 0.45, 0.60, 0.75]
    });
    imgs.forEach(img => {
      if (img.complete) obs.observe(img);
      else img.addEventListener("load", () => { try { obs.observe(img); } catch {} }, { once: true });
    });
    return true;
  }

  function boot() {
    const has = grid.querySelector(".poster img");
    if (!has) return false;
    if (setupObserver()) schedulePick();
    return true;
  }

  applyFog();
  pickDrift();
  if (!boot()) {
    setTimeout(boot, 250);
    setTimeout(boot, 700);
    setTimeout(boot, 1400);
  }
  new MutationObserver(() => boot()).observe(grid, { childList: true, subtree: true });
  window.addEventListener("scroll", schedulePick, { passive: true });
  if (!raf) raf = requestAnimationFrame(tick);
})();
