function debugldaprw_ab(str){
  dump("ldaprw_ab.js: " + str);
}


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

//    debugldaprw_ab("about to get proxy\n");
   
  return proxyMgr.getProxyForObject(mainThread, aInterface, aObject, 6);
    // 5 == PROXY_ALWAYS | PROXY_SYNC
}

/*
 * Need to change generateGetTargetsBoundCallback and generateGetTargetsQueryCallback to single
 * generator function generateGetTargetsCallback (onLDAPInit, onLDAPMessage){ function getTargetsCallback() {}; getTargetsCallback.prototype = {}; }
 */

function generateGetTargetsCallback (onLDAPInit, onLDAPMessage) {
  function getTargetsCallback () {};
  getTargetsCallback.prototype = {
       QueryInterface: function QI(iid) {
          if (iid.equals(Components.interfaces.nsISupports) ||
              iid.equals(Components.interfaces.nsILDAPMessageListener))
            return this;
          
          throw Components.results.NS_ERROR_NO_INTERFACE;
          },
       onLDAPInit: onLDAPInit,
       onLDAPMessage: onLDAPMessage
  }
  return getProxyThread( new getTargetsCallback(),
                         Components.interfaces.nsILDAPMessageListener );
}


/*
 * class definition
 */

//class constructor
function LdapDataSource() {
}

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

  kAttributes: new Array(),

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
  }
};

// ************** INIT *****************
LdapDataSource.prototype.init = function(attrs) {
      if (this.kInited == -1 ){
          this.mIOSvc = Components.classes["@mozilla.org/network/io-service;1"]
                                  .getService(Components.interfaces.nsIIOService)
      this.mLDAPSvc = Components.classes["@mozilla.org/network/ldap-service;1"]
                                  .getService(Components.interfaces.nsILDAPService);
      }
      this.kInited = 0;
      this.mStatus = 0;
      if ( !(attrs == undefined) ) this.kAttributes = attrs;
   
      this.mConnection = {};
      this.mOperationBind = Components.classes["@mozilla.org/network/ldap-operation;1"].createInstance(Components.interfaces.nsILDAPOperation);
      this.mOperationSearch = {};
      this.mMessages = new Array();
      this.mMessagesEntry = new Array();

      this.mBinded =   0;
      this.mFinished = 0;
      
};


LdapDataSource.prototype.generateGetTargetsBoundCallback = function (caller, queryURL, getpassword, metod ){  
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
                     //debugldaprw_ab("Create.generateGetTargetsBoundCallback.getTargetsBoundCallback: " + aMsg.type + "\n");
                     if (aMsg.type != aMsg.RES_BIND) {
                       debugldaprw_ab("bind failed\n");
                       throw Error("Bind failed");
                       return;
                     }
                     
                     caller.mBinded = 0;

                     if (aMsg.errorCode == Components.interfaces.nsILDAPErrors.SUCCESS )  {
                       debugldaprw_ab("binded\n");
                       caller.mBinded = 1;
                     }                     
                       caller.mFinished = 0;
                       //debugldaprw_ab("metod=" + metod +"\n");
                       metod(aMsg);
                   },

    onLDAPInit: function(aConn, aStatus) {
                  //debugldaprw_ab("Create.generateGetTargetsBoundCallback.getTargetsBoundCallback.onLDAPInit: " + aStatus + " " + password + "\n");
                  if (!Components.isSuccessCode(aStatus)) {
                    //debugldaprw_ab("Create.generateGetTargetsBoundCallback.getTargetsBoundCallback.onLDAPInit: Error\n" );
                    throw aStatus;
                  }

                  //caller.mOperationBind = Components.classes["@mozilla.org/network/ldap-operation;1"].createInstance(Components.interfaces.nsILDAPOperation);
                  debugldaprw_ab ("init oper\n");
                  try {
                    caller.mOperationBind.init(caller.mConnection, 
                         caller.generateGetTargetsBoundCallback(caller, queryURL, getpassword, metod),
                        null);
//                              debugldaprw_ab("caller.mOperationBind");
//                              debugldaprw_ab(caller.mOperationBind);
//                              debugldaprw_ab("\n");
//                              debugldaprw_ab(caller.mOperationBind.connection);
                              
                    caller.mOperationBind.simpleBind(getpassword());                                   
                  } catch (e) {
                      debugldaprw_ab("init error: " + e + "\n");
                      alert("init error: " + e + "\n");
                      return
                  }
                  debugldaprw_ab ("created operation\n");
                  return;
                }
            }
            return getProxyThread(new getTargetsBoundCallback(), Components.interfaces.nsILDAPMessageListener);
};
          

          //////////////////////////////////////////////////////
LdapDataSource.prototype.generateGetTargetsQueryCallback = function (caller, metod, callbackresult) {
            function getTargetsQueryCallback() {

            }
            
            getTargetsQueryCallback.prototype = {
              QueryInterface: function(iid) {
                  if (iid.equals(Components.interfaces.nsISupports) ||
                      iid.equals(Components.interfaces.nsILDAPMessageListener))
                    return this;
                
                  throw Components.results.NS_ERROR_NO_INTERFACE;
                },
              
              onLDAPMessage: function (aMsg) {
                caller.mMessages[caller.mMessages.length] = aMsg;
                if ( aMsg.type == aMsg.RES_SEARCH_ENTRY ){
                    caller.mMessagesEntry[caller.mMessagesEntry.length] = aMsg;
                    caller.mMessagesEntry[aMsg.dn] = aMsg;
                
                    if ( !(callbackresult == undefined)) callbackresult(aMsg);
                }
                                
                caller.mFinished++;
                if ( !(metod == undefined)) metod(aMsg);
              }
            }

              return getProxyThread(new getTargetsQueryCallback(), Components.interfaces.nsILDAPMessageListener);
            },



