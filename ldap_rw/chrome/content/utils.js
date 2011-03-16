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

function onnsIAbCardPropsDo(card, func) {
//  dump("onnsIAbCardPropsDo\n");
  var props = card.properties;
  while ( props.hasMoreElements() ){
     var attr = props.getNext();
     if (attr instanceof Components.interfaces.nsIProperty) {
       func(attr, card);
     }
  }
}

// need more aduequate naming
function onSelectedDirDo(func) {
  dump("onSelectedDirDo\n");
    var abDir = getSelectedDir();
    var prefs = getprefs();
    for (var key in prefs) {
      var pref = prefs[key];
      if (pref.book.URI == abDir.URI) {
        dump("onSelectedDirDo book founded\n");
        func(abDir, pref);
      }
    }
}

function CreateNSMutArray() {
  return Components.classes["@mozilla.org/array;1"].createInstance(Components.interfaces.nsIMutableArray);
 ;
}

function convertArraytonsIArray(arr){
  var nsar = CreateNSMutArray();
  if( nsar instanceof Components.interfaces.nsIMutableArray ){
    var l = arr.length;
    for (var i=0; i<l; i++){
      nsar.appendElement(arr[i], false);
    }
  }
  return nsar;
}

// ugly code (hack)
function dirWrapper(dir, cards) {
  this.dir = dir;
  for( var k in dir ){
    this[k] = dir[k];
  }
  if (cards != undefined)
    this.childCards = convertArraytonsIArray(cards).enumerate();

  this.addCard = function(card) {
    this.dir.addCard(card);
  };

  this.modifyCard = function(card) {
    var LastModifiedDate = card.getProperty ("LastModifiedDate", 0);
    card.setProperty("cusLastModifiedDate", LastModifiedDate);
    this.dir.modifyCard(card);
  };
}

function childCardsIterate(dir, func) {
  var cards = dir.childCards;
  while (cards.hasMoreElements()){
    var card = cards.getNext();
    if (card instanceof Components.interfaces.nsIAbCard) {
      func(card);
    }
  }
}

function getSelectedDir() {
  var mybook = null;
  var dirTree = document.getElementById("dirTree");
  if (dirTree == null){
    throw "getSelectedDir: Can't find dirTree";
  }else{
    if (dirTree.currentIndex < 0){
      return null;
    }
    var selected = dirTree.builderView.getResourceAtIndex(dirTree.currentIndex);
    var abManager = Components.classes["@mozilla.org/abmanager;1"].getService(Components.interfaces.nsIAbManager);
    return abManager.getDirectory( selected.Value ); 
  }
}

//function getSelectedCards() {}

