// wt-upcoming.js — pouze UPCOMING (bez zásahů do okna/panelu)
(() => {
  const root = document.getElementById('wtUpcoming');
  if (!root) return;

  const img = root.querySelector('.wtPoster img');
  const label = root.querySelector('.wtDateLabel');

  // Klik na label = nic neotevírá
  if (label) {
    label.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  const setReady = () => root.classList.add('is-ready');

  if (img) {
    if (img.complete && img.naturalWidth > 0) {
      requestAnimationFrame(() => requestAnimationFrame(setReady));
    } else {
      img.addEventListener('load', () => {
        requestAnimationFrame(() => requestAnimationFrame(setReady));
      }, { once: true });

      setTimeout(() => {
        if (!root.classList.contains('is-ready')) setReady();
      }, 1800);
    }
  } else {
    setReady();
  }
})();
