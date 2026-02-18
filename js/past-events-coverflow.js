// js/past-events-coverflow.js
// Coverflow "feel" matching wt-coverflow-feel-exact.html (rotate/depth/modifier/speed + idle return)
// - loads ONE JSON: data/events.json (or window.WT_PAST_EVENTS_JSON if set)
// - builds slides into #carouselSlot inside #coverflow
// - binds nav buttons (many selectors) + optional custom event wt:click {detail:{name:'prev'|'next'}}
// - does NOT touch share scripts or label logic

(function () {
  const DEFAULT_JSON = "data/events.json";

  function $(sel, root=document){ return root.querySelector(sel); }
  function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

  async function loadEvents(){
    const path = (window.WT_PAST_EVENTS_JSON || DEFAULT_JSON);
    const res = await fetch(path, { cache: "no-cache" });
    if(!res.ok){
      console.error("[coverflow] JSON not found:", path, res.status);
      return [];
    }
    try { return await res.json(); }
    catch(e){ console.error("[coverflow] JSON parse error:", e); return []; }
  }

  function buildSlides(events, wrapper){
    wrapper.innerHTML = "";
    wrapper.classList.add("swiper-wrapper");

    // newest first
    events.sort((a,b) => new Date(b.date) - new Date(a.date));

    for(const item of events){
      const slide = document.createElement("div");
      slide.className = "swiper-slide";

      const img = document.createElement("img");
      img.className = "poster";
      img.loading = "lazy";
      img.alt = item.title || "";
      img.src = item.image;

      // keep optional link
      if(item.link){
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

  function slidesPerView(){
    // match "feel" but keep mobile sane
    if (window.matchMedia && window.matchMedia("(max-width: 520px)").matches) return 1.25;
    if (window.matchMedia && window.matchMedia("(max-width: 900px)").matches) return 1.55;
    return 1.8;
  }

  function bindNav(swiper){
    // Common selectors (works even if markup changes)
    const prevSelectors = [
      ".wtNavPrev", "#wtCarouselPrev", "[data-coverflow-prev]", "[data-carousel-prev]", "[data-action='prev']"
    ];
    const nextSelectors = [
      ".wtNavNext", "#wtCarouselNext", "[data-coverflow-next]", "[data-carousel-next]", "[data-action='next']"
    ];

    const prevBtns = prevSelectors.flatMap(s => $all(s));
    const nextBtns = nextSelectors.flatMap(s => $all(s));

    prevBtns.forEach(btn => btn.addEventListener("click", (e)=>{ e.preventDefault(); swiper.slidePrev(); }));
    nextBtns.forEach(btn => btn.addEventListener("click", (e)=>{ e.preventDefault(); swiper.slideNext(); }));

    // Your older inline system (if present): window dispatches wt:click with detail.name prev/next
    window.addEventListener("wt:click", (e) => {
      const name = e && e.detail ? e.detail.name : "";
      if(name === "prev") swiper.slidePrev();
      if(name === "next") swiper.slideNext();
    });

    // Keyboard (desktop)
    window.addEventListener("keydown", (e)=>{
      if(e.key === "ArrowLeft") swiper.slidePrev();
      if(e.key === "ArrowRight") swiper.slideNext();
    });
  }

  function bindIdleReturn(swiper){
    let idleTimer;
    const IDLE_DELAY = 4500;

    const reset = ()=>{
      clearTimeout(idleTimer);
      idleTimer = setTimeout(()=>{
        // return to newest (index 0 because we insert newest-first)
        if(swiper.activeIndex !== 0) swiper.slideTo(0, 3000);
      }, IDLE_DELAY);
    };

    swiper.on("touchEnd", reset);
    swiper.on("slideChange", reset);
    swiper.on("transitionEnd", reset);
    reset();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if(typeof Swiper === "undefined"){
      console.error("[coverflow] Swiper not loaded");
      return;
    }

    const container = $("#coverflow");
    const wrapper = $("#carouselSlot");
    if(!container || !wrapper){
      console.error("[coverflow] Missing #coverflow or #carouselSlot");
      return;
    }

    const events = await loadEvents();
    if(!Array.isArray(events) || events.length === 0){
      console.error("[coverflow] No events loaded");
      return;
    }

    buildSlides(events, wrapper);

    // init AFTER DOM has slides
    requestAnimationFrame(() => {
      const swiper = new Swiper(container, {
        effect: "coverflow",
        centeredSlides: true,
        slidesPerView: slidesPerView(),
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

      // keep slidesPerView responsive on resize
      window.addEventListener("resize", ()=>{
        swiper.params.slidesPerView = slidesPerView();
        swiper.update();
      });

      bindNav(swiper);
      bindIdleReturn(swiper);
    });
  });

})();