// js/past-events-coverflow_NEW.js
// Builds Swiper coverflow inside #coverflow using events from window.WT_PAST_EVENTS_JSON (default: events.json).
// Does NOT touch your share scripts.

(function () {
  async function loadEvents(){
    const path = window.WT_PAST_EVENTS_JSON || "events.json";
    const res = await fetch(path, { cache: "no-cache" });
    if(!res.ok) throw new Error("events json not found: " + path);
    return await res.json();
  }

  function buildSlides(data, slot){
    const wrap = document.createElement("div");
    wrap.className = "swiper-wrapper";

    data.forEach(item => {
      const slide = document.createElement("div");
      slide.className = "swiper-slide";

      const img = document.createElement("img");
      img.className = "poster";
      img.src = item.image;
      img.alt = item.title || "";

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

      wrap.appendChild(slide);
    });

    slot.innerHTML = "";
    slot.appendChild(wrap);
  }

  function bindNav(swiper){
    const nav = document.getElementById("wtCarouselNav");
    if(!nav) return;

    nav.addEventListener("click", (e) => {
      const prev = e.target && e.target.closest ? e.target.closest(".wtNavPrev") : null;
      const next = e.target && e.target.closest ? e.target.closest(".wtNavNext") : null;
      if(prev){ e.preventDefault(); swiper.slidePrev(); }
      if(next){ e.preventDefault(); swiper.slideNext(); }
    });

    nav.addEventListener("wt:click", (e) => {
      const t = e.target;
      if(t && t.closest && t.closest(".wtNavPrev")) swiper.slidePrev();
      if(t && t.closest && t.closest(".wtNavNext")) swiper.slideNext();
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("coverflow");
    const slot = document.getElementById("carouselSlot");
    if(!container || !slot) return;

    let data;
    try{
      data = await loadEvents();
    }catch(err){
      console.warn(err);
      return;
    }
    if(!Array.isArray(data)) return;

    data.sort((a,b) => new Date(b.date) - new Date(a.date));

    buildSlides(data, slot);

    const swiper = new Swiper(container, {
      effect: "coverflow",
      centeredSlides: true,
      slidesPerView: "auto",
      loop: false,
      grabCursor: true,
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