(() => {
  const slot = document.getElementById('wtNewEventsSlot');
  if(!slot) return;

  const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const pad2 = (n)=>String(n).padStart(2,'0');

  function parseISODate(s){
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s||"").trim());
    if(!m) return null;
    const mo = +m[2], d = +m[3];
    if(mo<1||mo>12||d<1||d>31) return null;
    return { mo, d };
  }

  function buildLabel(dd, mon, scale){
    const wrap = document.createElement('div');
    wrap.className = 'wtLabelWrap';
    wrap.style.setProperty('--wtLabelScale', String(scale ?? 0.13));

    const scope = document.createElement('div');
    scope.className = 'wtLabelScope';

    const glass = document.createElement('div');
    glass.className = 'glassSquare';

    const press = document.createElement('div');
    press.className = 'pressGlow';

    const core = document.createElement('button');
    core.className = 'coreSquare';
    core.type = 'button';
    core.tabIndex = -1;
    core.setAttribute('aria-label','date label');
    // Label click must NOT open the poster link (reserved for future calendar UI)
    const swallow = (e) => { e.preventDefault(); e.stopPropagation(); };
    core.addEventListener('click', swallow);
    core.addEventListener('mousedown', swallow);
    core.addEventListener('touchstart', swallow, { passive:false });

    glass.appendChild(press);
    glass.appendChild(core);

    const date = document.createElement('div');
    date.className = 'wtLabelDate';

    const day = document.createElement('div');
    day.className = 'wtLabelDay';
    day.textContent = dd;

    const month = document.createElement('div');
    month.className = 'wtLabelMonth';
    month.textContent = mon;

    date.appendChild(day);
    date.appendChild(month);

    const root = document.createElement('div');
    root.className = 'wtUpcoming';
    root.appendChild(scope);
    scope.appendChild(glass);
    scope.appendChild(date);

    wrap.appendChild(root);

    const measure = () => {
      const dayW = day.getBoundingClientRect().width;
      const monW = month.getBoundingClientRect().width;
      if(dayW>0){
        scope.style.setProperty('--monW', dayW.toFixed(1) + 'px');
      }
      if(dayW>0 && monW>0){
        const s = dayW / monW;
        const clamped = Math.max(0.55, Math.min(1.35, s));
        month.style.transformOrigin = 'center top';
        month.style.transform = `scaleX(${clamped.toFixed(3)})`;
      }
    };
    requestAnimationFrame(measure);
    setTimeout(measure, 120);
    setTimeout(measure, 320);

    // Also swallow any clicks on the label wrapper area
    wrap.addEventListener('click', swallow);
    wrap.addEventListener('mousedown', swallow);
    wrap.addEventListener('touchstart', swallow, { passive:false });
    return { wrap, measure };
  }

  function buildItem(ev){
    const iso = parseISODate(ev.date);
    const dd = iso ? pad2(iso.d) : "--";
    const mon = iso ? MONTHS[iso.mo-1] : "---";

    const item = document.createElement('div');
    item.className = 'wtUpcomingItem wtReveal';

    const a = document.createElement('a');
    a.className = 'wtUpcomingLink';
    a.href = ev.url || '#';
    a.target = '_blank';
    a.rel = 'noopener';

    const img = document.createElement('img');
    img.className = 'wtUpcomingPoster';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = '';
    img.src = ev.poster;

    a.appendChild(img);
    item.appendChild(a);

    const { wrap, measure } = buildLabel(dd, mon, ev.labelScale);
    item.appendChild(wrap);

    img.addEventListener('load', () => setTimeout(measure, 50), { once:true });

    return item;
  }

  function revealInit(container){
    const els = container.querySelectorAll('.wtReveal');
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting) e.target.classList.add('isIn');
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -10% 0px' });
    els.forEach(el=>io.observe(el));
  }

  async function fetchFirst(urls){
    for(const u of urls){
      try{
        const res = await fetch(u, { cache:'no-cache' });
        if(res.ok) return await res.json();
      }catch(_){}
    }
    throw new Error('No upcoming json found');
  }

  async function run(){
    slot.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'wtUpcomingList';
    slot.appendChild(list);

    const candidates = ['data/upcoming.json'];

    try{
      const data = await fetchFirst(candidates);
      const events = Array.isArray(data?.events) ? data.events : (Array.isArray(data) ? data : []);
      events.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
      events.forEach(ev => { if(ev?.poster) list.appendChild(buildItem(ev)); });
      revealInit(list);
    }catch(e){
      console.warn('Upcoming load failed:', e);
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', run, { once:true });
  } else run();

  window.addEventListener('resize', () => {
    document.querySelectorAll('.wtUpcoming .wtLabelScope').forEach(scope => {
      const day = scope.querySelector('.wtLabelDay');
      if(!day) return;
      const w = day.getBoundingClientRect().width;
      if(w>0) scope.style.setProperty('--monW', w.toFixed(1) + 'px');
    });
  }, { passive:true });
})();