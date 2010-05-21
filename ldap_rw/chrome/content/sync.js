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

function debugsync(str){
  dump("sync.js: " + str);
}

function dumperrors(str){
  ldapsyncabort();
  dump(str+ "\n");
  alert(str);
}

// error collector
var errorstorage = {
  data:[],
  length: 0,
  add: function(err) {
    dump("");
    data[length++] = err;
  }
};
function queryerror(msg, dn, card) {
  if (msg) this.msg = msg;
  if (dn) this.dn = dn;
  if (card) this.card = card;
}
queryerror.prototype = {
  msg:  null,
  dn:   null,
  card: null
}

var QUEUESEARCHADD = 1;
var QUEUESEARCHGET = 2;
var QUEUEUPDATEADD = 3;
var QUEUEUPDATEGET = 4;
var QUEUEADDADD = 5;
var QUEUEADDGET = 6;
var QUEUERENADD = 7;
var QUEUERENGET = 8;
var QUEUEDELADD = 9;
var QUEUEDELGET = 10;
var ERRGET = 11;
var ERRSOL = 12;


var ldaprw_sync_abort = false;
function ldapsyncabort() {
  debugsync("ldapsyncabort\n");
  ldaprw_sync_abort = true;
}

// debug info
var alldn = [];
var allmsg = [];
var maillists = {};
/////////////////

/*
load("chrome://ldaprw/content/abtoldap.js"); 
load("chrome://ldaprw/content/ldaptoab.js"); 
load("chrome://ldaprw/content/ldapsource.js");
load("chrome://ldaprw/content/sync.js");
load("chrome://ldaprw/content/prefs.js");
*/

/*
  var abManager = Components.classes["@mozilla.org/abmanager;1"].getService(Components.interfaces.nsIAbManager);

var mybook = pref.book;
 var cards = mybook.childCards;
 var card = cards.getNext()
card instanceof Components.interfaces.nsIAbCard
var propers = card.properties; while ( propers.hasMoreElements() ) { var p = propers.getNext(); if ( p instanceof Components.interfaces.nsIProperty ){ print(p.name + "\t" + p.value + "\n"); } }

 */

/*
 * Sync all book
 * @backstatus callback function (type, msg)
 *
 * example:
 * ldapsync( function() { 
 *              switch(type){ 
 *               case QUEUESEARCHADD: somecounter++; break; 
 *               case QUEUESEARCHGET: anothercounter++; break
 *              }} )
 *
 * */

function ldapsync(backstatus) {
  ldaprw_sync_abort = false;
  debugsync("ldapsync\n");
  var prefs = getprefs();
  for ( var i in prefs) {
    if (ldaprw_sync_abort) {break;}
    syncpolitic2(prefs[i],backstatus);
  }
}

/*
 * Generator for password manager interface
 * @uri 
 * */
function gengetpassword() {
  var counter=0;
//  var queryURL = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(uri, null, null).QueryInterface(Components.interfaces.nsILDAPURL);

  /*
   * function getpassword returns string password or null
   * First call ask or get existing password and return it
   * Second call and other clear existing password and ask it again
   * When counter > 3 break with null
   * @queryURL 
   * @aMsg It's defined then password incorrect, clear it and ask again
   * */
  return function getpassword(queryURL, aMsg) {
      debugsync("getpassword "+ counter + "\n");
      if (queryURL == undefined) return null;
      
      if (counter > 0){  
//        debugsync("getpassword " + counter + "\t" + aMsg.errorCode + "\t" + LdapErrorsToStr(aMsg.errorCode) +"\n");
        try{
          var passwordManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
          var logins = passwordManager.findLogins( {}, queryURL.prePath, null, queryURL.spec); 
          if (logins.length>0) {
            passwordManager.removeLogin(logins[0])
              debugsync("old login removed");
          }
        }catch(e){
          dumperrors("getpassword:" + e + "\n");
        }
        debugsync("getpassword counter changed"+ counter + "\n");
      }
      if (counter++ > 2) return null;

      try {
        var pw = { value: ""};
        var authprompter = Components.classes["@mozilla.org/login-manager/prompter;1"] 
                            .getService(Components.interfaces.nsIAuthPrompt);
        var res = authprompter.promptPassword("Ldap Server Password Need", "Ldap Server Password Request\n" + queryURL.host , queryURL.spec, Components.interfaces.nsIAuthPrompt.SAVE_PASSWORD_PERMANENTLY, pw);
        if (!res) {
          return null;
        }
      }catch(e){
        dumperrors("getpassword: "+e);
      } 

      return pw.value;
   }
}



