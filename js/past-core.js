/* past-layout.css — RANDOM mobile (2 columns) + alive tilt from JS vars
   - NEROZBIJÍ hero/centraci: žádný transform na #eventsGrid
   - NAKLONĚNÍ FUNGUJE: transform je jen na .poster přes --tx/--ty/--rot/--scl
   - ŽÁDNÉ “vynulování” transformů (žádné transform:none pro random)
*/

/* ===== RANDOM: neklipovat rotace/přesahy ===== */
@media (max-width: 768px){
  #eventsGrid.randomMode .poster,
  #eventsGrid.randomMode .poster *{
    overflow: visible !important;
    clip-path: none !important;
    -webkit-clip-path: none !important;
    mask: none !important;
    -webkit-mask: none !important;
  }

  #eventsGrid.randomMode .poster{
    position: relative;
    contain: none !important;
    z-index: var(--z, 1);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }

  #eventsGrid.randomMode .poster img{
    display: block !important;
    width: 100% !important;
    height: auto !important;
    max-height: none !important;
    object-fit: contain !important;
    transform-origin: 50% 50% !important;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
}

/* ===== MOBILE RANDOM = 2 SLOUPCE (hlavní pravidlo) ===== */
@media (max-width: 768px){
  #eventsGrid.randomMode,
  #eventsGrid.randomMode.force2col,
  html.isTouch #eventsGrid.randomMode,
  html.isTouch #eventsGrid.randomMode.force2col{
    display: block !important;
    -webkit-column-count: 2 !important;
    column-count: 2 !important;
    -webkit-column-width: auto !important;
    column-width: auto !important;

    -webkit-column-gap: 1px !important;
    column-gap: 1px !important;

    padding: 0 !important;
    margin: 0 !important;

    width: 100vw !important;
    max-width: 100vw !important;
    margin-left: calc(50% - 50vw) !important;
    margin-right: calc(50% - 50vw) !important;

    transform: none !important;

    grid-template-columns: unset !important;
    gap: unset !important;

    isolation: isolate;
    filter: none !important;
    will-change: auto !important;
  }

  #eventsGrid.randomMode .poster{
    display: inline-block !important;
    width: 100% !important;
    break-inside: avoid !important;
    -webkit-column-break-inside: avoid !important;

    margin: 0 0 1px !important;

    transform: translate(var(--tx,0px), var(--ty,0px)) rotate(var(--rot,0deg)) scale(var(--scl,1)) !important;
    transform-origin: 50% 50% !important;

    transition: none !important;
    will-change: transform;
    filter: none !important;
    mix-blend-mode: normal !important;
  }

  #eventsGrid.randomMode .poster img{
    transform: none !important;
    will-change: auto !important;
    filter: none !important;
    mix-blend-mode: normal !important;
  }

  #eventsGrid.randomMode .wtIcon{
    width: 64px !important;
    height: 64px !important;
  }
}

/* ===== EXTRA MALÉ TELEFONY ===== */
@media (max-width: 420px){
  #eventsGrid.randomMode,
  #eventsGrid.randomMode.force2col,
  html.isTouch #eventsGrid.randomMode,
  html.isTouch #eventsGrid.randomMode.force2col{
    -webkit-column-gap: 0px !important;
    column-gap: 0px !important;
  }

  #eventsGrid.randomMode .poster{
    margin-bottom: 0px !important;
  }

  #eventsGrid.randomMode .wtIcon{
    width: 68px !important;
    height: 68px !important;
  }
}

/* ===== SCROLL stabilita (bez zabití náklonu) ===== */
@media (max-width: 768px) and (orientation: portrait){
  #eventsGrid.randomMode .poster,
  #eventsGrid.randomMode .poster img{
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }

  #eventsGrid.randomMode.isScrolling .poster,
  #eventsGrid.randomMode.isScrolling .poster img{
    filter: none !important;
    transition: none !important;
    animation: none !important;
  }

  #eventsGrid.randomMode .poster img{
    opacity: 1 !important;
  }
}

/* ===== volitelný reveal (zůstává, ale neblokuje běžný stav) ===== */
@media (max-width: 560px) and (orientation: portrait){
  #eventsGrid.randomMode .poster.rndmReveal{
    animation: rndmDepthIn 420ms cubic-bezier(.16,.9,.18,1) both;
  }

  @keyframes rndmDepthIn{
    0%{
      opacity: 0;
      transform:
        translate(var(--flipX,0px), var(--flipY,0px))
        translate(var(--tx,0px), calc(var(--ty,0px) + 34px))
        rotate(var(--rot,0deg))
        scale(var(--scl, 1));
      filter: blur(.2px);
    }
    100%{
      opacity: 1;
      transform:
        translate(var(--flipX,0px), var(--flipY,0px))
        translate(var(--tx,0px), var(--ty,0px))
        rotate(var(--rot,0deg))
        scale(var(--scl, 1));
      filter: blur(0);
    }
  }
}

/* ===== finální pojistka proti klipu ===== */
#eventsGrid.randomMode .poster{ overflow: visible !important; }
#eventsGrid.randomMode .poster img{ display:block; width:100%; height:auto; }
/* mini overlap – jemný nástěnkový efekt */
#eventsGrid.randomMode .poster:nth-child(3n){
  margin-bottom: -2px !important;
}

#eventsGrid.randomMode .poster:nth-child(5n){
  margin-bottom: -3px !important;
}

#eventsGrid.randomMode .poster:nth-child(7n){
  margin-bottom: -1px !important;
}

/* ===================================================================== */
/* AMBIENT layers (clean, no duplicity)                                   */
/* - #ambientBg: fog / mlha (více barev – pokud ji někdy dodáš z JS)      */
/* - #ambientGlow: jednobarevný glow (řídí past-core.js)                   */
/* - #ambientPoster: rozmazaný “sticky” plakát (řídí past-core.js)         */
/* ===================================================================== */

#ambientBg{
  --fog1:145,85,255;
  --fog2:145,85,255;
  --fog3:145,85,255;
  --fog4:145,85,255;

  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;

  filter: blur(54px) saturate(1.10);
  transform: translateZ(0);
  will-change: background-image;
}

#ambientGlow{
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;

  filter: blur(54px) saturate(1.10);
  transform: translateZ(0);
  will-change: background;
}

#ambientPoster{
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;

  opacity: .30;
  filter: blur(72px) saturate(1.16);
  transform: translateZ(0);
  will-change: background-image, opacity, filter;
}

/* ať je grid vždy nad ambientem */
#eventsGrid{ position: relative; z-index: 2; }

/* mobile: agresivnější + víc rozmazaný plakát */
@media (max-width: 560px) and (orientation: portrait){
  #ambientBg{
    filter: blur(58px) saturate(1.14);
  }
  #ambientGlow{
    filter: blur(70px) saturate(1.22);
    opacity: .92;
  }
  #ambientPoster{
    opacity: .45;
    filter: blur(92px) saturate(1.26);
  }
}
