/*!
 * DocumentCloud Notes 0.1.0
 * A part of [DocumentCloud](https://www.documentcloud.org).
 *
 * @license (c) (c) 2014 DocumentCloud, Investigative Reporters & Editors
 * DocumentCloud Notes may be freely distributed under the MIT license.
 *
 */
(function() {
  var dc            = window.dc = window.dc || {};
  var DocumentCloud = window.DocumentCloud = dc;
  dc.embed          = dc.embed || {};
  dc.embed.notes    = dc.embed.notes || {};

  var $ = dc.$ = dc.$ || window.jQuery.noConflict(true);
  var _ = dc._ = dc._ || window._.noConflict();

  _.t = _.t || function(input){ return input; };

  // Since https://github.com/documentcloud/documentcloud/pull/418, we intend 
  // the public `dc.embed.loadNote` to be a queuing function (defined in the 
  // loader) which only fires this function once it's available.
  // `note` can be either a URL to the .js/.json resource, an object, or a JSON 
  // string blob.
  dc.embed.immediatelyLoadNote = function(note, options) {
    options = options || {};

    var noteData = {};
    if (_.has(note, 'id')) {
      // We were passed note data as a native object
      noteData = note;
    } else {
      try {
        // We were passed note data as a JSON string
        noteData = $.parseJSON(note);
      } catch (e) {
        // Probably this was a URL string; try to grab the ID out of it
        try {
          noteData.id = parseInt(note.match(/(\d+).(?:js|json)$/)[1], 10);
        } catch (e) {
          // Probably this is a malformed JSON string
        }
      }
    }

    var id = options.id = noteData.id;
    var noteModel = new dc.embed.noteModel(options);

    // Store the note view for later access
    dc.embed.notes[id] = dc.embed.notes[id] || new dc.embed.noteView({model: noteModel, el: options.container});

    if (_.has(noteData, 'image_url')) {
      dc.embed.noteCallback(noteData);
    } else { // it's probably a url.
      // Get the party started by requesting note data.
      note_url = note.match(/\.js$/) ? note+"on" : note;
      
      var request = new XMLHttpRequest();
      request.open('GET', note_url, true);
      
      request.onload = function(){
        if (request.status >= 200 && request.status < 400) {
          var response = JSON.parse(request.responseText);
          dc.embed.noteCallback(response);
        } else {
          // handle error
        }
      };
      
      request.onerror = function(){
        //console.log("DocumentCloud: Error loading note");
      };
      
      request.send();
    }

    if (dc.recordHit) dc.embed.pingRemoteUrl('note', id);
  };

  // For backwards-compatibility with the old loader (and for use by people who 
  // don't use the loader), alias `dc.embed.loadNote` when undefined OR when 
  // defined by the old oEmbed loader 
  // (https://github.com/documentcloud/documentcloud/issues/420)
  if (_.isUndefined(dc.embed.loadNote) || !_.isUndefined(dc._notesWaitingForAppLoad)) {
    dc.embed.loadNote = dc.embed.immediatelyLoadNote;
  }

  // Complete the loading process & render the note.
  dc.embed.noteCallback = function(response) {
    var id                = response.id;
    var note              = dc.embed.notes[id];

    // If the embedder is a horrible person and has attempted to loadNote before their
    // target div exists, we'll try to rescue them with setElement again.
    if (!note.el) {
      note.setElement(note.model.options.container || '#DC-note-' + note.model.id);
      // Nuclear option! Create and insert a note div before the script tag 
      // that called this (we hope)
      if (!note.el) {
        $('script:not([src]):contains("/annotations/' + note.model.id + '.js")').each(function(){
          $(this).before('<div id="DC-note-' + note.model.id + '"></div>');
          note.setElement('#DC-note-' + note.model.id);
        });
      }
    }

    note.model.attributes = response;
    note.render();
    // If the note was loaded with an afterLoad callback, now's the time to invoke it.
    if (note.model.options && note.model.options.afterLoad) note.model.options.afterLoad(note);
  };

  // How we report analytics
  dc.embed.pingRemoteUrl = function(type, id) {
    var loc = window.location;
    var url = loc.protocol + '//' + loc.host + loc.pathname;
    if (url.match(/^file:/)) return false;
    url = url.replace(/[\/]+$/, '');
    var hitUrl = dc.recordHit;
    var key    = encodeURIComponent(type + ':' + id + ':' + url);
    $(document).ready( function(){ $(document.body).append('<img class="DV-pixelping" alt="" width="1" height="1" src="' + hitUrl + '?key=' + key + '" />'); });
  };

  // Note Model
  // ----------

  // Note Model constructor
  dc.embed.noteModel = function(opts) {
    this.options = opts || {};
    this.id      = opts.id;
  };

  // Note Model functions
  dc.embed.noteModel.prototype = {
    get: function(key) { return this.attributes[key]; },

    option: function(key) {
      return this.attributes.options[key];
    },

    isPrivate: function() {
      return this.get('access') == 'private';
    },

    isDraft: function() {
      return this.get('access') == 'exclusive';
    },

    canonicalUrl: function() {
      return this.get('canonical_url');
    },

    contextualUrl: function() {
      var url   = this.get('canonical_url');
      var start = url.indexOf('/annotations/');
      return url.substring(0, start) + '.html' + this._documentPageAnchor();
    },

    publishedUrlWithAnchor: function() {
      return this.get('published_url') + this._documentPageAnchor();
    },

    // Alias for historical purposes
    viewerUrl: function() {
      return this.publishedUrlWithAnchor();
    },

    _documentPageAnchor: function() {
      var id    = this.get('id');
      var page  = this.get('page');
      return '#document/p' + page + '/a' + id;
    },

    imageUrl: function() {
      return (this._imageUrl = this._imageUrl ||
        this.get('image_url').replace('{size}', 'normal').replace('{page}', this.get('page')));
    },

    // Parses the coordinates in pixel value and calculates pixel width/height
    coordinates: function(force){
      if (!this._coordinates || force) {
        var css = _.map(this.get('location').image.split(','), function(num){ return parseInt(num, 10); });
        this._coordinates = {
          top:    css[0],
          left:   css[3],
          right:  css[1],
          height: css[2] - css[0],
          width:  css[1] - css[3],
        };
        this._transformCoordinatesToLegacy();
      }
      return this._coordinates;
    },

    // The existing note viewer transforms stored note dimensions before
    // rendering. Replicate those transformations here for compatibility.
    _transformCoordinatesToLegacy: function() {
      var adjustments = {
        top:    1,
        left:   -2,
        width:  -8,
      };
      this._coordinates = _.mapObject(this._coordinates, function(val, key) {
        return _.has(adjustments, key) ? val + adjustments[key] : val;
      });
    }

  };

  // Note View
  // ---------

  // Note View constructor
  dc.embed.noteView = function(options){
    // stolen out of Backbone.View.setElement
    this.model = options.model;
    var el = this.model.options.el || '#DC-note-' + this.model.id;
    this.setElement(el);
  };

  dc.embed.noteView.prototype = {
    IMAGE_WIDTH: 700,

    $: function(selector){ return this.$el.find(selector); },
    setElement: function(element) {
      this.$el = element instanceof dc.$ ? element : dc.$(element);
      this.el  = this.$el[0];
    },

    render: function() {
      this.$el.html(JST['note_embed']({
        note:          this.model,
        hasImage:      !_.isEmpty(this.model.coordinates()),
        extraClasses:  this._extraClasses().join(' '),
        imagePosition: this._inlineCSS()
      }));
      return this.$el;
    },

    _inlineCSS: function() {
      var coords = this.model.coordinates();
      return _.isEmpty(coords) ? {} : {
        aspectRatio: coords.height / coords.width * 100,
        heightPixel: coords.height,
        widthPixel: coords.width,
        widthPercent: this.IMAGE_WIDTH / coords.width * 100,
        offsetTopPercent: coords.top / coords.height * -100,
        offsetLeftPercent: coords.left / coords.width * -100
      };
    },

    _extraClasses: function() {
      var extraClasses = [];
      if (this.model.isPrivate()) { extraClasses.push('private'); }
      if (this.model.isDraft())   { extraClasses.push('draft'); }
      return _.map(extraClasses, function(cls){ return 'DC-note-' + cls; });
    },

    displayModes: {},
    displayNames: {},
    cacheDomReferences: _.noop,
    checkAndSetWidth: _.noop,
    resize: _.noop,
  };
})();