/*
 * Second design of the sync function. The first function did send a request 
 * to fetch all records from server and then compared cards.
 *
 * Primary concept of second design is to move to functional style
 * @pref preferences
 * @backstatus callback function (type, aMsg)
 * */
function syncpolitic2(pref,backstatus, mybook){

  var abManager = Components.classes["@mozilla.org/abmanager;1"].getService(Components.interfaces.nsIAbManager);
  if (mybook == undefined ) mybook = pref.book;

  var queryURL = pref.queryURL;

  var mapper = new LdaptoAB();
  var mappertoldap = new ABtoLdap();

  var newcards = new Array();  

//  var maillists = CollectNodesMailLists(mybook);

  /*
   * Generator for callback function from ldap modify operations
   * @querymods Array of query objects
   *   for example [ { dn: aMsg.dn, mods: mods} ] 
   * */
  function genmodquery(querymods) {
    var modquerycount = 0;
    /*
     * Callback function for modify operations
     * @aMsg ldap messages
     * */
    return function modquery(aMsg, mdn) {
      debugsync("modquery " + modquerycount + "\n");
      if (ldaprw_sync_abort ) {
        debugsync("modequery abortall\n");
        ldap.abortall();
        return null;
      }
     if (aMsg != undefined ){
          debugsync("modquery aMsg= " + aMsg.errorCode + "\n");
          if(aMsg.errorCode != Components.interfaces.nsILDAPErrors.SUCCESS ){
            if (backstatus != undefined) backstatus(ERRGET, 0);
            
            dumperrors("Error: modquery " + aMsg.errorCode + "\n" 
                  + LdapErrorsToStr(aMsg.errorCode) + "\n"
                  + aMsg.errorMessage );
          }
          if (backstatus != undefined) backstatus(QUEUEUPDATEGET, aMsg.type);
      }
       if ( modquerycount < querymods.length ) {
          debugsync( querymods[modquerycount].dn + " "
              + querymods[modquerycount].mods+ "\n");
       
        return querymods[modquerycount++];
      }
      return null;
    }
  }


  /*
   * Callback function for ldap search results operation
   * @aMsg ldap messages
   * */
  function callbacksearchresult(aMsg) {
//    ldapcards[aMsg.dn] = aMsg;
//    ldapcards[ldapcards.length] = aMsg;
   debugsync("callbacksearchresult " + aMsg.type +"\n");
      if (ldaprw_sync_abort ) {
        debugsync("callbacksearchresult abortall\n");
        ldap.abortall();
        return;
      }
    var d = aMsg.getValues ("modifytimestamp", {}).toString();
    var ldapdate = new Date ( Date.UTC (d.substring(0,4), d.substring(4,6) - 1, d.substring(6,8), d.substring(8,10), d.substring(10,12), d.substring(12,14) ) );

    /// Search card for dn if it not exists may be we get an "alien" card 
    var card = mybook.getCardFromProperty("dn", aMsg.dn, false);
    if ( card == undefined ) {
      debugsync("callbacksearchresult: can't find\n");
      return;
    }
    
    /*
     * Compare a card date with a ldap message
     * need to move it to function
     * */

    var carddate = new Date();
    var carddatestr = card.getProperty("LastModifiedDate", 0);   
    carddate.setTime( carddatestr + "000");

    var oldldapdate = new Date();
    var oldldapdatestr = card.getProperty("LdapModifiedDate", 0);
    oldldapdate.setTime(oldldapdatestr + "000");

    debugsync("callbacksearchresult ldapdate=" 
        + ldapdate.getTime() + " carddate =" 
        + carddate.getTime() + " oldldapdate = "
        + oldldapdate.getTime() + "\n" );
    
    if ( ldapdate.getTime() != carddate.getTime() ){
      if (ldapdate.getTime() > carddate.getTime()) {
        mapper.map(aMsg, card);
        debugsync("modify card in Book "+ aMsg.dn + "\n");
        var newcard= mybook.modifyCard(card);
        if (backstatus != undefined) backstatus(QUEUESEARCHGET, aMsg.type);
      } else {
        debugsync("modify card in LDAP "+ aMsg.dn + "\n");
        var oldcard = Components.classes["@mozilla.org/addressbook/cardproperty;1"].createInstance(Components.interfaces.nsIAbCard); 
        mapper.map(aMsg, oldcard);
        var mods = CreateNSMutArray();
        
        mappertoldap.map(card, mods, oldcard);

        if (mods.length >0){             
          try { 
            ldap.modify (queryURL, pref.binddn, gengetpassword(), 
                         genmodquery( [ { dn: aMsg.dn, mods: mods} ] ) ); 
            if (backstatus != undefined) backstatus(QUEUEUPDATEADD, 0);
          } catch (e) {
            dumperrors("Error: " + e+ "\n"); 
          }    
        }else{
          debugsync("modify card in LDAP nothing to modify\n");
          if (backstatus != undefined) backstatus(QUEUESEARCHGET, aMsg.type);
        }

      }
    } else {
        if (backstatus != undefined) backstatus(QUEUESEARCHGET, aMsg.type);
    }

  };

  /*
   * Generator for callback search queries
   * @queryURL
   * */
  function gengetsearchquery(queryURL){
    var allcards = mybook.childCards;
    var currentcard;

    /*
     * old "sync" card by card
     * */
    function iteration(){
      debugsync("iter \n");
        while ( allcards.hasMoreElements()  ) {
          if (ldaprw_sync_abort ) {
            debugsync("modequery abortall\n");
            ldap.abortall();
            return null;
          }
          currentcard = allcards.getNext();
          if ( currentcard instanceof Components.interfaces.nsIAbCard) {
            var dn = currentcard.getProperty("dn", null);
            debugsync("iter while dn=" + dn + "\n");
            if ( dn ){
              if (backstatus != undefined) backstatus(QUEUESEARCHADD, 0);
              
              if ( currentcard.isMailList ) {
                // !!! never true
                // because card component of mailing list can't containing "dn"
                debugsync( "iter mailng list contains dn! dn=" + dn + "\n")
                maillists[currentcard.displayName].card = currentcard;
              // "(objectclass=groupOfNames)"
                return {dn: gendnML(pref, currentcard), filter: "(objectclass=" + pref.maillistClassesAR[0]  + ")"};
//                continue;
              } else {
                // "(objectclass=inetorgperson)"
                return {dn: dn, filter: "(objectclass=" + pref.objClassesAR[0] + ")"};
              }
            } else {
              if ( currentcard.isMailList ) {
                debugsync("iteration maillist\n");
                maillists[currentcard.displayName] = {card: currentcard};
//                search mailing list on ldap server
//                may be need to remove 'dn' from cards and create gendn function for all type card
                return {dn: gendnML(pref, currentcard), filter: "(objectclass=" + pref.maillistClassesAR[0]  + ")"};
//                newmaillisttoldap(currentcard);
              } else {
                debugsync("iteration new card new dn\n");
                newcardtoldap(currentcard);
              }
            }
          }
        }
        debugsync("iteration nothing to do\n")
        return null;
    }

    /*
     * Callback function for search operations
     * */
    return function(aMsg, mydn){
      debugsync("getsearchquery\n");
      if (ldaprw_sync_abort ) {
        debugsync("getsearchquery abortall\n");
        ldap.abortall();
        return null;
      }
      if ( aMsg == undefined ) return iteration();
      else
        if ( aMsg instanceof Components.interfaces.nsILDAPMessage) {

          //// debuging infos
//          allmsg[allmsg.length] = aMsg;
//          if ( mydn != undefined ) {
//            alldn[alldn.length] = { msg: aMsg, mydn: mydn };
//            debugsync("getsearchquery mydn=" + mydn.dn + "\n");
//          }
          ////////////////////////

          if ( aMsg.errorCode == Components.interfaces.nsILDAPErrors.SUCCESS ){
            return iteration();
          }else 
            if ( aMsg.errorCode == Components.interfaces.nsILDAPErrors.NO_SUCH_OBJECT){

              //// debug
              var dumpstr = "getsearchquery new card ";
              try {
                if (aMsg.errorCode != undefined) {
                  dumpstr+="errcode=" + aMsg.errorCode;
                }
                if (aMsg.matchedDn != undefined ) {
                  dumpstr+= " matchedDn=" + aMsg.matchedDn;
                }
                if (mydn != undefined ) {
                  dumpstr+= " dn=" + mydn.dn;
                }
              } catch(e) {
                debugsync(e);
              } finally {
                debugsync(dumpstr + "\n");
              }
              /////////////////////////////////////

               if (mydn != undefined ) {
                  var card = mybook.getCardFromProperty("dn", mydn.dn, false);
                  if ( card != undefined ) {
                    newcardtoldap(card);
                  } else {
                    var rdnval = mydn.dn.split(',')[0].split('=')[1].replace(/^\s+|\s+$/g,'');
                    var ml = maillists[rdnval];
                    debugsync(ml.card.displayName + "\n");
                    newmltoldap(ml.card);                    
                  }
                }

              return iteration();
            } else {
              if (backstatus != undefined) backstatus(ERRGET, 0);
              ldapsyncabort();              
              ldap.abortall();
              dumperrors (aMsg.type + "\n" + aMsg.errorCode + "\t" + LdapErrorsToStr(aMsg.errorCode) + "\n" + aMsg.errorMessage);
            }
        }
      debugsync("getsearchquery nothing to do\n");
      return null;  
   }
  }


  

  var ldap = new LdapDataSource();
  var newcardtoldap = genaddtoldap(pref, ldap, backstatus);
  var newmltoldap = genaddtoldapML(pref, ldap, backstatus);

  
  // Prepare Array of  requested attributes for ldap search request
  // need to refactor to use generator iterator from mapper or move to use
  // callback function
  var attrs = new Array(); 
  attrs[attrs.length]="objectClass";
  for (var i in mapper.__proto__) { 
    attrs[attrs.length] = i; 
  };
  
  ldap.init(attrs);

  try {
  //  queryURL.filter = "(objectclass=inetorgperson)"
    ldap.query(queryURL, pref.binddn, gengetpassword(), gengetsearchquery(pref.queryURL), callbacksearchresult );
  } catch (e) {
    dumperrors ("Error: " + e + "\n" );
  }

}

