
(function(){
  const DATA_URL = 'data/events.json';

  const grid = document.getElementById('eventsGrid');
  const modeButtons = Array.from(document.querySelectorAll('#wtModes .wtModeBtn'));
  const heroOverlay = document.getElementById('heroOverlay');
  const heroCard = heroOverlay ? heroOverlay.querySelector('.heroCard') : null;

  if(!grid || !heroOverlay || !heroCard) return;

  function parseDate(s){
    const [y,m,d] = String(s||'').split('-').map(Number);
    return new Date(y||1970,(m||1)-1,d||1,12,0,0);
  }

  let items = [];
  let currentMode = 'date';

  function updateActiveMode(mode){
    modeButtons.forEach(btn =>
      btn.classList.toggle('isActive', btn.dataset.mode === mode)
    );
  }

  function setPosterLinksEnabled(enabled){
    Array.from(grid.querySelectorAll('.poster')).forEach(p=>{
      if(p.tagName !== 'A') return;
      if(enabled){
        if(p.dataset.realHref){
          p.setAttribute('href', p.dataset.realHref);
          delete p.dataset.realHref;
        }
      }else{
        const h = p.getAttribute('href');
        if(h) p.dataset.realHref = h;
        p.removeAttribute('href');
      }
    });
  }

  function shufflePosters(){
    const posters = Array.from(grid.querySelectorAll('.poster'));
    for(let i=posters.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [posters[i],posters[j]]=[posters[j],posters[i]];
    }
    posters.forEach(p=>grid.appendChild(p));
  }

  // NATURAL RANDOM (soft, not tilted like crazy)
  function randomizeVars(){
    Array.from(grid.querySelectorAll('.poster')).forEach(el=>{
      const tx  = (Math.random() * 2 - 1) * 7;
      const ty  = (Math.random() * 2 - 1) * 10;
      const rot = (Math.random() * 2 - 1) * 0.45;
      const scl = 0.998 + Math.random()*0.01;
      const z   = 1 + Math.round(Math.random()*1);

      el.style.setProperty('--tx', tx.toFixed(1)+'px');
      el.style.setProperty('--ty', ty.toFixed(1)+'px');
      el.style.setProperty('--rot', rot.toFixed(2)+'deg');
      el.style.setProperty('--scl', scl.toFixed(3));
      el.style.setProperty('--z', z);
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
    const posters = Array.from(grid.querySelectorAll('.poster'));
    const map = new Map();
    posters.forEach(p=>map.set(Number(p.dataset.key),p));
    grid.innerHTML='';
    items.forEach((_,idx)=>{
      const el=map.get(idx);
      if(el) grid.appendChild(el);
    });
  }

  function scrollToFirstPoster(){
    const first = grid.querySelector('.poster');
    if(!first){
      window.scrollTo({top:0,behavior:'smooth'});
      return;
    }
    const topBar = document.querySelector('.topBar');
    const barH = topBar ? topBar.getBoundingClientRect().height : 0;
    const y = window.scrollY + first.getBoundingClientRect().top - (barH + 12);
    window.scrollTo({top:Math.max(0,y),behavior:'smooth'});
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

    a.addEventListener('click',(ev)=>{
      if(a.getAttribute('href')) return;
      ev.preventDefault();
      openHero(a);
    });

    return a;
  }

  // HERO with return animation
  let heroOpen=false;
  let heroFrom=null;

  function openHero(posterEl){
    if(heroOpen) return;
    const img=posterEl.querySelector('img');
    if(!img) return;

    const rect=img.getBoundingClientRect();
    heroFrom=rect;

    heroCard.innerHTML='';
    const wrap=document.createElement('div');
    wrap.className='rollWrap';
    const hi=document.createElement('img');
    hi.src=img.currentSrc||img.src;
    wrap.appendChild(hi);
    heroCard.appendChild(wrap);

    heroCard.style.left=rect.left+'px';
    heroCard.style.top=rect.top+'px';
    heroCard.style.width=rect.width+'px';
    heroCard.style.height=rect.height+'px';

    heroOverlay.classList.add('isOpen');
    heroOpen=true;

    requestAnimationFrame(()=>{
      const vw=window.innerWidth;
      const vh=window.innerHeight;
      const w=Math.min(vw-40,rect.width*1.3);
      const h=Math.min(vh-80,rect.height*1.3);

      heroCard.style.transition='all 360ms cubic-bezier(.2,.85,.2,1)';
      heroCard.style.left=(vw-w)/2+'px';
      heroCard.style.top=(vh-h)/2+'px';
      heroCard.style.width=w+'px';
      heroCard.style.height=h+'px';
    });
  }

  function closeHero(){
    if(!heroOpen||!heroFrom) return;

    heroCard.style.transition='all 260ms cubic-bezier(.2,.8,.2,1)';
    heroCard.style.left=heroFrom.left+'px';
    heroCard.style.top=heroFrom.top+'px';
    heroCard.style.width=heroFrom.width+'px';
    heroCard.style.height=heroFrom.height+'px';

    setTimeout(()=>{
      heroOverlay.classList.remove('isOpen');
      heroCard.innerHTML='';
      heroCard.style.transition='';
      heroOpen=false;
      heroFrom=null;
    },260);
  }

  heroOverlay.addEventListener('click',closeHero);

  async function init(){
    const res=await fetch(DATA_URL,{cache:'no-store'});
    const raw=await res.json();
    items=(raw||[])
      .map(it=>({...it,_date:parseDate(it.date)}))
      .sort((a,b)=>b._date-a._date);

    grid.innerHTML='';
    items.forEach((it,idx)=>grid.appendChild(makePoster(it,idx)));

    modeButtons.forEach(btn=>
      btn.addEventListener('click',()=>setMode(btn.dataset.mode))
    );

    updateActiveMode('date');
    setPosterLinksEnabled(true);
    scrollToFirstPoster();
  }

  init();
})();
