
function randomizeVars(){
  const posters = document.querySelectorAll('#eventsGrid.randomMode .poster');

  posters.forEach(el => {
    const tx = (Math.random()*2 - 1) * 6;   // small horizontal shift
    const ty = (Math.random()*2 - 1) * 8;   // small vertical shift
    const rot = (Math.random()*2 - 1) * 0.5; // mild tilt
    const scl = 1;

    el.style.setProperty('--tx', tx + 'px');
    el.style.setProperty('--ty', ty + 'px');
    el.style.setProperty('--rot', rot + 'deg');
    el.style.setProperty('--scl', scl);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  randomizeVars();
});
