// js/past-events-coverflow.js
(function () {

  async function loadEvents(){
    const path = window.WT_PAST_EVENTS_JSON || "events.json";
    const res = await fetch(path);
    return await res.json();
  }

  function createSlide(item){
    const slide = document.createElement("div");
    slide.className = "swiper-slide";

    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.title || "";

    slide.appendChild(img);
    return slide;
  }

  function initSwiper(){
    return new Swiper("#wtPastEventsSwiper", {
      effect: "coverflow",
      centeredSlides: true,
      slidesPerView: "auto",
      loop: false,
      coverflowEffect: {
        rotate: 0,
        stretch: 0,
        depth: 200,
        modifier: 1,
        slideShadows: false
      }
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const data = await loadEvents();
    const slot = document.getElementById("carouselSlot");

    if (!slot || !Array.isArray(data)) return;

    // nejnovější první
    data.sort((a,b) => new Date(b.date) - new Date(a.date));

    data.forEach(item => {
      slot.appendChild(createSlide(item));
    });

    initSwiper();
  });

})();
