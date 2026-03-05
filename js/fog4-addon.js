/* fog4-addon.js
   4-color ambient fog background
   – scroll mění jen barvy
   – klik nastaví texturu plakátu
*/

(() => {

const grid = document.getElementById('eventsGrid');
const ambient = document.getElementById('ambientBg');
const ambientGlow = document.getElementById('ambientGlow');
const ambientPoster = document.getElementById('ambientPoster');

if(!grid || !ambient || !ambientGlow || !ambientPoster) return;

const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
const FOG_N = 4;

let fogCurrent = Array.from({length:FOG_N},()=>({r:145,g:85,b:255}));
let fogTarget  = Array.from({length:FOG_N},()=>({r:145,g:85,b:255}));
let raf = 0;

function setFogVars(){
 for(let i=0;i<FOG_N;i++){
  const r=Math.round(fogCurrent[i].r);
  const g=Math.round(fogCurrent[i].g);
  const b=Math.round(fogCurrent[i].b);
  ambient.style.setProperty(`--fog${i+1}`,`${r},${g},${b}`);
 }
}

function applyFog(){

 setFogVars();

 ambientGlow.style.background =
 `
 radial-gradient(circle at 30% 35%, rgba(var(--fog1),.34), transparent 58%),
 radial-gradient(circle at 70% 32%, rgba(var(--fog2),.30), transparent 60%),
 radial-gradient(circle at 42% 72%, rgba(var(--fog3),.26), transparent 62%),
 radial-gradient(circle at 78% 76%, rgba(var(--fog4),.22), transparent 64%)
 `;

}

function tick(){

 for(let i=0;i<FOG_N;i++){

  fogCurrent[i].r += (fogTarget[i].r-fogCurrent[i].r)*0.10;
  fogCurrent[i].g += (fogTarget[i].g-fogCurrent[i].g)*0.10;
  fogCurrent[i].b += (fogTarget[i].b-fogCurrent[i].b)*0.10;

 }

 applyFog();

 let d=0;

 for(let i=0;i<FOG_N;i++){

  d+=Math.abs(fogTarget[i].r-fogCurrent[i].r);
  d+=Math.abs(fogTarget[i].g-fogCurrent[i].g);
  d+=Math.abs(fogTarget[i].b-fogCurrent[i].b);

 }

 if(d>2) raf=requestAnimationFrame(tick);
 else raf=0;

}

function setTargets(list){

 const base={r:145,g:85,b:255};

 const L=list?.length?list:[base];

 for(let i=0;i<FOG_N;i++){

  const c=L[i]||L[L.length-1]||base;

  fogTarget[i]={
   r:clamp(c.r,0,255),
   g:clamp(c.g,0,255),
   b:clamp(c.b,0,255)
  };

 }

 if(!raf) raf=requestAnimationFrame(tick);

}

function getAvgRGB(imgUrl){

 return new Promise(resolve=>{

  const img=new Image();
  img.crossOrigin="anonymous";

  img.onload=()=>{

   const c=document.createElement("canvas");
   const ctx=c.getContext("2d");

   const w=32,h=32;
   c.width=w;
   c.height=h;

   ctx.drawImage(img,0,0,w,h);

   const data=ctx.getImageData(0,0,w,h).data;

   let r=0,g=0,b=0,n=0;

   for(let i=0;i<data.length;i+=4){

    const a=data[i+3];
    if(a<32) continue;

    r+=data[i];
    g+=data[i+1];
    b+=data[i+2];

    n++;

   }

   if(!n) return resolve({r:145,g:85,b:255});

   resolve({
    r:r/n,
    g:g/n,
    b:b/n
   });

  };

  img.onerror=()=>resolve({r:145,g:85,b:255});
  img.src=imgUrl;

 });

}


let obs=null;
let lastEntries=new Map();
let t=0;

function schedulePick(){
 clearTimeout(t);
 t=setTimeout(pick,220);
}

async function pick(){

 const entries=[...lastEntries.values()]
 .filter(e=>e.isIntersecting)
 .sort((a,b)=>b.intersectionRatio-a.intersectionRatio)
 .slice(0,FOG_N);

 const srcs=entries.map(e=>e.target.currentSrc||e.target.src);

 if(!srcs.length) return;

 const rgbs=[];

 for(const s of srcs){

  try{
   rgbs.push(await getAvgRGB(s));
  }catch{}

 }

 if(rgbs.length) setTargets(rgbs);

}

function setup(){

 const imgs=[...grid.querySelectorAll(".poster img")];

 obs=new IntersectionObserver(entries=>{

  entries.forEach(e=>lastEntries.set(e.target,e));

  schedulePick();

 },{
  root:null,
  rootMargin:"220px 0px 220px 0px",
  threshold:[0.18,0.28,0.4,0.55,0.72]
 });

 imgs.forEach(img=>{

  if(img.complete) obs.observe(img);
  else img.addEventListener("load",()=>obs.observe(img),{once:true});

 });

}

window.addEventListener("scroll",schedulePick,{passive:true});

grid.addEventListener("click",ev=>{

 const poster=ev.target.closest(".poster");
 if(!poster) return;

 if(!grid.classList.contains("randomMode")) return;

 const img=poster.querySelector("img");

 const src=img.currentSrc||img.src;

 ambientPoster.style.backgroundImage=`url('${src}')`;

 getAvgRGB(src).then(rgb=>setTargets([rgb,rgb,rgb,rgb]));

});

applyFog();
setup();

})();
