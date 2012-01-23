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
// dump("explorer.js: " + str);
}

function dumperrors(str){
       dump(str+ "\n");
       alert(str);
}

/*
 * @todo move it to local variable spaces
 * they stay global for debug only
 */
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

/*
 * register to on load event
 */
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
    /*
    var treecols = tree.firstChild;

    for (var key in LdaptoAB.prototype) {
      var treecol = document.createElement('treecol');
      treecol.id = key;
      // need locale translator function
      treecol.setAttribute('label', key);
      treecol.flex = 1;
      treecol.hidden = true;
      treecols.appendChild(treecol);
    }
    */
    tree.view = cardtreeView;   
}

function selectServer(label) {
    curpref=prefs[label];
    Init();
}

/*
 * init
 */
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

/**
 * Search query generator
 * @param query
 * @param filter
 * @return Function
 */
function gensearchquery(query, filter) {
  var querycount = 0;
  return function (aMsg) {
       debugexplorer("searchquery:" + query + "\t" + querycount + "\n")
       
       /*
        * change status of "more label"
        */
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
         /*
          * return query for ldap server
          */
         return {dn: query, filter: filter } ;
       }
      return null;
  }
}

/**
 * Function generator for collect results
 * @param tree cardtreeView
 * @param attrs
 */
function gencallbacksearchresult(tree, attrs){
      return function(aMsg){           
           debugexplorer("callbacksearchresult:" + aMsg.dn + attrs + "\n");
           
           /*
            * cell in tree structure
            */
           var cell = new Array();
           cell["aMsg"] = aMsg;
           cell["dn"] = aMsg.dn;
           
           debugexplorer("attrs:" + aMsg.getAttributes({}) + "\n" );
           
           var cardattrs = aMsg.getAttributes({});
           
           for (var i in cardattrs) {
              try{
                debugexplorer("callbacksearchresult: attr=" + i + "\t"+ attrs[i]);
                /*
                 * fill cell with attributes from result from ldap server
                 */
                var val=aMsg.getValues ( cardattrs[i], {});
                if ( val != null) {
                       cell[ cardattrs[i] ] = val.toString();
                }
              }catch(e){
                    //debugexplorer(e+"\n");
                    dumperrors("Error not exist "+ e + "\n" + e.stack + "\n");
              }finally{ 
                    debugexplorer("\n");
              }
           } 
           
           if ( tree == undefined) debugexplorer("Error\n");
           
           debugexplorer("callbacksearchresult: tree.treeData.length= " + tree.treeData.length+  "\n");
           
           /*
            * add cell to tree
            */
           tree.treeData[tree.treeData.length] = cell;
           tree.treebox.rowCountChanged(0, 1);
     }
}

/**
 * event function for pressing enter key in search bar
 * @param value String
 */
function ldapexploreronEnterInSearchBar(value){
  document.getElementById('ldapexplorer-add').disabled=true;
  document.getElementById('ldapexplorer-morelabel').disabled=true;                     

  if ( ldap == null ){
    dumperrors("Choose Ldap server before\n");
    return;
  }
  
  cardtreeView.treebox.rowCountChanged(0, -cardtreeView.treeData.length);
//  cardtreeView.treebox.invalidate();
  cardtreeView.treeData = new Array();
  
  if (value == "") return;
  
  /*
   * request ldap server
   * looking for inputed value in search bar
   */
  var filter = searchformat.replace(/@V/g, value);
  try {
    ldap.query(queryURL, curpref.binddn, gengetpassword(), 
                         gensearchquery(queryURL.dn, filter),  
                         gencallbacksearchresult(cardtreeView, 
                                      ["cn","mail", "sn", "givenName"] ));
  } catch (e) {
    dumperrors ("Error: " + e + "\n" + e.stack + "\n" );
  } 
}

/*
 * card tree in ldap explorer
 */
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

/*
 * function for event "select something in tree of ldap explorer"
 */
function doselect(){
    document.getElementById('ldapexplorer-add').disabled=false;
    document.getElementById('ldapexplorer-del').disabled=false;

    var tree = document.getElementById('ldapexplorer-cardlist');
    if (tree.currentIndex < 0){
       debugexplorer("doselect: nothing selected\n");
       return null;
    }
    
    /*
     * show card in standart card viewer
     */
    try{
        var card = Components.classes["@mozilla.org/addressbook/cardproperty;1"].createInstance(Components.interfaces.nsIAbCard);
        
        /*
         * map card from ldap to ab
         */
        var mapper = new LdaptoAB();        
        mapper.map(cardtreeView.treeData[tree.currentIndex].aMsg, card);
        
        /*
         * show card
         */
        if (DisplayCardViewPane != undefined) DisplayCardViewPane(card);
      }catch(e){
        dumperrors("Error: " + e + "\n" + e.stack + "\n");
    }
}

