
(() => {
  const DATA_URL = 'data/events.json';

  const grid = document.getElementById('eventsGrid');
  const ambient = document.getElementById('ambientBg');
  const ambientGlow = document.getElementById('ambientGlow');
  const ambientPoster = document.getElementById('ambientPoster');
  const modeButtons = Array.from(document.querySelectorAll('#wtModes .wtModeBtn'));

  const heroOverlay = document.getElementById('heroOverlay');
  const heroCard = heroOverlay ? heroOverlay.querySelector('.heroCard') : null;

  if (!grid || !ambient || !ambientGlow || !ambientPoster || !heroOverlay || !heroCard) {
    console.error('[past] missing required DOM nodes');
    return;
  }

  const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));

  function parseDate(s){
    const [y,m,d] = String(s||'').split('-').map(Number);
    return new Date(y||1970,(m||1)-1,d||1,12,0,0);
  }

  // ===== DATE MODE SCROLL =====
  function scrollToFirstPoster(){
    const first = grid.querySelector('.poster');
    if(!first){
      window.scrollTo({top:0,behavior:'smooth'});
      return;
    }
    const bar = document.querySelector('.topBar');
    const barH = bar ? bar.getBoundingClientRect().height : 0;
    const y = window.scrollY + first.getBoundingClientRect().top - (barH + 12);
    window.scrollTo({top:Math.max(0,y),behavior:'smooth'});
  }

  // ===== AMBIENT =====
  let ambCurrent={r:145,g:85,b:255};
  let ambTarget={r:145,g:85,b:255};
  let ambRAF=0;

  function applyAmbient(){
    const r=Math.round(ambCurrent.r);
    const g=Math.round(ambCurrent.g);
    const b=Math.round(ambCurrent.b);
    ambient.style.setProperty('--ambR',r);
    ambient.style.setProperty('--ambG',g);
    ambient.style.setProperty('--ambB',b);
    ambientGlow.style.background=`radial-gradient(circle at 50% 42%, rgba(${r},${g},${b},.38), transparent 58%)`;
  }

  function tickAmbient(){
    ambCurrent.r+=(ambTarget.r-ambCurrent.r)*0.10;
    ambCurrent.g+=(ambTarget.g-ambCurrent.g)*0.10;
    ambCurrent.b+=(ambTarget.b-ambCurrent.b)*0.10;
    applyAmbient();
    const dr=Math.abs(ambTarget.r-ambCurrent.r);
    const dg=Math.abs(ambTarget.g-ambCurrent.g);
    const db=Math.abs(ambTarget.b-ambCurrent.b);
    if(dr+dg+db>0.8){
      ambRAF=requestAnimationFrame(tickAmbient);
    }else{
      ambRAF=0;
    }
  }

  function setAmbientTarget(rgb){
    ambTarget={
      r:clamp(rgb.r,0,255),
      g:clamp(rgb.g,0,255),
      b:clamp(rgb.b,0,255)
    };
    if(!ambRAF) ambRAF=requestAnimationFrame(tickAmbient);
  }

  async function getAvgRGB(imgUrl){
    return new Promise(resolve=>{
      const img=new Image();
      img.crossOrigin="anonymous";
      img.onload=()=>{
        try{
          const c=document.createElement('canvas');
          const ctx=c.getContext('2d',{willReadFrequently:true});
          const w=32,h=32;
          c.width=w;c.height=h;
          ctx.drawImage(img,0,0,w,h);
          const data=ctx.getImageData(0,0,w,h).data;
          let r=0,g=0,b=0,n=0;
          for(let i=0;i<data.length;i+=4){
            const a=data[i+3];
            if(a<32)continue;
            r+=data[i];g+=data[i+1];b+=data[i+2];
            n++;
          }
          if(!n)return resolve({r:145,g:85,b:255});
          resolve({r:r/n,g:g/n,b:b/n});
        }catch(e){
          resolve({r:145,g:85,b:255});
        }
      };
      img.onerror=()=>resolve({r:145,g:85,b:255});
      img.src=imgUrl;
    });
  }

  async function setAmbientFromImg(src){
    if(!src)return;
    ambientPoster.style.backgroundImage=`url('${src}')`;
    const rgb=await getAvgRGB(src);
    setAmbientTarget(rgb);
  }

  // ===== DATA =====
  let items=[];
  let currentMode='date';

  function updateActiveMode(mode){
    modeButtons.forEach(btn=>btn.classList.toggle('isActive',btn.dataset.mode===mode));
  }

  function setPosterLinksEnabled(enabled){
    Array.from(grid.querySelectorAll('.poster')).forEach(p=>{
      if(p.tagName!=='A')return;
      if(enabled){
        if(p.dataset.realHref){
          p.setAttribute('href',p.dataset.realHref);
          delete p.dataset.realHref;
        }
      }else{
        const h=p.getAttribute('href');
        if(h)p.dataset.realHref=h;
        p.removeAttribute('href');
      }
    });
  }

  function shufflePosters(){
    const posters=Array.from(grid.querySelectorAll('.poster'));
    for(let i=posters.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [posters[i],posters[j]]=[posters[j],posters[i]];
    }
    posters.forEach(p=>grid.appendChild(p));
  }

  function randomizeVars(){
    Array.from(grid.querySelectorAll('.poster')).forEach(el=>{
      const tx=(Math.random()*2-1)*14;
      const ty=(Math.random()*2-1)*22;
      const rot=(Math.random()*2-1)*1.6;
      const scl=0.99+Math.random()*0.05;
      const z=1+Math.round(Math.random()*3);
      el.style.setProperty('--tx',tx.toFixed(1)+'px');
      el.style.setProperty('--ty',ty.toFixed(1)+'px');
      el.style.setProperty('--rot',rot.toFixed(2)+'deg');
      el.style.setProperty('--scl',scl.toFixed(3));
      el.style.setProperty('--z',z);
    });
  }

  function clearRandomVars(){
    Array.from(grid.querySelectorAll('.poster')).forEach(el=>{
      el.style.removeProperty('--tx');
      el.style.removeProperty('--ty');
      el.style.removeProperty('--rot');
      el.style.removeProperty('--scl');
      el.style.removeProperty('--z');
    });
  }

  function restoreOrder(){
    const posters=Array.from(grid.querySelectorAll('.poster'));
    const map=new Map();
    posters.forEach(p=>map.set(Number(p.dataset.key),p));
    grid.innerHTML='';
    items.forEach((_,idx)=>{
      const el=map.get(idx);
      if(el)grid.appendChild(el);
    });
  }

  function setMode(mode){
    if(mode===currentMode){
      if(mode==='random'){
        shufflePosters();
        randomizeVars();
      }else{
        restoreOrder();
        scrollToFirstPoster();
      }
      return;
    }

    currentMode=mode;
    grid.classList.toggle('randomMode',mode==='random');
    updateActiveMode(mode);
    setPosterLinksEnabled(mode!=='random');

    if(mode==='random'){
      shufflePosters();
      randomizeVars();
    }else{
      clearRandomVars();
      restoreOrder();
      scrollToFirstPoster();
    }
  }

  // ===== HERO =====
  let heroOpen=false;
  let heroSrc=null;

  function openHero(posterEl){
    if(heroOpen)return;
    const img=posterEl.querySelector('img');
    if(!img)return;

    heroSrc=img.currentSrc||img.src;
    heroOverlay.classList.add('isOpen');
    heroOpen=true;

    heroCard.innerHTML='';
    const wrap=document.createElement('div');
    wrap.className='rollWrap';
    const hi=document.createElement('img');
    hi.src=heroSrc;
    hi.alt=img.alt||'';
    wrap.appendChild(hi);
    heroCard.appendChild(wrap);

    recenterHeroCard(true);
  }

  function closeHero(){
    if(!heroOpen)return;
    heroOverlay.classList.remove('isOpen');
    heroCard.innerHTML='';
    heroOpen=false;
  }

  function recenterHeroCard(noTransition){
    if(!heroOpen)return;
    const hi=heroCard.querySelector('img');
    if(!hi)return;

    const vw=window.innerWidth;
    const vh=window.innerHeight;

    const natW=hi.naturalWidth||1200;
    const natH=hi.naturalHeight||1600;

    const maxW=Math.min(vw-32,980);
    const maxH=Math.min(vh-96,900);

    const scale=Math.min(maxW/natW,maxH/natH,1.0);
    const w=Math.round(natW*scale);
    const h=Math.round(natH*scale);

    heroCard.style.transition=noTransition?'none':'';
    heroCard.style.left=(vw-w)/2+'px';
    heroCard.style.top=(vh-h)/2+'px';
    heroCard.style.width=w+'px';
    heroCard.style.height=h+'px';

    if(noTransition){
      requestAnimationFrame(()=>heroCard.style.transition='');
    }
  }

  window.addEventListener('resize',()=>recenterHeroCard(true));
  window.addEventListener('orientationchange',()=>{
    recenterHeroCard(true);
    setTimeout(()=>recenterHeroCard(true),120);
  });

  heroOverlay.addEventListener('click',closeHero);

  grid.addEventListener('click',ev=>{
    if(!grid.classList.contains('randomMode'))return;
    const a=ev.target.closest('.poster');
    if(!a)return;
    ev.preventDefault();
    openHero(a);
  });

  function makePoster(item,idx){
    const a=document.createElement('a');
    a.className='poster';
    a.dataset.key=String(idx);
    a.href=item.link||'#';

    const img=document.createElement('img');
    img.loading='lazy';
    img.src=item.image||'';
    img.alt=item.title||'';
    a.appendChild(img);

    a.addEventListener('mouseenter',()=>{
      if(img.src)setAmbientFromImg(img.src);
    });

    return a;
  }

  async function init(){
    const res=await fetch(DATA_URL,{cache:'no-store'});
    const raw=await res.json();

    items=(raw||[])
      .map(it=>({...it,_date:parseDate(it.date)}))
      .sort((a,b)=>b._date-a._date);

    grid.innerHTML='';
    items.forEach((it,idx)=>grid.appendChild(makePoster(it,idx)));

    modeButtons.forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));

    updateActiveMode('date');
    setPosterLinksEnabled(true);
    clearRandomVars();
    applyAmbient();

    scrollToFirstPoster();
  }

  init();
})();
