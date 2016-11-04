(function() {
  var dc = window.dc = window.dc || {};
  dc.noteQueue       = dc.noteQueue || [];
  dc.recordHit       = "//dev.dcloud.org/pixel.gif";
  dc.embed           = dc.embed || {};
  dc.embed.loadNote  = function(url, options) {
    var insertStylesheet = function(href, media) {
      if (!document.querySelector('link[href$="' + href + '"]')) {
        media = media || 'screen';
        var stylesheet       = document.createElement('link');
            stylesheet.rel   = 'stylesheet';
            stylesheet.type  = 'text/css';
            stylesheet.media = media;
            stylesheet.href  = href;
        document.getElementsByTagName('head')[0].appendChild(stylesheet);
      }
    };
    var insertJavaScript = function(src, onLoadCallback) {
      var script = document.querySelector('script[src$="' + src + '"]');
      if (!script) {
        script       = document.createElement('script');
        script.src   = src;
        script.async = true;
        document.getElementsByTagName('head')[0].appendChild(script);
      }
      if (script.addEventListener && !script.getAttribute('data-listening')) {
        script.setAttribute('data-listening', true);
        script.addEventListener('load', onLoadCallback);
      }
    };
    var loadQueuedNotes = function() {
      var loadNote = dc.embed.immediatelyLoadNote || (dc.embed.noteCallback && dc.embed.loadNote ? dc.embed.loadNote : false);
      if (loadNote) {
        var q = dc.noteQueue;
        for (var i = 0, qLength = q.length; i < qLength; i++) {
          loadNote(q[i].url, q[i].options);
        }
        dc.noteQueue = [];
      } else if (window.console) {
        console.error("DocumentCloud embed can't load because of missing components.");
      }
    };
    insertStylesheet('//notes-assets.dcloud.org/dist/note_embed-datauri.css');
    if (dc.embed.immediatelyLoadNote) {
      dc.embed.immediatelyLoadNote(url, options);
    } else {
      dc.noteQueue.push({url: url, options: options});
      insertJavaScript('//notes-assets.dcloud.org/dist/note_embed.js', loadQueuedNotes);
    }
  }
})();
