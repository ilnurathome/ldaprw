function debuglistener(str){
  dump("listener.js: " + str);
}

function dumperrors(str){
       dump(str+ "\n");
       alert(str);
}

function abL() {
  this.accepted =0;
  this.duration =0;
}
abL.prototype = {
  mReceived:0,
  duringadd: false,
  accepted: 0,
  duration: 0,
  updatecard: function(item) {
          var caller = this;

          function update(abDir, pref){
            function livesync() {
               ldaprw_sync_abort = false;
               syncpolitic2(pref, ldaprw.genonStatusUpdate(), new dirWrapper(abDir, [item]) );
            }
            if (caller.duration > 0 && caller.accepted == 0) return;
            if (pref.liveduration > 0 && pref.liveaccepted == 0) return;
            if ( (caller.duration > 0 && caller.accepted == 1) || 
                 (pref.liveduration > 0 && pref.liveaccepted == 1) ) {
              livesync();
              return;
            }
            window.openDialog("chrome://ldaprw/content/liveupdatepromt.xul","prompt", "chrome", function(d) {
                 caller.accepted=1;
                 caller.duration=d;
                 if (d == 2) {
                    pref.liveaccepted = 1;
                    pref.liveduration = 2;
                    setpref(pref);
                 }
                 livesync();
              }, function(d) {
                 caller.accepted=0;
                 caller.duration=d;
                 if (d == 2) {
                    pref.liveaccepted = 1;
                    pref.liveduration = 2;
                    setpref(pref);
                 }

                 // ugly
                 caller.duringadd = false;
                 if (d == 2) dumperrors("not implemented yet");
              } );
          }

          onSelectedDirDo(update);
  },
  onItemAdded: function(parentItem, item) {
      debuglistener("onItemAdded\n");
      try {
        if (item instanceof Components.interfaces.nsIAbCard){
          this.duringadd = true;
          this.updatecard(item);
        }
      } catch(e) {
        debuglistener("onItemAdded:" + e+ "\n");
      }
  },
  onItemRemoved: function(parentItem, item) {
    alert( "Item Removed" );
  },
  onItemPropertyChanged: function(item, property, oldValue, newValue) {
      debuglistener("onItemPropertyChanged\n");
      try {
        if (item instanceof Components.interfaces.nsIAbCard){
          if (this.duringadd == false ){
            this.updatecard(item);
          } else {
            /// ugly!!!
            this.duringadd = false;
          }
        }
      } catch(e) {
        debuglistener("onItemPropertyChanged:" + e+ "\n");
      }
  }
}

