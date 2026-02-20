/* LED -> Background */
    function setLayer(v, on){
      if(!v) return;
      v.style.visibility = on ? "visible" : "hidden";
      v.style.opacity = on ? "" : "0";
      if(on){ v.play().catch(()=>{}); } else { try{ v.pause(); }catch(e){} }
    }
    const sand = document.querySelector('.sandGlass');

    function applyBG(){
      const sandOn = (window.leds?.[0]?.dataset?.on === "1");
      const led2On  = (window.leds?.[1]?.dataset?.on === "1");
      const led3On  = (window.leds?.[2]?.dataset?.on === "1");

      if(sand) sand.style.display = sandOn ? "block" : "none";

      setLayer(vMilk, led2On);
      setLayer(vM, led2On);
      setLayer(vC, led2On);
      setLayer(vY, led2On);

      setLayer(ambient, led3On);
      setLayer(bloomOv, led3On);

      window.softSync && window.softSync();
    }
    window.applyBG = applyBG;
    applyBG();
