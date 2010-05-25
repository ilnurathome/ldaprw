
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

