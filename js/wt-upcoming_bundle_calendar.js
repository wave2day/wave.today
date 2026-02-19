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


  function downloadICS(ev){
    // All-day event based on ISO date (YYYY-MM-DD). Creates a small .ics file for "Add to calendar".
    const iso = parseISODate(ev.date);
    if(!iso) return;

    const y = String(ev.date).slice(0,4);
    const mm = String(iso.mo).padStart(2,'0');
    const dd = String(iso.d).padStart(2,'0');
    const dtStart = `${y}${mm}${dd}`;
    // DTEND for all-day events is non-inclusive -> next day
    const dObj = new Date(`${y}-${mm}-${dd}T00:00:00`);
    const next = new Date(dObj.getTime() + 24*60*60*1000);
    const dtEnd = `${next.getFullYear()}${String(next.getMonth()+1).padStart(2,'0')}${String(next.getDate()).padStart(2,'0')}`;

    const title = String(ev.title || ev.name || 'wave.today event').replace(/\r?\n/g,' ').trim();
    const url = String(ev.link || ev.url || '').trim();
    const loc = String(ev.location || ev.place || '').replace(/\r?\n/g,' ').trim();
    const desc = String(ev.description || '').replace(/\r?\n/g,' ').trim();

    const esc = (s)=> String(s||'')
      .replace(/\\/g,'\\\\')
      .replace(/\n/g,'\\n')
      .replace(/,/g,'\\,')
      .replace(/;/g,'\\;');

    const uid = `${Date.now()}-${Math.random().toString(16).slice(2)}@wave.today`;
    const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z');

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//wave.today//Upcoming//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${esc(title)}`
    ];
    if(loc) lines.push(`LOCATION:${esc(loc)}`);
    if(url) lines.push(`URL:${esc(url)}`);
    const fullDesc = [desc, url].filter(Boolean).join(' ');
    if(fullDesc) lines.push(`DESCRIPTION:${esc(fullDesc)}`);

    lines.push('END:VEVENT','END:VCALENDAR');

    const blob = new Blob([lines.join('\r\n') + '\r\n'], {type:'text/calendar;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const safe = title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60) || 'event';
    a.download = `${y}-${mm}-${dd}_${safe}.ics`;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 50);
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

    // Label click -> add to calendar (.ics)
    const bindCal = (e)=>{ e.preventDefault(); e.stopPropagation(); downloadICS(ev); };
    wrap.addEventListener('click', bindCal, true);
    const coreBtn = wrap.querySelector('.coreSquare');
    if(coreBtn) coreBtn.addEventListener('click', bindCal, true);
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

    const candidates = ['data/upcoming.json','data/Upcoming.json','data/UPCOMING.json'];

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
