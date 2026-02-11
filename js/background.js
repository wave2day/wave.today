/* ===== BACKGROUND MODULE (1:1) ===== */
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
    const sandOn    = leds[0].dataset.on === "1"; // yellow
    const prismOn   = leds[1].dataset.on === "1"; // magenta
    const ambientOn = leds[2].dataset.on === "1"; // cyan

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

/* ===== SHARE BUTTON MODULE (1:1) ===== */
const orb      = document.getElementById("shareOrb");
const sheet    = document.getElementById("wtActionSheet");
const back     = document.getElementById("wtSheetBackdrop");
const sentinel = document.getElementById("wtBottomSentinel");

let openedManually = false;
let openedByBottom = false;

// === scroll heuristika pro auto-hide při jízdě nahoru ===
let lastScrollY = window.scrollY || 0;
let maxYSinceOpen = lastScrollY;   // nejnižší mí
let minYSinceOpen = lastScrollY;   // nejvyšší mí
let lastState = false;

// helper: open/close
function showSheet(on){
  if(on){
    sheet.classList.add("show");
    back.classList.add("show");
  }else{
    sheet.classList.remove("show");
    back.classList.remove("show");
  }
  lastState = on;
}

function toggleSheet(){
  const on = !sheet.classList.contains("show");
  openedManually = on;
  openedByBottom = false;
  maxYSinceOpen = window.scrollY || 0;
  minYSinceOpen = maxYSinceOpen;
  showSheet(on);
}

orb?.addEventListener("click", toggleSheet);
back?.addEventListener("click", ()=> {
  openedManually = false;
  openedByBottom = false;
  showSheet(false);
});

// bottom intersection → auto open
if("IntersectionObserver" in window && sentinel){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        if(!openedManually){
          openedByBottom = true;
          maxYSinceOpen = window.scrollY || 0;
          minYSinceOpen = maxYSinceOpen;
          showSheet(true);
        }
      }
    });
  }, {threshold: 1});
  io.observe(sentinel);
}

// scroll logic (auto-hide when user scrolls up enough after reaching bottom)
window.addEventListener("scroll", ()=>{
  const y = window.scrollY || 0;

  if(lastState){
    if(y > maxYSinceOpen) maxYSinceOpen = y;
    if(y < minYSinceOpen) minYSinceOpen = y;

    const up = (maxYSinceOpen - y);

    if(openedByBottom && up > 120){
      openedByBottom = false;
      showSheet(false);
    }
  }

  lastScrollY = y;
}, {passive:true});

// share actions
document.addEventListener("click", (e)=>{
  const btn = e.target.closest(".shareRow");
  if(!btn) return;

  const action = btn.getAttribute("data-action");
  if(action === "share"){
    if(navigator.share){
      navigator.share({title: document.title, url: location.href}).catch(()=>{});
    }
  }else if(action === "instagram"){
    // placeholder action
  }else if(action === "mail"){
    location.href = "mailto:?subject=" + encodeURIComponent(document.title) + "&body=" + encodeURIComponent(location.href);
  }
});
