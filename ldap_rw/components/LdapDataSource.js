Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function getService(aContract, aInterface) {
  return Components.classes[aContract].getService(Components.interfaces[aInterface]);
}

function createInstance(aContract, aInterface) {
  return Components.classes[aContract].createInstance(Components.interfaces[aInterface]);
}


function getProxyThread(aObject, aInterface) {

  var mainThread;

  mainThread = Components.classes["@mozilla.org/thread-manager;1"].getService().mainThread;
  
  var proxyMgr = Components.classes["@mozilla.org/xpcomproxy;1"].getService(
                                  Components.interfaces.nsIProxyObjectManager);

//    dump("about to get proxy\n");
   
  return proxyMgr.getProxyForObject(mainThread, aInterface, aObject, 6);
    // 5 == PROXY_ALWAYS | PROXY_SYNC
}

/*
 * class definition
 */

//class constructor
function LdapDataSource() {}

//class definition
LdapDataSource.prototype = {

  // properties required for XPCOM registration:
  classDescription: "My LdapDataSource XPCOM Component",
  classID:          Components.ID("bb9bd3e8-11ec-4dae-9a38-c0278420e092"),
  contractID:       "@ilnurathome.dyndns.org/LdapDataSource;1",
  _xpcom_categories: [{ category: "app-startup", service: true }],


  QueryInterface:   XPCOMUtils.generateQI([Components.interfaces.nsILdapDataSource]),
  //QueryInterface:   XPCOMUtils.generateQI(),
  mIOSvc: {},
  mLDAPSvc: {},
  mLDAPDataSource: {},

  mConnection: {},
  mOperationBind: {},
  mOperationSearch: {},
  mMessages: new Array(),
  mMessagesEntry: new Array(),

  mBinded:   0,
  mFinished: 0,

  kInited: -1,

  /*function (iid) {
       if (iid.equals(Components.interfaces.nsISupports) return this;
       throw Components.results.NS_ERROR_NO_INTERFACE;
  },*/
  getMessages: function (count) {
      count.value = this.mMessages.length;
      return this.mMessages;
  },
  getMessagesEntry: function (count) {
      count.value = this.mMessagesEntry.length;
      return this.mMessagesEntry;
  },

  getMessagesEntryIndexBy: function(index) {
      return this.mMessagesEntry[index];
  },
  getMessageEntryLength: function() {
      return this.mMessagesEntry.length;
  },

// ************** INIT *****************
  init: function() {
      if (this.kInited == -1 ){
          this.mIOSvc = Components.classes["@mozilla.org/network/io-service;1"]
                                  .getService(Components.interfaces.nsIIOService)
      this.mLDAPSvc = Components.classes["@mozilla.org/network/ldap-service;1"]
                                  .getService(Components.interfaces.nsILDAPService);
      }
      this.kInited = 0;
      this.mStatus = 0;
  },


  generateGetTargetsBoundCallback: function (caller, queryURL, password, queryes){

            ////////////////////////////////////////////
            function getTargetsBoundCallback () {}
            getTargetsBoundCallback.prototype = { 
              QueryInterface: function QI(iid) {
                                if (iid.equals(Components.interfaces.nsISupports) ||
                                    iid.equals(Components.interfaces.nsILDAPMessageListener))
                                  return this;
                                
                                throw Components.results.NS_ERROR_NO_INTERFACE;
                              },

              onLDAPMessage: function (aMsg) {
//                               dump("Create.generateGetTargetsBoundCallback.getTargetsBoundCallback: " + aMsg.type + "\n");
                               if (aMsg.type != aMsg.RES_BIND) {
                                 dump("bind failed\n");
                                 return;
                               }

                               caller.mBinded = 1;
                               caller.mFinished = 0;

                               caller.mOperationSearch = Components.classes["@mozilla.org/network/ldap-operation;1"].createInstance(Components.interfaces.nsILDAPOperation);
                               try {
                                 caller.mOperationSearch.init(caller.mConnection, caller.generateGetTargetsSearchCallback(caller, queryes), null);
                                 if (!( queryes == undefined )) {
                                   dump("Queryes:  " + queryes + "\n");
                                   if ( queryes instanceof Array ){
                                     caller.mOperationSearch.searchExt(queryes[caller.mFinished], queryURL.scope, queryURL.filter, 0, new Array(), 0, -1);
                                   }
                                 } else {
                                   caller.mOperationSearch.searchExt(queryURL.dn, queryURL.scope, queryURL.filter, 0, new Array(), 0, -1);
                                 }
                               } catch (e) {
                                 dump("init error: " + e + "\n");
                                 return
                               }

                             },

              onLDAPInit: function(aConn, aStatus) {
//                            dump("Create.generateGetTargetsBoundCallback.getTargetsBoundCallback.onLDAPInit: " + aStatus + " " + password + "\n");
                            
                            if (!Components.isSuccessCode(aStatus)) {
//                              dump("Create.generateGetTargetsBoundCallback.getTargetsBoundCallback.onLDAPInit: Error\n" );
                              throw aStatus;
                            }
                            

                            caller.mOperationBind = Components.classes["@mozilla.org/network/ldap-operation;1"].createInstance(Components.interfaces.nsILDAPOperation);
                            dump ("init oper\n");
                            try {
                              caller.mOperationBind.init(caller.mConnection, getProxyThread(this, Components.interfaces.nsILDAPMessageListener), null);
//                              dump("caller.mOperationBind");
//                              dump(caller.mOperationBind);
//                              dump("\n");
//                              dump(caller.mOperationBind.connection);
                              caller.mOperationBind.simpleBind(password);                                   } catch (e) {
                              dump("init error: " + e + "\n");
                              return
                            }
                            dump ("created operation\n");
                            return;
                          }
            }
            return getProxyThread(new getTargetsBoundCallback(), Components.interfaces.nsILDAPMessageListener);
          },
          

          //////////////////////////////////////////////////////
  generateGetTargetsSearchCallback:   function (caller, queryes) {
            function getTargetsSearchCallback() {

            }
            
            getTargetsSearchCallback.prototype = {
              QueryInterface: function(iid) {
                  if (iid.equals(Components.interfaces.nsISupports) ||
                      iid.equals(Components.interfaces.nsILDAPMessageListener))
                    return this;
                
                  throw Components.results.NS_ERROR_NO_INTERFACE;
                },
              
              onLDAPMessage: function (aMsg) {
//                dump("Create.generateGetTargetsSearchCallback.getTargetsSearchCallback: " + aMsg.type + "\n");
                caller.mMessages[caller.mMessages.length] = aMsg;
                if (aMsg.type == aMsg.RES_SEARCH_ENTRY) {
                  caller.mMessagesEntry[caller.mMessagesEntry.length] = aMsg;
                  caller.mMessagesEntry[aMsg.dn] = aMsg;
                }
                else if (aMsg.type == aMsg.RES_SEARCH_RESULT) { 
//                  dump("search complete");
                  caller.mFinished = caller.mFinished +1;
//                  delete caller.mOperationBind;
                    delete caller.mOperationSearch;
//                  delete caller.mConnection;
//                  caller.mOperationSearch.abandonExt();

                    caller.mOperationSearch = Components.classes["@mozilla.org/network/ldap-operation;1"].createInstance(Components.interfaces.nsILDAPOperation);
                    try {
                      caller.mOperationSearch.init(caller.mConnection, caller.generateGetTargetsSearchCallback(caller), null);
                      if (!( queryes == undefined )) {
                        if ( queryes instanceof Array ){
                          caller.mOperationSearch.searchExt(queryes[caller.mFinished], queryURL.scope, queryURL.filter, 0, new Array(), 0, -1);
                        }
                      }
                    } catch (e) {
                      dump("init error: " + e + "\n");
                      return
                    }
                }
              }
            }

              return getProxyThread(new getTargetsSearchCallback(), Components.interfaces.nsILDAPMessageListener);
            },



// ************** CREATE ***************
//  query: function (aLdapUri, aBindName, password) {
  query: function (queryURL, aBindName, password, queryes) {
            var caller = this;
//            var queryURL;

            if (queryURL == undefined ) {
              throw Error("queryURL is undefined");
              return;
            }

//            dump ( "Create: " + aLdapUri + " " + aBindName + " " + password + "\n");
//            if (queryURL == null) {
//              queryURL = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(aLdapUri, null, null).QueryInterface(Components.interfaces.nsILDAPURL);
//            }
//            dump ( queryURL.host + "\n" );
//            dump ( queryURL.dn + "\n" );
//            dump ( queryURL.scope + "\n" );
//            dump ( queryURL.filter + "\n" );
            

            this.mConnection =  Components.classes["@mozilla.org/network/ldap-connection;1"].createInstance().QueryInterface(Components.interfaces.nsILDAPConnection);

            try {
              this.mConnection.init(queryURL, aBindName, this.generateGetTargetsBoundCallback(caller, queryURL, password, queryes), null, Components.interfaces.nsILDAPConnection.VERSION3 );
            } catch (e) {
              dump ("Error:" + e + "\n");
            }
          } 
}