/*
 * function for do something on select cards in ldap explorer
 * such as delete or add to local addressbook
 * @param method Function
 */
function doOnselectedInTree(metod){
    var tree = document.getElementById('ldapexplorer-cardlist');
    debugexplorer("doOnselected:" + tree.tagName + "\n");
    var start = new Object();
    var end = new Object();
    var numRanges = tree.view.selection.getRangeCount();

  for (var t = 0; t < numRanges; t++){
    tree.view.selection.getRangeAt(t,start,end);
    for (var v = start.value; v <= end.value; v++){
      debugexplorer("Item " + v + " is selected.\t" + cardtreeView.treeData[v].dn+"\n");
      /*
       * call to method (add, delete etc)
       */
      metod(v);
  }
 }
}

/*
 * function for event pressed add button
 * add card from ldap explorer to active local addressbook
 */
function doAdd() {
  /// NEED to change some code to call getSelectedDir();
  var mybook = getSelectedDir();  
  debugexplorer("add to " + mybook + "\n");

  /*
   * call with lambda function
   */
  doOnselectedInTree( function(v) {
      try{
        if ( addcardfromldap(mybook, cardtreeView.treeData[v].aMsg, true) ) {
            debugexplorer("card allready exists, sync it.");
        }
       }catch(e){
            dumperrors("Error:"+e+"\n" + e.stack + "\n");
     } } );
}

/*
 * function generator for delete cards on ldap server
 * @param queries
 * @return Function
 */
function gendelquery(queries) {
    var querycount = 0;
    
    /*
     * callback function
     * @param aMsg ldap message
     * @return query
     */
    return function (aMsg) {
       debugexplorer("delquery:" + queries + "\t" + querycount + "\n")
       
       if (aMsg != undefined ){
              debugexplorer("aMsg.errorCode:"+aMsg.errorCode + "\n");
              
              if (aMsg.errorCode != Components.interfaces.nsILDAPErrors.SUCCESS){
                dumperrors("Errors: delquery " + aMsg.errorCode + "\n"
                    + LdapErrorsToStr(aMsg.errorCode) + "\n"
                    + aMsg.errorMessage );
                return null;
              }
       }
       
       if ( querycount < queries.length ) {        
        return queries[querycount++];
       }
       
       /*
        * clear string in search bar
        */
       ldapexploreronEnterInSearchBar("");
       return null;
    }
}

/*
 * request ldap server for delete cards
 * @param v queries
 */
function deleteonldap(v) {
    if ( ldap == null ){
        debugexplorer("Choose Ldap server before\n");
        return;
    }

    try {
        ldap.deleteext(queryURL, curpref.binddn, gengetpassword(), 
            gendelquery(v) );
    } catch (e) {
        dumperrors ("Error: " + e + "\n"  + e.stack + "\n");
    }
}

/*
 * function for event pressed delete button
 */
function doDel() {
  var queries = [];

  /*
   * collect query callback function 
   */
  function collect(v) {
    debugexplorer("doDel: " + v + "\n");
    
    queries[queries.length] = {number: v, dn: cardtreeView.treeData[v].aMsg.dn};
  }

  /*
   * collect selected cards
   */
  doOnselectedInTree( collect );
  
  // debug
  for( var i in queries ) {
    debugexplorer("collected:" + i + "\t" + queries[i].dn + "\n");
  }
  
  /*
   * prompt user
   */
  var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                        .getService(Components.interfaces.nsIPromptService);
  var result = prompts.confirm(null, "Delete from LDAP Server", "Are you sure?");

  if (result) {
    debugexplorer("call to del");
    
    deleteonldap(queries);
  }
}

  /*
   * Generator for callback function from ldap modify operations
   * @param querymods Array of query objects
   *   for example [ { dn: aMsg.dn, mods: mods} ] 
   */
  function genmodquery(querymods, backstatus) {
    var modquerycount = 0;
    
    /*
     * Callback function for modify operations
     * @param aMsg ldap messages
     * @param 
     */
    return function modquery(aMsg, mdn) {
      debugexplorer("modquery " + modquerycount + "\n");
      
      /*
       * abort when need to abort
       */
      if (ldaprw_sync_abort ) {
        debugexplorer("modequery abortall\n");
        ldap.abortall();
        return null;
      }
      
     if (aMsg != undefined ){
          debugexplorer("modquery aMsg= " + aMsg.errorCode + "\n");
          
          if(aMsg.errorCode != Components.interfaces.nsILDAPErrors.SUCCESS ){
            dumperrors("Error: modquery " + aMsg.errorCode + "\n" 
                  + LdapErrorsToStr(aMsg.errorCode) + "\n"
                  + aMsg.errorMessage );
          }
          
          if (backstatus != undefined) backstatus(QUEUEUPDATEGET, aMsg.type);
      }
      
      if ( modquerycount < querymods.length ) {
          debugexplorer( querymods[modquerycount].dn + " "
              + querymods[modquerycount].mods+ "\n");
       
          return querymods[modquerycount++];
      }
      return null;
    }
  }
  

