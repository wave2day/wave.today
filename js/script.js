// autoplay video
const bg = document.getElementById("bgVideo");
if (bg) {
  bg.play().catch(()=>{});
}

// share logika
const orb = document.getElementById("shareOrb");
const sheet = document.getElementById("wtActionSheet");
const backdrop = document.getElementById("wtSheetBackdrop");

if (orb && sheet && backdrop) {

  function openSheet() {
    sheet.classList.add("open");
    backdrop.classList.add("open");
  }

  function closeSheet() {
    sheet.classList.remove("open");
    backdrop.classList.remove("open");
  }

  orb.addEventListener("click", () => {
    sheet.classList.contains("open") ? closeSheet() : openSheet();
  });

  backdrop.addEventListener("click", closeSheet);
}
