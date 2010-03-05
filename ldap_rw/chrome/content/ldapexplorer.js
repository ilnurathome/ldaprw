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
function debugexplorer(str){
//  dump("explorer.js: " + str);
}

function dumperrors(str){
       dump(str+ "\n");
       alert(str);
}


var prefs=null;
var curpref=null;
var ldap=null;
//var getpassword=null;
var mapper=null;
var gQueryURIFormat = null;    
var attrs=null;               
var queryURL=null;

const numbermsg=10;

debugexplorer("loading\n");

window.addEventListener("load", function(e) { onLoad(e); }, false); 

var searchformat=""; 

function onLoad() {
     debugexplorer("loading onload\n");
    var menu = document.getElementById("ldapexplorer-servers");
    if (menu == null){
        dumperrors("onLoad: no menu\n");
        return;
    }
    debugexplorer("onLoad: menu\n");

    prefs = getprefs();   

    debugexplorer("onLoad: pref\n");    

    for (var i in prefs) menu.appendItem(i);    
                
    mapper = new LdaptoAB();

  // need to refactor to use generator iterator from mapper or move to use
  // callback function
    searchformat = "(|";
    attrs = new Array(); 
    for (var i in mapper.__proto__) { 
      if ( i == "dn" ) continue;
      attrs[attrs.length] = i; 
      searchformat += "(" + i + "=*@V*" + ")";
    };
    searchformat += ")";    

   //debugexplorer("searchformat=" + searchformat + "\n");

    document.getElementById('ldapexplorer-add').disabled=true;
    document.getElementById('ldapexplorer-del').disabled=true;
    document.getElementById('ldapexplorer-morelabel').disabled=true;                     
    var tree = document.getElementById('ldapexplorer-cardlist');
    tree.view = cardtreeView;   
}

function selectServer(label) {
    curpref=prefs[label];
    Init();
}

function Init(){
    queryURL = curpref.queryURL;

    ldap = new LdapDataSource();

    ldap.init(attrs, curpref.maxHits);
    document.getElementById('ldapexplorer-morelabel').disabled=true;                        

//    var searchformattmp = "" ;
//    var classes = curpref.objClassesAR;
//    for (var i in classes) { 
//      searchformattmp += "(objectClass=" + classes[i] + ")";
//    };
//    searchformat = "(&" + searchformattmp + searchformat + ")";
//     debugexplorer(searchformat);
}

function gensearchquery(query, filter) {
  var querycount = 0;
  return function (aMsg) {
       debugexplorer("searchquery:" + query + "\t" + querycount + "\n")
       if (aMsg != undefined ){
              debugexplorer("aMsg.errorCode:"+aMsg.errorCode + "\n");
              if (aMsg.errorCode == 4){
                    document.getElementById('ldapexplorer-morelabel').disabled=false;
              }else {
                    document.getElementById('ldapexplorer-morelabel').disabled=true;
              }
       }
       
       if ( querycount < 1 ) {        
         querycount++;
        return {dn: query, filter: filter } ;
       }
      return null;
  }
}

function gencallbacksearchresult(tree, attrs){
      return function(aMsg){           
           debugexplorer("callbacksearchresult:" + aMsg.dn + attrs + "\n");
           var cell = new Array();
           cell["aMsg"] = aMsg;
           cell["dn"] = aMsg.dn;
           debugexplorer("attrs:" + aMsg.getAttributes({}) + "\n" );
           var cardattrs = aMsg.getAttributes({});
           for (var i in cardattrs) {
              try{
                debugexplorer("callbacksearchresult: attr=" + i + "\t"+ attrs[i]);
                var val=aMsg.getValues ( cardattrs[i], {});
                if ( val != null) {
                       cell[ cardattrs[i] ] = val.toString();
                }
              }catch(e){
                    //debugexplorer(e+"\n");
                    dumperrors("Error not exist "+ e);
              }finally{ 
                    debugexplorer("\n");
              }
           } 
           if ( tree == undefined) debugexplorer("Error\n");
           debugexplorer("callbacksearchresult: tree.treeData.length= " + tree.treeData.length+  "\n");
           tree.treeData[tree.treeData.length] = cell;
           tree.treebox.rowCountChanged(0, 1);
     }
}