/*
function modifyonldap(card) {
  if ( ldap == null ){
    debugexplorer("Choose Ldap server before\n");
    return;
  }

  try {
    ldap.modify(queryURL, curpref.binddn, gengetpassword(), 
        genmodquery( [ { dn: aMsg.dn, mods: mods} ] ) );
  } catch (e) {
    dumperrors ("Error: " + e + "\n"  + e.stack + "\n");
  } 
}
*/

/*
 * function for event pressed edit button
 */
function doEdit() {
    var tree = document.getElementById('ldapexplorer-cardlist');
    if (tree.currentIndex < 0){
       debugexplorer("do select nothing selected\n");
       return null;
    }

    var aMsg = cardtreeView.treeData[tree.currentIndex].aMsg;
    debugexplorer("doEdit: aMsg.dn=" + aMsg.dn + "\n");

    try{
      // temprorary wrong method
      var card = Components.classes["@mozilla.org/addressbook/cardproperty;1"].createInstance(Components.interfaces.nsIAbCard);     
      var oldcard = Components.classes["@mozilla.org/addressbook/cardproperty;1"].createInstance(Components.interfaces.nsIAbCard);     
      
      /*
       * mappers
       */
      var mapper = new LdaptoAB();    
      var mappertoldap = new ABtoLdap();
      
      // temprorary wrong method. Goog method to clone card needed.!!!!
      mapper.map(aMsg, oldcard); 
      // oldcard.copy(card);
      mapper.map(aMsg, card); 

      debugexplorer("oldcard.primaryEmail=" + oldcard.primaryEmail + "\n");
      debugexplorer("card.primaryEmail=" + card.primaryEmail + "\n");

      mygoEditCardDialog(null, card);
/*
      var newprops = card.properties;
      while (newprops.hasMoreElements() ){
        var newattr = newprops.getNext();
        if (attr instanceof Components.interfaces.nsIProperty){
          var oldprop = oldcard.getProperty(newattr.name, null);
        }
      }
*/
      debugexplorer("oldcard.primaryEmail=" + oldcard.primaryEmail + "\n");
      debugexplorer("card.primaryEmail=" + card.primaryEmail + "\n");

      /*
       * create modificators for query to ldap server
       */
      var mods = CreateNSMutArray();
      mappertoldap.map(card, mods, oldcard);

      /*
       * request to update cards on ldap server
       */
      if (mods.length >0){
        debugexplorer("doEdit: mods.length=" + mods.length + ", aMsg.dn=" + aMsg.dn + "\n");        
        
        ldap.modify (queryURL, curpref.binddn, gengetpassword(), 
            genmodquery( [ { dn: aMsg.dn, mods: mods} ]) ); 
      }else{
        debugexplorer("modify card in LDAP nothing to modify\n");
      }      
    }catch(e){
      dumperrors("Error: " + e + "\n" + e.stack + "\n");
    }
}

/*
 * open edit card window
 * @param abURI
 * @param card
 */
function mygoEditCardDialog(abURI, card) {
   window.openDialog("chrome://ldaprw/content/myabEditCardDialog.xul",  
                     "",  
                     "chrome,resizable=no,modal,titlebar,centerscreen",  
                     {abURI:null, card:card});
}


/*

var card = Components.classes["@mozilla.org/addressbook/cardproperty;1"].createInstance(Components.interfaces.nsIAbCard); 
card.displayName = "testCard";

goEditCardDialog(null, card);

 * */

