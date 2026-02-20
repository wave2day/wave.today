// Zabráníme tomu, aby klik na label spustil klik na plakát.
  // (funguje i kdyby se později měnilo DOM – používáme delegaci)
  document.addEventListener('click', function(e){
    const btn = e.target.closest('.wtLabelWrap .coreSquare');
    if(!btn) return;
    e.preventDefault();
    e.stopPropagation();
    // tady můžeš později navázat vlastní akci (modal, share, filtr...)
    // console.log('Label click', btn);
  }, true);