var components = [LdapDataSource];

var NSGetModule = XPCOMUtils.generateNSGetModule(components);

/*
var ldapmodif = Components.classes["@mozilla.org/network/ldap-modification;1"].createInstance(Components.interfaces.nsILDAPModification);

 */

function getprefs(){
  var list = new Array();
  
  var prefs = Components.classes["@mozilla.org/preferences-service;1"] .getService(Components.interfaces.nsIPrefService);

  var myprefs = prefs.getBranch("extensions.ldaprw.ldap_2.servers.");

  var count = { value: 0 };  
  var mychilds = myprefs.getChildList("", count);
  if (mychilds instanceof Array) {
    for (var c in mychilds){
      var key = mychilds[c].split('.')[0];
      if ( list[key] == undefined ) {
        list[key] = {};
        var abprefs = prefs.getBranch("ldap_2.servers." + key + ".");
        list[key].binddn = myprefs.getCharPref(key + ".auth.dn");
        list[key].uri = myprefs.getCharPref(key + ".uri");

        list[key].description = abprefs.getCharPref("description");
        list[key].dirType = abprefs.getIntPref("dirType");
        list[key].filename = abprefs.getCharPref("filename");
      }
    }
  }
  return list;
}

function getpasswd(hostname, formSubmitURL, httprealm){
  // hostname  = "ldap://ilnurhp.local";
  // formSubmitURL = null;
  // httprealm = "ldap://ilnurhp.local/dc=local??sub?(objectclass=*)";
  var passwordManager = Components.classes["@mozilla.org/login-manager;1"].
                         getService(Components.interfaces.nsILoginManager);
  var logins = passwordManager.findLogins({}, hostname, formSubmitURL, httprealm );
  return logins.password;
}

