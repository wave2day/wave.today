// wt-upcoming_scoped.js
// Scope: render ONLY inside #wtNewEventsSlot. Nešahá na zbytek stránky.

(function(){
  const SLOT_ID = "wtNewEventsSlot";
  const JSON_PATH = "./data/upcoming.json";
  const LABEL_HTML_PATH = "./whitelabelone.html";

  function parseISODate(s){
    if(!s || typeof s !== "string") return null;
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(!m) return null;
    const y = +m[1], mo = +m[2], d = +m[3];
    const dt = new Date(y, mo-1, d);
    return isNaN(dt.getTime()) ? null : dt;
  }

  function parseDateFromFilename(path){
    if(!path || typeof path !== "string") return null;
    const m = path.match(/(\d{4})-(\d{2})-(\d{2})_/);
    if(!m) return null;
    return new Date(+m[1], (+m[2])-1, +m[3]);
  }

  function month3(dt){
    return new Intl.DateTimeFormat("en", { month:"short" }).format(dt).toUpperCase();
  }

  function getList(data){
    if(Array.isArray(data)) return data;
    if(data && Array.isArray(data.events)) return data.events;
    return [];
  }

  async function load(){
    const slot = document.getElementById(SLOT_ID);
    if(!slot) return;

    let data;
    try{
      const res = await fetch(JSON_PATH, { cache:"no-cache" });
      if(!res.ok) return;
      data = await res.json();
    }catch(e){ return; }

    const list = getList(data);
    if(!list.length) return;

    const ev = list[0];
    const img = ev.image || ev.img || ev.poster || "";
    const url = ev.url || ev.link || ev.href || "#";
    const dt = parseISODate(ev.date || ev.datetime || "") || parseDateFromFilename(img);

    const day = dt ? String(dt.getDate()).padStart(2,"0") : "00";
    const mon = dt ? month3(dt) : "MON";

    slot.innerHTML = `
      <div class="wtUpcomingItem wtReveal">
        <a class="wtPosterLink" href="${escapeAttr(url)}" target="_blank" rel="noopener">
          <img class="wtPosterImg" src="${escapeAttr(img)}" alt="upcoming poster">
          <div class="wtWhiteLabel" aria-hidden="true">
            <iframe src="${LABEL_HTML_PATH}" title="label"></iframe>
            <div class="wtLabelText">
              <div class="wtLabelDay">${day}</div>
              <div class="wtLabelMonth">${mon}</div>
            </div>
          </div>
        </a>
      </div>
    `;

    // Reveal when visible
    const el = slot.querySelector(".wtReveal");
    if(!el) return;

    const io = new IntersectionObserver((entries)=>{
      for(const e of entries){
        if(e.isIntersecting){
          el.classList.add("isIn");
          io.disconnect();
        }
      }
    }, { threshold: 0.18, rootMargin: "0px 0px -10% 0px" });

    io.observe(el);
  }

  function escapeAttr(s){
    return String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", load);
  }else{
    load();
  }
})();