(function(){
      const ua = navigator.userAgent;
      const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR|CriOS|FxiOS/.test(ua);
      if(isSafari) document.documentElement.classList.add('is-safari');
    })();
