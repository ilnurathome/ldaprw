var ldaprw = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
    this.strings = document.getElementById("ldaprw-strings");
  },

  onMenuItemCommand: function(e) {
    var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                  .getService(Components.interfaces.nsIPromptService);
    promptService.alert(window, this.strings.getString("helloMessageTitle"),
                                this.strings.getString("helloMessage"));
  },

  onToolbarButtonCommand: function(e) {
    // just reuse the function above.  you can change this, obviously!
    ldaprw.onMenuItemCommand(e);
  }
};

window.addEventListener("load", ldaprw.onLoad, false);
