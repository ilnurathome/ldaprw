var ldaprw = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
    this.strings = document.getElementById("ldaprw-strings");
  },

  onMenuExplorerCommand: function(e) {
    window.open("chrome://ldaprw/content/ldapexplorer.xul", "Explorer", "chrome");
    //var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
//                                  .getService(Components.interfaces.nsIPromptService);
//    promptService.alert(window, this.strings.getString("helloMessageTitle"),
  //                              this.strings.getString("helloMessage"));
  },

  onMenuPrefCommand: function(e) {
    window.open("chrome://ldaprw/content/prefs.xul", "Preferences", "chrome");
  },

};

window.addEventListener("load", ldaprw.onLoad, false);
