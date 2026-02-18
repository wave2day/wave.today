// js/past-events-coverflow_BASE_FINAL.js
// Coverflow carousel fed from ONE JSON location: <WT_BASE>/data/events.json
// Does NOT touch share.js or share-actions.js.

(function () {

  function basePath(){
    const b = (window.WT_BASE || "./").toString();
    return b.endsWith("/") ? b : (b + "/");
  }

  async function loadEvents(){
    const path = basePath() + "data/events.json";
    const res = await fetch(path, { cache: "no-cache" });
    if(!res.ok){
      console.error("[past-events] JSON not found:", path, res.status);
      return [];
    }
    try { return await res.json(); }
    catch(e){ console.error("[past-events] JSON parse error:", e); return []; }
  }

  function fillSlides(data, wrapper){
    wrapper.innerHTML = "";
    if(!wrapper.classList.contains("swiper-wrapper")) wrapper.classList.add("swiper-wrapper");

    data.forEach(item => {
      const slide = document.createElement("div");
      slide.className = "swiper-slide";

      const img = document.createElement("img");
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

      wrapper.appendChild(slide);
    });
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
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if(typeof Swiper === "undefined"){
      console.error("[past-events] Swiper not loaded");
      return;
    }

    const container = document.getElementById("coverflow");
    const wrapper = document.getElementById("carouselSlot");
    if(!container || !wrapper){
      console.error("[past-events] Missing #coverflow or #carouselSlot");
      return;
    }

    const data = await loadEvents();
    if(!Array.isArray(data) || data.length === 0){
      console.error("[past-events] No events loaded");
      return;
    }

    data.sort((a,b) => new Date(b.date) - new Date(a.date));
    fillSlides(data, wrapper);

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