function ldapexploreronEnterInSearchBar(value){
  document.getElementById('ldapexplorer-add').disabled=true;
  document.getElementById('ldapexplorer-morelabel').disabled=true;                     

  if ( ldap == null ){
    debugexplorer("Choose Ldap server before\n");
    return;
  }
  
  cardtreeView.treebox.rowCountChanged(0, -cardtreeView.treeData.length);
  cardtreeView.treeData = new Array();
  
  if (value == "") return;
  
  var filter = searchformat.replace(/@V/g, value);
  try {
    ldap.query(queryURL, curpref.binddn, gengetpassword(), 
                         gensearchquery(queryURL.dn, filter),  
                         gencallbacksearchresult(cardtreeView, 
                                      ["cn","mail", "sn", "givenName"] ));
  } catch (e) {
    dumperrors ("Error: " + e + "\n" );
  } 
}

var cardtreeView = {
       treeData: [],
       get rowCount() { return this.treeData.length;},

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
    document.getElementById('ldapexplorer-del').disabled=false;
    var tree = document.getElementById('ldapexplorer-cardlist');
    if (tree.currentIndex < 0){
       debugexplorer("do select nothing selected\n");
       return null;
    }

  try{
    var card = Components.classes["@mozilla.org/addressbook/cardproperty;1"].createInstance(Components.interfaces.nsIAbCard);     
    var mapper = new LdaptoAB();        
    mapper.map(cardtreeView.treeData[tree.currentIndex].aMsg, card);       
    if (DisplayCardViewPane != undefined) DisplayCardViewPane(card);
  }catch(e){
    dumperrors("Error: " + e + "\n");
  }
}

function doOnselectedInTree(metod){
    var tree = document.getElementById('ldapexplorer-cardlist');
    debugexplorer("doOnselected:" + tree.tagName + "\n");
    var start = new Object();
    var end = new Object();
    var numRanges = tree.view.selection.getRangeCount();
    var mybook = null;

    var dirTree = document.getElementById("dirTree");
    if (dirTree == null){
       debugexplorer("add to default\n");
       mybook = curpref.book; //abManager.getDirectory( "moz-abmdbdirectory://" + curpref.filename ); 
       debugexplorer("add to default\n");
    }else{
        debugexplorer("add to selected\n");
       if (dirTree.currentIndex < 0){
          debugexplorer("nothing selected\n");
          return null;
       }
        var selected = dirTree.builderView.getResourceAtIndex(dirTree.currentIndex);
        var abManager = Components.classes["@mozilla.org/abmanager;1"].getService(Components.interfaces.nsIAbManager);
        mybook = abManager.getDirectory( selected.Value ); 
        debugexplorer("add to selected "+ selected.Value + "\t" + mybook + "\n");
    }

    debugexplorer("add to " + mybook + "\n");

  for (var t = 0; t < numRanges; t++){
    tree.view.selection.getRangeAt(t,start,end);
    for (var v = start.value; v <= end.value; v++){
      debugexplorer("Item " + v + " is selected.\t" + cardtreeView.treeData[v].dn+"\n");
      metod(v);
  }
 }
}

function doAdd() {
  doOnselectedInTree( function(v) {
      try{
        if ( addcardfromldap(mybook, cardtreeView.treeData[v].aMsg, true) ) {
        debugexplorer("card allready exists, sync it.");
        }
       }catch(e){
            dumperrors("Error:"+e+"\n");
     }

      } );
}

function gendelquery(queries) {
  var querycount = 0;
  return function (aMsg) {
       debugexplorer("delquery:" + queries + "\t" + querycount + "\n")
       if (aMsg != undefined ){
              debugexplorer("aMsg.errorCode:"+aMsg.errorCode + "\n");
              if (aMsg.errorCode != Components.interfaces.nsILDAPErrors.SUCCESS){
                dumperrors("Errors: delquery " + aMsg.errorCode + "\n"
                    + LdapErrorsToStr(aMsg.errorCode) + "\n"
                    + aMsg.errorMessage );
              }
       }
       
       if ( querycount < queries.length ) {        
        return queries[querycount++];
       }
      return null;
  }
}

function deleteonldap(v) {
  if ( ldap == null ){
    debugexplorer("Choose Ldap server before\n");
    return;
  }

  try {
    ldap.deleteext(queryURL, curpref.binddn, gengetpassword(), 
        gendelquery(v) );
  } catch (e) {
    dumperrors ("Error: " + e + "\n" );
  } 
}

function doDel() {

  var queries = [];

  function collect(v) {
    dump("doDel: " + v + "\n");
    queries[queries.length] = {dn: cardtreeView.treeData[v].aMsg.dn};
  }

  doOnselectedInTree( collect );
  for( var i in queries ) {
    dump("collected:" + i + "\t" + queries[i].dn + "\n");
  }
  
  var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                        .getService(Components.interfaces.nsIPromptService);

  var result = prompts.confirm(null, "Delete from LDAP Server", "Are you sure?");

  if (result) {
    debugexplorer("call to del");
    deleteonldap(v);
  }
}

