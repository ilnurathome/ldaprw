function debugsync(str){
  //dump("sync.js: " + str);
}

function dumperrors(str){
       dump(str+ "\n");
       alert(str);
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


function gengetpassword(uri) {
  var counter=0;
  var queryURL = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(uri, null, null).QueryInterface(Components.interfaces.nsILDAPURL);

  function pwdret(type, val){ 
    this.type =type; 
    this.val = val; 
  }
  pwdret.prototype = {
    classDescription: "Pwd object",
    type: -1,
    value: "",

  }

  return function getpassword(aMsg) {
      debugsync("getpassword "+ counter + "\n");
      if (aMsg != undefined){  
        debugsync("getpassword " + counter + "\t" + aMsg.errorCode + "\t" + LdapErrorsToStr(aMsg.errorCode) +"\n");
        try{
          var passwordManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
          var logins = passwordManager.findLogins( {}, queryURL.prePath, null, uri); 
          if (logins.length>0) {
            passwordManager.removeLogin(logins[0])
              dump("old login removed");
          }
        }catch(e){
          dumperrors("getpassword:" + e + "\n");
        }
        counter++;
        debugsync("getpassword counter changed"+ counter + "\n");
        if (counter > 2) return false;
        return true;
      }

      try{
        var pw = { value: ""};
        var authprompter = Components.classes["@mozilla.org/login-manager/prompter;1"] 
                            .getService(Components.interfaces.nsIAuthPrompt);
        var res = authprompter.promptPassword("Ldap Server Password Need", "Ldap Server Password Request\n" + uri , uri, Components.interfaces.nsIAuthPrompt.SAVE_PASSWORD_PERMANENTLY, pw);
        if (!res) {
          counter = 3;
        }
      }catch(e){
        dumperrors("getpassword: "+e);
      }      
      return pw.value;
   }
}



/*
 * Experimental func
 * 
 */
function syncpolitic2(pref){
//  var mainThread = Components.classes["@mozilla.org/thread-manager;1"].getService().mainThread;

  var mybook = pref.book;

  var queryURL = pref.queryURL;

  var mapper = new LdaptoAB();
  var mappertoldap = new ABtoLdap();

  var newcards = new Array();  

  function genmodquery(querymods) {
    var modquerycount = 0;
    return function modquery(aMsg) {
      debugsync("modquery " + modquerycount + "\n");
     if (aMsg != undefined ){
          debugsync("modquery aMsg= " + aMsg.errorCode + "\n");
          if(aMsg.errorCode != Components.interfaces.nsILDAPErrors.SUCCESS ){
            dumperrors("Error: modquery " + aMsg.errorCode + "\n" 
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
        
        mappertoldap.map(card, mods, oldcard);

        if (mods.length >0){             
          try { 
            ldap.modify (queryURL, pref.binddn, gengetpassword(pref.uri), 
                         genmodquery( [ { dn: aMsg.dn, mods: mods} ] ) ); 
          } catch (e) {
            dumperrors("Error: " + e+ "\n"); 
          }    
        }else{
          debugsync("modify card in LDAP nothing to modify\n");
        }

      }
    }
    
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
            var filter = "(objectclass=inetorgperson)";
            if ( dn ){
              return {dn: dn, filter: filter};
            } else {
              debugsync("iteration new card new dn\n");
              newcardtoldap(currentcard);
           }
          }
        }
        debugsync("iteration nothing to do\n")
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
            } else {
              dumperrors (aMsg.type + "\n" + aMsg.errorCode + "\t" + LdapErrorsToStr(aMsg.errorCode) + "\n" + aMsg.errorMessage);
            }
        }
      debugsync("getsearchquery nothing to do\n");
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
  //  queryURL.filter = "(objectclass=inetorgperson)"
    ldap.query(queryURL, pref.binddn, gengetpassword(pref.uri), gengetsearchquery(), callbacksearchresult );
  } catch (e) {
    dumperrors ("Error: " + e + "\n" );
  }

}

function genaddtoldap(pref, ldapser) {


  var mybook = pref.book;
  var queryURL = pref.queryURL;

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
          dumperrors("Error: addquery " + aMsg.errorCode + "\n" 
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
      mods.appendElement( CreateLDAPMod( "objectClass", pref.objClassesAR, Components.interfaces.nsILDAPModification.MOD_ADD | Components.interfaces.nsILDAPModification.MOD_BVALUES ), false );
      
      mappertoldap.map(card, mods, oldcard);

      card.setProperty("dn", dn);
      
      try {
        ldap.add(queryURL, pref.binddn, gengetpassword(pref.uri), genaddquery(card, [{dn: dn, mods: mods}]) );  
      } catch(e) {
        dumperrors("Error: " + e+"\n");
      }
      
    }
}

function addcardfromldap(book, aMsg, replace){
 
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

