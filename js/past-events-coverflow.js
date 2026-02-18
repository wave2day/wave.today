// js/past-events-coverflow_NEW.js
// Swiper coverflow for the Past Events window.
// Reads events from window.WT_PAST_EVENTS_JSON (default: events.json).
// Does NOT touch share.js.

(function () {
  async function loadEvents(){
    const path = window.WT_PAST_EVENTS_JSON || "events.json";
    const res = await fetch(path, { cache: "no-cache" });
    if(!res.ok) throw new Error("events json not found: " + path);
    return await res.json();
  }

  function buildSlides(data, wrapper){
    // Make sure wrapper is the real Swiper wrapper (direct child of container)
    wrapper.classList.add("swiper-wrapper");
    wrapper.innerHTML = "";

    data.forEach(item => {
      const slide = document.createElement("div");
      slide.className = "swiper-slide";

      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.title || "";
      img.loading = "lazy";

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
    });
  }

  function bindNav(swiper){
    const nav = document.getElementById("wtCarouselNav");
    if(!nav) return;

    nav.addEventListener("click", (e) => {
      if(e.target && e.target.closest && e.target.closest(".wtNavPrev")) {
        e.preventDefault();
        swiper.slidePrev();
      }
      if(e.target && e.target.closest && e.target.closest(".wtNavNext")) {
        e.preventDefault();
        swiper.slideNext();
      }
    }, true);

    // If your arrow module dispatches custom events
    nav.addEventListener("wt:click", (e) => {
      const t = e.target;
      if(t && t.closest && t.closest(".wtNavPrev")) swiper.slidePrev();
      if(t && t.closest && t.closest(".wtNavNext")) swiper.slideNext();
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("coverflow");
    const wrapper = document.getElementById("carouselSlot"); // will become .swiper-wrapper
    if(!container || !wrapper) return;

    let data;
    try{
      data = await loadEvents();
    }catch(err){
      console.warn("[coverflow] " + err.message);
      return;
    }
    if(!Array.isArray(data)) return;

    data.sort((a,b) => new Date(b.date) - new Date(a.date));
    buildSlides(data, wrapper);

    const swiper = new Swiper("#coverflow", {
      effect: "coverflow",
      centeredSlides: true,
      slidesPerView: "auto",
      loop: false,
      grabCursor: true,
      watchOverflow: true,
      coverflowEffect: {
        rotate: 0,
        stretch: 0,
        depth: 240,
        modifier: 1,
        slideShadows: false
      }
    });

    bindNav(swiper);
  });
})();