var ldaprw = {
  initialized: false,
  strings: null,
  statusbar: null,
  abListener: null,
  onLoad: function() {
    // initialization code
    dump("ldaprw.onLoad\n");
    this.initialized = true;
    this.strings = document.getElementById("ldaprw-strings");
    this.statusbar = document.getElementById("ldaprwstatus");

    var abManager = Components.classes["@mozilla.org/abmanager;1"].getService(Components.interfaces.nsIAbManager);

    var abListener = new abL();
    this.abListener = abListener;
    abManager.addAddressBookListener( abListener, Components.interfaces.nsIAbListener.itemChanged);
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
      return function(type, msg) {
        dump ("onStatusUpdate type=" + type + "\n");
        count++;
        switch(type) {
          case QUEUESEARCHADD: qsa++; break;
          case QUEUESEARCHGET: qsg++; break;
          case QUEUEUPDATEADD: qua++; break;                            
          case QUEUEUPDATEGET: qug++; break;
          case QUEUEADDADD:    qaa++; break;
          case QUEUEADDGET:    qag++; break;
        }
        if ( ldaprw.statusbar ==null ) ldaprw.statusbar = document.getElementById("ldaprwstatus");
        ldaprw.statusbar.label = "ldaprw debug: QSA: " + qsa + " | "
          + "QSG: " + qsg + " | "
          + "QUA: " + qua + " | "
          + "QUG: " + qug + " | "
          + "QAA: " + qaa + " | "
          + "QAG: " + qag;
        ldaprw.statusbar.tooltipText = "ldaprw debug: QUEUESEARCHADD: " + qsa + "\n"
          + "QUEUESEARCHGET: " + qsg + "\n"
          + "QUEUEUPDATEADD: " + qua + "\n"
          + "QUEUEUPDATEGET: " + qug + "\n"
          + "QUEUEADDADD: " + qaa + "\n"
          + "QUEUEADDGET: " + qag;     
      }
  },
  onContextMenuSync: function(){
      function callbackDir(abDir, pref){
        dump("callbackDir\n");
        alert("not implemented yet abDir.URI=" + abDir.URI + ", abDir.dirName=" + abDir.dirName + "\n");
        try {
          var cards = GetSelectedAbCards();
          var l = cards.length;
          for(var i=0; i<l; i++) {
            dump("cards["+i+".displayName=" + cards[i].displayName + "\n");
          }
          syncpolitic2(pref, ldaprw.genonStatusUpdate(), new dirWrapper(getSelectedDir(), cards ) );          
        }catch(e){
          dump(e);
        }
      }
      onSelectedDirDo( callbackDir );
  }
};

window.addEventListener("load", ldaprw.onLoad, false);

