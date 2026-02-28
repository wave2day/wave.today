/* wt-calendar.js (Google Calendar TEMPLATE)
   Tap/click on the date label (.wtLabelWrap) opens Google Calendar "Add event" (prefilled).
   - No CSS changes required.
   - No times required: creates an ALL‑DAY event for the label's date.
   - Adds ticket URL + poster URL into Details.

   Pulls:
     date  -> from label (.day + .mon) or label text (e.g., "25 FEB")
     title -> from poster <img alt="..."> or image filename
     ticket/event url -> from nearest <a href> (prefers .wtUpcomingLink if present)
     poster url -> from nearest <img src>

   If nothing happens, check that this file is actually served:
     https://wave.today/js/wt-calendar.js
*/

(() => {
  const LABEL_SELECTOR = ".wtLabelWrap";
  const ITEM_SELECTOR = ".wtUpcomingItem";
  const LINK_SELECTOR_PREFERRED = "a.wtUpcomingLink[href]";
  const LINK_SELECTOR_FALLBACK = "a[href]";
  const POSTER_SELECTOR = "img";

  const MONTHS = {
    jan: 1, january: 1,
    feb: 2, february: 2,
    mar: 3, march: 3,
    apr: 4, april: 4,
    may: 5,
    jun: 6, june: 6,
    jul: 7, july: 7,
    aug: 8, august: 8,
    sep: 9, sept: 9, september: 9,
    oct: 10, october: 10,
    nov: 11, november: 11,
    dec: 12, december: 12,
  };

  const pad = (n) => String(n).padStart(2, "0");

  function absolutizeUrl(url) {
    if (!url) return "";
    try { return new URL(url, window.location.href).toString(); }
    catch { return url; }
  }

  function extractDayMonth(labelEl) {
    const dayEl = labelEl.querySelector(".day");
    const monEl = labelEl.querySelector(".mon");

    let day = dayEl ? dayEl.textContent.trim() : "";
    let mon = monEl ? monEl.textContent.trim() : "";

    if (!day || !mon) {
      const t = labelEl.textContent.replace(/\s+/g, " ").trim();
      const m = t.match(/(\d{1,2})\s*([A-Za-z]{3,9})/);
      if (m) { day = m[1]; mon = m[2]; }
    }

    const dayNum = parseInt(day, 10);
    const monNum = MONTHS[(mon || "").toLowerCase()];
    if (!dayNum || !monNum) return null;
    return { day: dayNum, month: monNum };
  }

  function decideYear(month, day) {
    const now = new Date();
    const y = now.getFullYear();
    const candidate = new Date(y, month - 1, day);
    const diffDays = (candidate - now) / (1000 * 60 * 60 * 24);
    return (diffDays < -7) ? (y + 1) : y;
  }

  function addDaysYMD(ymd, days) {
    const [y, m, d] = ymd.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  }

  function ymdToCompact(ymd) {
    return ymd.replaceAll("-", "");
  }

  function getTitle(itemEl) {
    const img = itemEl.querySelector(POSTER_SELECTOR);
    const alt = img && img.getAttribute("alt");
    if (alt && alt.trim()) return alt.trim();

    const src = img && img.getAttribute("src");
    if (src) {
      const file = (src.split("?")[0].split("#")[0].split("/").pop() || "").trim();
      const base = file.replace(/\.(jpg|jpeg|png|webp|gif)$/i, "");
      if (base) return base.replace(/[_-]+/g, " ").trim();
    }
    return "Event";
  }

  function getTicketUrl(itemEl) {
    const a = itemEl.querySelector(LINK_SELECTOR_PREFERRED) || itemEl.querySelector(LINK_SELECTOR_FALLBACK);
    const href = a ? a.getAttribute("href") : "";
    return absolutizeUrl(href);
  }

  function getPosterUrl(itemEl) {
    const img = itemEl.querySelector(POSTER_SELECTOR);
    const src = img ? img.getAttribute("src") : "";
    return absolutizeUrl(src);
  }

  function openGoogleCalendarAllDay({ title, ymd, ticketUrl, posterUrl }) {
    const start = ymdToCompact(ymd);
    const end = ymdToCompact(addDaysYMD(ymd, 1));

    const detailsLines = [];
    if (ticketUrl) detailsLines.push(`Tickets: ${ticketUrl}`);
    if (posterUrl) detailsLines.push(`Poster: ${posterUrl}`);

    const gcal = new URL("https://calendar.google.com/calendar/render");
    gcal.searchParams.set("action", "TEMPLATE");
    gcal.searchParams.set("text", title || "Event");
    gcal.searchParams.set("dates", `${start}/${end}`);
    if (detailsLines.length) gcal.searchParams.set("details", detailsLines.join("\n"));

    window.open(gcal.toString(), "_blank", "noopener,noreferrer");
  }

  document.addEventListener("click", (e) => {
    const label = e.target.closest(LABEL_SELECTOR);
    if (!label) return;

    e.preventDefault();
    e.stopPropagation();

    const item = label.closest(ITEM_SELECTOR) || document;

    let ymd;
    const dm = extractDayMonth(label);
    if (dm) {
      const year = decideYear(dm.month, dm.day);
      ymd = `${year}-${pad(dm.month)}-${pad(dm.day)}`;
    } else {
      const now = new Date();
      ymd = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    }

    const title = getTitle(item);
    const ticketUrl = getTicketUrl(item);
    const posterUrl = getPosterUrl(item);

    openGoogleCalendarAllDay({ title, ymd, ticketUrl, posterUrl });
  }, true);
})();