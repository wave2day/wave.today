/* 3-color fog – ink in water */

(() => {

  const grid = document.getElementById("eventsGrid");
  const ambient = document.getElementById("ambientBg");
  if (!grid || !ambient) return;

  const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
  const N = 3;

  const base = {r:170,g:120,b:230};

  let current = Array.from({length:N},()=>({...base}));
  let target  = Array.from({length:N},()=>({...base}));

  let pos = [
    {x:22,y:28,s:70,a:.60},
    {x:78,y:30,s:66,a:.55},
    {x:46,y:74,s:78,a:.45}
  ];

  let posTarget = JSON.parse(JSON.stringify(pos));

  let raf=0;
  let cache=new Map();
  let nextDrift=0;

  const rand=(a,b)=>a+Math.random()*(b-a);

  function stylize(rgb){

    const avg=(rgb.r+rgb.g+rgb.b)/3;

    return{
      r:clamp(avg+(rgb.r-avg)*2.2+14,0,255),
      g:clamp(avg+(rgb.g-avg)*2.0+12,0,255),
      b:clamp(avg+(rgb.b-avg)*2.3+16,0,255)
    };

  }

  function apply(){

    ambient.style.backgroundImage=`
      radial-gradient(circle at ${pos[0].x}% ${pos[0].y}%, rgba(${current[0].r},${current[0].g},${current[0].b},${pos[0].a}), transparent ${pos[0].s}%),
      radial-gradient(circle at ${pos[1].x}% ${pos[1].y}%, rgba(${current[1].r},${current[1].g},${current[1].b},${pos[1].a}), transparent ${pos[1].s}%),
      radial-gradient(circle at ${pos[2].x}% ${pos[2].y}%, rgba(${current[2].r},${current[2].g},${current[2].b},${pos[2].a}), transparent ${pos[2].s}%)
    `;

  }

  function tick(t){

    if(!nextDrift) nextDrift=t+6000;

    if(t>=nextDrift){

      posTarget=[
        {x:rand(12,36),y:rand(18,40),s:rand(64,80),a:.62},
        {x:rand(64,88),y:rand(20,42),s:rand(60,76),a:.56},
        {x:rand(28,72),y:rand(60,86),s:rand(70,86),a:.48}
      ];

      nextDrift=t+rand(5000,9000);

    }

    for(let i=0;i<N;i++){

      current[i].r += (target[i].r-current[i].r)*.03;
      current[i].g += (target[i].g-current[i].g)*.03;
      current[i].b += (target[i].b-current[i].b)*.03;

      pos[i].x += (posTarget[i].x-pos[i].x)*.015;
      pos[i].y += (posTarget[i].y-pos[i].y)*.015;
      pos[i].s += (posTarget[i].s-pos[i].s)*.015;
      pos[i].a += (posTarget[i].a-pos[i].a)*.015;

    }

    apply();
    raf=requestAnimationFrame(tick);

  }

  function mix(list){

    for(let i=0;i<N;i++){

      const inc=stylize(list[i]||list[list.length-1]||base);

      target[i]={
        r:target[i].r*.70+inc.r*.30,
        g:target[i].g*.70+inc.g*.30,
        b:target[i].b*.70+inc.b*.30
      };

    }

  }

  function getAvg(src){

    if(cache.has(src)) return Promise.resolve(cache.get(src));

    return new Promise(res=>{

      const img=new Image();
      img.crossOrigin="anonymous";

      img.onload=()=>{

        const c=document.createElement("canvas");
        const ctx=c.getContext("2d",{willReadFrequently:true});

        c.width=32;
        c.height=32;

        ctx.drawImage(img,0,0,32,32);

        const d=ctx.getImageData(0,0,32,32).data;

        let r=0,g=0,b=0,n=0;

        for(let i=0;i<d.length;i+=4){

          if(d[i+3]<32) continue;

          r+=d[i];
          g+=d[i+1];
          b+=d[i+2];
          n++;

        }

        const rgb=n?{r:r/n,g:g/n,b:b/n}:base;

        cache.set(src,rgb);
        res(rgb);

      };

      img.onerror=()=>res(base);
      img.src=src;

    });

  }

  async function update(){

    const imgs=[...grid.querySelectorAll(".poster img")];

    if(!imgs.length) return;

    const visible=imgs
      .map(img=>({img,rect:img.getBoundingClientRect()}))
      .filter(o=>o.rect.top<window.innerHeight && o.rect.bottom>0)
      .slice(0,3);

    const colors=[];

    for(const v of visible){

      const src=v.img.currentSrc||v.img.src;
      const rgb=await getAvg(src);
      colors.push(rgb);

    }

    if(colors.length) mix(colors);

  }

  window.addEventListener("scroll",()=>update(),{passive:true});
  new MutationObserver(()=>update()).observe(grid,{childList:true,subtree:true});

  update();
  if(!raf) raf=requestAnimationFrame(tick);

})();
