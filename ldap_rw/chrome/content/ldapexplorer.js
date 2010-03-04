var prefs=null;
var curpref=null;
var ldap=null;
var getpassword=null;
var mapper=null;
var gQueryURIFormat = null;    
var attrs=null;               
var queryURL=null;

const numbermsg=10;

dump("loading\n");

window.addEventListener("load", function(e) { onLoad(e); }, false); 

var searchformat=""; 

function onLoad() {
     dump("loading onload\n");
    var menu = document.getElementById("ldapexplorer-servers");
    if (menu == null){
        alert("onLoad: no menu\n");
        return;
    }
    dump("onLoad: menu\n");

    prefs = getprefs();   

    dump("onLoad: pref\n");    

    for (var i in prefs) menu.appendItem(i);    
                
    mapper = new LdaptoAB();

    searchformat = "(|";
    attrs = new Array(); 
    for (var i in mapper.__proto__) { 
      if ( i == "dn" ) continue;
      attrs[attrs.length] = i; 
      searchformat += "(" + i + "=*@V*" + ")";
    };
    searchformat += ")";    

   //dump("searchformat=" + searchformat + "\n");

    document.getElementById('ldapexplorer-add').disabled=true;                     document.getElementById('ldapexplorer-morelabel').disabled=true;                     
    var tree = document.getElementById('ldapexplorer-cardlist');
    tree.view = cardtreeView;   
}

function selectServer(label) {
    curpref=prefs[label];
    Init();
}

function Init(){
    queryURL = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(curpref.uri, null, null).QueryInterface(Components.interfaces.nsILDAPURL);

    getpassword = gengetpassword(curpref.uri);

    ldap = new LdapDataSource();

    ldap.init(attrs, curpref.maxHits);
//    alert (searchformat);
//    alert (searchformat.replace(/@V/g, "string") );

   document.getElementById('ldapexplorer-morelabel').disabled=true;                        

    var searchformattmp = "" ;
    var classes = curpref.objClasses.replace(/\s*/g, '').split(',');
    for (var i in classes) { 
      searchformattmp += "(objectClass=" + classes[i] + ")";
    };
//    searchformat = "(&" + searchformattmp + searchformat + ")";
//     dump(searchformat);
}

function gensearchquery(queries) {
  var querycount = 0;
  return function (aMsg) {
       dump("searchquery:" + queries + "\t" + querycount + "\t" + queries.length  + "\n")
       if (aMsg != undefined ){
              dump("aMsg.errorCode:"+aMsg.errorCode + "\n");
              if (aMsg.errorCode == 4){
                    document.getElementById('ldapexplorer-morelabel').disabled=false;
              }else {
                    document.getElementById('ldapexplorer-morelabel').disabled=true;
              }
       }
       if ( querycount < queries.length ) {        
        return queries[querycount++];
      }
      return null;
  }
}

function gencallbacksearchresult(tree, attrs){
      return function(aMsg){           
           dump("callbacksearchresult:" + aMsg.dn + attrs + "\n");
           var cell = new Array();
           cell["aMsg"] = aMsg;
           cell["dn"] = aMsg.dn;
           dump("attrs:" + aMsg.getAttributes({}) + "\n" );
           for (var i in attrs) {
              try{
                dump("callbacksearchresult: attr=" + i + "\t"+ attrs[i]);
                var val=aMsg.getValues ( attrs[i], {});
                if ( val != null) {
                       cell[ attrs[i] ] = val.toString();
                }
              }catch(e){
                    //dump(e+"\n");
                    dump(" not exist");
              }finally{ 
                    dump("\n");
              }
           } 
           if ( tree == undefined) dump("Error\n");
           dump("callbacksearchresult: tree.treeData.length= " + tree.treeData.length+  "\n");
           tree.treeData[tree.treeData.length] = cell;
           tree.treebox.rowCountChanged(0, 1);
     }
}

   function ldapexploreronEnterInSearchBar(value){
       document.getElementById('ldapexplorer-add').disabled=true;                     document.getElementById('ldapexplorer-morelabel').disabled=true;                     

        if ( ldap == null ){
             dump("Choose Ldap server before\n");
             return;
       }

        cardtreeView.treebox.rowCountChanged(0, -cardtreeView.treeData.length);
        cardtreeView.treeData = new Array();

         if (value == "") return;

           var filter = searchformat.replace(/@V/g, value);
        try {
            queryURL.filter = filter;
            ldap.query(queryURL, curpref.binddn, getpassword, 
                                gensearchquery([queryURL.dn]),  
                                 gencallbacksearchresult(cardtreeView, 
                                                            ["cn","mail", "sn", "givenName"] ));
        } catch (e) {
    dump ("Error: " + e + "\n" );
        } 
   }

var cardtreeView = {
       treeData: [],
       get rowCount() { return this.treeData.length;},
      //rowCount: 1,

      treeBox: null,  

    getCellText : function(row,column){
           return this.treeData[row][column.id];
    },

    setTree: function(treebox){ this.treebox = treebox; },
    isContainer: function(row){ return false; },
    isSeparator: function(row){ return false; },
    isSorted: function(){ return false; },
    getLevel: function(row){ return 0; },
    getImageSrc: function(row,col){ return null; },
    getRowProperties: function(row,props){},
    getCellProperties: function(row,col,props){},
    getColumnProperties: function(colid,col,props){}
}


function doselect(){
    document.getElementById('ldapexplorer-add').disabled=false;
    var tree = document.getElementById('ldapexplorer-cardlist');
    if (tree.currentIndex < 0){
       dump("do select nothing selected\n");
       return null;
    }

  try{
    var card = Components.classes["@mozilla.org/addressbook/cardproperty;1"].createInstance(Components.interfaces.nsIAbCard);     
    var mapper = new LdaptoAB();                                                   mapper.map(cardtreeView.treeData[tree.currentIndex].aMsg, card);               DisplayCardViewPane(card);
  }catch(e){
    dump("Error: " + e + "\n");
  }
}

function doAdd() {
    var abManager = Components.classes["@mozilla.org/abmanager;1"].getService(Components.interfaces.nsIAbManager);
    var tree = document.getElementById('ldapexplorer-cardlist');
    dump("doAdd:" + tree.tagName + "\n");
    var start = new Object();
    var end = new Object();
    var numRanges = tree.view.selection.getRangeCount();
    var mybook = null;

    var dirTree = document.getElementById("dirTree");
    if (dirTree == null){
       dump("add to default\n");
       mybook = abManager.getDirectory( "moz-abmdbdirectory://" + curpref.filename ); 
       dump("add to default\n");
    }else{
        dump("add to selected\n");
       if (dirTree.currentIndex < 0){
          dump("nothing selected\n");
          return null;
       }
       var selected = dirTree.builderView.getResourceAtIndex(dirTree.currentIndex);
        mybook = abManager.getDirectory( selected.Value ); 
        dump("add to selected "+ selected.Value + "\t" + mybook + "\n");
    }

    dump("add to " + mybook + "\n");

  for (var t = 0; t < numRanges; t++){
    tree.view.selection.getRangeAt(t,start,end);
    for (var v = start.value; v <= end.value; v++){
      dump("Item " + v + " is selected.\t" + cardtreeView.treeData[v].dn+"\n");
      try{
           if ( addcardfromldap(mybook, cardtreeView.treeData[v].aMsg, true) ) {
            dump("card allready exists, sync it.");
            }
       }catch(e){
            dump("Error:"+e+"\n");
     }
  }
 }
}

function doAddAll() {
    
}

