function debugsync(str){
  dump("sync.js: " + str);
}

function dumperrors(str){
   dump(str);
}


/*
load("chrome://ldaprw/content/abtoldap.js"); 
load("chrome://ldaprw/content/ldaptoab.js"); 
load("chrome://ldaprw/content/ldapsource.js");
load("chrome://ldaprw/content/sync.js");
load("chrome://ldaprw/content/prefs.js");
*/

/*
  var abManager = Components.classes["@mozilla.org/abmanager;1"].getService(Components.interfaces.nsIAbManager);

var mybook = abManager.getDirectory( "moz-abmdbdirectory://" + pref.filename );
 var cards = mybook.childCards;
 var card = cards.getNext()
card instanceof Components.interfaces.nsIAbCard
var propers = card.properties; while ( propers.hasMoreElements() ) { var p = propers.getNext(); if ( p instanceof Components.interfaces.nsIProperty ){ dump(p.name + "\t" + p.value + "\n"); } }

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

function genLdapErrorsToStr() {
  var errors = [];
  for ( var i in Components.interfaces.nsILDAPErrors) { 
     errors[ errors.length ] = i;
  }
  return function(n) {
    return errors[n];
  }
}

var LdapErrorsToStr = genLdapErrorsToStr();

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
      debugsync("modquery " + modquerycount + "\n");
     if (aMsg != undefined ){
          debugsync("modquery aMsg= " + aMsg.errorCode + "\n");
          if(aMsg.errorCode != Components.interfaces.nsILDAPErrors.SUCCESS ){
            alert("Error: modquery " + aMsg.errorCode + "\n" 
                  + LdapErrorsToStr(aMsg.errorCode) + "\n"
                  + aMsg.errorMessage );
          }
      }
       if ( modquerycount < querymods.length ) {
          dump( querymods[modquerycount].dn + " "
              + querymods[modquerycount].mods+ "\n");
       
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
        
//        try{
//          var objclassexists = aMsg.getValues("objectClass", {});
//          var objclassneeded = pref.objClasses.replace(/\s*/g, '').split(",");
//          var objclassestmp;

          //mods.appendElement( CreateLDAPMod( "objectClass", pref.objClasses.replace(/\s*/g, '').split(","), Components.interfaces.nsILDAPModification.MOD_ADD | Components.interfaces.nsILDAPModification.MOD_BVALUES ), false );        
          //mods.appendElement( CreateLDAPMod( "objectClass", pref.objClasses.replace(/\s*/g, '').split(","), Components.interfaces.nsILDAPModification.MOD_ADD | Components.interfaces.nsILDAPModification.MOD_BVALUES ), false );
//        }catch(e){
//          dumperrors("Errors: " + e + "\n");
//        }
        mappertoldap.map(card, mods, oldcard);

        if (mods.length >0){             
          try { 
            ldap.modify (queryURL, pref.binddn, getpassword, 
                         genmodquery( [ { dn: aMsg.dn, mods: mods} ] ) ); 
          } catch (e) {
            dumperrors("Error: " + e+ "\n"); 
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
  attrs[attrs.length]="objectClass";
  for (var i in mapper.__proto__) { 
    attrs[attrs.length] = i; 
  };
  
  ldap.init(attrs);

  try {
    queryURL.filter = "(objectclass=inetorgperson)"
//    ldap.query(queryURL, binddn, "(objectclass=inetorgperson)", getpassword, getsearchquery, callbacksearchresult );
    ldap.query(queryURL, pref.binddn, getpassword, gengetsearchquery(), callbacksearchresult );
  } catch (e) {
    dumperrors ("Error: " + e + "\n" );
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
          alert("Error: addquery " + aMsg.errorCode + "\n" 
                  + LdapErrorsToStr(aMsg.errorCode) + "\n"
                  + aMsg.errorMessage );
          
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
      mods.appendElement( CreateLDAPMod( "objectClass", pref.objClasses.replace(/\s*/g, '').split(","), Components.interfaces.nsILDAPModification.MOD_ADD | Components.interfaces.nsILDAPModification.MOD_BVALUES ), false );
      
      mappertoldap.map(card, mods, oldcard);

      card.setProperty("dn", dn);
      
      try {
        ldap.add(queryURL, pref.binddn, getpassword, genaddquery(card, [{dn: dn, mods: mods}]) );  
      } catch(e) {
        dumperrors("Error: " + e+"\n");
      }
      
    }
}

function addcardfromldap(book, aMsg, replace){
//  var abManager = Components.classes["@mozilla.org/abmanager;1"].getService(Components.interfaces.nsIAbManager);
//  var book = abManager.getDirectory( "moz-abmdbdirectory://" + pref.filename );
 
  var mapper = new LdaptoAB();
  var card = book.getCardFromProperty("dn", aMsg.dn, false);
  if ( card == undefined ) {
    var card = Components.classes["@mozilla.org/addressbook/cardproperty;1"].createInstance(Components.interfaces.nsIAbCard); 


    mapper.map(aMsg, card);

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

