(function() {
  window.dc           = window.dc || {};
  window.dc.recordHit = "//www.documentcloud.org/pixel.gif";
  window.dc.noteQueue = window.dc.noteQueue || [];
  window.dc.embed     = window.dc.embed     || {};

  // Public entry point
  window.dc.embed.loadNote = function(url, options) {
    if (window.dc.embed.actuallyLoadNote !== void 0) {
      // We already have access to `note_embed.js`, so just proxy on to the 
      // real note-loader
      window.dc.embed.actuallyLoadNote(url, options);
    } else {

      // 1. Define the note-loading utilities we'll need
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
          stylesheet       = document.createElement('link');
          stylesheet.rel   = 'stylesheet';
          stylesheet.type  = 'text/css';
          stylesheet.media = 'screen';
          stylesheet.href  = href;
          document.querySelector('head').appendChild(stylesheet);
        }
      };
      var insertJavaScript = function(src, onLoadCallback) {
        if (!document.querySelector('script[src$="' + src + '"]')) {
          script = document.createElement('script');
          script.src = src;
          script.async = true;
          on(script, 'load', onLoadCallback);
          document.querySelector('body').appendChild(script);
        }
      };
      var loadNotes = function() {
        q = window.dc.noteQueue;
        for (var i = 0, qLength = q.length; i < qLength; i++) {
          window.dc.embed.actuallyLoadNote(q[i].url, q[i].options);
        }
        window.dc.noteQueue = [];
      };

      // 2. Add this note to the queue that `loadNotes` will use
      window.dc.noteQueue.push({url: url, options: options});

      // 3. Insert the styles and scripts needed, with `loadNotes` fired after 
      //    the script has finished loading
      insertStylesheet('../dist/note_embed.css');
      insertJavaScript('../dist/note_embed.js', loadNotes);
    }
  }

})();
