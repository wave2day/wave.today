/* tilt-addon.js
   Adds subtle tilt everywhere WITHOUT touching your core click/hero logic.
   - In randomMode: does nothing (core randomizeVars already sets --rot)
   - In non-random (date) mode: sets deterministic --rot per poster
*/
(function(){
  const grid = document.getElementById('eventsGrid');
  if(!grid) return;

  function hasRandomMode(){
    return grid.classList.contains('randomMode');
  }

  function deterministicRot(seed){
    // stable pseudo-random in [-0.28, +0.28] deg
    const r = Math.sin(seed * 12.9898) * 43758.5453;
    const u = r - Math.floor(r);
    return (u * 2 - 1) * 0.28;
  }

  function applyTiltNonRandom(){
    if(hasRandomMode()) return;
    const posters = grid.querySelectorAll('.poster');
    posters.forEach((el, i) => {
      const seed = Number(el.dataset.key) || (i + 1);
      const rot = deterministicRot(seed);
      // only touch rotation; keep any existing tx/ty/scale as-is
      el.style.setProperty('--rot', rot.toFixed(2) + 'deg');
      if(!el.style.getPropertyValue('--tx')) el.style.setProperty('--tx', '0px');
      if(!el.style.getPropertyValue('--ty')) el.style.setProperty('--ty', '0px');
      if(!el.style.getPropertyValue('--scl')) el.style.setProperty('--scl', '1');
      if(!el.style.getPropertyValue('--z')) el.style.setProperty('--z', '1');
    });
  }

  // Run after core has rendered posters
  function boot(){
    applyTiltNonRandom();
  }

  // Observe mode switches and re-renders
  const mo = new MutationObserver(() => {
    applyTiltNonRandom();
  });
  mo.observe(grid, { attributes:true, attributeFilter:['class'], childList:true, subtree:false });

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot, { once:true });
  }else{
    boot();
  }
})();
