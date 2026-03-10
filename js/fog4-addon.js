/* fog4-addon.js — dominant palette + stronger pour + slower fade */

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

  /* 1. vrstva – širší mléčné pole */
  let powerCur = [0.34, 0.30, 0.26];
  let powerTgt = [0.34, 0.30, 0.26];

  /* 2. vrstva – hutnější barevné jádro */
  let coreCur = [0.26, 0.22, 0.20];
  let coreTgt = [0.26, 0.22, 0.20];

  let posCur = [
    { x: 22, y: 28, s: 96, a: 0.72 },
    { x: 78, y: 30, s: 92, a: 0.64 },
    { x: 48, y: 74, s: 108, a: 0.56 }
  ];

  let posTgt = JSON.parse(JSON.stringify(posCur));

  let obs = null;
  let timer = 0;
  let raf = 0;
  let nextDrift = 0;
  let lastEntries = new Map();

  const cache = new Map();
  const rand = (a, b) => a + Math.random() * (b - a);

  function luminance(rgb) {
    return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
  }

  function saturation(rgb) {
    return Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b);
  }

  function stylize(rgb) {
    const avg = (rgb.r + rgb.g + rgb.b) / 3;
    const lum = luminance(rgb);
    const sat = saturation(rgb);

    /* tmavé barvy nenech úplně zesvětlit */
    const lift = lum < 60 ? 0 : lum < 120 ? 3 : 8;
    const boost = sat < 22 ? 1.85 : 2.15;

    return {
      r: clamp(avg + (rgb.r - avg) * boost + lift, 0, 255),
      g: clamp(avg + (rgb.g - avg) * (boost - 0.10) + lift, 0, 255),
      b: clamp(avg + (rgb.b - avg) * (boost + 0.08) + lift + 2, 0, 255)
    };
  }

  function mixWithMilk(rgb, k) {
    return {
      r: MILK.r * (1 - k) + rgb.r * k,
      g: MILK.g * (1 - k) + rgb.g * k,
      b: MILK.b * (1 - k) + rgb.b * k
    };
  }

  function avgRGB(list) {
    if (!list.length) return { ...BASE };
    let r = 0, g = 0, b = 0;
    for (const c of list) {
      r += c.r;
      g += c.g;
      b += c.b;
    }
    return {
      r: r / list.length,
      g: g / list.length,
      b: b / list.length
    };
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
      return Array.from({ length: count }, () => ({
        rgb: { ...BASE },
        rect: null,
        ratio: 0
      }));
    }

    const chosen = [samples[0]];

    while (chosen.length < count && chosen.length < samples.length) {
      let best = null;
      let bestScore = -1;

      for (const s of samples) {
        if (chosen.includes(s)) continue;

        const minDist = Math.min(...chosen.map(c => colorDist(c.rgb, s.rgb)));
        const score = minDist + (s.ratio || 0) * 24 + saturation(s.rgb) * 0.15;

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
    const c1 = mixWithMilk(cur[0], clamp(powerCur[0], 0, 1.4));
    const c2 = mixWithMilk(cur[1], clamp(powerCur[1], 0, 1.4));
    const c3 = mixWithMilk(cur[2], clamp(powerCur[2], 0, 1.4));

    const field = mixWithMilk(avgRGB([c1, c2, c3]), 0.18);

    ambient.style.backgroundImage = `
radial-gradient(circle at ${posCur[0].x}% ${posCur[0].y}%,
  rgba(${c1.r|0},${c1.g|0},${c1.b|0},${posCur[0].a}) 0%,
  rgba(${c1.r|0},${c1.g|0},${c1.b|0},${posCur[0].a * 0.78}) 20%,
  rgba(${c1.r|0},${c1.g|0},${c1.b|0},${posCur[0].a * 0.42}) 46%,
  rgba(${c1.r|0},${c1.g|0},${c1.b|0},${posCur[0].a * 0.18}) 76%,
  transparent ${posCur[0].s}%),

radial-gradient(circle at ${posCur[1].x}% ${posCur[1].y}%,
  rgba(${c2.r|0},${c2.g|0},${c2.b|0},${posCur[1].a}) 0%,
  rgba(${c2.r|0},${c2.g|0},${c2.b|0},${posCur[1].a * 0.78}) 20%,
  rgba(${c2.r|0},${c2.g|0},${c2.b|0},${posCur[1].a * 0.42}) 46%,
  rgba(${c2.r|0},${c2.g|0},${c2.b|0},${posCur[1].a * 0.18}) 76%,
  transparent ${posCur[1].s}%),

radial-gradient(circle at ${posCur[2].x}% ${posCur[2].y}%,
  rgba(${c3.r|0},${c3.g|0},${c3.b|0},${posCur[2].a}) 0%,
  rgba(${c3.r|0},${c3.g|0},${c3.b|0},${posCur[2].a * 0.78}) 20%,
  rgba(${c3.r|0},${c3.g|0},${c3.b|0},${posCur[2].a * 0.42}) 46%,
  rgba(${c3.r|0},${c3.g|0},${c3.b|0},${posCur[2].a * 0.18}) 76%,
  transparent ${posCur[2].s}%),

radial-gradient(circle at ${posCur[0].x}% ${posCur[0].y}%,
  rgba(${cur[0].r|0},${cur[0].g|0},${cur[0].b|0},${coreCur[0]}) 0%,
  rgba(${cur[0].r|0},${cur[0].g|0},${cur[0].b|0},${coreCur[0] * 0.62}) 18%,
  rgba(${cur[0].r|0},${cur[0].g|0},${cur[0].b|0},${coreCur[0] * 0.24}) 34%,
  transparent 42%),

radial-gradient(circle at ${posCur[1].x}% ${posCur[1].y}%,
  rgba(${cur[1].r|0},${cur[1].g|0},${cur[1].b|0},${coreCur[1]}) 0%,
  rgba(${cur[1].r|0},${cur[1].g|0},${cur[1].b|0},${coreCur[1] * 0.62}) 18%,
  rgba(${cur[1].r|0},${cur[1].g|0},${cur[1].b|0},${coreCur[1] * 0.24}) 34%,
  transparent 42%),

radial-gradient(circle at ${posCur[2].x}% ${posCur[2].y}%,
  rgba(${cur[2].r|0},${cur[2].g|0},${cur[2].b|0},${coreCur[2]}) 0%,
  rgba(${cur[2].r|0},${cur[2].g|0},${cur[2].b|0},${coreCur[2] * 0.62}) 18%,
  rgba(${cur[2].r|0},${cur[2].g|0},${cur[2].b|0},${coreCur[2] * 0.24}) 34%,
  transparent 42%),

linear-gradient(180deg,
  rgba(${field.r|0},${field.g|0},${field.b|0},0.28),
  rgba(242,237,249,0.08) 42%,
  rgba(246,242,250,0.08) 100%)
`;
  }

  function pickDrift() {
    posTgt = [
      { x: rand(14, 34), y: rand(18, 38), s: rand(96, 114), a: rand(0.70, 0.88) },
      { x: rand(66, 86), y: rand(20, 40), s: rand(92, 110), a: rand(0.62, 0.80) },
      { x: rand(28, 72), y: rand(62, 84), s: rand(100, 120), a: rand(0.54, 0.72) }
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

      powerCur[i] += (powerTgt[i] - powerCur[i]) * 0.024;
      coreCur[i] += (coreTgt[i] - coreCur[i]) * 0.030;

      posCur[i].x += (posTgt[i].x - posCur[i].x) * 0.018;
      posCur[i].y += (posTgt[i].y - posCur[i].y) * 0.018;
      posCur[i].s += (posTgt[i].s - posCur[i].s) * 0.016;
      posCur[i].a += (posTgt[i].a - posCur[i].a) * 0.018;

      powerTgt[i] = clamp(powerTgt[i] - 0.0000025, 0.52, 1.60);
      coreTgt[i]  = clamp(coreTgt[i]  - 0.0000040, 0.36, 2.10);
    }

    applyFog();
    raf = requestAnimationFrame(tick);
  }

  function extractDominantPalette(src) {
    if (cache.has(src)) return Promise.resolve(cache.get(src));

    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          const c = document.createElement("canvas");
          const ctx = c.getContext("2d", { willReadFrequently: true });

          c.width = 40;
          c.height = 40;
          ctx.drawImage(img, 0, 0, 40, 40);

          const data = ctx.getImageData(0, 0, 40, 40).data;
          const buckets = new Map();

          for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3];
            if (a < 40) continue;

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const qr = Math.round(r / 20) * 20;
            const qg = Math.round(g / 20) * 20;
            const qb = Math.round(b / 20) * 20;
            const key = `${qr}_${qg}_${qb}`;

            if (!buckets.has(key)) {
              buckets.set(key, { r: 0, g: 0, b: 0, n: 0, score: 0 });
            }

            const bucket = buckets.get(key);
            bucket.r += r;
            bucket.g += g;
            bucket.b += b;
            bucket.n += 1;

            const rgb = { r, g, b };
            const sat = saturation(rgb);
            const lum = luminance(rgb);

            /* černá / tmavá nesmí být ignorovaná */
            const darkBoost = lum < 95 ? 1.25 : 1;
            const vividBoost = 1 + sat * 0.02;

            bucket.score += vividBoost * darkBoost;
          }

          const palette = [...buckets.values()]
            .filter(x => x.n > 4)
            .map(x => ({
              rgb: { r: x.r / x.n, g: x.g / x.n, b: x.b / x.n },
              n: x.n,
              score: x.score
            }))
            .sort((a, b) => (b.n + b.score) - (a.n + a.score));

          const picked = [];
          for (const item of palette) {
            if (picked.length >= 4) break;

            const ok = picked.every(p => colorDist(p, item.rgb) > 24);
            if (ok) picked.push(item.rgb);
          }

          while (picked.length < 3) picked.push(picked[picked.length - 1] || BASE);

          const result = picked.slice(0, 4).map(stylize);
          cache.set(src, result);
          resolve(result);
        } catch {
          const fallback = [BASE, BASE, BASE].map(stylize);
          cache.set(src, fallback);
          resolve(fallback);
        }
      };

      img.onerror = () => {
        const fallback = [BASE, BASE, BASE].map(stylize);
        cache.set(src, fallback);
        resolve(fallback);
      };

      img.src = src;
    });
  }

  function schedulePick() {
    clearTimeout(timer);
    timer = setTimeout(pick, 90);
  }

  async function pick() {
    const visible = Array.from(lastEntries.values())
      .filter(e => e && e.isIntersecting && e.target)
      .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))
      .slice(0, 10);

    if (!visible.length) return;

    const main = visible[0];
    const mainImg = main.target;
    const mainSrc = mainImg ? (mainImg.currentSrc || mainImg.src) : null;
    if (!mainSrc) return;

    const palette = await extractDominantPalette(mainSrc);
    const mainRect = mainImg.getBoundingClientRect();
    const center = viewportPercentFromRect(mainRect);

    const baseSamples = palette.slice(0, 4).map((rgb, i) => ({
      rgb,
      rect: {
        left: mainRect.left + (i === 0 ? -20 : i === 1 ? 20 : i === 2 ? -10 : 10),
        right: mainRect.right,
        top: mainRect.top + (i === 0 ? -12 : i === 1 ? -6 : i === 2 ? 8 : 14),
        bottom: mainRect.bottom
      },
      ratio: main.intersectionRatio || 0.9
    }));

    const chosen = pickDistinctColors(baseSamples, N);

    const offsets = [
      { x: -8, y: -6 },
      { x: 10, y: -4 },
      { x: 2, y: 12 }
    ];

    for (let i = 0; i < N; i++) {
      const s = chosen[i];

      tgt[i] = {
        r: tgt[i].r * 0.46 + s.rgb.r * 0.54,
        g: tgt[i].g * 0.46 + s.rgb.g * 0.54,
        b: tgt[i].b * 0.46 + s.rgb.b * 0.54
      };

      posTgt[i].x = clamp(center.x + offsets[i].x, 8, 92);
      posTgt[i].y = clamp(center.y + offsets[i].y, 10, 90);
      posTgt[i].s = clamp(102 + (s.ratio || 0) * 16, 96, 124);
      posTgt[i].a = clamp(0.70 + (s.ratio || 0) * 0.18, 0.70, 0.92);

      powerTgt[i] = clamp(powerTgt[i] + 0.82 + (s.ratio || 0) * 0.46, 0.52, 1.60);
      coreTgt[i]  = clamp(coreTgt[i]  + 1.08 + (s.ratio || 0) * 0.62, 0.36, 2.10);
    }
  }

  function setupObserver() {
    if (obs) {
      try { obs.disconnect(); } catch {}
    }

    lastEntries = new Map();

    const imgs = Array.from(grid.querySelectorAll(".poster img"));
    if (!imgs.length) return false;

    obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e && e.target) lastEntries.set(e.target, e);
      });
      schedulePick();
    }, {
      root: null,
      rootMargin: "220px 0px 220px 0px",
      threshold: [0.08, 0.16, 0.28, 0.42, 0.60, 0.78]
    });

    imgs.forEach(img => {
      if (img.complete) obs.observe(img);
      else img.addEventListener("load", () => {
        try { obs.observe(img); } catch {}
      }, { once: true });
    });

    return true;
  }

  function initialBoot() {
    const first = grid.querySelector(".poster img");
    if (!first) return;

    lastEntries.set(first, {
      target: first,
      isIntersecting: true,
      intersectionRatio: 0.95
    });

    schedulePick();
  }

  function boot() {
    const has = grid.querySelector(".poster img");
    if (!has) return false;
    if (setupObserver()) initialBoot();
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