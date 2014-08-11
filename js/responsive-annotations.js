$(function() {

  // Storage of note model/properties.
  var notes = {};

  var currentQuery;
  var lgQuery = window.matchMedia("(min-width:1200px)");
  var mdQuery = window.matchMedia("(min-width:980px) and (max-width:1199px)");
  var smQuery = window.matchMedia("(min-width:768px) and (max-width:979px)");
  var xsQuery = window.matchMedia("(max-width:767px)");

  var resizeTimer; //set resizeTimer to empty so it resets on page load

  //entry point
  //caches note & image width, sets up resize handler
  var init = function() {
    findNotes();
    //on resize, run the function and reset the timeout
    //250 is the delay in milliseconds. Can be adjust as you see fit. 
    $(window).resize(function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkSize, 250);
    });
  }

  var findNotes = function() {
    $(".DC-note-container").each(function() {
      getCoordinates(this); /*swapURL(this);*/
    });
  }

  //link notes to wapo embedder pages instead of document cloud
  //var swapURL = function(note) {
  //    var note = $(note); 
  //    if (note.data('wapo')) {
  //        var newLink = note.data('wapo'); 
  //        note.find('a').attr('href', newLink); 
  //        note.find('a').attr('target', '_blank');
  //    }
  //}  

  // gets default/canonical positioning data from the DOM for note & stores it.
  var getCoordinates = function(noteEl) {
    var noteID = $(noteEl).attr('id');

    var wrapWidth   = $("#" + noteID + " .DC-note-excerpt").width(),
      docWidth      = $("#" + noteID + " .DC-note-image").width(),
      docTop        = $("#" + noteID + " .DC-note-image").position().top,
      lCoverWidth   = $("#" + noteID + " .DC-left-cover").width(),
      rCoverWidth   = $("#" + noteID + " .DC-right-cover").width(),
      excerptHeight = $("#" + noteID + " .DC-note-excerpt").height(),
      excerptLeft   = $("#" + noteID + " .DC-note-excerpt").position().left,
      excerptWidth  = $("#" + noteID + " .DC-note-excerpt").width();

    if (docWidth != 0 && !(notes[noteID])) { //don't store notes that are set to display none
      var x1 = lCoverWidth,
          y1 = (docTop) * -1;

      var x2 = x1 + (750 - (lCoverWidth + rCoverWidth)),
          y2 = y1 + excerptHeight;

      var noteWidth = (x2 - x1);

      var note = {
        x1: x1,
        x2: x2,
        y1: y1,
        y2: y2,
        noteID: noteID,
        wrapWidth: wrapWidth,
        docWidth: docWidth,
        docTop: docTop,
        lCoverWidth: lCoverWidth,
        rCoverWidth: rCoverWidth,
        excerptHeight: excerptHeight,
        excerptLeft: excerptLeft,
        excerptWidth: excerptWidth,
        noteWidth: noteWidth
      }

      notes[noteID] = note;
    }
    setMatchMedia();
  }

  //set up media event listeners
  var setMatchMedia = function() {
    //initial call of handleMatchMedia for each breakpoint
    handleMatchMedia(lgQuery);
    handleMatchMedia(mdQuery);
    handleMatchMedia(smQuery);
    handleMatchMedia(xsQuery);

    //add listeners for when viewport size changes
    lgQuery.addListener(handleMatchMedia);
    mdQuery.addListener(handleMatchMedia);
    smQuery.addListener(handleMatchMedia);
    xsQuery.addListener(handleMatchMedia);

    //orientation change listener
    window.addEventListener("orientationchange", function() {
      console.debug("orientation change = " + window.orientation);
      checkSize();
    }, false);
  }

  var handleMatchMedia = function(mediaQuery) {
    if (mediaQuery.matches) {
      console.log("mediaQuery.media = " + mediaQuery.media);
      currentQuery = mediaQuery.media;
      checkSize();
    }
  }

  //diffs the note's natural width with its current width and decides what to do
  var checkSize = function() {
    $.each(notes, function() {
      var noteElem = $("#" + this.noteID); // the notes lookup should just cache the element.
      var newWrapWidth = noteElem.find('.DC-note-excerpt-wrap').width(); // Get viewable width
      var checkWidth = this.noteWidth / newWrapWidth; // calculate the ration of the note's width to the veiwable width

      // If we're at the smallest media width size just resize the doc/note
      // otherwise check whether the note is larger or smaller than the viewerable width
      if (currentQuery != xsQuery.media) {
        if (checkWidth > 1) { // note width is larger than viewable width
          resizeDoc(this.noteID);
        } else if (checkWidth < 1) { // note width is smaller than viewable width
          restoreDoc(this.noteID);
        }
      } else {
        resizeDoc(this.noteID);
      }
    });
  }

  //calculates scaling factor based on the new note width & updates the note element's attributes
  var resizeDoc = function(noteID) {
    //original values
    var natNoteWidth = notes[noteID].noteWidth;
    var natWrapWidth = notes[noteID].wrapWidth;
    var natDocWidth  = notes[noteID].docWidth;

    //new values after resize of browser 
    var newWrapWidth = $("#" + noteID + " .DC-note-excerpt-wrap").width();

    //calculate new width of document image
    var newDocWidth = natDocWidth - natNoteWidth + newWrapWidth - 70;

    var scaling_factor   = newDocWidth / natDocWidth;
    var newExcerptWidth  = (notes[noteID].excerptWidth)  * scaling_factor;
    var newExcerptHeight = (notes[noteID].excerptHeight) * scaling_factor;

    //new x1,x2,y1,y2
    var newX1 = (notes[noteID].x1) * scaling_factor;
    var newX2 = (notes[noteID].x2) * scaling_factor;

    //apply calculations to elements
    scaleNoteImage(noteID, {
      imageHeight:     newExcerptHeight,
      imageWidth:      newDocWidth,
      leftCoverWidth:  newX1,
      excerptWidth:    newExcerptWidth,
      rightCoverWidth: newExcerptWidth - newX2,
      imageTop:        (notes[noteID].docTop) * scaling_factor,
      excerptLeft:     -1 * newX1
    });
  }

  //sets note element's attributes back to default
  var restoreDoc = function(noteID) {
    scaleNoteImage(noteID, {
      imageHeight:     notes[noteID].excerptHeight,
      imageWidth:      notes[noteID].docWidth,
      leftCoverWidth:  notes[noteID].lCoverWidth,
      excerptWidth:    notes[noteID].excerptWidth,
      rightCoverWidth: notes[noteID].rCoverWidth,
      imageTop:        notes[noteID].docTop,
      excerptLeft:     notes[noteID].excerptLeft
    });
  }

  var scaleNoteImage = function(noteID,dimensions){
    // set heights for note images.
    $("#" + noteID + " .DC-note-excerpt").height(dimensions.imageHeight);
    $("#" + noteID + " .DC-left-cover"  ).height(dimensions.imageHeight);
    $("#" + noteID + " .DC-right-cover" ).height(dimensions.imageHeight); 

    // Set widths of viewable area, left cover, note excerpt, and right cover.
    $("#" + noteID + " .DC-note-image"  ).width(dimensions.imageWidth);
    $("#" + noteID + " .DC-left-cover"  ).width(dimensions.leftCoverWidth);
    $("#" + noteID + " .DC-note-excerpt").width(dimensions.excerptWidth);
    $("#" + noteID + " .DC-right-cover" ).width(dimensions.rightCoverWidth);

    // position left cover & note excerpt
    $("#" + noteID + " .DC-note-image"  ).css('top', dimensions.imageTop);
    $("#" + noteID + " .DC-note-excerpt").css('left', dimensions.excerptLeft);
  }

  //footnote click
  $(document).on('click', '.link-fn', function() {
    var fnLink = $(this);
    var fnLinkIcon = $(this).find('.fa');
    var fnID = $(this).data('fn');
    var footnote = $('#footnote' + fnID);
    if (footnote.hasClass('show')) {
      footnote.removeClass('show');
      footnote.slideUp({
        duration: 800,
        easing: 'swing'
      });
      fnLink.removeClass('reverse');
    } else {
      footnote.addClass('show');
      footnote.slideDown({
        duration: 800,
        easing: 'swing'
      });
      fnLink.addClass('reverse');
      //add note to notes and run subsequent functions
      var note = $(footnote).find('.DC-note-container');
      getCoords(note);
    }
    if (fnLinkIcon.hasClass('fa-caret-down')) {
      fnLinkIcon.removeClass('fa-caret-down').addClass('fa-caret-up');
    } else {
      fnLinkIcon.removeClass('fa-caret-up').addClass('fa-caret-down');
    }
  });

  $(window).load(function() {
    init();
  });

});
