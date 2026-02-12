(() => {
  const orb = document.getElementById('wtOrb');
  const overlay = document.getElementById('wtOverlay');
  const card = document.getElementById('wtCard');
  const inner = document.getElementById('wtInner');
  if(!orb || !overlay || !card || !inner) return;

  // ===== Orb: rubber drag + walls + bounce + spring home (+ shake impulse while returning) =====
  ['contextmenu','dragstart','selectstart'].forEach(ev=>{
    orb.addEventListener(ev, e=>e.preventDefault(), {capture:true});
  });

  let pointerId = null, isDragging = false;
  let downX = 0, downY = 0, startX = 0, startY = 0;
  let curX = 0, curY = 0, dragBaseX = 0, dragBaseY = 0;
  let suppressTap = false, pressTimer = null;

  let anchorRect = null;
  const bounds = {minX:0,maxX:0,minY:0,maxY:0};

  const recomputeBounds = () => {
    const prev = orb.style.transform;
    orb.style.transform = 'translate3d(0,0,0)';
    anchorRect = orb.getBoundingClientRect();
    orb.style.transform = prev;

    const margin = 10;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    bounds.minX = -(anchorRect.left - margin);
    bounds.maxX = (vw - margin) - anchorRect.right;
    bounds.minY = -(anchorRect.top - margin);
    bounds.maxY = (vh - margin) - anchorRect.bottom;
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wallBounce = (v, min, max) => v < min ? (min + (min - v) * 0.35) : (v > max ? (max - (v - max) * 0.35) : v);

  const apply = (x,y) => {
    curX = wallBounce(x, bounds.minX, bounds.maxX);
    curY = wallBounce(y, bounds.minY, bounds.maxY);
    orb.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
  };

  const LIMIT = 180;
  const rubber = (d) => {
    const ad = Math.abs(d);
    if(ad <= LIMIT) return d;
    return Math.sign(d) * (LIMIT + (ad - LIMIT) * 0.28);
  };

  let returning = false, rafId = 0, vx = 0, vy = 0, lastShakeT = 0;

  const stopReturn = ()=>{
    returning = false;
    if(rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  };

  function springHome(){
    stopReturn();
    returning = true;

    const k = 0.018, c = 0.14, R = 0.62;
    vx = 0; vy = 0;
    let last = performance.now();

    function step(t){
      if(!returning) return;

      const dt = Math.min(0.032, (t - last)/1000);
      last = t;

      const ax = -k*curX - c*vx;
      const ay = -k*curY - c*vy;

      vx += ax * dt;
      vy += ay * dt;

      curX += vx * (dt*60);
      curY += vy * (dt*60);

      if(curX < bounds.minX){ curX = bounds.minX; vx = -vx * R; }
      else if(curX > bounds.maxX){ curX = bounds.maxX; vx = -vx * R; }
      if(curY < bounds.minY){ curY = bounds.minY; vy = -vy * R; }
      else if(curY > bounds.maxY){ curY = bounds.maxY; vy = -vy * R; }

      orb.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;

      if(Math.abs(curX) < 0.35 && Math.abs(curY) < 0.35 && Math.abs(vx) < 0.2 && Math.abs(vy) < 0.2){
        curX = 0; curY = 0;
        orb.style.transform = 'translate3d(0,0,0)';
        orb.classList.remove('wt-dragging');
        orb.style.willChange = '';
        isDragging = false;
        suppressTap = false;
        stopReturn();
        return;
      }
      rafId = requestAnimationFrame(step);
    }
    rafId = requestAnimationFrame(step);
  }

  // iOS motion permission (silent)
  let motionEnabled = false;
  const enableMotion = async ()=>{
    if(motionEnabled) return;
    motionEnabled = true;
    try{
      if(typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function'){
        const res = await DeviceMotionEvent.requestPermission();
        if(res !== 'granted') return;
      }
    }catch(_){ return; }
    window.addEventListener('devicemotion', onMotion, {passive:true});
  };

  const onMotion = (ev)=>{
    if(!returning || orb.style.display === 'none') return;
    const acc = ev.accelerationIncludingGravity || ev.acceleration;
    if(!acc) return;

    const ax = acc.x || 0, ay = acc.y || 0, az = acc.z || 0;
    const mag = Math.sqrt(ax*ax + ay*ay + az*az);

    if(mag < 3.0) return;
    const now = performance.now();
    if(now - lastShakeT < 90) return;
    lastShakeT = now;

    const GAIN = 0.55;
    vx += ax * GAIN;
    vy += -ay * GAIN;
  };

  window.__WT_ORB_API = {
    recomputeBounds,
    setPos: (x,y) => {
      recomputeBounds();
      curX = clamp(x, bounds.minX, bounds.maxX);
      curY = clamp(y, bounds.minY, bounds.maxY);
      orb.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
    },
    moveToViewportCenter: () => {
      recomputeBounds();
      const cx = window.innerWidth * 0.5;
      const cy = window.innerHeight * 0.5;
      const ax = anchorRect.left + anchorRect.width * 0.5;
      const ay = anchorRect.top  + anchorRect.height * 0.5;
      window.__WT_ORB_API.setPos(cx - ax, cy - ay);
    },
    springHome: () => {
      if(isDragging) return;
      recomputeBounds();
      orb.classList.add('wt-dragging');
      orb.style.willChange = 'transform';
      suppressTap = true;
      springHome();
    }
  };

  recomputeBounds();
  window.addEventListener('resize', () => {
    recomputeBounds();
    apply(curX, curY);
  }, {passive:true});

  orb.addEventListener('click', (e) => {
    if(suppressTap){ e.preventDefault(); e.stopPropagation(); }
  }, true);

  // One gesture is enough
  document.addEventListener('pointerdown', () => { enableMotion(); }, {passive:true, capture:true, once:true});

  orb.addEventListener('pointerdown', (e) => {
    if(e.button !== undefined && e.button !== 0) return;
    pointerId = e.pointerId;
    downX = e.clientX; downY = e.clientY;
    startX = e.clientX; startY = e.clientY;
    suppressTap = false;

    dragBaseX = curX;
    dragBaseY = curY;

    stopReturn();

    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      isDragging = true;
      suppressTap = true;
      orb.classList.add('wt-dragging');
      orb.style.willChange = 'transform';
      try{ orb.setPointerCapture(pointerId); }catch(_){}
    }, 170);
  });

  orb.addEventListener('pointermove', (e) => {
    if(pointerId === null || e.pointerId !== pointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if(!isDragging){
      if(Math.hypot(e.clientX - downX, e.clientY - downY) > 10){
        clearTimeout(pressTimer);
        pressTimer = null;
        isDragging = true;
        suppressTap = true;
        orb.classList.add('wt-dragging');
        orb.style.willChange = 'transform';
        try{ orb.setPointerCapture(pointerId); }catch(_){}
      }else{
        return;
      }
    }
    apply(dragBaseX + rubber(dx), dragBaseY + rubber(dy));
  });

  const end = () => {
    clearTimeout(pressTimer);
    pressTimer = null;
    pointerId = null;
    if(isDragging) springHome();
  };
  orb.addEventListener('pointerup', end);
  orb.addEventListener('pointercancel', end);

  // ===== Overlay: never show orb and card at the same time =====
  overlay.classList.remove('is-open');
  overlay.style.display = 'none';
  orb.style.display = 'block';

  let state = 'closed'; // closed | opening | open | closing

  const waitTransformEnd = (timeoutMs=820)=> new Promise((resolve)=>{
    let done = false;
    const finish = ()=>{
      if(done) return;
      done = true;
      inner.removeEventListener('transitionend', onEnd);
      resolve();
    };
    const onEnd = (ev)=>{ if(ev.propertyName === 'transform') finish(); };
    inner.addEventListener('transitionend', onEnd);
    setTimeout(finish, timeoutMs);
  });

  const open = ()=>{
    if(state !== 'closed') return;
    state = 'opening';
    orb.style.display = 'none';
    overlay.style.display = 'grid';
    requestAnimationFrame(()=> overlay.classList.add('is-open'));
    waitTransformEnd().then(()=>{ if(state === 'opening') state = 'open'; });
  };

  const close = ()=>{
    if(state !== 'open') return;
    state = 'closing';
    overlay.classList.remove('is-open');

    waitTransformEnd().then(()=>{
      overlay.style.display = 'none';

      orb.style.display = 'block';
      orb.style.visibility = 'hidden';

      window.__WT_ORB_API?.recomputeBounds?.();
      window.__WT_ORB_API?.moveToViewportCenter?.();

      orb.style.visibility = '';
      window.__WT_ORB_API?.springHome?.();

      state = 'closed';
    });
  };

  orb.addEventListener('click', (e)=>{
    if(e.defaultPrevented) return;
    e.preventDefault();
    open();
  });

  card.addEventListener('click', (e)=>{
    e.preventDefault();
    e.stopPropagation();
    close();
  });

  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') close(); });

  // Extra: prevent drag-ghost & context menu inside orb/card
  [document.documentElement, document.body, orb, overlay, card].forEach((el)=>{
    el?.addEventListener('contextmenu', (e)=>e.preventDefault(), {capture:true});
  });
  [orb, card].forEach((root)=>{
    root?.querySelectorAll('img, svg').forEach((n)=>{
      n.setAttribute('draggable','false');
      n.addEventListener('dragstart', (e)=>e.preventDefault(), {capture:true});
      n.addEventListener('contextmenu', (e)=>e.preventDefault(), {capture:true});
    });
  });
})();