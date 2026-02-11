/* ===== VIDEO SYNC (odlehčené) ===== */
const base = document.getElementById("myVideo");
const bloom = document.getElementById("bloomVideo");
const bounce = document.getElementById("bounceVideo");

function syncOnce(){
  if(base.readyState < 2) return;

  if(bloom && bloom.style.display !== "none" && bloom.readyState >= 2){
    const d = base.currentTime - bloom.currentTime;
    if(Math.abs(d) > 0.12) bloom.currentTime = base.currentTime;
  }

  if(bounce && bounce.style.display !== "none" && bounce.readyState >= 2){
    const d2 = base.currentTime - bounce.currentTime;
    if(Math.abs(d2) > 0.45) bounce.currentTime = base.currentTime;
  }
}
setInterval(syncOnce, 250);


/* ===== LED PANEL (original logika) ===== */
const leds = [...document.querySelectorAll('.led')];
const panel = document.getElementById('panel');
const panelLight = document.getElementById('panelLight');

function tint(el){
  const v = getComputedStyle(el).getPropertyValue('--rimTint').trim();
  return v || "255,255,255";
}
function rootVar(name){
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;
}
function updatePanelLight(){
  const t = leds.map(tint);
  panel.style.setProperty('--L1', t[0]);
  panel.style.setProperty('--L2', t[1]);
  panel.style.setProperty('--L3', t[2]);

  const k = leds.reduce((n,l)=> n + (l.dataset.on==="1"), 0); // 0..3
  const baseO = rootVar('--panelInterferenceBase');
  const step = rootVar('--panelInterferenceStep');
  panelLight.style.opacity = (baseO + step * k).toFixed(2);
}
leds.forEach(l=>{
  l.addEventListener('click', ()=>{
    l.dataset.on = (l.dataset.on === '1') ? '0' : '1';
    updatePanelLight();
  });
});
updatePanelLight();


/* ===== LED -> BACKGROUND (stejné chování + pauza vrstev při OFF) ===== */
(function(){
  const sand  = document.querySelector('.sandGlass');
  const prism = document.querySelector('.prismGlass');

  const leds = document.querySelectorAll('#ledWrapper .led');
  if(!leds.length) return;

  function setVisible(el, on){
    if(el) el.style.display = on ? "block" : "none";
  }

  function setVideoLayer(v, on){
    if(!v) return;

    // Stabilnější než display none/block (menší šance na "bliknutí" u mix-blend/filter)
    v.style.visibility = on ? "visible" : "hidden";
    v.style.opacity = on ? "" : "0";

    if(on){
      if(base.readyState >= 2 && v.readyState >= 2){
        const diff = Math.abs(base.currentTime - v.currentTime);
        if(diff > 0.45) v.currentTime = base.currentTime;
      }
      v.play().catch(()=>{});
    }else{
      v.pause();
    }
  }

  function apply(){
    const sandOn    = leds[0]?.dataset.on === "1";
    const prismOn   = leds[1]?.dataset.on === "1";
    const ambientOn = leds[2]?.dataset.on === "1";

    setVisible(sand, sandOn);
    setVisible(prism, prismOn);

    setVideoLayer(bounce, prismOn);
    setVideoLayer(bloom, ambientOn);
  }

  leds.forEach(l=>{
    l.addEventListener("click", ()=>setTimeout(apply,0));
  });

  apply();
})();
