// js/share-links-fix.js
// Makes Instagram / Mail (and optional SMS) rows work reliably inside #wtActionSheet.
// Does NOT touch existing share.js (open/close) logic.
(function () {
  function onReady(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true});
    else fn();
  }

  onReady(function(){
    const sheet = document.getElementById('wtActionSheet');
    if(!sheet) return;

    // Hard-coded targets (you can change later when moving off GitHub).
    const INSTAGRAM_URL = 'https://www.instagram.com/wave__today?igsh=Y2xhcGdlMGtlejdx';
    const MAIL_TO = 'info@wave.today';
    const MAIL_SUBJECT = 'wave.today';

    function currentUrl(){
      return window.location.href;
    }

    function handle(action){
      const url = currentUrl();

      if(action === 'instagram'){
        // Use same-tab navigation (more reliable than window.open on mobile).
        window.location.href = INSTAGRAM_URL;
        return;
      }

      if(action === 'mail'){
        const body = encodeURIComponent(url);
        const href = `mailto:${MAIL_TO}?subject=${encodeURIComponent(MAIL_SUBJECT)}&body=${body}`;
        window.location.href = href;
        return;
      }

      if(action === 'sms' || action === 'message'){
        const body = encodeURIComponent(url);
        // Android/iOS tolerate different separators; this is generally OK.
        window.location.href = `sms:?&body=${body}`;
        return;
      }
    }

    sheet.addEventListener('click', function(e){
      const row = e.target && e.target.closest ? e.target.closest('.shareRow') : null;
      if(!row) return;

      const action = row.getAttribute('data-action');
      if(action !== 'instagram' && action !== 'mail' && action !== 'sms' && action !== 'message') return;

      // Always prevent default so anchor/button behaves the same everywhere.
      e.preventDefault();
      e.stopPropagation();
      handle(action);
    }, true);
  });
})();