function genrdnML(pref, card) {
  //return pref.attrRdn + "=" + card.displayName;
  var basisRdn = card.getProperty(pref.basisRdn, "");
  if ( basisRdn.length > 0 ) {
    return pref.attrRdn + "=" + card.getProperty(pref.basisRdn);  
  } else {
    throw "genrdn: basisRdn.length = 0";
  }
}

function gendnML(pref,card) {
  return genrdnML(pref, card) + ',' + pref.queryURL.dn;
}

function genrdn(pref, card) {
//  return pref.attrRdn + "=" + card.displayName; 
//  var basisRdn = card.getProperty(pref.basisRdn, "");
  var basisRdn = pref.genRdn(card);
  if ( basisRdn.length > 0 ) {
    return pref.attrRdn + "=" + basisRdn;
  } else {
    debugsync("genrdn: basisRdn.length=" + basisRdn.length + "\n");
    throw "genrdn: basisRdn.length = 0";
    return null;
  }
}

function gendn(pref,card) {
  var rdn = genrdn(pref, card);
  debugsync("gendn: rdn="+rdn+"\n");
  return rdn + ',' + pref.queryURL.dn;
}

/*
 * Generator of callback function for add operation
 * */

function genaddtoldap(pref, ldapser, backstatus) {


  var mybook = pref.book;
  var queryURL = pref.queryURL;

  var mapper = new LdaptoAB();
  var mappertoldap = new ABtoLdap();

  var ldap = ldapser;
  if (ldap == undefined) {    
    var ldap = new LdapDataSource();
    var attrs = new Array(); 
    attrs[attrs.length]="objectClass";
    for (var i in mapper.__proto__) { 
      attrs[attrs.length] = i; 
    };
    ldap.init(attrs);
  }

  function genaddquery(card, addqueries) {
    var addquerycount = 0;
    return function addquery(aMsg, mdn) {
      debugsync("addquery " + addquerycount + "\n");
      if (ldaprw_sync_abort ) {
        try{
          if (backstatus != undefined) backstatus(ERRGET, 0);
          debugsync("addquery abortall\n");
          ldap.abortall();
        }catch(e){
          dumperrors("addquery aborting failed: " + e + "\n");
        }
        return null;
      }
      if (aMsg != undefined ){
          debugsync("addquery aMsg= " + aMsg.errorCode + "\n");
        if (aMsg.errorCode != Components.interfaces.nsILDAPErrors.SUCCESS) {
          try{
            ldapsyncabort();
            if (backstatus != undefined) backstatus(ERRGET, 0);
            dump("addtoldap: aborting\n");
            ldap.abortall();
          }catch(e){
            dumperrors("addquery aborting failed: " + e + "\n");
          }

          dumperrors("Error: addquery " + aMsg.errorCode + "\n" 
                  + LdapErrorsToStr(aMsg.errorCode) + "\n"
                  + aMsg.errorMessage + "\n"
                  + card.getProperty("dn", "") + "\n");
          return null;
        }else{
          card.setProperty("dn", mdn.dn);
          var newcard= mybook.modifyCard(card);
          if (backstatus != undefined) backstatus(QUEUEADDGET, aMsg.type);          
        }
      }
      if ( addquerycount < addqueries.length ) {
        return addqueries[addquerycount++];
      }
      return null;
    }
  }


    return function(card){
      debugsync("New card\n");
      try {
        var oldcard = Components.classes["@mozilla.org/addressbook/cardproperty;1"] .createInstance(Components.interfaces.nsIAbCard);
        var mods = CreateNSMutArray();
   
        var dn = card.getProperty("dn", null);
        if ( !dn ){
          //dn = pref.attrRdn + "=" + card.displayName + "," + queryURL.dn;
          dn = gendn(pref, card);
        }
        debugsync("newcardtoldap dn=" + dn + "\n");
        mods.appendElement( CreateLDAPMod( "objectClass", pref.objClassesAR, Components.interfaces.nsILDAPModification.MOD_ADD | Components.interfaces.nsILDAPModification.MOD_BVALUES ), false );
      
        mappertoldap.map(card, mods, oldcard);
      
        ldap.add(queryURL, pref.binddn, gengetpassword(), genaddquery(card, [{dn: dn, mods: mods /* maybe need: , card:card */}]) );
        if (backstatus != undefined) backstatus(QUEUEADDADD, 0);        
      } catch(e) {
        dumperrors("Error: " + e+"\n");
      }      
    }
}


