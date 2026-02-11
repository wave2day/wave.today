const base   = document.getElementById("myVideo");
const bloom  = document.getElementById("bloomVideo");
const bounce = document.getElementById("bounceVideo");

const sand   = document.querySelector(".sandGlass");
const prism  = document.querySelector(".prismGlass");

const panel      = document.getElementById("panel");
const panelLight = document.getElementById("panelLight");

// deterministicky podle tříd (žádné leds[0]/[1]/[2])
const ledY = document.querySelector("#ledWrapper .led.y");
const ledM = document.querySelector("#ledWrapper .led.m");
const ledC = document.querySelector("#ledWrapper .led.c");

function isOn(el){ return el && el.dataset.on === "1"; }
function toggle(el){ if(el) el.dataset.on = isOn(el) ? "0" : "1"; }

function setVisible(el, on){
  if(!el) return;
  el.style.display = on ? "block" : "none";
}

function setVideoLayer(v, on){
  if(!v) return;

  v.style.visibility = on ? "visible" : "hidden";
  v.style.opacity = on ? "" : "0";

  if(on){
    if(base && base.readyState >= 2 && v.readyState >= 2){
      const diff = Math.abs(base.currentTime - v.currentTime);
      if(diff > 0.45) v.currentTime = base.currentTime;
    }
    v.play().catch(()=>{});
  }else{
    v.pause();
  }
}

function updatePanelLight(){
  if(!panel || !panelLight || !ledY || !ledM || !ledC) return;

  const tY = getComputedStyle(ledY).getPropertyValue('--rimTint').trim() || "255,255,255";
  const tM = getComputedStyle(ledM).getPropertyValue('--rimTint').trim() || "255,255,255";
  const tC = getComputedStyle(ledC).getPropertyValue('--rimTint').trim() || "255,255,255";

  panel.style.setProperty('--L1', tY);
  panel.style.setProperty('--L2', tM);
  panel.style.setProperty('--L3', tC);

  const k = (isOn(ledY)?1:0) + (isOn(ledM)?1:0) + (isOn(ledC)?1:0);

  const rootStyle = getComputedStyle(document.documentElement);
  const baseO = parseFloat(rootStyle.getPropertyValue('--panelInterferenceBase')) || 0.18;
  const step  = parseFloat(rootStyle.getPropertyValue('--panelInterferenceStep')) || 0.28;

  panelLight.style.opacity = (baseO + step * k).toFixed(2);
}

function applyBackground(){
  const sandOn    = isOn(ledY); // žlutá -> sand
  const prismOn   = isOn(ledM); // růžová -> prism + bounce
  const ambientOn = isOn(ledC); // modrá -> bloom

  setVisible(sand, sandOn);
  setVisible(prism, prismOn);

  setVideoLayer(bounce, prismOn);
  setVideoLayer(bloom, ambientOn);
}

// jemné synchronizování vrstev s base videem
function syncOnce(){
  if(!base || base.readyState < 2) return;

  if(bloom && bloom.style.visibility !== "hidden" && bloom.readyState >= 2){
    const d = base.currentTime - bloom.currentTime;
    if(Math.abs(d) > 0.12) bloom.currentTime = base.currentTime;
  }
  if(bounce && bounce.style.visibility !== "hidden" && bounce.readyState >= 2){
    const d2 = base.currentTime - bounce.currentTime;
    if(Math.abs(d2) > 0.45) bounce.currentTime = base.currentTime;
  }
}
setInterval(syncOnce, 250);

function hook(el){
  if(!el) return;
  el.addEventListener("click", ()=>{
    toggle(el);
    updatePanelLight();
    applyBackground();
  });
}

hook(ledY);
hook(ledM);
hook(ledC);

// init (vypnuto vše)
if(ledY) ledY.dataset.on = "0";
if(ledM) ledM.dataset.on = "0";
if(ledC) ledC.dataset.on = "0";
updatePanelLight();
applyBackground();
