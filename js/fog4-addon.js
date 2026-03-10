/* fog4-addon.js — living pour + stable 3 colors + screen-wide 4th accent */

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

  let powerCur = [0.34, 0.30, 0.26];
  let powerTgt = [0.34, 0.30, 0.26];

  let coreCur = [0.26, 0.22, 0.20];
  let coreTgt = [0.26, 0.22, 0.20];

  let posCur = [
    { x: 22, y: 28, s: 96, a: 0.72 },
    { x: 78, y: 30, s: 92, a: 0.64 },
    { x: 48, y: 74, s: 108, a: 0.56 }
  ];

  let posTgt = JSON.parse(JSON.stringify(posCur));

  /* 4. akcentová vrstva — oddělená od mlhy */
  let accentCur = { r: 255, g: 255, b: 255 };
  let accentTgt = { r: 255, g: 255, b: 255 };

  let accentPosCur = { x: 50, y: 50, s: 20, a: 0.00 };
  let accentPosTgt = { x: 50, y: 50, s: 20, a: 0.34 };

  let streakCur = { x: 52, y: 48, s: 14, a: 0.00 };
  let streakTgt = { x: 52, y: 48, s: 14, a: 0.22 };

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
    const sat = saturation(rgb);
    const boost = sat < 20 ? 1.55 : sat < 45 ? 1.75 : 1.92;

    return {
      r: clamp(avg + (rgb.r - avg) * boost + 6, 0, 255),
      g: clamp(avg + (rgb.g - avg) * (boost - 0.05) + 5, 0, 255),
      b: clamp(avg + (rgb.b - avg) * (boost + 0.04) + 7, 0, 255)
    };
  }

  function stylizeAccent(rgb) {
    const avg = (rgb.r + rgb.g + rgb.b) / 3;
    const sat = saturation(rgb);
    const lum = luminance(rgb);

    const boost = sat < 28 ? 2.05 : 2.35;
    const lift = lum > 185 ? 8 : lum < 70 ? 0 : 3;

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

  function applyFog() {
    const c1 = mixWithMilk(cur[0], clamp(powerCur[0], 0, 1.45));
    const c2 = mixWithMilk(cur[1], clamp(powerCur[1], 0, 1.45));
    const c3 = mixWithMilk(cur[2], clamp(powerCur[2], 0, 1.45));

    const field = mixWithMilk(avgRGB([c1, c2, c3]), 0.18);

    ambient.style.backgroundImage = `
radial-gradient(circle at ${posCur[0].x}% ${posCur[0].y}%,
  rgba(${c1.r|0},${c1.g|0},${c1.b|0},${posCur[0].a}) 0%,
  rgba(${c1.r|0},${c1.g|0},${c1.b|0},${posCur[0].a * 0.78}) 20%,
  rgba(${c1.r|0},${c1.g|0},${c1.b|0},${posCur[0].a * 0.42}) 46%,
  rgba(${c1.r|0},${c1.g|0},${c1.b|0},${posCur[0].a * 0.18}) 78%,
  transparent ${posCur[0].s}%),

radial-gradient(circle at ${posCur[1].x}% ${posCur[1].y}%,
  rgba(${c2.r|0},${c2.g|0},${c2.b|0},${posCur[1].a}) 0%,
  rgba(${c2.r|0},${c2.g|0},${c2.b|0},${posCur[1].a * 0.78}) 20%,
  rgba(${c2.r|0},${c2.g|0},${c2.b|0},${posCur[1].a * 0.42}) 46%,
  rgba(${c2.r|0},${c2.g|0},${c2.b|0},${posCur[1].a * 0.18}) 78%,
  transparent ${posCur[1].s}%),

radial-gradient(circle at ${posCur[2].x}% ${posCur[2].y}%,
  rgba(${c3.r|0},${c3.g|0},${c3.b|0},${posCur[2].a}) 0%,
  rgba(${c3.r|0},${c3.g|0},${c3.b|0},${posCur[2].a * 0.78}) 20%,
  rgba(${c3.r|0},${c3.g|0},${c3.b|0},${posCur[2].a * 0.42}) 46%,
  rgba(${c3.r|0},${c3.g|0},${c3.b|0},${posCur[2].a * 0.18}) 78%,
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

radial-gradient(circle at ${accentPosCur.x}% ${accentPosCur.y}%,
  rgba(${accentCur.r|0},${accentCur.g|0},${accentCur.b|0},${accentPosCur.a}) 0%,
  rgba(${accentCur.r|0},${accentCur.g|0},${accentCur.b|0},${accentPosCur.a * 0.82}) 10%,
  rgba(${accentCur.r|0},${accentCur.g|0},${accentCur.b|0},${accentPosCur.a * 0.42}) 22%,
  transparent ${accentPosCur.s}%),

radial-gradient(ellipse at ${streakCur.x}% ${streakCur.y}%,
  rgba(${accentCur.r|0},${accentCur.g|0},${accentCur.b|0},${streakCur.a}) 0%,
  rgba(${accentCur.r|0},${accentCur.g|0},${accentCur.b|0},${streakCur.a * 0.55}) 14%,
  transparent ${streakCur.s}%),

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

    accentPosTgt.x = clamp(accentPosTgt.x + rand(-2, 2), 10, 90);
    accentPosTgt.y = clamp(accentPosTgt.y + rand(-2, 2), 12, 88);
    streakTgt.x = clamp(streakTgt.x + rand(-3, 3), 8, 92);
    streakTgt.y = clamp(streakTgt.y + rand(-3, 3), 10, 90);
  }

  function tick(now) {
    if (!nextDrift) nextDrift = now + 6200;

    if (now >= nextDrift) {
      pickDrift();
      nextDrift = now + rand(5200, 8600);
    }

    for (let i = 0; i < N; i++) {
      cur[i].r += (tgt[i].r - cur[i].r) * 0.018;
      cur[i].g += (tgt[i].g - cur[i].g) * 0.018;
      cur[i].b += (tgt[i].b - cur[i].b) * 0.018;

      powerCur[i] += (powerTgt[i] - powerCur[i]) * 0.018;
      coreCur[i] += (coreTgt[i] - coreCur[i]) * 0.022;

      posCur[i].x += (posTgt[i].x - posCur[i].x) * 0.014;
      posCur[i].y += (posTgt[i].y - posCur[i].y) * 0.014;
      posCur[i].s += (posTgt[i].s - posCur[i].s) * 0.014;
      posCur[i].a += (posTgt[i].a - posCur[i].a) * 0.016;

      powerTgt[i] = clamp(powerTgt[i] - 0.0000018, 0.56, 1.80);
      coreTgt[i]  = clamp(coreTgt[i]  - 0.0000030, 0.40, 2.30);
    }

    accentCur.r += (accentTgt.r - accentCur.r) * 0.090;
    accentCur.g += (accentTgt.g - accentCur.g) * 0.090;
    accentCur.b += (accentTgt.b - accentCur.b) * 0.090;

    accentPosCur.x += (accentPosTgt.x - accentPosCur.x) * 0.040;
    accentPosCur.y += (accentPosTgt.y - accentPosCur.y) * 0.040;
    accentPosCur.s += (accentPosTgt.s - accentPosCur.s) * 0.034;
    accentPosCur.a += (accentPosTgt.a - accentPosCur.a) * 0.085;

    streakCur.x += (streakTgt.x - streakCur.x) * 0.050;
    streakCur.y += (streakTgt.y - streakCur.y) * 0.050;
    streakCur.s += (streakTgt.s - streakCur.s) * 0.034;
    streakCur.a += (streakTgt.a - streakCur.a) * 0.080;

    accentPosTgt.a = clamp(accentPosTgt.a - 0.0000004, 0.38, 0.62);
    streakTgt.a = clamp(streakTgt.a - 0.0000008, 0.24, 0.42);

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

            const darkWeight = lum < 85 ? 1.06 : 1;
            const vividWeight = 1 + sat * 0.028;
            const neutralPenalty = sat < 18 ? 0.92 : 1;

            bucket.score += vividWeight * darkWeight * neutralPenalty;
          }

          const palette = [...buckets.values()]
            .filter(x => x.n > 4)
            .map(x => ({
              rgb: { r: x.r / x.n, g: x.g / x.n, b: x.b / x.n },
              n: x.n,
              score: x.score
            }))
            .sort((a, b) => (b.n + b.score) - (a.n + a.score));

          const dominant = palette[0]?.rgb || BASE;
          const accents = [];

          for (const item of palette.slice(1)) {
            const rgb = item.rgb;
            if (colorDist(rgb, dominant) < 22) continue;
            if (accents.length && colorDist(rgb, accents[0]) < 20) continue;
            accents.push(rgb);
            if (accents.length >= 3) break;
          }

          while (accents.length < 3) accents.push(accents[accents.length - 1] || dominant);

          let accent = dominant;
          let bestAccentScore = -1;

          for (const item of palette) {
            const rgb = item.rgb;
            const sat = saturation(rgb);
            const lum = luminance(rgb);

            const accentScore =
              sat * 1.0 +
              (lum > 185 ? 10 : 0) +
              (item.n < 42 ? 10 : 0);

            if (accentScore > bestAccentScore) {
              bestAccentScore = accentScore;
              accent = rgb;
            }
          }

          const result = {
            dominant: stylize(dominant),
            alt1: stylize(accents[0]),
            alt2: stylize(accents[1]),
            alt3: stylize(accents[2]),
            accent: stylizeAccent(accent)
          };

          cache.set(src, result);
          resolve(result);
        } catch {
          const fallback = {
            dominant: stylize(BASE),
            alt1: stylize(BASE),
            alt2: stylize(BASE),
            alt3: stylize(BASE),
            accent: stylizeAccent({ r: 255, g: 255, b: 255 })
          };
          cache.set(src, fallback);
          resolve(fallback);
        }
      };

      img.onerror = () => {
        const fallback = {
          dominant: stylize(BASE),
          alt1: stylize(BASE),
          alt2: stylize(BASE),
          alt3: stylize(BASE),
          accent: stylizeAccent({ r: 255, g: 255, b: 255 })
        };
        cache.set(src, fallback);
        resolve(fallback);
      };

      img.src = src;
    });
  }

  async function extractAccentFromVisible(visible) {
    const candidates = [];

    for (const entry of visible.slice(0, 8)) {
      const img = entry.target;
      const src = img ? (img.currentSrc || img.src) : null;
      if (!src) continue;

      try {
        const pal = await extractDominantPalette(src);

        const local = [
          pal.accent,
          pal.alt1,
          pal.alt2,
          pal.alt3,
          pal.dominant
        ].filter(Boolean);

        for (const rgb of local) {
          const sat = Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b);
          const lum = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;

          const vividScore =
            sat * 1.35 +
            (lum > 170 ? 14 : 0) +
            (entry.intersectionRatio || 0) * 18;

          candidates.push({
            rgb,
            score: vividScore,
            rect: img.getBoundingClientRect()
          });
        }
      } catch {}
    }

    if (!candidates.length) {
      return {
        rgb: stylizeAccent({ r: 255, g: 255, b: 255 }),
        rect: null
      };
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  }

  function schedulePick() {
    clearTimeout(timer);
    timer = setTimeout(pick, 180);
  }

  async function pick() {
    const visible = Array.from(lastEntries.values())
      .filter(e => e && e.isIntersecting && e.target)
      .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))
      .slice(0, 8);

    if (!visible.length) return;

    const main = visible[0];
    const mainImg = main.target;
    const mainSrc = mainImg ? (mainImg.currentSrc || mainImg.src) : null;
    if (!mainSrc) return;

    const palette = await extractDominantPalette(mainSrc);
    const mainRect = mainImg.getBoundingClientRect();
    const center = viewportPercentFromRect(mainRect);

    const dominant = palette.dominant || stylize(BASE);
    tgt[0] = {
      r: tgt[0].r * 0.56 + dominant.r * 0.44,
      g: tgt[0].g * 0.56 + dominant.g * 0.44,
      b: tgt[0].b * 0.56 + dominant.b * 0.44
    };

    posTgt[0].x = clamp(center.x - 8, 8, 92);
    posTgt[0].y = clamp(center.y - 6, 10, 90);
    posTgt[0].s = clamp(108 + (main.intersectionRatio || 0) * 14, 100, 126);
    posTgt[0].a = clamp(0.78 + (main.intersectionRatio || 0) * 0.12, 0.78, 0.94);

    powerTgt[0] = clamp(powerTgt[0] + 0.58 + (main.intersectionRatio || 0) * 0.24, 0.56, 1.80);
    coreTgt[0]  = clamp(coreTgt[0]  + 0.84 + (main.intersectionRatio || 0) * 0.34, 0.40, 2.30);

    const altA = palette.alt1 || palette.alt3 || dominant;
    const altB = palette.alt2 || palette.alt3 || dominant;

    tgt[1] = {
      r: tgt[1].r * 0.58 + altA.r * 0.42,
      g: tgt[1].g * 0.58 + altA.g * 0.42,
      b: tgt[1].b * 0.58 + altA.b * 0.42
    };

    tgt[2] = {
      r: tgt[2].r * 0.58 + altB.r * 0.42,
      g: tgt[2].g * 0.58 + altB.g * 0.42,
      b: tgt[2].b * 0.58 + altB.b * 0.42
    };

    posTgt[1].x = clamp(center.x + 10, 8, 92);
    posTgt[1].y = clamp(center.y - 4, 10, 90);
    posTgt[1].s = clamp(102 + (main.intersectionRatio || 0) * 12, 96, 120);
    posTgt[1].a = clamp(0.70 + (main.intersectionRatio || 0) * 0.10, 0.70, 0.88);

    posTgt[2].x = clamp(center.x + 2, 8, 92);
    posTgt[2].y = clamp(center.y + 12, 10, 90);
    posTgt[2].s = clamp(100 + (main.intersectionRatio || 0) * 12, 94, 118);
    posTgt[2].a = clamp(0.66 + (main.intersectionRatio || 0) * 0.10, 0.66, 0.84);

    powerTgt[1] = clamp(powerTgt[1] + 0.44 + (main.intersectionRatio || 0) * 0.18, 0.56, 1.80);
    coreTgt[1]  = clamp(coreTgt[1]  + 0.60 + (main.intersectionRatio || 0) * 0.24, 0.40, 2.30);

    powerTgt[2] = clamp(powerTgt[2] + 0.44 + (main.intersectionRatio || 0) * 0.18, 0.56, 1.80);
    coreTgt[2]  = clamp(coreTgt[2]  + 0.60 + (main.intersectionRatio || 0) * 0.24, 0.40, 2.30);

    const accentPick = await extractAccentFromVisible(visible);
    const accentRgb = accentPick.rgb || stylizeAccent({ r: 255, g: 255, b: 255 });

    accentTgt = accentRgb;

    let accentCenter = center;
    if (accentPick.rect) {
      accentCenter = viewportPercentFromRect(accentPick.rect);
    }

    accentPosTgt.x = clamp(accentCenter.x + rand(-6, 6), 10, 90);
    accentPosTgt.y = clamp(accentCenter.y + rand(-6, 6), 12, 88);
    accentPosTgt.s = 13 + rand(-2, 3);
    accentPosTgt.a = 0.54;

    streakTgt.x = clamp(accentCenter.x + rand(-10, 10), 8, 92);
    streakTgt.y = clamp(accentCenter.y + rand(-8, 8), 10, 90);
    streakTgt.s = 8 + rand(-1, 2);
    streakTgt.a = 0.34;
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