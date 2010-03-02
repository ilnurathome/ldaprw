function debugsync(str){
//  dump("sync.js: " + str);
}



/*
load("chrome://ldaprw/content/abtoldap.js"); 
load("chrome://ldaprw/content/ldaptoab.js"); 
load("chrome://ldaprw/content/ldaprw_ab.js");
load("chrome://ldaprw/content/overlay.js");
load("chrome://ldaprw/content/sync.js");
load("chrome://ldaprw/content/prefs.js");
*/



function ldapsync() {
  debugsync("ldapsync\n");
  var prefs = getprefs();
  for ( var i in prefs) {
    syncpolitic2(prefs[i]);
  }
}

function gengetpassword(prePath, uri) {
    return function() {
      var passwordManager = Components.classes["@mozilla.org/login-manager;1"].
                         getService(Components.interfaces.nsILoginManager);
      var logins = passwordManager.findLogins( {}, prePath, null, uri); 
      return logins[0].password;
    };
}


function syncpolitic1(pref) {

//  var uri = "ldap://ilnurhp.local/ou=addressbook,dc=local??sub?(objectclass=*)";
//  var binddn = "uid=ilnur,ou=people,dc=local";
//  var pref = prefs.ldapsync;

  
  var binddn = pref.binddn;
  var uri = pref.uri;
  var filename = pref.filename;
  var objClasses = pref.objClasses;
    

  var queryURL = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(uri, null, null).QueryInterface(Components.interfaces.nsILDAPURL);

  var getpassword = gengetpassword(queryURL.prePath, uri);

  var mainThread = Components.classes["@mozilla.org/thread-manager;1"].getService().mainThread;
  
  var abManager = Components.classes["@mozilla.org/abmanager;1"].getService(Components.interfaces.nsIAbManager);
//  var mybook = abManager.getDirectory("moz-abmdbdirectory://abook-3.mab");
  var mybook = abManager.getDirectory( "moz-abmdbdirectory://" + filename );

  var ldapcards = new Array();
  var ldapABcards = new Array();
  var mapper = new LdaptoAB();
  var mappertoldap = new ABtoLdap();

  var modcards = new Array();
  var querydn = new Array();
  var newcards = new Array();
  var allcards = mybook.childCards;


  function callbacksearchresult(aMsg) {
    //debugsync("callbacksearchresultcallbacksearchresultcallbacksearchresultcallbacksearchresult" + aMsg + "\n");
    ldapcards[aMsg.dn] = aMsg;
    ldapcards[ldapcards.length] = aMsg;
    var card = Components.classes["@mozilla.org/addressbook/cardproperty;1"]  
                       .createInstance(Components.interfaces.nsIAbCard);
    mapper.map(aMsg, card);
    ldapABcards[ldapABcards.length] = card;
  };


  var searchquerygeted =0;
  function getsearchquery(aMsg){
    if (searchquerygeted > 0) return null;
    searchquerygeted++;
    return queryURL.dn;
  }

  var ldap = new LdapDataSource();
  var attrs = new Array(); 
  for (i in mapper.__proto__) { 
    attrs[attrs.length] = i; 
  };
  ldap.init(attrs);
  try {
    queryURL.filter = "(objectclass=inetorgperson)"
//    ldap.query(queryURL, binddn, "(objectclass=inetorgperson)", getpassword, getsearchquery, callbacksearchresult );
    ldap.query(queryURL, binddn, getpassword, getsearchquery, callbacksearchresult );
  } catch (e) {
    debugsync ("Error: " + e + "\n" );
  }

  debugsync ("finished? " + ldap.mFinished + "\n");
  while(!ldap.mFinished) {
    debugsync ("+" );
    mainThread.processNextEvent(true);
  }
  debugsync("\ncomplete\n");

//  var ar = ldap.getMessagesEntry({});
  var ar = ldapcards;
  for ( a in ar ) {
    debugsync(a + " : " + ar[a].dn + "\n"); 
    debugsync("\t" + ar[a].getAttributes({}) + "\n" );
  }

  while (allcards.hasMoreElements()) {
    var c = allcards.getNext();
    if ( c instanceof Components.interfaces.nsIAbCard) {
      var dn = c.getProperty("dn", null);
      debugsync("c=" + c.lastName + " " + dn + "\n");
      if (dn == null || ar[dn] == undefined) {
        newcards[newcards.length]=c;
      } else {
        modcards[modcards.length]=c;
        querydn[querydn.length] = dn;
      }
    }
  }

  /*
  var card = Components.classes["@mozilla.org/addressbook/cardproperty;1"]  
                       .createInstance(Components.interfaces.nsIAbCard);
  */

  var querymods = new Array();
//  for (i in ar) {
  debugsync("ar.length=" + ar.length +"\n");
  for (var i=0; i<ar.length; i++) {
    debugsync("\nIteration " + i + "\n");
    var d = ar[i].getValues ("modifytimestamp", {}).toString();
    var ldapdate = new Date ( Date.UTC (d.substring(0,4), d.substring(4,6) - 1, d.substring(6,8), d.substring(8,10), d.substring(10,12), d.substring(12,14) ) );
    var card = mybook.getCardFromProperty("dn", ar[i].dn, false);
    if ( card == undefined ) {
      var card = Components.classes["@mozilla.org/addressbook/cardproperty;1"] 
                           .createInstance(Components.interfaces.nsIAbCard); 
      mapper.map(ar[i], card);
      card.setProperty("LastLDAPLoadDate", (new Date()).getTime() );
      card.setProperty("LastLDAPModifyDate", ldapdate.getTime() );
      debugsync("new card from LDAP "+ i +" " + ar[i].dn +"\n");
      var newcard= mybook.addCard(card);
    } else {
      var carddate = new Date();
      var carddatestr = card.getProperty("LastModifiedDate", "");
      if ( carddatestr == 0 ) 
        carddatestr = (new Date()).getTime().toString().substring(0,10);
      carddate.setTime( carddatestr + "000");
      debugsync("card exists " + ldapdate.getTime() + " " +carddate.getTime()+ "\n");

      if ( ldapdate.getTime() != carddate.getTime() ){
        if (ldapdate.getTime() > carddate.getTime()) {
          mapper.map(ar[i], card);
          debugsync("modify card in Book "+ i +" " + ar[i].dn + "\n");
          var newcard= mybook.modifyCard(card);
        } else {
          var mods = CreateNSMutArray();
          debugsync("modify card in LDAP "+ i +" " + ar[i].dn + "\n");
          var query = {dn: ar[i].dn, mods: mods};
          var oldcard = Components.classes["@mozilla.org/addressbook/cardproperty;1"].createInstance(Components.interfaces.nsIAbCard); 
          
          mapper.map(ar[i], oldcard);

          mappertoldap.map(card, mods, oldcard);
          if ( query.mods.length >0){
            querymods[querymods.length] = query;
            debugsync("modify card in LDAP "+ i +" " + ar[i].dn + "\n");
          }else{
            debugsync("nothing to modify\n");
          }
        }
      }
    }
  }

  var modquerycount = 0;
  function modquery() {
    if ( modquerycount < querymods.length ) {
      return querymods[modquerycount++];
    }
    return null;
  }

  if (querymods.length > 0) {
    try { 
      ldap.modify(queryURL, binddn, getpassword, modquery ); 
    } catch (e) {
      debugsync("Error: " + e+ "\n"); 
    }
  }

  var mappertoldap= new ABtoLdap();
  var addqueries = new Array();
  for ( card in newcards) {
    var oldcard = Components.classes["@mozilla.org/addressbook/cardproperty;1"] .createInstance(Components.interfaces.nsIAbCard);
    var mods = CreateNSMutArray();
//    var dn = generateRDN(pref.attrRdn, newcards[card]); //"uid=ldapsync,ou=addressbook,dc=local";
    dn = pref.attrRdn + "=" + newcards[card].displayName + "," + queryURL.dn;
    
    mods.appendElement( CreateLDAPMod( "objectClass", pref.objClasses.split(","), Components.interfaces.nsILDAPModification.MOD_ADD | Components.interfaces.nsILDAPModification.MOD_BVALUES ), false );
    
    mappertoldap.map(newcards[card], mods, oldcard);
    debugsync("dn = " + dn + "\n");
    addqueries[addqueries.length] = {dn: dn, mods: mods};

    newcards[card].setProperty("dn", dn);
    var newcard= mybook.modifyCard(newcards[card]);
  }

  var addquerycount = 0;
  function addquery() {
    if ( addquerycount < addqueries.length ) {
      return addqueries[addquerycount++];
    }
    return null;
  }
  
  try {
    ldap.add(queryURL, binddn, getpassword, addquery ); 
  } catch (e) {
    debugsync("Error: " + e+ "\n"); 
  }
}

