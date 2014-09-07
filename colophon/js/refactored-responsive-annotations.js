$(function() {

  // Storage of note model/properties.
  var notes = {};
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
    $(".DC-note-container").each(function() { getCoordinates($(this)); /*swapURL(this);*/ });
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

    var wrapWidth     = noteEl.find(".DC-note-excerpt").width();
    var docWidth      = noteEl.find(".DC-note-image").width();
    var docTop        = noteEl.find(".DC-note-image").position().top;
    var lCoverWidth   = noteEl.find(".DC-left-cover").width();
    var rCoverWidth   = noteEl.find(".DC-right-cover").width();
    var excerptHeight = noteEl.find(".DC-note-excerpt").height();
    var excerptLeft   = noteEl.find(".DC-note-excerpt").position().left;
    var excerptWidth  = noteEl.find(".DC-note-excerpt").width();

    if (docWidth != 0 && !(notes[noteID])) { //don't store notes that are set to display none
      var note = {
        x1: lCoverWidth,
        x2: 750 - rCoverWidth,
        y1: -1* docTop,
        y2: -1* docTop + excerptHeight,
        
        noteID: noteID,
        wrapWidth: wrapWidth,
        docWidth: docWidth,
        docTop: docTop,
        lCoverWidth: lCoverWidth,
        rCoverWidth: rCoverWidth,
        excerptHeight: excerptHeight,
        excerptLeft: excerptLeft,
        excerptWidth: excerptWidth,
        
        noteWidth: 750 - (lCoverWidth + rCoverWidth)
      }

      notes[noteID] = note;
    }
    checkSize();
  }

  //diffs the note's natural width with its current width and decides what to do
  var checkSize = function() {
    $.each(notes, function() {
      var noteElem = $("#" + this.noteID); // the notes lookup should just cache the element.
      var newWrapWidth = noteElem.find('.DC-note-excerpt-wrap').width(); // Get viewable width

      //if viewable width < left cover width + note width, kill left cover
      //if viewable width <                    note width, scale!
      //else, restoreDoc
      ( newWrapWidth < this.lCoverWidth+this.noteWidth ) ? resizeDoc(this.noteID) : restoreDoc(this.noteID);
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
    var newDocWidth = natDocWidth - natNoteWidth + newWrapWidth;

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
    var noteEl = $("#"+noteID);
    noteEl.find(".DC-note-excerpt").height(dimensions.imageHeight);
    noteEl.find(".DC-left-cover"  ).height(dimensions.imageHeight);
    noteEl.find(".DC-right-cover" ).height(dimensions.imageHeight); 

    // Set widths of viewable area, left cover, note excerpt, and right cover.
    noteEl.find(".DC-note-image"  ).width(dimensions.imageWidth);
    noteEl.find(".DC-left-cover"  ).width(dimensions.leftCoverWidth);
    noteEl.find(".DC-note-excerpt").width(dimensions.excerptWidth);
    noteEl.find(".DC-right-cover" ).width(dimensions.rightCoverWidth);

    // position left cover & note excerpt
    noteEl.find(".DC-note-image"  ).css('top', dimensions.imageTop);
    noteEl.find(".DC-note-excerpt").css('left', dimensions.excerptLeft);
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
      getCoordinates(note);
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
