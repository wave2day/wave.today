(() => {
  const DATA_URL = 'data/events.json';

  const grid = document.getElementById('eventsGrid');
  const ambient = document.getElementById('ambientBg');
  const ambientGlow = document.getElementById('ambientGlow');
  const ambientPoster = document.getElementById('ambientPoster');

  const modeButtons = Array.from(document.querySelectorAll('#wtModes .wtModeBtn'));

  const heroOverlay = document.getElementById('heroOverlay');
  const heroCard = heroOverlay ? heroOverlay.querySelector('.heroCard') : null;

  if (!grid || !heroOverlay || !heroCard) {
    console.error('Missing DOM nodes');
    return;
  }

  function parseDate(s){
    const [y,m,d] = String(s||'').split('-').map(Number);
    return new Date(y||1970,(m||1)-1,d||1,12,0,0);
  }

  // ---------------- RANDOM LAYOUT ----------------
  function shufflePosters(){
    const posters = Array.from(grid.querySelectorAll('.poster'));
    for(let i = posters.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      grid.insertBefore(posters[j], posters[i]);
      [posters[i], posters[j]] = [posters[j], posters[i]];
    }
  }

  function randomizeVars(){
    const posters = Array.from(grid.querySelectorAll('.poster'));

    posters.forEach(el => {
      const tx  = (Math.random()*2 - 1) * 14;
      const ty  = (Math.random()*2 - 1) * 22;

      // VERY MILD ROTATION
      const rot = (Math.random()*2 - 1) * 0.25;

      const scl = 0.995 + Math.random()*0.02;
      const z   = 1 + Math.round(Math.random()*2);

      el.style.setProperty('--tx', tx.toFixed(1)+'px');
      el.style.setProperty('--ty', ty.toFixed(1)+'px');
      el.style.setProperty('--rot', rot.toFixed(2)+'deg');
      el.style.setProperty('--scl', scl.toFixed(3));
      el.style.setProperty('--z', z);
    });
  }

  function clearRandomVars(){
    Array.from(grid.querySelectorAll('.poster')).forEach(el => {
      el.style.removeProperty('--tx');
      el.style.removeProperty('--ty');
      el.style.removeProperty('--rot');
      el.style.removeProperty('--scl');
      el.style.removeProperty('--z');
    });
  }

  // ---------------- HERO ----------------

  let heroOpen = false;
  let heroPosterEl = null;

  function getPosterRect(poster){
    const img = poster.querySelector('img');
    if(!img) return null;
    const r = img.getBoundingClientRect();
    return {left:r.left,top:r.top,width:r.width,height:r.height};
  }

  function openHero(poster){
    if(heroOpen) return;

    heroPosterEl = poster;
    const img = poster.querySelector('img');
    if(!img) return;

    const rect = getPosterRect(poster);

    heroOverlay.classList.add('isOpen');
    heroOverlay.setAttribute('aria-hidden','false');

    heroCard.innerHTML = '';
    const hi = document.createElement('img');
    hi.src = img.currentSrc || img.src;
    heroCard.appendChild(hi);

    heroCard.style.left = rect.left + 'px';
    heroCard.style.top = rect.top + 'px';
    heroCard.style.width = rect.width + 'px';
    heroCard.style.height = rect.height + 'px';

    requestAnimationFrame(()=>{
      heroCard.style.left = '50%';
      heroCard.style.top = '50%';
      heroCard.style.transform = 'translate(-50%,-50%)';
    });

    heroOpen = true;
  }

  function closeHero(){
    if(!heroOpen) return;

    const rect = getPosterRect(heroPosterEl);

    heroCard.style.transform = 'none';
    heroCard.style.left = rect.left + 'px';
    heroCard.style.top = rect.top + 'px';
    heroCard.style.width = rect.width + 'px';
    heroCard.style.height = rect.height + 'px';

    setTimeout(()=>{
      heroOverlay.classList.remove('isOpen');
      heroOverlay.setAttribute('aria-hidden','true');
      heroCard.innerHTML = '';
      heroOpen = false;
      heroPosterEl = null;
    },280);
  }

  heroOverlay.addEventListener('click', closeHero);

  // ---------------- MODES ----------------

  let items = [];
  let currentMode = 'date';

  function updateActiveMode(mode){
    modeButtons.forEach(btn => btn.classList.toggle('isActive', btn.dataset.mode === mode));
  }

  function setMode(mode){

    if(mode === currentMode){
      if(mode === 'random'){
        shufflePosters();
        randomizeVars();
      }
      return;
    }

    currentMode = mode;
    grid.classList.toggle('randomMode', mode === 'random');
    updateActiveMode(mode);

    if(mode === 'random'){
      shufflePosters();
      randomizeVars();
    }else{
      clearRandomVars();
    }
  }

  // ---------------- RENDER ----------------

  function makePoster(item, idx){
    const a = document.createElement('a');
    a.className = 'poster';
    a.dataset.key = String(idx);
    a.href = item.link || '#';

    const img = document.createElement('img');
    img.src = item.image;
    img.loading = 'lazy';

    a.appendChild(img);

    a.addEventListener('click', e=>{
      if(grid.classList.contains('randomMode')){
        e.preventDefault();
        openHero(a);
      }
    });

    return a;
  }

  async function init(){

    const res = await fetch(DATA_URL,{cache:'no-store'});
    const raw = await res.json();

    items = raw
      .map(it => ({...it,_date:parseDate(it.date)}))
      .sort((a,b)=>b._date-a._date);

    grid.innerHTML = '';
    items.forEach((it,idx)=>grid.appendChild(makePoster(it,idx)));

    modeButtons.forEach(btn=>{
      btn.addEventListener('click',()=>setMode(btn.dataset.mode));
    });

    updateActiveMode('date');
  }

  init();

})();