/* wt-calendar.js
   Klik na .wtLabelWrap -> otevře "Add to calendar" (Google Calendar TEMPLATE)
   Bez zásahu do CSS. CSS už definuje klikací overlay .wtLabelWrap. */

(function () {
  const LABEL_SELECTOR = ".wtLabelWrap";

  // --- Helpers ---
  function pad(n) { return String(n).padStart(2, "0"); }

  // Input: "YYYY-MM-DDTHH:mm:ss" (lokální čas bez Z)
  // Output: "YYYYMMDDTHHMMSSZ" (UTC pro Google Calendar)
  function toGCalUTC(dtLocal) {
    const d = new Date(dtLocal);
    if (Number.isNaN(d.getTime())) return null;
    return (
      d.getUTCFullYear() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) + "T" +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) + "Z"
    );
  }

  function addHours(dtLocal, hours) {
    const d = new Date(dtLocal);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(d.getHours() + hours);
    // vrátíme opět "YYYY-MM-DDTHH:mm:ss" v lokálním formátu
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const da = pad(d.getDate());
    const h = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const s = pad(d.getSeconds());
    return `${y}-${m}-${da}T${h}:${mi}:${s}`;
  }

  function openGoogleCalendar({ title, start, end, location, url }) {
    const startUTC = toGCalUTC(start);
    const endUTC = toGCalUTC(end);
    if (!startUTC || !endUTC) return;

    const gcal = new URL("https://calendar.google.com/calendar/render");
    gcal.searchParams.set("action", "TEMPLATE");
    gcal.searchParams.set("text", title || "Event");
    gcal.searchParams.set("dates", `${startUTC}/${endUTC}`);
    if (location) gcal.searchParams.set("location", location);
    if (url) gcal.searchParams.set("details", url);

    window.open(gcal.toString(), "_blank", "noopener,noreferrer");
  }

  function getEventDataFromLabel(labelEl) {
    // Preferované: data-* na .wtLabelWrap (nebo na .wtUpcomingItem)
    const host =
      labelEl.closest("[data-title][data-start]") ||
      labelEl.closest(".wtUpcomingItem") ||
      labelEl;

    const ds = host.dataset;

    // Minimální očekávání:
    // data-title="..." data-start="YYYY-MM-DDTHH:mm:ss"
    // volitelně: data-end, data-location, data-url
    let title = ds.title || "";
    const start = ds.start || "";
    let end = ds.end || "";
    const location = ds.location || "";
    const url = ds.url || "";

    // fallback title: zkus sebrat z aria-label / alt plakátu
    if (!title) {
      const poster = host.querySelector(".wtUpcomingPoster");
      title = (poster && poster.getAttribute("alt")) ? poster.getAttribute("alt") : "Event";
    }

    // když není end, dáme default +2h (upravi si jak chceš)
    if (start && !end) end = addHours(start, 2);

    return { title, start, end, location, url };
  }

  // --- Main click handler ---
  document.addEventListener("click", function (e) {
    const label = e.target.closest(LABEL_SELECTOR);
    if (!label) return;

    // Zabránit prokliku na plakátový <a> pod tím
    e.preventDefault();
    e.stopPropagation();

    const data = getEventDataFromLabel(label);

    // Bez start/end to kalendář neotevře smysluplně
    if (!data.start || !data.end) {
      // nic nevypisujeme; tichý fail
      return;
    }

    openGoogleCalendar(data);
  }, true);
})();