function generateRDN(prefix, card){
  var value = "";
  if ( card.primaryEmail != "" ) {
    value = card.primaryEmail;
  } else {
    if ( card.firstName != "" && card.lastName != "" ) {
      card.firstName + card.lastName ;
    }else{
      //value = "" + Math.random() * 1000000000 | 0
      alert("Error: can't generate DN");
      throw Error("Error: can't generate DN");
    }
  }
  value = value.replace("@","_at_").replace(".", "_dot_").replace(",", "_comma_");
  return prefix + "=" + value;
}

/*
 * Experimental func
 * 
 */
function syncpolitic2(pref){
  var mainThread = Components.classes["@mozilla.org/thread-manager;1"].getService().mainThread;

  var abManager = Components.classes["@mozilla.org/abmanager;1"].getService(Components.interfaces.nsIAbManager);

  var mybook = abManager.getDirectory( "moz-abmdbdirectory://" + pref.filename ); 

  var queryURL = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(pref.uri, null, null).QueryInterface(Components.interfaces.nsILDAPURL);

  var getpassword = gengetpassword(queryURL.prePath, pref.uri);

  var mapper = new LdaptoAB();
  var mappertoldap = new ABtoLdap();

  /*
   * Masking some function
   */

  /*
  var masked = mapper.__proto__[pref.attrRdn];
  var maskedfunction;
  if ( masked != undefined ) {
    maskedfunction = mappertoldap[masked];
    mappertoldap[masked] = function(){};
  }
  */

  var newcards = new Array();  


  function genmodquery(querymods) {
    var modquerycount = 0;
    return function modquery(aMsg) {
      debugsync("modquery " + modquerycount + " "
          + querymods[modquerycount].dn + " "
          + querymods[modquerycount].mods+ "\n");
      if (aMsg != undefined ){
          debugsync("modquery aMsg= " + aMsg.errorCode + "\n");
      }
       if ( modquerycount < querymods.length ) {
        
        return querymods[modquerycount++];
      }
      return null;
    }
  }


  function callbacksearchresult(aMsg) {
//    ldapcards[aMsg.dn] = aMsg;
//    ldapcards[ldapcards.length] = aMsg;
   debugsync("callbacksearchresult " + aMsg.type +"\n");
    var d = aMsg.getValues ("modifytimestamp", {}).toString();
    var ldapdate = new Date ( Date.UTC (d.substring(0,4), d.substring(4,6) - 1, d.substring(6,8), d.substring(8,10), d.substring(10,12), d.substring(12,14) ) );

    var card = mybook.getCardFromProperty("dn", aMsg.dn, false);
    if ( card == undefined ) {
      debugsync("callbacksearchresult: can't find\n");
      return;
    }
    

    var carddate = new Date();
    var carddatestr = card.getProperty("LastModifiedDate", 0);
    
    carddate.setTime( carddatestr + "000");

    debugsync("callbacksearchresult ldapdate=" 
        + ldapdate.getTime() + " carddate =" 
        + carddate.getTime() + "\n" );
    
    if ( ldapdate.getTime() != carddate.getTime() ){
      if (ldapdate.getTime() > carddate.getTime()) {
        mapper.map(aMsg, card);
        debugsync("modify card in Book "+ aMsg.dn + "\n");
        var newcard= mybook.modifyCard(card);
      } else {
        debugsync("modify card in LDAP "+ aMsg.dn + "\n");
        var oldcard = Components.classes["@mozilla.org/addressbook/cardproperty;1"].createInstance(Components.interfaces.nsIAbCard); 
        mapper.map(aMsg, oldcard);
        var mods = CreateNSMutArray();
        mappertoldap.map(card, mods, oldcard);

        if (mods.length >0){             
          try { 
            ldap.modify (queryURL, pref.binddn, getpassword, 
                         genmodquery( [ { dn: aMsg.dn, mods: mods} ] ) ); 
          } catch (e) {
            debugsync("Error: " + e+ "\n"); 
          }    
        }else{
          debugsync("modify card in LDAP nothing to modify\n");
        }

      }
    }
    

//    ldapABcards[ldapABcards.length] = card;
  };


  function gengetsearchquery(){
    var allcards = mybook.childCards;
    var currentcard;

    function iteration(){
      debugsync("iter \n");
        while ( allcards.hasMoreElements()  ) {
          
          currentcard = allcards.getNext();
          if ( currentcard instanceof Components.interfaces.nsIAbCard) {
            var dn = currentcard.getProperty("dn", null);
            debugsync("iter while dn=" + dn + "\n");
            if ( dn ){
              return dn;
            } else {
              debugsync("iteration new card new dn\n");
              newcardtoldap(currentcard);
           }
          }
        }
        debugsync("nothing to do\n")
        return null;
    }

    return function(aMsg){
      debugsync("getsearchquery\n");
      if ( aMsg == undefined ) return iteration();
      else
        if ( aMsg instanceof Components.interfaces.nsILDAPMessage) {
          if ( aMsg.errorCode == Components.interfaces.nsILDAPErrors.SUCCESS ){
            return iteration();
          }else 
            if ( aMsg.errorCode == Components.interfaces.nsILDAPErrors.NO_SUCH_OBJECT){
              debugsync("getsearchquery new card\n");
              newcardtoldap(currentcard);
              return iteration();
            }
        }
      debugsync("nothing to do\n");
      return null;  
   }
  }


  

  var ldap = new LdapDataSource();
  var newcardtoldap = genaddtoldap(pref, ldap);
  
  var attrs = new Array(); 
  for (i in mapper.__proto__) { 
    attrs[attrs.length] = i; 
  };
  
  ldap.init(attrs);

  try {
    queryURL.filter = "(objectclass=inetorgperson)"
//    ldap.query(queryURL, binddn, "(objectclass=inetorgperson)", getpassword, getsearchquery, callbacksearchresult );
    ldap.query(queryURL, pref.binddn, getpassword, gengetsearchquery(), callbacksearchresult );
  } catch (e) {
    debugsync ("Error: " + e + "\n" );
  }

}

