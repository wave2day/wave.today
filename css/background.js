// background.js
const base = document.getElementById("myVideo");
const bloom = document.getElementById("bloomVideo");
const bounce = document.getElementById("bounceVideo");

function syncOnce(){
  if(base.readyState < 2) return;

  // bloom stačí jemně
  if(bloom && bloom.style.visibility !== "hidden" && bloom.readyState >= 2){
    const d = base.currentTime - bloom.currentTime;
    if(Math.abs(d) > 0.12) bloom.currentTime = base.currentTime;
  }

  // bounce – méně agresivně (a i tak stabilněji než dřív)
  if(bounce && bounce.style.visibility !== "hidden" && bounce.readyState >= 2){
    const d2 = base.currentTime - bounce.currentTime;
    if(Math.abs(d2) > 0.55) bounce.currentTime = base.currentTime;
  }
}
setInterval(syncOnce, 250);

// LED panel (světlo v panelu)
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

  const k = leds.reduce((n,l)=> n + (l.dataset.on==="1"), 0);
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

// LED -> BACKGROUND (stabilní přepínání bez display none/block u videí)
(function(){
  const sand  = document.querySelector('.sandGlass');
  const prism = document.querySelector('.prismGlass');

  const ledsInPanel = document.querySelectorAll('#ledWrapper .led');
  if(!ledsInPanel.length) return;

  function setVisible(el, on){
    if(el) el.style.display = on ? "block" : "none";
  }
  function setVideoLayer(v, on){
    if(!v) return;

    v.style.visibility = on ? "visible" : "hidden";
    v.style.opacity = on ? "" : "0";

    if(on){
      if(base.readyState >= 2 && v.readyState >= 2){
        const diff = Math.abs(base.currentTime - v.currentTime);
        if(diff > 0.55) v.currentTime = base.currentTime;
      }
      v.play().catch(()=>{});
    }else{
      v.pause();
    }
  }

  function apply(){
    const sandOn    = ledsInPanel[0]?.dataset.on === "1"; // yellow
    const prismOn   = ledsInPanel[1]?.dataset.on === "1"; // magenta
    const ambientOn = ledsInPanel[2]?.dataset.on === "1"; // cyan

    setVisible(sand, sandOn);
    setVisible(prism, prismOn);

    setVideoLayer(bounce, prismOn);
    setVideoLayer(bloom, ambientOn);
  }

  ledsInPanel.forEach(l=>{
    l.addEventListener("click", ()=>setTimeout(apply,0));
  });

  apply();
})();
