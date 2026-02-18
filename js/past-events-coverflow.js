// js/past-events-coverflow_WT_FINAL.js
// Uses ONE JSON: <WT_BASE>/data/events.json
// Keeps your existing share + QR modules untouched.

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
      img.className = "poster";
      img.src = item.image;
      img.alt = item.title || "";

      if(item.link){
        const a = document.createElement("a");
        a.href = item.link;
        a.target = "_self";
        a.rel = "noopener";
        a.appendChild(img);
        slide.appendChild(a);
      } else {
        slide.appendChild(img);
      }

      wrapper.appendChild(slide);
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

    // Your inline code dispatches window event: wt:click with detail.name = prev/next
    window.addEventListener("wt:click", (e) => {
      const name = e && e.detail ? e.detail.name : "";
      if(name === "prev") swiper.slidePrev();
      if(name === "next") swiper.slideNext();
    });
  });
})();