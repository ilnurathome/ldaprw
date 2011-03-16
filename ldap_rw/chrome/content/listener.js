/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is LdapRW.
 *
 * The Initial Developer of the Original Code is
 * Ilnur Kiyamov <ilnurathome@gmail.com>.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *  
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

function debuglistener(str){
  dump("listener.js: " + str);
}

function dumperrors(str){
       dump(str+ "\n");
       alert(str);
}

/*
 * constructor
 */
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

