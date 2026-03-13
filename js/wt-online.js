
(() => {
  let wtOnlineBadgeId = 0;

  function initOnlineGlobe(chartId){
    if (
      typeof am5 === "undefined" ||
      typeof am5map === "undefined" ||
      typeof am5themes_Animated === "undefined" ||
      typeof am5geodata_continentsLow === "undefined"
    ) return;

    const root = am5.Root.new(chartId);
    root.setThemes([am5themes_Animated.new(root)]);
    if (root._logo) root._logo.dispose();

    const chart = root.container.children.push(am5map.MapChart.new(root, {
      panX: "none",
      panY: "none",
      wheelX: "none",
      wheelY: "none",
      pinchZoom: false,
      projection: am5map.geoOrthographic(),
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0
    }));

    const backgroundSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));
    backgroundSeries.mapPolygons.template.setAll({
      fill: am5.color(0x7aa4ff),
      fillOpacity: 1,
      strokeOpacity: 0,
      interactive: false
    });
    backgroundSeries.data.push({
      geometry: am5map.getGeoRectangle(90, 180, -90, -180)
    });

    const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
      geoJSON: am5geodata_continentsLow,
      exclude: ["antarctica"]
    }));

    polygonSeries.mapPolygons.template.setAll({
      fill: am5.color(0xf6f7fb),
      strokeOpacity: 0,
      interactive: false,
      shadowColor: am5.color(0x000000),
      shadowBlur: 1.4,
      shadowOffsetX: -1,
      shadowOffsetY: 1,
      shadowOpacity: 0.12
    });

    chart.animate({
      key: "rotationX",
      from: 0,
      to: 360,
      duration: 30000,
      loops: Infinity
    });

    chart.appear(400, 100);

    requestAnimationFrame(() => {
      const host = document.getElementById(chartId);
      if (!host) return;
      host.querySelectorAll("div, canvas, svg").forEach(node => {
        node.style.position = "absolute";
        node.style.inset = "0";
        node.style.width = "100%";
        node.style.height = "100%";
        node.style.borderRadius = "50%";
        node.style.overflow = "hidden";
        node.style.background = "transparent";
      });
    });
  }

  function buildOnlineBadge(){
    const chartId = `wtOnlineGlobe-${++wtOnlineBadgeId}`;

    const wrap = document.createElement("div");
    wrap.className = "wtOnlineWrap";

    wrap.innerHTML = `
      <div class="wtOnlineBadge" aria-label="ONLINE">
        <div class="wtOnlineEdgeRefraction" aria-hidden="true"></div>
        <div class="wtOnlineGlobeWrap" aria-hidden="true">
          <div id="${chartId}" class="wtOnlineGlobe"></div>
        </div>
        <div class="wtOnlineText">ONLINE</div>
      </div>
    `;

    requestAnimationFrame(() => initOnlineGlobe(chartId));
    return wrap;
  }

  function parseEvents(data){
    const events = Array.isArray(data?.events)
      ? data.events
      : (Array.isArray(data) ? data : []);

    return events
      .filter(ev => ev && (ev.poster || ev.image || ev.img))
      .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
  }

  async function fetchUpcoming(){
    const candidates = [
      "data/upcoming.json",
      "data/Upcoming.json",
      "data/UPCOMING.json"
    ];

    for (const url of candidates){
      try {
        const res = await fetch(url, { cache: "no-cache" });
        if (res.ok) return await res.json();
      } catch (_) {}
    }

    throw new Error("No upcoming json found");
  }

  async function applyOnlineBadges(){
    const items = Array.from(document.querySelectorAll(".wtUpcomingItem"));
    if (!items.length) return;

    let data;
    try {
      data = await fetchUpcoming();
    } catch (e) {
      console.warn("wt-online: json load failed", e);
      return;
    }

    const events = parseEvents(data);

    items.forEach((item, index) => {
      const ev = events[index];
      if (!ev || ev.online !== true) return;
      if (item.querySelector(".wtOnlineWrap")) return;

      const badge = buildOnlineBadge();
      const isNarrow = item.clientWidth && item.clientWidth < 260;
      if (isNarrow) {
        const badgeCore = badge.querySelector(".wtOnlineBadge");
        if (badgeCore) badgeCore.classList.add("is-small");
      }

      item.appendChild(badge);
    });
  }

  function runWhenReady(){
    const slot = document.getElementById("wtNewEventsSlot");
    if (!slot) return;

    const tryRun = () => {
      const items = slot.querySelectorAll(".wtUpcomingItem");
      if (!items.length) {
        requestAnimationFrame(tryRun);
        return;
      }
      applyOnlineBadges();
    };

    tryRun();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runWhenReady, { once: true });
  } else {
    runWhenReady();
  }
})();