// ************** CREATE ***************
//  query: function (aLdapUri, aBindName, password) {
LdapDataSource.prototype.query = function (queryURL, aBindName, getpassword, getquery, callback) {

           /*
            *
            */
        //   function createcallmetod(queryes) {
            // return function(){
            function callmetod(aMsg) {
//               debugldaprw_ab("callmetod query\t" + getquery + "\n");
               if (!( getquery == undefined )) {
                 var query = getquery(aMsg);
                 if ( query ){
                   caller.mOperationSearch = Components.classes["@mozilla.org/network/ldap-operation;1"].createInstance(Components.interfaces.nsILDAPOperation);
                   try {
                     caller.mOperationSearch.init(caller.mConnection, caller.generateGetTargetsQueryCallback(caller, callmetod, callback), null);
                     //mOperationSearch.searchExt(queryes[mFinished], queryURL.scope, filter, caller.kAttributes.length, caller.kAttributes, 0, -1);
                     caller.mOperationSearch.searchExt(query, queryURL.scope, queryURL.filter, caller.kAttributes.length, caller.kAttributes, 0, -1);
                   } catch (e) {
                     debugldaprw_ab("init error: " + e + "\n");
                     return;
                   }
                 }
               }
               return;
             }
//           }

           var caller = this;
//            var queryURL;
 
           if (caller.mBinded ){
              debugldaprw_ab("Already binded\n");
              callmetod();
              return;
            }

            if (queryURL == undefined ) {
              throw Error("queryURL is undefined");
              return;
            }         
           
            
            caller.mConnection =  Components.classes["@mozilla.org/network/ldap-connection;1"].createInstance().QueryInterface(Components.interfaces.nsILDAPConnection);

            try {
              caller.mConnection.init(queryURL, aBindName, caller.generateGetTargetsBoundCallback(caller, queryURL, getpassword, callmetod), null, Components.interfaces.nsILDAPConnection.VERSION3 );
            } catch (e) {
              debugldaprw_ab ("Error:" + e + "\n");
            }
};



LdapDataSource.prototype.add = function (queryURL, aBindName, getpassword, getquery, callback) {

           /*
            *
            */
           function callmetod(aMsg) {
//             debugldaprw_ab("callmetod add = "+ mFinished + "\t" + queryes + "\n");
             if (!( getquery == undefined )) {
               var query = getquery(aMsg);
               if ( query ){
                 var mOperationSearch = Components.classes["@mozilla.org/network/ldap-operation;1"]
                   .createInstance(Components.interfaces.nsILDAPOperation);
                 try {
                   mOperationSearch.init(caller.mConnection, caller.generateGetTargetsQueryCallback(caller, callmetod, callback), null);
                   mOperationSearch.addExt(query.dn, query.mods);
                 } catch (e) {
                   debugldaprw_ab("init error: " + e + "\n");
                   return;
                 }
               }
             }
             return;  
           }

           var caller = this;
//            var queryURL;
           
            if (caller.mBinded ){
              debugldaprw_ab("Already binded\n");
              callmetod();
              return;
            }
       
            if (queryURL == undefined ) {
              throw Error("queryURL is undefined");
              return;
            }         
           
     

            this.mConnection =  Components.classes["@mozilla.org/network/ldap-connection;1"].createInstance().QueryInterface(Components.interfaces.nsILDAPConnection);

            try {
              this.mConnection.init(queryURL, aBindName, this.generateGetTargetsBoundCallback(caller, queryURL, getpassword, callmetod), null, Components.interfaces.nsILDAPConnection.VERSION3 );
            } catch (e) {
              debugldaprw_ab ("Error:" + e + "\n");
            }
};



LdapDataSource.prototype.modify = function (queryURL, aBindName, getpassword, getquery, callback) {

           /*
            *
            */
            function callmetod(aMsg){
               if (!( getquery == undefined )) {
                 var query = getquery(aMsg);
                 if ( query ){
                   var mOperationSearch = Components.classes["@mozilla.org/network/ldap-operation;1"]
                                             .createInstance(Components.interfaces.nsILDAPOperation);
                   try {
                     mOperationSearch.init(caller.mConnection, caller.generateGetTargetsQueryCallback(caller, callmetod), null);
                     mOperationSearch.modifyExt(query.dn, query.mods);
                   } catch (e) {
                     debugldaprw_ab("init error: " + e + "\n");
                     return;
                   }
                 }
               }
               return;
             
           }

           var caller = this;
//            var queryURL;


            if (caller.mBinded ){
              debugldaprw_ab("Already binded\n");
              callmetod();
              return;
            }
            
            if (queryURL == undefined ) {
              throw Error("queryURL is undefined");
              return;
            }         
           
            this.mConnection =  Components.classes["@mozilla.org/network/ldap-connection;1"].createInstance().QueryInterface(Components.interfaces.nsILDAPConnection);

            try {
              this.mConnection.init(queryURL, aBindName, this.generateGetTargetsBoundCallback(caller, queryURL, getpassword, callmetod), null, Components.interfaces.nsILDAPConnection.VERSION3 );
            } catch (e) {
              debugldaprw_ab ("Error:" + e + "\n");
            }
};

var components = [LdapDataSource];

var NSGetModule = XPCOMUtils.generateNSGetModule(components);


/*
var ldapmodif = Components.classes["@mozilla.org/network/ldap-modification;1"].createInstance(Components.interfaces.nsILDAPModification);

 */