function genaddtoldap(pref, ldapser) {
  
  var abManager = Components.classes["@mozilla.org/abmanager;1"].getService(Components.interfaces.nsIAbManager);

  var mybook = abManager.getDirectory( "moz-abmdbdirectory://" + pref.filename ); 
  var queryURL = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(pref.uri, null, null).QueryInterface(Components.interfaces.nsILDAPURL);
  var getpassword = gengetpassword(queryURL.prePath, pref.uri);

  var mapper = new LdaptoAB();
  var mappertoldap = new ABtoLdap();

  var ldap = ldapser;
  if (ldap == undefined) {    
    var ldap = new LdapDataSource();
  }

  function genaddquery(card, addqueries) {
    var addquerycount = 0;
    return function addquery(aMsg) {
      debugsync("addquery " + addquerycount + "\n");
      if (aMsg != undefined ){
          debugsync("addquery aMsg= " + aMsg.errorCode + "\n");
        if (aMsg.errorCode != Components.interfaces.nsILDAPErrors.SUCCESS) {
          debugsync("addquery Ldap can't add " + aMsg.errorCode + "\n");
          throw "Error: Ldap can't add " + aMsg.errorCode;
          return null;
        }else{
          var newcard= mybook.modifyCard(card);
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
      var oldcard = Components.classes["@mozilla.org/addressbook/cardproperty;1"] .createInstance(Components.interfaces.nsIAbCard);
      var mods = CreateNSMutArray();
      
      dn = pref.attrRdn + "=" + card.displayName + "," + queryURL.dn;
      debugsync("newcardtoldap dn=" + dn + "\n");
      mods.appendElement( CreateLDAPMod( "objectClass", pref.objClasses.split(","), Components.interfaces.nsILDAPModification.MOD_ADD | Components.interfaces.nsILDAPModification.MOD_BVALUES ), false );
      
      mappertoldap.map(card, mods, oldcard);

      card.setProperty("dn", dn);
      
      try {
        ldap.add(queryURL, pref.binddn, getpassword, genaddquery(card, [{dn: dn, mods: mods}]) );  
      } catch(e) {
        debugsync("Error: " + e+"\n");
      }
      
    }
}

function addcardfromldap(book, aMsg, replace){
  var mapper = new LdaptoAB();
  var card = mybook.getCardFromProperty("dn", aMsg.dn, false);
  if ( card == undefined ) {
    var card = Components.classes["@mozilla.org/addressbook/cardproperty;1"].createInstance(Components.interfaces.nsIAbCard); 
    mapper.map(aMsg, card);
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

