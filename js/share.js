const orb      = document.getElementById("shareOrb");
  const sheet    = document.getElementById("wtActionSheet");
  const back     = document.getElementById("wtSheetBackdrop");
  const sentinel = document.getElementById("wtBottomSentinel");

  let openedManually = false;
  let openedByBottom = false;

  // === scroll heuristika pro auto-hide při jízdě nahoru ===
  let lastScrollY = window.scrollY || 0;
  let maxYSinceOpen = lastScrollY;   // nejnižší místo (největší Y), kam se uživatel po otevření dostal
  let hideArmed = false;

  function resetScrollHeuristics(){
    lastScrollY = window.scrollY || 0;
    maxYSinceOpen = lastScrollY;
    hideArmed = false;
  }

  function openSheet({manual=false, byBottom=false}={}){
    openedManually = !!manual;
    openedByBottom = !!byBottom;

    sheet.classList.add("show");
    back.classList.add("show");

    resetScrollHeuristics();
  }

  function closeSheet(){
    sheet.classList.remove("show");
    back.classList.remove("show");

    openedManually = false;
    openedByBottom = false;

    resetScrollHeuristics();
  }

  // ručně (toggle)
  orb.addEventListener("click", (e)=>{
    e.preventDefault();
    if (sheet.classList.contains("show")) {
      closeSheet();
    } else {
      openSheet({manual:true, byBottom:false});
    }
  });
// zavřít klikem mimo
  back.addEventListener("click", closeSheet);

  // --- AUTO OPEN u konce stránky (IntersectionObserver + fallback) ---
  const openByBottomOnce = ()=>{
    if(sheet.classList.contains("show")) return;
    openSheet({manual:false, byBottom:true});
  };

  if("IntersectionObserver" in window){
    const io = new IntersectionObserver((entries)=>{
      const hit = entries.some(e=>e.isIntersecting);
      if(hit){
        openByBottomOnce();
      }else{
        // když jsme to otevřeli kvůli dnu a už nejsme u dna, zavři
        if(openedByBottom){
          closeSheet();
        }
      }
    },{
      root: null,
      // citlivost (px před koncem). Zvýšit = otevře dřív.
      rootMargin: "0px 0px 220px 0px",
      threshold: 0
    });
    io.observe(sentinel);
  }else{
    // fallback: když jsme fakt blízko konce, otevři
    window.addEventListener("scroll", ()=>{
      const scrollPos = window.scrollY + window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      if(docH - scrollPos < 160){
        openByBottomOnce();
      }
    }, {passive:true});
  }

  // --- AUTO HIDE při scrollu nahoru (funguje pro ruční i auto otevření) ---
  window.addEventListener("scroll", ()=>{
    const y = window.scrollY || 0;
    const dy = y - lastScrollY;
    lastScrollY = y;

    if(!sheet.classList.contains("show")) return;

    // aktualizuj nejnižší dosažený bod po otevření
    if(y > maxYSinceOpen){
      maxYSinceOpen = y;
      hideArmed = false; // jdeš dolů -> ne
      return;
    }

    // jdeš nahoru -> po určité "trase" schovej
    if(dy < -2){
      const upDistance = (maxYSinceOpen - y);

      // „odlep“ od dna: u auto-openu to schovej rychleji
      const THRESH = openedByBottom ? 36 : 56; // px
      const HARD   = openedByBottom ? 90 : 120;

      if(upDistance > THRESH) hideArmed = true;

      if(hideArmed && upDistance > HARD){
        closeSheet();
      }
    }
  }, {passive:true});