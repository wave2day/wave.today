// js/share-actions.js
// Handles ONLY the system Share action inside the bottom panel.
// Does not modify or interfere with existing share.js.

(function () {
  function ready(fn){
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function(){
    const sheet = document.getElementById("wtActionSheet");
    if (!sheet) return;

    sheet.addEventListener("click", function(e){
      const row = e.target && e.target.closest ? e.target.closest(".shareRow") : null;
      if (!row) return;

      if (row.getAttribute("data-action") !== "share") return;

      e.preventDefault();

      const url = window.location.href;
      const title = document.title || "wave.today";
      const text = "go to " + title + " " + url;

      if (navigator.share) {
        navigator.share({ title, text, url }).catch(function(){});
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).catch(function(){});
      }
    }, true);
  });
})();
