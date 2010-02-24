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
 * Need to change generateGetTargetsBoundCallback and generateGetTargetsSearchCallback to single
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
//  mOperationSearch: {},
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
  },

// ************** INIT *****************
  init: function(attrs) {
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
      this.mOperationBind = {},
        //  mOperationSearch: {},
      this.mMessages = new Array();
      this.mMessagesEntry = new Array();

      this.mBinded =   0;
      this.mFinished = 0;
      
  },

  generateGetTargetsBoundCallback: function (caller, queryURL, getpassword, queryes, metod ){

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
                               metod();
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
                              caller.mOperationBind.simpleBind(getpassword());                                   } catch (e) {
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
  generateGetTargetsSearchCallback:   function (caller, queryes, metod, callbackresult) {
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
                switch(aMsg.type){
                  case aMsg.RES_SEARCH_ENTRY:
                    caller.mMessagesEntry[caller.mMessagesEntry.length] = aMsg;
                    caller.mMessagesEntry[aMsg.dn] = aMsg;
                    //                  dump("callbackresult=" + callbackresult + "\n");
                    if ( !(callbackresult == undefined)) callbackresult(aMsg);
                    break;
              
                  case aMsg.RES_SEARCH_RESULT: 
//                  dump("search complete");
                    caller.mFinished++;
                    if ( !(metod == undefined)) metod();
                    break;

                  case aMsg.RES_ADD:
                  case aMsg.RES_MODIFY:
                    caller.mFinished++;
                    if ( !(metod == undefined)) metod();
                    break;
                  default:
                    break;
                };
              }
            }

              return getProxyThread(new getTargetsSearchCallback(), Components.interfaces.nsILDAPMessageListener);
            },



// ************** CREATE ***************
//  query: function (aLdapUri, aBindName, password) {
  query: function (queryURL, aBindName, filter, getpassword, queryes, callback) {

           /*
            *
            */
        //   function createcallmetod(queryes) {
             var mFinished=0;
            // return function(){
            function callmetod() {
               dump("callmetod query = "+ mFinished );
//                 dump( "\t" + queryes[mFinished] );
                 dump( "\n");
               if (!( queryes == undefined )) {
                 if ( !(queryes[mFinished]==undefined) ){
                   var mOperationSearch = Components.classes["@mozilla.org/network/ldap-operation;1"]
                                             .createInstance(Components.interfaces.nsILDAPOperation);
                   try {
                     mOperationSearch.init(caller.mConnection, caller.generateGetTargetsSearchCallback(caller, queryes, callmetod, callback), null);
                     //mOperationSearch.searchExt(queryes[mFinished], queryURL.scope, queryURL.filter, 0, new Array(), 0, -1);
//                     dump("kAttributes="+ caller.kAttributes + "\n");
                     mOperationSearch.searchExt(queryes[mFinished], queryURL.scope, filter, caller.kAttributes.length, caller.kAttributes, 0, -1);
                     mFinished++;
                   } catch (e) {
                     dump("init error: " + e + "\n");
                     return;
                   }
                 }
               }
               return mFinished;
             }
//           }

           var caller = this;
//            var queryURL;

            if (queryURL == undefined ) {
              throw Error("queryURL is undefined");
              return;
            }         
           

            this.mConnection =  Components.classes["@mozilla.org/network/ldap-connection;1"].createInstance().QueryInterface(Components.interfaces.nsILDAPConnection);

            try {
              this.mConnection.init(queryURL, aBindName, this.generateGetTargetsBoundCallback(caller, queryURL, getpassword, queryes, callmetod, callback), null, Components.interfaces.nsILDAPConnection.VERSION3 );
            } catch (e) {
              dump ("Error:" + e + "\n");
            }
          } ,



  add: function (queryURL, aBindName, getpassword, queryes, callback) {

           /*
            *
            */
         var mFinished=0;
           function callmetod() {
             dump("callmetod add = "+ mFinished + "\t" + queryes + "\n");
             if (!( queryes == undefined )) {
               if ( !(queryes[mFinished]==undefined) ){
                 var mOperationSearch = Components.classes["@mozilla.org/network/ldap-operation;1"]
                   .createInstance(Components.interfaces.nsILDAPOperation);
                 try {
                   mOperationSearch.init(caller.mConnection, caller.generateGetTargetsSearchCallback(caller, queryes, callmetod, callback), null);
                   mOperationSearch.addExt(queryes[mFinished].dn, queryes[mFinished].mods);
                   mFinished++;
                 } catch (e) {
                   dump("init error: " + e + "\n");
                   return;
                 }
               }
             }
             return mFinished;  
           }

           var caller = this;
//            var queryURL;

            if (queryURL == undefined ) {
              throw Error("queryURL is undefined");
              return;
            }         
           

            this.mConnection =  Components.classes["@mozilla.org/network/ldap-connection;1"].createInstance().QueryInterface(Components.interfaces.nsILDAPConnection);

            try {
              this.mConnection.init(queryURL, aBindName, this.generateGetTargetsBoundCallback(caller, queryURL, getpassword, queryes, callmetod, callback), null, Components.interfaces.nsILDAPConnection.VERSION3 );
            } catch (e) {
              dump ("Error:" + e + "\n");
            }
          },



         modify: function (queryURL, aBindName, getpassword, queryes, callback) {

           /*
            *
            */
             var mFinished=0;
            function callmetod(){
               dump("callmetod modify = "+ mFinished + "\t" + queryes + "\n");

               if (!( queryes == undefined )) {
                 if ( !(queryes[mFinished]==undefined) ){
                   dump ("queryes[mFinished]" + queryes[mFinished] + "\n");
                   var mOperationSearch = Components.classes["@mozilla.org/network/ldap-operation;1"]
                                             .createInstance(Components.interfaces.nsILDAPOperation);
                   try {
                     mOperationSearch.init(caller.mConnection, caller.generateGetTargetsSearchCallback(caller, queryes), null);
                     mOperationSearch.modifyExt(queryes[mFinished].dn, queryes[mFinished].mods);
                     mFinished++;
                   } catch (e) {
                     dump("init error: " + e + "\n");
                     return;
                   }
                 }
               }
               return mFinished;
             
           }

           var caller = this;
//            var queryURL;

            if (queryURL == undefined ) {
              throw Error("queryURL is undefined");
              return;
            }         
           

            this.mConnection =  Components.classes["@mozilla.org/network/ldap-connection;1"].createInstance().QueryInterface(Components.interfaces.nsILDAPConnection);

            try {
              this.mConnection.init(queryURL, aBindName, this.generateGetTargetsBoundCallback(caller, queryURL, getpassword, queryes, callmetod, callback), null, Components.interfaces.nsILDAPConnection.VERSION3 );
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


