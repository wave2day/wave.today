const ARROW = (dir)=>`
      <div class="glassBase pill v-blue">
        <div class="pressGlow"></div>
        <button class="coreBtn" type="button" aria-label="${dir==='prev'?'Předchozí':'Další'}">
          <svg class="arrow" viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              <linearGradient id="gFill${dir}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#1a1a1a" stop-opacity="0.92"/>
                <stop offset="0.55" stop-color="#0f0f0f" stop-opacity="0.98"/>
                <stop offset="1" stop-color="#000" stop-opacity="1"/>
              </linearGradient>
              <linearGradient id="gHi${dir}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#ffffff" stop-opacity="0.18"/>
                <stop offset="0.35" stop-color="#ffffff" stop-opacity="0.06"/>
                <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
              </linearGradient>
            </defs>
            ${dir==='prev'
              ? '<path d="M64 18 L30 50 L64 82" fill="none" stroke="url(#gFillprev)" stroke-width="18" class="stroke"/><path d="M64 18 L30 50 L64 82" fill="none" stroke="url(#gHiprev)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="72 3" stroke-dashoffset="-2" opacity="0.9"/>'
              : '<path d="M36 18 L70 50 L36 82" fill="none" stroke="url(#gFillnext)" stroke-width="18" class="stroke"/><path d="M36 18 L70 50 L36 82" fill="none" stroke="url(#gHinext)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="72 3" stroke-dashoffset="-2" opacity="0.9"/>'}
          </svg>
        </button>
      </div>
    `;
    

    
    // vložení TVÝCH tlačítek (jen jednou)
    const prevSlot = document.querySelector('#wtCarouselNav .wtNavPrev');
    const nextSlot = document.querySelector('#wtCarouselNav .wtNavNext');
    if(prevSlot && !prevSlot.innerHTML.trim()) prevSlot.innerHTML = ARROW('prev');
    if(nextSlot && !nextSlot.innerHTML.trim()) nextSlot.innerHTML = ARROW('next');

    // deterministicky inertní kliky: jen eventy, žádná knihovna, žádné posouvání
    const fire = (name) => window.dispatchEvent(new CustomEvent('wt:click', { detail: { name } }));
    document.querySelector('#wtCarouselNav .wtNavPrev')?.addEventListener('click', (e)=>{ e.preventDefault(); fire('prev'); });
    document.querySelector('#wtCarouselNav .wtNavNext')?.addEventListener('click', (e)=>{ e.preventDefault(); fire('next'); });
