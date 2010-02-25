
/*
load("chrome://ldaprw/content/abtoldap.js"); 
load("chrome://ldaprw/content/ldaptoab.js"); 
load("chrome://ldaprw/content/ldaprw_ab.js");
load("chrome://ldaprw/content/overlay.js");
load("chrome://ldaprw/content/sync.js");
load("chrome://ldaprw/content/prefs.js");
*/



function ldapsync() {
  var prefs = getprefs();
  for ( var i in prefs) {
    getAbCardsFromLdap(prefs[i]);
  }
}

function getAbCardsFromLdap(pref) {

//  var url = "ldap://ilnurhp.local/ou=addressbook,dc=local??sub?(objectclass=*)";
//  var binddn = "uid=ilnur,ou=people,dc=local";

    var binddn = pref.binddn;
    var uri = pref.uri;
    var filename = pref.filename;
    var queryURL = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(uri, null, null).QueryInterface(Components.interfaces.nsILDAPURL);
    function getpassword() {
      var passwordManager = Components.classes["@mozilla.org/login-manager;1"].
                         getService(Components.interfaces.nsILoginManager);
      var logins = passwordManager.findLogins( {}, queryURL.prePath, null, queryURL.spec); 
      return logins[0].password;
    };
//  var ldap = Components.classes["@ilnurathome.dyndns.org/LdapDataSource;1"].
//                createInstance(Components.interfaces.nsILdapDataSource);
  var mainThread = Components.classes["@mozilla.org/thread-manager;1"].getService().mainThread;

  var ldapcards = new Array();
  var ldapABcards = new Array();
  var mapper = new LdaptoAB();
  var mappertoldap = new ABtoLdap();


  function callbacksearchresult(aMsg) {
    //dump("callbacksearchresultcallbacksearchresultcallbacksearchresultcallbacksearchresult" + aMsg + "\n");
    ldapcards[ldapcards.length] = aMsg;
    var card = Components.classes["@mozilla.org/addressbook/cardproperty;1"]  
                       .createInstance(Components.interfaces.nsIAbCard);
    mapper.map(aMsg, card);
    ldapABcards[ldapABcards.length] = card;
  };

  var abManager = Components.classes["@mozilla.org/abmanager;1"].getService(Components.interfaces.nsIAbManager);
//  var mybook = abManager.getDirectory("moz-abmdbdirectory://abook-3.mab");
  var mybook = abManager.getDirectory( "moz-abmdbdirectory://" + filename );

  var modcards = new Array();
  var querydn = new Array();
  var newcards = new Array();
  var allcards = mybook.childCards;

  while (allcards.hasMoreElements()) {
    var c = allcards.getNext();
    if ( c instanceof Components.interfaces.nsIAbCard) {
      var dn = c.getProperty("dn", null);
      dump("c=" + c.lastName + " " + dn + "\n");
      if (dn == null) {
        newcards[newcards.length]=c;
      } else {
        modcards[modcards.length]=c;
        querydn[querydn.length] = dn;
      }
    }
  }

  var ldap = new LdapDataSource();
  var attrs = new Array(); 
  for (i in mapper.__proto__) { 
    attrs[attrs.length] = i; 
  };
  ldap.init(attrs);
  try {
    //queryURL.filter = "(objectclass=inetorgperson)"
    ldap.query(queryURL, binddn, "(objectclass=inetorgperson)", getpassword, [queryURL.dn], callbacksearchresult );
    //ldap.query(queryURL, binddn, "(objectclass=inetorgperson)", getpassword, querydn, callbacksearchresult );
  } catch (e) {
    dump ("Error: " + e + "\n" );
  }

  dump ("finished? " + ldap.mFinished + "\n");
  while(!ldap.mFinished) {
    dump ("+" );
    mainThread.processNextEvent(true);
  }
  dump("\ncomplete\n");

  var ar = ldap.getMessagesEntry({});
  for ( a in ar ) {
    dump(a + " : " + ar[a].dn + "\n"); 
    dump("\t" + ar[a].getAttributes({}) + "\n" );
  }



  /*
  var card = Components.classes["@mozilla.org/addressbook/cardproperty;1"]  
                       .createInstance(Components.interfaces.nsIAbCard);
  */

  var querymods = new Array();
//  for (i in ar) {
  dump("ar.length=" + ar.length +"\n");
  for (var i=0; i<ar.length; i++) {
    dump("\nIteration " + i + "\n");
    var d = ar[i].getValues ("modifytimestamp", {}).toString();
    var ldapdate = new Date ( Date.UTC (d.substring(0,4), d.substring(4,6) - 1, d.substring(6,8), d.substring(8,10), d.substring(10,12), d.substring(12,14) ) );
    var card = mybook.getCardFromProperty("dn", ar[i].dn, false);
    if ( card == undefined ) {
      var card = Components.classes["@mozilla.org/addressbook/cardproperty;1"] 
                           .createInstance(Components.interfaces.nsIAbCard); 
      mapper.map(ar[i], card);
      card.setProperty("LastLDAPLoadDate", (new Date()).getTime() );
      card.setProperty("LastLDAPModifyDate", ldapdate.getTime() );
      dump("new card from LDAP "+ i +" " + ar[i].dn +"\n");
      var newcard= mybook.addCard(card);
    } else {
      var carddate = new Date();
      var carddatestr = card.getProperty("LastModifiedDate", "");
      if ( carddatestr == 0 ) 
        carddatestr = (new Date()).getTime().toString().substring(0,10);
      carddate.setTime( carddatestr + "000");
      dump("card exists " + ldapdate.getTime() + " " +carddate.getTime()+ "\n");

      if ( ldapdate.getTime() != carddate.getTime() ){
        if (ldapdate.getTime() > carddate.getTime()) {
          mapper.map(ar[i], card);
          dump("modify card in Book "+ i +" " + ar[i].dn + "\n");
          var newcard= mybook.modifyCard(card);
        } else {
          var mods = CreateNSMutArray();
          dump("modify card in LDAP "+ i +" " + ar[i].dn + "\n");
          var query = {dn: ar[i].dn, mods: mods};
          var oldcard = Components.classes["@mozilla.org/addressbook/cardproperty;1"].createInstance(Components.interfaces.nsIAbCard); 
          
          mapper.map(ar[i], oldcard);

          mappertoldap.map(card, mods, oldcard);
          if ( query.mods.length >0){
            querymods[querymods.length] = query;
            dump("modify card in LDAP "+ i +" " + ar[i].dn + "\n");
          }else{
            dump("nothing to modify\n");
          }
        }
      }
    }
  }

  if (querymods.length > 0) {
    try { 
      ldap.modify(queryURL, binddn, getpassword, querymods ); 
    } catch (e) {
      dump("Error: " + e+ "\n"); 
    }
  }

  var mappertoldap= new ABtoLdap();
  var addqueries = new Array();
  for ( card in newcards) {
    var oldcard = Components.classes["@mozilla.org/addressbook/cardproperty;1"] .createInstance(Components.interfaces.nsIAbCard);
    var mods = CreateNSMutArray();
    var dn = generateDN(newcards[card]); //"uid=ldapsync,ou=addressbook,dc=local";
    dn = "uid=" + dn + "," + queryURL.dn;
    mappertoldap.map(newcards[card], mods, oldcard);
    dump("dn = " + dn + "\n");
    addqueries[addqueries.length] = {dn: dn, mods: mods};

    newcards[card].setProperty("dn", dn);
    var newcard= mybook.modifyCard(newcards[card]);
 // query.mods.appendElement( CreateLDAPMod( "objectClass", ["top", "person", "inetorgperson" ] ), false );
  }
  
    try { 
      ldap.add(queryURL, binddn, getpassword, addqueries ); 
    } catch (e) {
      dump("Error: " + e+ "\n"); 
    }
  }

function generateDN(card){
  return card.firstName + card.lastName ;
}


