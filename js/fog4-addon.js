/* fog4-addon.js — milky start + stronger 3-color pour */
(() => {
  const grid = document.getElementById("eventsGrid");
  const ambient = document.getElementById("ambientBg");
  if (!grid || !ambient) return;

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const N = 3;

  const MILK = { r: 244, g: 239, b: 248 };
  const BASE = { r: 182, g: 136, b: 228 };

  let cur = Array.from({ length: N }, () => ({ ...BASE }));
  let tgt = Array.from({ length: N }, () => ({ ...BASE }));

  // start = jemně mléčné, ale ne mrtvé
  let powerCur = [0.30, 0.24, 0.18];
  let powerTgt = [0.30, 0.24, 0.18];

  let posCur = [
    { x: 22, y: 28, s: 84, a: 0.68 },
    { x: 78, y: 30, s: 80, a: 0.58 },
    { x: 48, y: 74, s: 96, a: 0.48 },
  ];
  let posTgt = JSON.parse(JSON.stringify(posCur));

  let obs = null;
  let timer = 0;
  let raf = 0;
  let nextDrift = 0;
  let lastEntries = new Map();
  const cache = new Map();
  const rand = (a, b) => a + Math.random() * (b - a);

  function stylize(rgb) {
    const avg = (rgb.r + rgb.g + rgb.b) / 3;
    return {
      r: clamp(avg + (rgb.r - avg) * 2.10 + 12, 0, 255),
      g: clamp(avg + (rgb.g - avg) * 1.95 + 10, 0, 255),
      b: clamp(avg + (rgb.b - avg) * 2.20 + 14, 0, 255),
    };
  }

  function mixWithMilk(rgb, k) {
    return {
      r: MILK.r * (1 - k) + rgb.r * k,
      g: MILK.g * (1 - k) + rgb.g * k,
      b: MILK.b * (1 - k) + rgb.b * k,
    };
  }

  function avgRGB(list) {
    if (!list.length) return { ...BASE };
    let r = 0, g = 0, b = 0;
    for (const c of list) {
      r += c.r; g += c.g; b += c.b;
    }
    return { r: r / list.length, g: g / list.length, b: b / list.length };
  }

  function colorDist(a, b) {
    const dr = a.r - b.r;
    const dg = a.g - b.g;
    const db = a.b - b.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  function viewportPercentFromRect(rect) {
    const vw = Math.max(window.innerWidth, 1);
    const vh = Math.max(window.innerHeight, 1);
    const cx = clamp(((rect.left + rect.right) * 0.5 / vw) * 100, 8, 92);
    const cy = clamp(((rect.top + rect.bottom) * 0.5 / vh) * 100, 10, 90);
    return { x: cx, y: cy };
  }

  function pickDistinctColors(samples, count = 3) {
    if (!samples.length) {
      return Array.from({ length: count }, () => ({ rgb: { ...BASE }, rect: null, ratio: 0 }));
    }

    const chosen = [samples[0]];

    while (chosen.length < count && chosen.length < samples.length) {
      let best = null;
      let bestScore = -1;

      for (const s of samples) {
        if (chosen.includes(s)) continue;
        const minDist = Math.min(...chosen.map(c => colorDist(c.rgb, s.rgb)));
        const score = minDist + (s.ratio || 0) * 24;
        if (score > bestScore) {
          bestScore = score;
          best = s;
        }
      }

      if (!best) break;
      chosen.push(best);
    }

    while (chosen.length < count) {
      chosen.push(chosen[chosen.length - 1] || samples[0]);
    }

    return chosen;
  }

  function applyFog() {
    const c1 = mixWithMilk(cur[0], clamp(powerCur[0], 0, 1));
    const c2 = mixWithMilk(cur[1], clamp(powerCur[1], 0, 1));
    const c3 = mixWithMilk(cur[2], clamp(powerCur[2], 0, 1));

    // celkové pole z 3 barev
    const field = mixWithMilk(avgRGB([c1, c2, c3]), 0.34);

    ambient.style.backgroundImage =
      `
      radial-gradient(circle at ${posCur[0].x}% ${posCur[0].y}%,
        rgba(${Math.round(c1.r)},${Math.round(c1.g)},${Math.round(c1.b)},${posCur[0].a}) 0%,
        rgba(${Math.round(c1.r)},${Math.round(c1.g)},${Math.round(c1.b)},${posCur[0].a * 0.74}) 18%,
        rgba(${Math.round(c1.r)},${Math.round(c1.g)},${Math.round(c1.b)},${posCur[0].a * 0.38}) 42%,
        rgba(${Math.round(c1.r)},${Math.round(c1.g)},${Math.round(c1.b)},${posCur[0].a * 0.14}) 64%,
        transparent ${posCur[0].s}%),

      radial-gradient(circle at ${posCur[1].x}% ${posCur[1].y}%,
        rgba(${Math.round(c2.r)},${Math.round(c2.g)},${Math.round(c2.b)},${posCur[1].a}) 0%,
        rgba(${Math.round(c2.r)},${Math.round(c2.g)},${Math.round(c2.b)},${posCur[1].a * 0.74}) 18%,
        rgba(${Math.round(c2.r)},${Math.round(c2.g)},${Math.round(c2.b)},${posCur[1].a * 0.38}) 42%,
        rgba(${Math.round(c2.r)},${Math.round(c2.g)},${Math.round(c2.b)},${posCur[1].a * 0.14}) 64%,
        transparent ${posCur[1].s}%),

      radial-gradient(circle at ${posCur[2].x}% ${posCur[2].y}%,
        rgba(${Math.round(c3.r)},${Math.round(c3.g)},${Math.round(c3.b)},${posCur[2].a}) 0%,
        rgba(${Math.round(c3.r)},${Math.round(c3.g)},${Math.round(c3.b)},${posCur[2].a * 0.74}) 20%,
        rgba(${Math.round(c3.r)},${Math.round(c3.g)},${Math.round(c3.b)},${posCur[2].a * 0.38}) 44%,
        rgba(${Math.round(c3.r)},${Math.round(c3.g)},${Math.round(c3.b)},${posCur[2].a * 0.14}) 66%,
        transparent ${posCur[2].s}%),

      linear-gradient(180deg,
        rgba(${Math.round(field.r)},${Math.round(field.g)},${Math.round(field.b)},0.34),
        rgba(243,238,249,0.18) 40%,
        rgba(246,242,250,0.22) 100%)
      `;
  }

  function pickDrift() {
    posTgt = [
      { x: rand(14, 34), y: rand(18, 38), s: rand(82, 96), a: rand(0.62, 0.78) },
      { x: rand(66, 86), y: rand(20, 40), s: rand(78, 92), a: rand(0.54, 0.70) },
      { x: rand(28, 72), y: rand(62, 84), s: rand(92, 106), a: rand(0.46, 0.62) },
    ];
  }

  function tick(now) {
    if (!nextDrift) nextDrift = now + 6200;
    if (now >= nextDrift) {
      pickDrift();
      nextDrift = now + rand(5200, 8600);
    }

    for (let i = 0; i < N; i++) {
      cur[i].r += (tgt[i].r - cur[i].r) * 0.022;
      cur[i].g += (tgt[i].g - cur[i].g) * 0.022;
      cur[i].b += (tgt[i].b - cur[i].b) * 0.022;

      powerCur[i] += (powerTgt[i] - powerCur[i]) * 0.020;

      posCur[i].x += (posTgt[i].x - posCur[i].x) * 0.018;
      posCur[i].y += (posTgt[i].y - posCur[i].y) * 0.018;
      posCur[i].s += (posTgt[i].s - posCur[i].s) * 0.014;
      posCur[i].a += (posTgt[i].a - posCur[i].a) * 0.016;

      // pomalé povolování, aby barva držela déle
      powerTgt[i] = clamp(powerTgt[i] - 0.00022, 0.20, 0.98);
    }

    applyFog();
    raf = requestAnimationFrame(tick);
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
          c.width = 32;
          c.height = 32;
          ctx.drawImage(img, 0, 0, 32, 32);
          const data = ctx.getImageData(0, 0, 32, 32).data;

          let r = 0, g = 0, b = 0, n = 0;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 32) continue;
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            n++;
          }

          const rgb = n ? { r: r / n, g: g / n, b: b / n } : BASE;
          cache.set(src, rgb);
          resolve(rgb);
        } catch {
          resolve(BASE);
        }
      };
      img.onerror = () => resolve(BASE);
      img.src = src;
    });
  }

  function schedulePick() {
    clearTimeout(timer);
    timer = setTimeout(pick, 120);
  }

  async function pick() {
    const visible = Array.from(lastEntries.values())
      .filter(e => e && e.isIntersecting && e.target)
      .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))
      .slice(0, 12);

    if (!visible.length) return;

    const samples = [];
    for (const entry of visible) {
      const img = entry.target;
      const src = img ? (img.currentSrc || img.src) : null;
      if (!src) continue;

      try {
        const rgb = await getAvgRGB(src);
        samples.push({
          rgb: stylize(rgb),
          rect: img.getBoundingClientRect(),
          ratio: entry.intersectionRatio || 0
        });
      } catch {}
    }

    if (!samples.length) return;

    const chosen = pickDistinctColors(samples, N);

    for (let i = 0; i < N; i++) {
      const s = chosen[i];

      tgt[i] = {
        r: tgt[i].r * 0.60 + s.rgb.r * 0.40,
        g: tgt[i].g * 0.60 + s.rgb.g * 0.40,
        b: tgt[i].b * 0.60 + s.rgb.b * 0.40
      };

      if (s.rect) {
        const p = viewportPercentFromRect(s.rect);
        posTgt[i].x = p.x;
        posTgt[i].y = p.y;
        posTgt[i].s = clamp(84 + s.ratio * 20, 82, 110);
      }

      // tady se to opravdu dolejvá
      powerTgt[i] = clamp(powerTgt[i] + 0.14 + s.ratio * 0.14, 0.20, 0.98);
    }
  }

  function setupObserver() {
    if (obs) {
      try { obs.disconnect(); } catch {}
    }
    lastEntries = new Map();

    const imgs = Array.from(grid.querySelectorAll(".poster img"));
    if (!imgs.length) return false;

    obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e && e.target) lastEntries.set(e.target, e);
      });
      schedulePick();
    }, {
      root: null,
      rootMargin: "220px 0px 220px 0px",
      threshold: [0.10, 0.18, 0.30, 0.45, 0.60, 0.75]
    });

    imgs.forEach(img => {
      if (img.complete) obs.observe(img);
      else img.addEventListener("load", () => {
        try { obs.observe(img); } catch {}
      }, { once: true });
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