/*
 * Generator of callback function for add operation, mailing list
 * */

function genaddtoldapML(pref, ldapser, backstatus) {

  var abManager = Components.classes["@mozilla.org/abmanager;1"].getService(Components.interfaces.nsIAbManager);

  var mybook = pref.book;
  var queryURL = pref.queryURL;

  var mapper = new LdaptoML();
  var mappertoldap = new MLtoLdap();

  var ldap = ldapser;
  if (ldap == undefined) {    
    var ldap = new LdapDataSource();
  }

  function genaddquery(card, addqueries) {
    var addquerycount = 0;
    return function addquery(aMsg, mdn) {
      debugsync("addquery " + addquerycount + "\n");
      if (ldaprw_sync_abort ) {
        debugsync("addquery abortall\n");
        ldap.abortall();
        return null;
      }
      if (aMsg != undefined ){
          debugsync("addquery aMsg= " + aMsg.errorCode + "\n");
        if (aMsg.errorCode != Components.interfaces.nsILDAPErrors.SUCCESS) {
          dumperrors("Error: addquery " + aMsg.errorCode + "\n" 
                  + LdapErrorsToStr(aMsg.errorCode) + "\n"
                  + aMsg.errorMessage + "\n"
                  + card.getProperty("dn", "") + "\n");
          return null;
        }else{
//          var newcard= mybook.modifyCard(card);
          if (backstatus != undefined) backstatus(QUEUEADDGET, aMsg.type);          
        }
      }
      if ( addquerycount < addqueries.length ) {
        return addqueries[addquerycount++];
      }
      return null;
    }
  }


    return function(card){
      debugsync("New mailing list to ldap\n");
      try {
        var node = abManager.getDirectory(card.mailListURI);
        var ml = { card: card, node: node}; 

        var mods = CreateNSMutArray();
      
        var dn = gendnML(pref, card);
        debugsync("new ml to ldap dn=" + dn + "\n");
        mods.appendElement( CreateLDAPMod( "objectClass", pref.maillistClassesAR, Components.interfaces.nsILDAPModification.MOD_ADD | Components.interfaces.nsILDAPModification.MOD_BVALUES ), false );
        debugsync("new ml to ldap mods.length=" + mods.length + "\n");
      
        mappertoldap.map(ml, mods);

        //// Thunderbird can't store 'dn' in mailing list nsAbCard
        //card.setProperty("dn", dn);
        debugsync("new ml to ldap mods.length=" + mods.length + "\n");
      
        ldap.add(queryURL, pref.binddn, gengetpassword(), genaddquery(card, [{dn: dn, mods: mods}]) );
        if (backstatus != undefined) backstatus(QUEUEADDADD, 0);        
      } catch(e) {
        dumperrors("Error: " + e+"\n");
      }      
    }
}


/*
 * Add new card to address book from ldap or modify existing card
 * */
function addcardfromldap(book, aMsg, replace){
 
  var mapper = new LdaptoAB();
  var card = book.getCardFromProperty("dn", aMsg.dn, false);
  if ( card == undefined ) {
    var card = Components.classes["@mozilla.org/addressbook/cardproperty;1"].createInstance(Components.interfaces.nsIAbCard); 

    mapper.map(aMsg, card);

    // NEED to change code to use onnsIAbCardPropsDo(card, func)
    var propers = card.properties; 
    while ( propers.hasMoreElements() ) { 
      var p = propers.getNext(); 
      if ( p instanceof Components.interfaces.nsIProperty ){ 
        debugsync(p.name + "\t" + p.value + "\n"); 
      } 
    } 

    var newcard= book.addCard(card);

    return 0;
  } else {
    if (replace){
      mapper.map(aMsg, card);
      var newcard= book.modifyCard(card);      
      return 0;
    }
  }
  return 1;
}


