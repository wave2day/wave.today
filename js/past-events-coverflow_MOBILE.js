// js/past-events-coverflow.js
// Past Events coverflow carousel powered by Swiper.
// Reads data from window.WT_PAST_EVENTS_JSON (default: events.json).
// Does NOT touch share.js / share-actions.js.

(function () {
  async function loadEvents(){
    const path = window.WT_PAST_EVENTS_JSON || "events.json";
    const res = await fetch(path, { cache: "no-cache" });
    if(!res.ok) throw new Error("Cannot load events JSON: " + path);
    return await res.json();
  }

  function buildSlides(data){
    const wrapper = document.getElementById("carouselSlot");
    if(!wrapper) return null;

    wrapper.innerHTML = "";

    data.forEach(item => {
      const slide = document.createElement("div");
      slide.className = "swiper-slide";

      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.title || "";
      img.loading = "lazy";

      // If you want fullscreen poster open later, leave as img only.
      // If you want link-out when link is present:
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

    return wrapper;
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

    // If your arrows dispatch custom events
    nav.addEventListener("wt:click", (e) => {
      const t = e.target;
      if(t && t.closest && t.closest(".wtNavPrev")) swiper.slidePrev();
      if(t && t.closest && t.closest(".wtNavNext")) swiper.slideNext();
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if(typeof Swiper === "undefined") return;

    const container = document.getElementById("coverflow");
    const wrapper = document.getElementById("carouselSlot");
    if(!container || !wrapper) return;

    let data;
    try{
      data = await loadEvents();
    }catch(err){
      console.warn(err);
      return;
    }
    if(!Array.isArray(data)) return;

    // newest first
    data.sort((a,b) => new Date(b.date) - new Date(a.date));

    buildSlides(data);

    const swiper = new Swiper(container, {
      effect: "coverflow",
      centeredSlides: true,
      slidesPerView: "auto",
      grabCursor: true,
      loop: false,
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