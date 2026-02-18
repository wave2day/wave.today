// js/past-events-coverflow.js
// One JSON location: /data/events.json
// Works on root, subpages and GitHub Pages

(function () {

  async function loadEvents(){

    // BASE path (set once in HTML)
    const base = (window.WT_BASE || "./").replace(/\/?$/, "/");

    // Final JSON path
    const path = base + "data/events.json";

    const res = await fetch(path, { cache: "no-cache" });

    if(!res.ok){
      console.error("Events JSON not found:", path);
      return [];
    }

    return await res.json();
  }

  function buildSlides(data, slot){

    slot.innerHTML = "";
    slot.classList.add("swiper-wrapper");

    data.forEach(item => {

      const slide = document.createElement("div");
      slide.className = "swiper-slide";

      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.title || "";

      slide.appendChild(img);
      slot.appendChild(slide);
    });
  }

  function initSwiper(){
    return new Swiper("#coverflow", {
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
  }

  document.addEventListener("DOMContentLoaded", async () => {

    if(typeof Swiper === "undefined"){
      console.error("Swiper not loaded");
      return;
    }

    const container = document.getElementById("coverflow");
    const slot = document.getElementById("carouselSlot");

    if(!container || !slot){
      console.error("Carousel elements missing");
      return;
    }

    const data = await loadEvents();

    if(!Array.isArray(data) || data.length === 0){
      console.error("No events loaded");
      return;
    }

    // newest first
    data.sort((a,b) => new Date(b.date) - new Date(a.date));

    buildSlides(data, slot);
    initSwiper();
  });

})();
