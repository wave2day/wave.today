// js/share-links-fix.js
// Minimal fix: ensure Instagram/Mail (and any other <a.shareRow>) always open.
// Does NOT change share.js or share-actions.js. Safe to include after them.

(function () {
  function onReady(fn){
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  onReady(function(){
    var sheet = document.getElementById("wtActionSheet");
    if(!sheet) return;

    sheet.addEventListener("click", function(e){
      var row = e.target && e.target.closest ? e.target.closest(".shareRow") : null;
      if(!row) return;

      // Leave the system share row to share-actions.js
      var action = row.getAttribute("data-action") || "";
      if(action === "share") return;

      // Only intervene for links (anchors)
      var href = row.getAttribute("href");
      if(!href) return;

      // Ensure it fires even if something else overlays / blocks default navigation
      e.preventDefault();

      // mailto / tel / sms should use location
      if(/^mailto:/i.test(href) || /^tel:/i.test(href) || /^sms:/i.test(href)){
        window.location.href = href;
        return;
      }

      // External link: try new tab, fallback same tab
      var win = window.open(href, "_blank", "noopener");
      if(!win) window.location.href = href;
    }, true);
  });
})();