function setpref() {
  var prefs = Components.classes["@mozilla.org/preferences-service;1"] .getService(Components.interfaces.nsIPrefService);
  prefs = prefs.getBranch("extensions.ldaprw.");
  prefs.setCharPref("ldap_2.servers.ldapsync.auth.dn", "uid=ilnur,ou=people,dc=local");
  prefs.setCharPref("ldap_2.servers.ldapsync.uri", "ldap://ilnurhp.local/ou=addressbook,dc=local??sub?(|(objectClass=person)(objectClass=inetOrgPerson))");
  prefs.setCharPref("ldap_2.servers.ldapsync.uri", "ldap://ilnurhp.local/ou=addressbook,dc=local??sub?(objectClass=*)");
}

function sync() {
  var list = getprefs();
  for ( var i in list) {
    getAbCardsFromLdap(list[i]);
  }
}

function getAbCardsFromLdap(pref) {

//  var url = "ldap://ilnurhp.local/ou=addressbook,dc=local??sub?(objectclass=*)";
//  var binddn = "uid=ilnur,ou=people,dc=local";

    var binddn = pref.binddn;
    var uri = pref.uri;
    var filename = pref.filename;
    var queryURL = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(uri, null, null).QueryInterface(Components.interfaces.nsILDAPURL);
    var logins = passwordManager.findLogins( {}, queryURL.prePath, null, queryURL.spec); 

  var ldap = new LdapDataSource();
//  var ldap = Components.classes["@ilnurathome.dyndns.org/LdapDataSource;1"].
//                createInstance(Components.interfaces.nsILdapDataSource);
  var mainThread = Components.classes["@mozilla.org/thread-manager;1"].getService().mainThread;

  ldap.init();
  try {
    ldap.query(queryURL, binddn, logins[0].password);
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


  var abManager = Components.classes["@mozilla.org/abmanager;1"].getService(Components.interfaces.nsIAbManager);
//  var mybook = abManager.getDirectory("moz-abmdbdirectory://abook-3.mab");
  var mybook = abManager.getDirectory( "moz-abmdbdirectory://" + filename );

  var card = Components.classes["@mozilla.org/addressbook/cardproperty;1"]  
                       .createInstance(Components.interfaces.nsIAbCard);


  var mapper = new LdaptoAB();
  
  for (i in ar) {
    var card = mybook.getCardFromProperty("dn", ar[i].dn, false);
    if ( card == undefined ) {
      var card = Components.classes["@mozilla.org/addressbook/cardproperty;1"] 
                           .createInstance(Components.interfaces.nsIAbCard); 
      mapper.map(ar[i], card);
      dump("new card\n");
      var newcard= mybook.addCard(card);
    } else {
      mapper.map(ar[i], card);
      dump("modify card\n");
      var newcard= mybook.modifyCard(card);
    }
  }

  write ( ar[47].dn + '.jpg', ar[47].getBinaryValues("jpegPhoto",{})[0].get({}) );

}

