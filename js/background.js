const leds = [...document.querySelectorAll('.led')];
const panel = document.getElementById('panel');
const panelLight = document.getElementById('panelLight');

const sand  = document.getElementById('glass1');
const prism = document.getElementById('glass2');
const bloom = document.getElementById('bloomLayer');
const bounce = document.getElementById('bounceLayer');

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

function setVisible(el, on){ el.style.display = on ? "block" : "none"; }
function setLayer(el, on){
  el.style.visibility = on ? "visible" : "hidden";
  el.style.opacity = on ? "1" : "0";
}

function apply(){
  const sandOn    = leds[0].dataset.on === "1"; // yellow
  const prismOn   = leds[1].dataset.on === "1"; // magenta
  const ambientOn = leds[2].dataset.on === "1"; // cyan

  setVisible(sand, sandOn);
  setVisible(prism, prismOn);
  setLayer(bounce, prismOn);
  setLayer(bloom, ambientOn);
}

leds.forEach(l=>{
  l.addEventListener('click', ()=>{
    l.dataset.on = (l.dataset.on === '1') ? '0' : '1';
    updatePanelLight();
    apply();
  });
});

updatePanelLight();
apply();
