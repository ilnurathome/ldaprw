var ldaprw = {
  initialized: false,
  strings: null,
  statusbar: null,
  onLoad: function() {
    // initialization code
    dump("ldaprw.onLoad\n");
    this.initialized = true;
    this.strings = document.getElementById("ldaprw-strings");
    this.statusbar = document.getElementById("ldaprwstatus");
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
  }
};

window.addEventListener("load", ldaprw.onLoad, false);

