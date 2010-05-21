var ldaprw = {
  initialized: false,
  strings: null,
  statusbar: null,
  abListener: null,
  addListener: function(){
    try{
        var abListener = new abL();
        var abManager = Components.classes["@mozilla.org/abmanager;1"].getService(Components.interfaces.nsIAbManager);
        this.abListener = abListener;
        abManager.addAddressBookListener( abListener, Components.interfaces.nsIAbListener.itemChanged | Components.interfaces.nsIAbListener.itemAdded );
        dump("Listener added\n");
    } catch(e) {
        dump("addListener error:"+e+"\n");
    }
  },
  rmListener: function(){
    removeAddressBookListener (this.abListener);
  },
  onLoad: function() {
    // initialization code
    dump("ldaprw.onLoad\n");
    try {
    ldaprw.initialized = true;
    ldaprw.strings = document.getElementById("ldaprw-strings");
    ldaprw.statusbar = document.getElementById("ldaprwstatus");
    ldaprw.addListener();
    } catch(e){
       dump("onLoad: " + e + "\n");
    }
  },

  onMenuExplorerCommand: function(e) {
    window.open("chrome://ldaprw/content/ldapexplorer.xul", "Explorer", "chrome");
  },

  onMenuPrefCommand: function(e) {
    window.open("chrome://ldaprw/content/prefs.xul", "Preferences", "chrome");
  },

  onMenuSyncCommand: function(e) {
    if ( !this.statusbar ) this.statusbar = document.getElementById("ldaprwstatus");
    try{
      this.statusbar.label = "Syncing..:";
      ldapsync(this.genonStatusUpdate());
    }catch(e){
      dump("ldaprw.onMenuSyncCommand error: " + e + "\n");
    }
  },

  genonStatusUpdate: function(){
      var count =0;
      var qsa = 0;
      var qsg = 0;
      var qua = 0;
      var qug = 0;
      var qaa = 0;
      var qag = 0;
      var eg  = 0;
      return function(type, msg) {
//        dump ("onStatusUpdate type=" + type + "\n");
        count++;
        switch(type) {
          case QUEUESEARCHADD: qsa++; break;
          case QUEUESEARCHGET: qsg++; break;
          case QUEUEUPDATEADD: qua++; break;                            
          case QUEUEUPDATEGET: qug++; break;
          case QUEUEADDADD:    qaa++; break;
          case QUEUEADDGET:    qag++; break;
          case ERRGET:         eg++;  break;
        }
        if ( ldaprw.statusbar ==null ) ldaprw.statusbar = document.getElementById("ldaprwstatus");
        ldaprw.statusbar.label = "ldaprw debug: QSA: " + qsa + " | "
          + "QSG: " + qsg + " | "
          + "QUA: " + qua + " | "
          + "QUG: " + qug + " | "
          + "QAA: " + qaa + " | "
          + "QAG: " + qag + " | "
          + "EG: " + eg;
        ldaprw.statusbar.tooltipText = "ldaprw debug: QUEUESEARCHADD: " + qsa + "\n"
          + "QUEUESEARCHGET: " + qsg + "\n"
          + "QUEUEUPDATEADD: " + qua + "\n"
          + "QUEUEUPDATEGET: " + qug + "\n"
          + "QUEUEADDADD: " + qaa + "\n"
          + "QUEUEADDGET: " + qag + "\n"
          + "ERRGET: " + eg;     
      }
  },
  onContextMenuSync: function(){
      function callbackDir(abDir, pref){
        dump("callbackDir\n");
        try {
          var cards = GetSelectedAbCards();
          var l = cards.length;
          for(var i=0; i<l; i++) {
            dump("cards["+i+".displayName=" + cards[i].displayName + "\n");
          }
          ldaprw_sync_abort = false;
          syncpolitic2(pref, ldaprw.genonStatusUpdate(), new dirWrapper(getSelectedDir(), cards ) );          
        }catch(e){
          dump(e);
        }
      }
      onSelectedDirDo( callbackDir );
  }
};

window.addEventListener("load", ldaprw.onLoad, false);

