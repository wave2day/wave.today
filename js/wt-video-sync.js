const base = document.getElementById("myVideo");
    const ambient = document.getElementById("bloomVideo");
    const bloomOv = document.getElementById("bloomOverlay");
    const vMilk = document.getElementById("vMilk");
    const vM = document.getElementById("vM");
    const vC = document.getElementById("vC");
    const vY = document.getElementById("vY");

    const vids = [base, ambient, bloomOv, vMilk, vM, vC, vY].filter(Boolean);

    window.addEventListener('load', ()=>{
      vids.forEach(v=>{
        try{ v.muted = true; v.playsInline = true; v.play().catch(()=>{}); }catch(e){}
      });
    });

    function softSync(){
      const t = base?.currentTime || 0;
      vids.forEach(v=>{
        if(v === base) return;
        if(v.readyState >= 2 && base.readyState >= 2){
          const d = t - v.currentTime;
          if(Math.abs(d) > 0.35) v.currentTime = t;
        }
      });
    }
    setInterval(softSync, 250);
    window.softSync = softSync;
