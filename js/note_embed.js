(function() {
  
  // Setup namespaces
  window.dc = window.dc || {};
  dc.embed  = dc.embed || {};
  var notes = dc.embed.notes = dc.embed.notes || {};
  
  // Setup dependencies
  var _ = dc._             = window._.noConflict();
  var $ = dc.$ = dc.jQuery = window.jQuery.noConflict(true);
  
  // Setup global resize function
  var resizeNotes = _.debounce(function(){
    // Determine whether each note needs to be resized and resize it if needed.
    _.each(notes, function(note, id){ note.checkAndSetWidth(); });
  }, 250);
  $(window).resize(resizeNotes);
  
  // Public API entry point for loading notes.
  dc.embed.loadNote = function(embedUrl, opts) {
    var options = opts || {};
    var id = parseInt(embedUrl.match(/(\d+).js$/)[1], 10);
    var el = options.container || '#DC-note-' + id;
    var noteModel = new dc.embed.noteModel(options);

    // Store the note view for later access
    notes[id] = notes[id] || new dc.embed.noteView({model: noteModel, el: el});
    
    // This API assumes that the response will be a JSONP response
    // which will invoke `dc.embed.noteCallback`
    //
    // Get the party started by requesting note data.
    $.getScript(embedUrl);
    
    if (dc.recordHit) dc.embed.pingRemoteUrl('note', id);
  };
  
  // Complete the loading process & render the note.
  dc.embed.noteCallback = function(response) {
    var id                = response.id;
    var note              = dc.embed.notes[id];
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
    $(document).ready( function(){ $(document.body).append('<img alt="" width="1" height="1" src="' + hitUrl + '?key=' + key + '" />'); });
  };
  
  // Note Model constructor
  dc.embed.noteModel = function(opts) {
    this.options = opts || {};
  };
  
  // Note Model functions
  dc.embed.noteModel.prototype = {
    get : function(key) { return this.attributes[key]; },
    
    option : function(key) {
      return this.attributes.options[key];
    },
    
    imageUrl : function() {
      return (this._imageUrl = this._imageUrl ||
        this.get('image_url').replace('{size}', 'normal').replace('{page}', this.get('page')));
    },

    coordinates : function() {
      if (this._coordinates) return this._coordinates;
      var loc = this.get('location');
      if (!loc) return null;
      var css = _.map(loc.image.split(','), function(num){ return parseInt(num, 10); });
      return (this._coordinates = {
        top:    css[0],
        left:   css[3],
        right:  css[1],
        height: css[2] - css[0],
        width:  css[1] - css[3]
      });
    },
    
    viewerUrl : function() {
      var suffix = '#document/p' + this.get('page') + '/a' + this.get('id');
      return this.get('published_url') + suffix;
    }
    
  };
  
  // Note View constructor
  dc.embed.noteView = function(options){
    // stolen out of Backbone.View.setElement
    var element = options.el;
    this.$el = element instanceof dc.$ ? element : dc.$(element);
    this.el = this.$el[0];

    this.model = options.model;
  };
  
  dc.embed.noteView.prototype = {
    displayModes: { "scale": 1, "narrow": 2, "full": 3 },
    
    $: function(selector){ return this.$el.find(selector); },

    render : function() {
      this.$el.html(JST['note_embed']({note : this.model}));
      this.cacheDomReferences();
      this.viewablePageWidth = this.$(".DC-note-excerpt-wrap").width();
      if (this.$el.width() < 700) this.center();
      return this.$el;
    },
    
    center : function() {
      var $excerpt       = this.$('.DC-note-excerpt');
      var coords         = this.model.coordinates();
      if (!coords) return;
      var annoCenter     = coords.left + (coords.width / 2);
      var viewportWidth  = $excerpt.closest('.DC-note-excerpt-wrap').width();
      var viewportCenter = viewportWidth / 2;

      if (coords.left + coords.width > viewportWidth) {
        if (coords.width > viewportWidth) {
          $excerpt.css('left', -1 * coords.left);
        } else {
          $excerpt.css('left', viewportCenter - annoCenter);
        }
      }
    },
    
    // Provide description
    cacheDomReferences: function() {
      this.$viewableArea = this.$(".DC-note-excerpt-wrap");
      this.$noteExcerpt  = this.$(".DC-note-excerpt");
      this.$leftCover    = this.$(".DC-left-cover"  );
      this.$rightCover   = this.$(".DC-right-cover" );
      this.$noteImage    = this.$(".DC-note-image"  );
    },
    
    checkAndSetWidth: function() {
      if (!this.model.coordinates()) return false;
      var viewableWidth = this.$viewableArea.width();
      var targetMode;
      
      if (viewableWidth < this.model.coordinates().width) { // Smallest width, time to scale the image
        targetMode = this.displayModes["scale"];
      } else if (viewableWidth < this.model.coordinates().right) { // Medium width, hide left cover or recenter, or whatever.
        targetMode = this.displayModes["narrow"];
      } else { // largest width, expand!
        targetMode = this.displayModes["full"];
      }
      this.resize(targetMode);
    },

    resize: function(targetMode) {
      console.log("Resizing "+this.model.get('id')+" from "+this.mode+" to "+targetMode+"!");
      if (this.mode == targetMode) return;
      if (targetMode === 1) {
        // hide covers, shift left & begin scaling
        
      } else if (targetMode === 2) {
        // recenter
        
      } else if (targetMode === 3) {
        // fully expand
        
      }
      this.mode = targetMode;
    }
  };
})();
