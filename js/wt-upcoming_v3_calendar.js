(() => {
  const slot = document.getElementById('wtNewEventsSlot');
  if (!slot) return;

  const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

  const pad2 = (n) => String(n).padStart(2, '0');

  function parseISODate(s){
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s||"").trim());
    if(!m) return null;
    const y = +m[1], mo = +m[2], d = +m[3];
    if(mo<1||mo>12||d<1||d>31) return null;
    return { y, mo, d };
  }

  function escapeICS(text){
    return String(text ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;")
      ;
  }

  function makeAllDayICS(ev){
    const p = parseISODate(ev?.date);
    if(!p) return null;

    // All-day: DTSTART/DTEND as VALUE=DATE; DTEND is next day
    const start = `${p.y}${pad2(p.mo)}${pad2(p.d)}`;

    const dt = new Date(Date.UTC(p.y, p.mo-1, p.d));
    dt.setUTCDate(dt.getUTCDate() + 1);
    const end = `${dt.getUTCFullYear()}${pad2(dt.getUTCMonth()+1)}${pad2(dt.getUTCDate())}`;

    const title = ev?.title || ev?.name || "Event";
    const url = ev?.link || ev?.url || "";
    const location = [ev?.city, ev?.club, ev?.venue].filter(Boolean).join(", ");
    const descriptionParts = [];
    if(ev?.subtitle) descriptionParts.push(ev.subtitle);
    if(ev?.notes) descriptionParts.push(ev.notes);
    if(url) descriptionParts.push(url);
    const description = descriptionParts.join("\n");

    const uid = `wt-${start}-${Math.random().toString(16).slice(2)}@wave.today`;
    const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');

    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//wave.today//WT Upcoming//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${escapeICS(title)}`,
      location ? `LOCATION:${escapeICS(location)}` : null,
      description ? `DESCRIPTION:${escapeICS(description)}` : null,
      url ? `URL:${escapeICS(url)}` : null,
      "END:VEVENT",
      "END:VCALENDAR"
    ].filter(Boolean).join("\r\n");
  }

  function downloadText(filename, text, mime){
    const blob = new Blob([text], { type: mime || "text/plain" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  }

  function onLabelClick(ev){
    // Default action: create an .ics (all-day) and download/open
    const ics = makeAllDayICS(ev);
    if(!ics){
      // If date is missing or bad, do nothing quietly
      return;
    }
    const safeTitle = String(ev?.title || ev?.name || "event").toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/-+/g,'-').replace(/^-|-$/g,'');
    const filename = `${safeTitle || "event"}-${String(ev?.date || "").trim()}.ics`;
    downloadText(filename, ics, "text/calendar;charset=utf-8");
  }

  function buildLabel(dd, mon, scale){
    const wrap = document.createElement('div');
    wrap.className = 'wtLabelWrap';
    wrap.style.setProperty('--wtLabelScale', String(scale ?? 0.13));
    wrap.setAttribute('role', 'button');
    wrap.setAttribute('tabindex', '0');
    wrap.setAttribute('aria-label', 'Add to calendar');

    const scope = document.createElement('div');
    scope.className = 'wtLabelScope';

    const glass = document.createElement('div');
    glass.className = 'glassSquare';

    const core = document.createElement('div');
    core.className = 'core';

    const date = document.createElement('div');
    date.className = 'wtLabelDate';

    const day = document.createElement('div');
    day.className = 'wtLabelDay';
    day.textContent = String(dd);

    const month = document.createElement('div');
    month.className = 'wtLabelMonth';
    month.textContent = String(mon);

    date.appendChild(day);
    date.appendChild(month);

    core.appendChild(date);
    glass.appendChild(core);
    scope.appendChild(glass);
    wrap.appendChild(scope);

    return wrap;
  }

  function buildItem(ev){
    const item = document.createElement('div');
    item.className = 'wtUpcomingItem wtReveal';

    const link = document.createElement('a');
    link.className = 'wtUpcomingLink';
    link.href = ev?.link || ev?.url || '#';
    link.target = '_blank';
    link.rel = 'noopener';

    const img = document.createElement('img');
    img.className = 'wtUpcomingPoster';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = ev?.title || 'poster';
    img.src = ev?.poster || ev?.image || ev?.img || '';

    link.appendChild(img);
    item.appendChild(link);

    const d = parseISODate(ev?.date);
    if(d){
      const dd = pad2(d.d);
      const mon = MONTHS[d.mo-1] || '';
      const label = buildLabel(dd, mon, ev?.labelScale ?? 0.13);

      // IMPORTANT: label click must NOT trigger poster link click
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        onLabelClick(ev);
      };
      label.addEventListener('click', handler, { passive: false });
      label.addEventListener('pointerdown', (e)=>{ e.stopPropagation(); }, { passive: true });
      label.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter' || e.key === ' '){
          handler(e);
        }
      });

      item.appendChild(label);
    }

    // reveal
    requestAnimationFrame(() => item.classList.add('isIn'));

    return item;
  }

  async function fetchFirst(urls){
    let lastErr = null;
    for(const url of urls){
      try{
        const r = await fetch(url, { cache: 'no-cache' });
        if(!r.ok) throw new Error(`HTTP ${r.status}`);
        return await r.json();
      }catch(e){
        lastErr = e;
      }
    }
    throw lastErr || new Error('No upcoming JSON found');
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
      events
        .filter(Boolean)
        .filter(ev => (ev.poster || ev.image || ev.img) && (ev.link || ev.url || true))
        .sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')))
        .forEach(ev => list.appendChild(buildItem(ev)));
    }catch(e){
      // silent fail: keep slot empty
      // console.warn('[WT] upcoming load failed', e);
    }
  }

  run();
})();