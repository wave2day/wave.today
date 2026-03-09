
(() => {
  if (window.__WT_SIDE_PANEL_APP__) return;
  window.__WT_SIDE_PANEL_APP__ = true;

  const PANEL_HTML = `
    <div class="sp-sidePanel" id="spSidePanel" style="--x:114px">
      <div class="sp-glassPlate"></div>
      <div class="sp-panelCardWrap">
        <div class="sp-whiteCard">
          <div class="sp-rows">
            <button class="sp-cardBtn" id="spBtnInfo" type="button" aria-label="Info">
              <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="120" cy="120" r="100" fill="black"/>
                <circle cx="120" cy="70" r="12" fill="white"/>
                <rect x="110" y="100" width="20" height="70" rx="10" fill="white"/>
              </svg>
            </button>
            <button class="sp-cardBtn" id="spBtnTv" type="button" aria-label="Page 3">
              <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="20" y="20" width="200" height="200" rx="30" ry="30" fill="black"/>
                <path d="M -20 141.2 C -18.3 143.4, -13.3 152.0, -10.0 154.2 C  -6.7 156.4,  -3.3 156.4,   0.0 154.2 C   3.3 152.0,   6.7 146.9,  10.0 141.2 C  13.3 135.5,  16.7 127.1,  20.0 120.0 C  23.3 112.9,  26.7 104.5,  30.0  98.8 C  33.3  93.1,  36.7  88.0,  40.0  85.8 C  43.3  83.6,  46.7  83.6,  50.0  85.8 C  53.3  88.0,  56.7  93.1,  60.0  98.8 C  63.3 104.5,  66.7 112.9,  70.0 120.0 C  73.3 127.1,  76.7 135.5,  80.0 141.2 C  83.3 146.9,  86.7 152.0,  90.0 154.2 C  93.3 156.4,  96.7 156.4, 100.0 154.2 C 103.3 152.0, 106.7 146.9, 110.0 141.2 C 113.3 135.5, 116.7 127.1, 120.0 120.0 C 123.3 112.9, 126.7 104.5, 130.0  98.8 C 133.3  93.1, 136.7  88.0, 140.0  85.8 C 143.3  83.6, 146.7  83.6, 150.0  85.8 C 153.3  88.0, 156.7  93.1, 160.0  98.8 C 163.3 104.5, 166.7 112.9, 170.0 120.0 C 173.3 127.1, 176.7 135.5, 180.0 141.2 C 183.3 146.9, 186.7 152.0, 190.0 154.2 C 193.3 156.4, 196.7 156.4, 200.0 154.2 C 203.3 152.0, 206.7 146.9, 210.0 141.2" fill="none" stroke="white" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="sp-cardBtn" id="spBtnExtra" type="button" aria-label="Page 4">YT</button>
          </div>
        </div>
      </div>
      <div class="sp-grip"></div>
      <div class="sp-hit" id="spHit"></div>
    </div>
  `;

  const INFO_HTML = `
    <div class="sp-infoWindow" id="spInfoWindow" hidden aria-hidden="true">
      <div class="sp-infoGlass">
        <div class="sp-infoHeader" id="spInfoHandle">
          <div class="sp-infoTitle">INFO</div>
          <button class="sp-infoClose" id="spInfoClose" type="button" aria-label="Zavřít">×</button>
        </div>
        <div class="sp-infoBody">
          <div class="sp-infoContent">
            <h1>Wave.Today — wave events in one place</h1>

            <p>
            Wave.Today brings an overview of concerts, parties and <strong>online events</strong> from the <strong>wave, darkwave, witch house etc.</strong> scene.<br>
            Since <strong>2020</strong>, it publishes <strong>posters and links to events</strong> — a simpler way to see <strong>what is happening right now</strong> hardly exists.
            </p>

            <p>
            <strong>You can find posters of current events</strong> with links to official event pages or ticket purchase.
            </p>

            <p>
            The <strong>Past Events</strong> section presents an <strong>archive gallery</strong> of past events and shows how active the scene really is.
            </p>

            <h2>Tips</h2>

            <p>
            • <strong>Just click the poster</strong> to be redirected to the event page, official event website or ticket purchase<br>
            • Click the <strong>date label</strong> to add the event to your calendar
            </p>

            <h2 class="sp-noticeTitle">Did you notice?</h2>
            <p class="sp-noticeBlock">
            <img src="assets/gif/wave.gif" width="18" style="vertical-align:middle;margin-right:6px;" alt="wave orb">
            <em>Click the rotating pink orb</em> and a panel with a <strong>QR code</strong> opens.<br>
            The QR code leads directly to <strong>Wave.Today</strong>.
            </p>

            <p>
            There is also an <strong>Instagram</strong> that may interest you — moments from shows and performances by artists of this scene appear there.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  const STYLE = `
    <style id="spSidePanelStyle">
      :root{
        --spW: 142px; --spH: 286px; --spShellR: 40px;
        --spGrooveLeft: 8px; --spGrooveW: 3px; --spGrooveGap: 7px; --spHandleVisible: 28px;
        --glassClearA: rgba(255,255,255,.14); --glassClearB: rgba(255,255,255,.08);
        --glassMilkA: rgba(255,255,255,.10); --glassMilkB: rgba(255,255,255,.12);
        --botRim1: rgba(255,255,255,.88); --botRim2: rgba(255,255,255,.44);
        --botRimGlow: rgba(210,220,255,.26); --botInnerGlow: rgba(255,255,255,.22);
        --rimTint: 170,190,255; --bleedA: .085; --bleedB: .040; --bleedX: 78%; --bleedY: 86%; --topRimFade: 30%;
      }
      .sp-sidePanel{position:fixed;top:50%;right:0;width:var(--spW);height:var(--spH);transform:translate(var(--x,114px),-50%);touch-action:none;user-select:none;-webkit-user-select:none;will-change:transform;z-index:40000;}
      .sp-sidePanel::before{display:none;}
      .sp-glassPlate{position:absolute;inset:0 auto 0 0;width:calc(100% - 17px);height:100%;overflow:hidden;border-radius:var(--spShellR) 0 0 var(--spShellR);isolation:isolate;background:radial-gradient(120% 140% at 50% 62%, var(--glassMilkA), transparent 62%),radial-gradient(120% 160% at 50% 92%, var(--glassMilkB), transparent 58%),radial-gradient(120% 140% at 28% 20%, var(--glassClearA), transparent 55%),radial-gradient(140% 160% at 70% 74%, var(--glassClearB), transparent 60%),rgba(255,255,255,.08);box-shadow:inset 0 18px 26px rgba(0,0,0,.16),inset 0 -22px 30px rgba(255,255,255,.22),-4px 0 8px rgba(255,255,255,.03);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);}
      .sp-glassPlate::before{content:"";position:absolute;inset:10px;border-radius:calc(var(--spShellR) - 8px) 0 0 calc(var(--spShellR) - 8px);pointer-events:none;z-index:1;background:radial-gradient(120% 70% at 50% 0%, rgba(255,255,255,.26) 0%, rgba(255,255,255,.10) 22%, rgba(255,255,255,0) 55%),linear-gradient(180deg, rgba(255,255,255,.11) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0) 100%),radial-gradient(70% 90% at 16% 18%, rgba(255,255,255,.42) 0%, rgba(255,255,255,.18) 35%, transparent 72%),radial-gradient(70% 90% at 84% 18%, rgba(255,255,255,.42) 0%, rgba(255,255,255,.18) 35%, transparent 72%);filter:blur(1.35px);opacity:.95;}
      .sp-glassPlate::after{content:"";position:absolute;inset:-1px;border-radius:var(--spShellR) 0 0 var(--spShellR);pointer-events:none;z-index:2;background:radial-gradient(78% 44% at 52% 100%, var(--botInnerGlow) 0%, rgba(255,255,255,.12) 26%, transparent 66%),linear-gradient(0deg, var(--botRim1) 0%, var(--botRim2) 7%, rgba(255,255,255,0) 18%),radial-gradient(96% 26% at 56% 102%, var(--botRimGlow) 0%, rgba(210,220,255,.12) 36%, transparent 74%),radial-gradient(72% 120% at var(--bleedX) var(--bleedY), rgba(var(--rimTint), var(--bleedA)) 0%, rgba(var(--rimTint), var(--bleedB)) 28%, transparent 68%),conic-gradient(from 210deg, transparent 0 18%, rgba(var(--rimTint), .09) 22%, transparent 36%, rgba(var(--rimTint), .045) 46%, transparent 62%, rgba(var(--rimTint), .032) 70%, transparent 100%),linear-gradient(90deg, rgba(var(--rimTint), .085) 0%, rgba(var(--rimTint), .055) 8%, transparent 22%, transparent 78%, rgba(var(--rimTint), .055) 92%, rgba(var(--rimTint), .085) 100%),radial-gradient(170% 120% at 50% -38%, rgba(0,0,0,.30) 0%, rgba(0,0,0,.12) 14%, transparent var(--topRimFade));-webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;padding:13px;filter:blur(1.05px);opacity:.95;}
      .sp-grip{position:absolute;z-index:10;left:var(--spGrooveLeft);top:50%;transform:translateY(-50%);height:180px;width:calc((var(--spGrooveW) * 2) + var(--spGrooveGap));}
      .sp-grip::before,.sp-grip::after{content:"";position:absolute;top:0;width:var(--spGrooveW);height:100%;border-radius:999px;background:linear-gradient(180deg, rgba(255,255,255,.94), rgba(209,209,216,.98));box-shadow:inset 0 2px 3px rgba(0,0,0,.24), 1px 0 0 rgba(255,255,255,.42), -1px 0 2px rgba(0,0,0,.10);}
      .sp-grip::before{left:0}.sp-grip::after{right:0}
      .sp-hit{position:absolute;left:0;top:0;width:var(--spHandleVisible);height:100%;z-index:20;background:transparent;touch-action:none;}
      .sp-panelCardWrap{position:absolute;top:14px;right:32px;width:80px;height:258px;z-index:5;}
      .sp-whiteCard{position:absolute;inset:0;border-radius:28px 0 0 28px;overflow:hidden;background:linear-gradient(180deg,#ffffff 0%, #f4f4f7 100%);border:1px solid rgba(60,60,70,.35);box-shadow:0 10px 18px rgba(255,255,255,.24), 0 2px 8px rgba(0,0,0,.10);}
      .sp-rows{position:absolute;inset:0;display:grid;grid-template-rows:1fr 1fr 1fr;}
      .sp-cardBtn{border:0;background:transparent;font-size:15px;font-weight:850;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;transition:background-color .12s ease, box-shadow .12s ease, transform .08s ease;-webkit-tap-highlight-color:transparent;}
      .sp-cardBtn:active{background:rgba(0,0,0,.06);box-shadow:inset 0 1px 6px rgba(0,0,0,.10);transform:scale(.985);}
      .sp-cardBtn:focus-visible{outline:none;background:rgba(0,0,0,.04);}
      .sp-cardBtn + .sp-cardBtn{border-top:1px solid rgba(0,0,0,.10);}
      .sp-cardBtn svg{width:22px;height:22px;display:block;}.sp-noSelect,.sp-noSelect *{user-select:none !important;-webkit-user-select:none !important;}
      .sp-infoWindow{position:fixed;left:24px;top:calc(env(safe-area-inset-top) + 24px);width:min(420px, calc(100vw - 48px));max-height:min(72vh, 680px);z-index:40010;touch-action:none;}
      .sp-infoGlass{position:relative;overflow:hidden;border-radius:28px;background:radial-gradient(120% 140% at 50% 62%, rgba(255,255,255,.12), transparent 62%),radial-gradient(120% 160% at 50% 92%, rgba(255,255,255,.10), transparent 58%),radial-gradient(120% 140% at 28% 20%, rgba(255,255,255,.18), transparent 55%),rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.18);box-shadow:inset 0 18px 26px rgba(0,0,0,.18),inset 0 -18px 24px rgba(255,255,255,.18),0 18px 50px rgba(0,0,0,.20),0 0 34px rgba(255,255,255,.14);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);}
      .sp-infoHeader{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;cursor:grab;user-select:none;-webkit-user-select:none;border-bottom:1px solid rgba(255,255,255,.12);}
      .sp-infoHeader:active{cursor:grabbing}
      .sp-infoTitle{font:700 14px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;letter-spacing:.08em;color:#0d0d12;}
      .sp-infoClose{border:0;background:rgba(255,255,255,.42);color:#111;width:28px;height:28px;border-radius:999px;cursor:pointer;font-size:18px;line-height:1;}
      .sp-infoBody{max-height:min(calc(72vh - 58px), 620px);overflow:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;}
      .sp-infoContent{padding:16px 18px 18px;color:#11131a;font:500 14px/1.55 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;}
      .sp-infoContent h1{margin:0 0 14px;font-size:20px;line-height:1.15;font-weight:750;}
      .sp-infoContent h2{margin:18px 0 8px;font-size:15px;line-height:1.2;font-weight:700;}
      .sp-infoContent p{margin:0 0 12px;}
      .sp-noticeTitle{font-size:13px !important;opacity:.74;margin:16px 0 4px !important;}
      .sp-noticeBlock{margin:0 0 12px !important;}
      @media (max-width:640px){.sp-infoWindow{left:12px;width:calc(100vw - 24px);max-height:68vh}.sp-infoBody{max-height:calc(68vh - 58px)}}
    </style>
  `;

  function injectStyle(){ if(!document.getElementById('spSidePanelStyle')) document.head.insertAdjacentHTML('beforeend', STYLE); }
  function injectMarkup(){
    if(!document.getElementById('spSidePanel')) document.body.insertAdjacentHTML('beforeend', PANEL_HTML);
    if(!document.getElementById('spInfoWindow')) document.body.insertAdjacentHTML('beforeend', INFO_HTML);
  }

  function initPanel(){
    const panel = document.getElementById('spSidePanel');
    const hit = document.getElementById('spHit');
    if(!panel || !hit) return;
    const CLOSED = 114, OPEN = 32, PULL = 17, THRESHOLD = 74;
    let x = CLOSED, startClientX = 0, startX = x, dragging = false;
    const clamp = (v,min,max) => Math.min(max, Math.max(min, v));
    function render(immediate=false){ if(immediate) panel.style.transition='none'; panel.style.setProperty('--x', x + 'px'); }
    function animateTo(target){ x = target; panel.style.transition='transform .30s cubic-bezier(.18,.86,.22,1.06)'; render(); window.setTimeout(()=>{ panel.style.transition='none'; }, 320); }
    function onDown(e){ e.preventDefault(); dragging = true; startClientX = e.clientX; startX = x; document.body.classList.add('sp-noSelect'); hit.setPointerCapture(e.pointerId); panel.style.transition='none'; }
    function onMove(e){ if(!dragging) return; e.preventDefault(); const dx = e.clientX - startClientX; x = clamp(startX + dx, PULL, CLOSED); render(true); }
    function onUp(){ if(!dragging) return; dragging = false; document.body.classList.remove('sp-noSelect'); if(x <= OPEN) return animateTo(OPEN); if(x < THRESHOLD) animateTo(OPEN); else animateTo(CLOSED); }
    hit.addEventListener('pointerdown', onDown);
    hit.addEventListener('pointermove', onMove);
    hit.addEventListener('pointerup', onUp);
    hit.addEventListener('pointercancel', onUp);
    window.addEventListener('mouseup', () => document.body.classList.remove('sp-noSelect'));
    window.addEventListener('blur', () => document.body.classList.remove('sp-noSelect'));
    render(true);
  }

  function initInfoWindow(){
    const infoBtn = document.getElementById('spBtnInfo');
    const tvBtn = document.getElementById('spBtnTv');
    const extraBtn = document.getElementById('spBtnExtra');
    const win = document.getElementById('spInfoWindow');
    const closeBtn = document.getElementById('spInfoClose');
    const handle = document.getElementById('spInfoHandle');
    if(!infoBtn || !win || !closeBtn || !handle) return;

    let open = false;
    function openWin(){ win.hidden = false; win.setAttribute('aria-hidden','false'); open = true; }
    function closeWin(){ win.hidden = true; win.setAttribute('aria-hidden','true'); open = false; }
    function toggleWin(){ if(open) closeWin(); else openWin(); }

    infoBtn.addEventListener('click', (e) => { e.preventDefault(); toggleWin(); });
    closeBtn.addEventListener('click', (e) => { e.preventDefault(); closeWin(); });
    if(tvBtn) tvBtn.addEventListener('click', () => console.log('Page 3 placeholder'));
    if(extraBtn) extraBtn.addEventListener('click', () => console.log('Page 4 placeholder'));

    let drag = false, pointerId = null, startX = 0, startY = 0, originLeft = 0, originTop = 0;

    function clampRect(left, top){
      const rect = win.getBoundingClientRect();
      const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
      const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
      return { left: Math.min(maxLeft, Math.max(8, left)), top: Math.min(maxTop, Math.max(8, top)) };
    }

    handle.addEventListener('pointerdown', (e) => {
      if(e.target.closest('#spInfoClose')) return;
      drag = true; pointerId = e.pointerId; startX = e.clientX; startY = e.clientY;
      const rect = win.getBoundingClientRect(); originLeft = rect.left; originTop = rect.top;
      handle.setPointerCapture(pointerId);
    });

    handle.addEventListener('pointermove', (e) => {
      if(!drag || e.pointerId != pointerId) return;
      const next = clampRect(originLeft + (e.clientX - startX), originTop + (e.clientY - startY));
      win.style.left = next.left + 'px';
      win.style.top = next.top + 'px';
    });

    function stopDrag(e){ if(e.pointerId != null && e.pointerId != pointerId) return; drag = false; pointerId = null; }
    handle.addEventListener('pointerup', stopDrag);
    handle.addEventListener('pointercancel', stopDrag);
  }

  function boot(){ injectStyle(); injectMarkup(); initPanel(); initInfoWindow(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
