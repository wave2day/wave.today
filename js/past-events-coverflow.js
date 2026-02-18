// js/past-events-coverflow.js
// Jednoduchá finální verze – načte data a až potom spustí Swiper

document.addEventListener("DOMContentLoaded", async () => {

  const container = document.getElementById("coverflow");
  const wrapper = document.getElementById("carouselSlot");

  if (!container || !wrapper) {
    console.error("[coverflow] missing #coverflow or #carouselSlot");
    return;
  }

  // cesta k JSON
  const jsonPath = "data/events.json";

  let data = [];
  try {
    const res = await fetch(jsonPath);
    data = await res.json();
  } catch (e) {
    console.error("[coverflow] JSON load error", e);
    return;
  }

  if (!Array.isArray(data) || data.length === 0) {
    console.error("[coverflow] empty data");
    return;
  }

  // seřadit od nejnovějších
  data.sort((a, b) => new Date(b.date) - new Date(a.date));

  // vytvořit slidy
  wrapper.innerHTML = "";
  wrapper.classList.add("swiper-wrapper");

  data.forEach(item => {
    const slide = document.createElement("div");
    slide.className = "swiper-slide";

    const img = document.createElement("img");
    img.className = "poster";
    img.src = item.image;
    img.alt = item.title || "";

    slide.appendChild(img);
    wrapper.appendChild(slide);
  });

  // až jsou slidy v DOM → spustit Swiper
  requestAnimationFrame(() => {
    new Swiper(container, {
      effect: "coverflow",
      centeredSlides: true,
      slidesPerView: "auto",
      grabCursor: true,
      coverflowEffect: {
        rotate: 0,
        stretch: 0,
        depth: 250,
        modifier: 1,
        slideShadows: false
      }
    });
  });

});
