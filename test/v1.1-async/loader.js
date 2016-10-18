(function() {
  window.dc           = window.dc || {};
  window.dc.noteQueue = window.dc.noteQueue || [];
  window.dc.embed     = window.dc.embed     || {};
  window.dc.recordHit = "//www.documentcloud.org/pixel.gif";

  // `loadNote()` used to be defined in `note_embed.js`, but we've renamed that 
  // to `actuallyLoadNote()` and turned this into a queuing function.
  window.dc.embed.loadNote = function(url, options) {
    if (window.dc.embed.actuallyLoadNote !== void 0) {
      window.dc.embed.actuallyLoadNote(url, options);
    } else {
      // 1. Define our note-loading utility functions
      var on = function (el, eventName, handler) {
        if (el.addEventListener) {
          el.addEventListener(eventName, handler);
        } else {
          el.attachEvent('on' + eventName, function() {
            handler.call(el);
          });
        }
      };
      var insertStylesheet = function(href) {
        if (!document.querySelector('link[href$="' + href + '"]')) {
          var stylesheet       = document.createElement('link');
              stylesheet.rel   = 'stylesheet';
              stylesheet.type  = 'text/css';
              stylesheet.media = 'screen';
              stylesheet.href  = href;
          document.querySelector('head').appendChild(stylesheet);
        }
      };
      var insertJavaScript = function(src, onLoadCallback) {
        if (!document.querySelector('script[src$="' + src + '"]')) {
          var script       = document.createElement('script');
              script.src   = src;
              script.async = true;
          on(script, 'load', onLoadCallback);
          document.querySelector('body').appendChild(script);
        }
      };
      var loadNotes = function() {
        var q = window.dc.noteQueue;
        for (var i = 0, qLength = q.length; i < qLength; i++) {
          window.dc.embed.actuallyLoadNote(q[i].url, q[i].options);
        }
        window.dc.noteQueue = [];
      };

      // 2. Add this note to the queue that `loadNotes()` will use
      window.dc.noteQueue.push({url: url, options: options});

      // 3. Insert the styles and scripts needed, with `loadNotes()` fired 
      //    after the script has finished loading
      insertStylesheet('/dist/note_embed.css');
      insertJavaScript('/dist/note_embed.js', loadNotes);
    }
  }
})();
