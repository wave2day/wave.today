/* WT Past Events Coverflow
   - builds slides from your past events JSON
   - uses existing WT arrow buttons which dispatch `wt:click` (prev/next)
   - does NOT touch share.js / share-actions.js
*/
(() => {
  const SLOT_ID = 'carouselSlot';
  const SWIPER_ID = 'coverflow';

  const slot = document.getElementById(SLOT_ID);
  const swiperRoot = document.getElementById(SWIPER_ID);

  if (!slot || !swiperRoot) return;

  // Allow override without editing this file:
  // window.WT_PAST_EVENTS_JSON = 'assets/.../your-file.json'
  const jsonUrl = window.WT_PAST_EVENTS_JSON || 'assets/data/past-events.json';

  const toDate = (s) => {
    // expects YYYY-MM-DD; fallback keeps stable ordering
    const t = Date.parse(s);
    return Number.isFinite(t) ? t : -Infinity;
  };

  const build = (items) => {
    const valid = (Array.isArray(items) ? items : [])
      .filter(e => e && typeof e === 'object' && e.image)
      // newest first
      .sort((a, b) => toDate(b.date) - toDate(a.date));

    // Swiper DOM
    const wrap = document.createElement('div');
    wrap.className = 'swiper-wrapper';

    valid.forEach((e) => {
      const slide = document.createElement('div');
      slide.className = 'swiper-slide';

      const img = document.createElement('img');
      img.className = 'poster';
      img.loading = 'lazy';
      img.alt = e.title || '';
      img.src = e.image;

      // optional: click opens link if provided
      if (e.link) {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
          try { window.open(e.link, '_blank', 'noopener'); } catch (_) {}
        });
      }

      slide.appendChild(img);
      wrap.appendChild(slide);
    });

    // If nothing, keep the reserved height (so layout doesn't jump)
    slot.innerHTML = '';
    if (!valid.length) {
      const ph = document.createElement('div');
      ph.className = 'placeholder';
      ph.textContent = 'No past events yet.';
      slot.appendChild(ph);
      return null;
    }

    slot.appendChild(wrap);

    if (typeof window.Swiper === 'undefined') {
      // Library not loaded – leave as static strip (still shows first image)
      return null;
    }

    const swiper = new window.Swiper('#' + SWIPER_ID, {
      effect: 'coverflow',
      centeredSlides: true,
      slidesPerView: 1.8,
      grabCursor: true,
      speed: 560,
      coverflowEffect: {
        rotate: 22,
        stretch: 0,
        depth: 160,
        modifier: 1.18,
        slideShadows: false
      }
    });

    // Connect to your existing arrow buttons which emit `wt:click`
    window.addEventListener('wt:click', (ev) => {
      const name = ev?.detail?.name;
      if (name === 'prev') swiper.slidePrev();
      if (name === 'next') swiper.slideNext();
    });

    // Optional: idle return to first slide (same feel as the old widget)
    let idleTimer;
    const IDLE_DELAY = 4500;
    const reset = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (swiper.activeIndex !== 0) swiper.slideTo(0, 3000);
      }, IDLE_DELAY);
    };
    swiper.on('touchEnd', reset);
    swiper.on('slideChange', reset);
    reset();

    return swiper;
  };

  const boot = async () => {
    // If page already provides data, use it
    if (Array.isArray(window.WT_PAST_EVENTS)) {
      build(window.WT_PAST_EVENTS);
      return;
    }

    try {
      const res = await fetch(jsonUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      build(data);
    } catch (err) {
      // keep reserved height + show placeholder text (no console noise)
      slot.innerHTML = '';
      const ph = document.createElement('div');
      ph.className = 'placeholder';
      ph.textContent = 'Past events JSON not found: ' + jsonUrl;
      slot.appendChild(ph);
    }
  };

  boot();
})();
