// js/past-events-coverflow.js
// Coverflow feel 1:1 podle wt-coverflow-feel-exact.html
// - načítá data z data/events.json (nebo window.WT_PAST_EVENTS_JSON pokud je nastaveno)
// - vygeneruje slidy do #carouselSlot uvnitř #coverflow
// - inicializuje Swiper s parametry přesně jako reference
// - napojí šipky (prev/next) na víc možných selektorů
// - neřeší label ani share

(function () {
  const DEFAULT_JSON = "data/events.json";

  function q(sel, root = document) { return root.querySelector(sel); }
  function qa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  async function loadEvents() {
    const path = (window.WT_PAST_EVENTS_JSON || DEFAULT_JSON);
    const res = await fetch(path, { cache: "no-cache" });
    if (!res.ok) {
      console.error("[coverflow] JSON not found:", path, res.status);
      return [];
    }
    try { return await res.json(); }
    catch (e) { console.error("[coverflow] JSON parse error:", e); return []; }
  }

  function buildSlides(events, wrapper) {
    wrapper.innerHTML = "";
    wrapper.classList.add("swiper-wrapper");

    // nejnovější první
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    for (const item of events) {
      const slide = document.createElement("div");
      slide.className = "swiper-slide";

      const img = document.createElement("img");
      img.className = "poster";
      img.loading = "lazy";
      img.alt = item.title || "";
      img.src = item.image;

      if (item.link) {
        const a = document.createElement("a");
        a.href = item.link;
        a.target = "_blank";
        a.rel = "noopener";
        a.appendChild(img);
        slide.appendChild(a);
      } else {
        slide.appendChild(img);
      }

      wrapper.appendChild(slide);
    }
  }

  function bindArrows(swiper) {
    // Napojení šipek: funguje, pokud tvoje tlačítka mají aspoň jednu z těchto podob.
    const prevSelectors = [
      ".wtNavPrev",
      "#wtCarouselPrev",
      "[data-coverflow-prev]",
      "[data-carousel-prev]",
      "[data-action='prev']",
      "[aria-label='Previous']"
    ];

    const nextSelectors = [
      ".wtNavNext",
      "#wtCarouselNext",
      "[data-coverflow-next]",
      "[data-carousel-next]",
      "[data-action='next']",
      "[aria-label='Next']"
    ];

    const prevBtns = prevSelectors.flatMap(s => qa(s));
    const nextBtns = nextSelectors.flatMap(s => qa(s));

    prevBtns.forEach(btn => {
      btn.addEventListener("click", (e) => { e.preventDefault(); swiper.slidePrev(); }, { passive: false });
      btn.addEventListener("touchend", (e) => { e.preventDefault(); swiper.slidePrev(); }, { passive: false });
    });

    nextBtns.forEach(btn => {
      btn.addEventListener("click", (e) => { e.preventDefault(); swiper.slideNext(); }, { passive: false });
      btn.addEventListener("touchend", (e) => { e.preventDefault(); swiper.slideNext(); }, { passive: false });
    });

    // Pokud máš starší inline systém, který dispatchuje:
    // window.dispatchEvent(new CustomEvent("wt:click", { detail: { name: "prev" } }))
    window.addEventListener("wt:click", (e) => {
      const name = e && e.detail ? e.detail.name : "";
      if (name === "prev") swiper.slidePrev();
      if (name === "next") swiper.slideNext();
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (typeof Swiper === "undefined") {
      console.error("[coverflow] Swiper not loaded");
      return;
    }

    const container = q("#coverflow");
    const wrapper = q("#carouselSlot");

    if (!container || !wrapper) {
      console.error("[coverflow] Missing #coverflow or #carouselSlot");
      return;
    }

    const events = await loadEvents();
    if (!Array.isArray(events) || events.length === 0) {
      console.error("[coverflow] No events loaded");
      return;
    }

    buildSlides(events, wrapper);

    // init až po vložení slidů do DOM
    requestAnimationFrame(() => {
      const swiper = new Swiper(container, {
        effect: "coverflow",
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

      bindArrows(swiper);
    });
  });

})();
