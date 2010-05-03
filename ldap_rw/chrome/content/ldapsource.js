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

function debugldapsource(str){
//  dump("ldapsource.js: " + str);
}

function dumperrors(str){
   dump(str + "\n");
   alert(str);
}


//Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

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

//    debugldapsource("about to get proxy\n");
   
  return proxyMgr.getProxyForObject(mainThread, aInterface, aObject, 6);
    // 5 == PROXY_ALWAYS | PROXY_SYNC
}

/* 
 * Generator of function for convert ldap errors code to string 
 * */
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
 *
 * */
//class constructor
function LdapDataSource() {
}

//class definition
LdapDataSource.prototype = {

  // properties required for XPCOM registration:
 // classDescription: "My LdapDataSource XPCOM Component",
 // classID:          Components.ID("bb9bd3e8-11ec-4dae-9a38-c0278420e092"),
//  contractID:       "@ilnurathome.dyndns.org/LdapDataSource;1",
 // _xpcom_categories: [{ category: "app-startup", service: true }],


 // QueryInterface:   XPCOMUtils.generateQI([Components.interfaces.nsILdapDataSource]),
  //QueryInterface:   XPCOMUtils.generateQI(),
  mIOSvc: {},
  mLDAPSvc: {},
  mLDAPDataSource: {},

  mConnection: {},
  mOperationBind: {}, // for debuging only
  mOperationSearch: {}, // for debuging only
  mMessages: new Array(), // for debuging only
  mMessagesEntry: new Array(), // for debuging only

  mBinded:   0,
  mFinished: 0,

  kInited: -1,
  kMaxMess: -1,

  kAttributes: new Array(),

};

// ************** INIT *****************
LdapDataSource.prototype.init = function(attrs, maxmess) {
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
      this.mdn = {};
      if (maxmess != undefined) this.kMaxMess = maxmess;
};


LdapDataSource.prototype.generateGetTargetsBoundCallback = function (caller, queryURL, getpassword, metod ){ 
  function binder(aMsg) {
    try {
      caller.mOperationBind.init(caller.mConnection, 
          caller.generateGetTargetsBoundCallback(caller, queryURL, getpassword, metod), null);
      
      var pw = getpassword(queryURL, aMsg);
      if ( pw == null ) return;
      caller.mOperationBind.simpleBind(pw);
    } catch (e) {
      dumperrors("init error: " + e + "\n");
      alert("init error: " + e + "\n");
      return
    }
  }
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
                     //debugldapsource("Create.generateGetTargetsBoundCallback.getTargetsBoundCallback: " + aMsg.type + "\n");
                     if (aMsg.type != aMsg.RES_BIND) {
                       debugldapsource("bind failed\n");
                       throw Error("Bind failed");
                       return;
                     }
                     
                     caller.mBinded = 0;

                     if (aMsg.errorCode == Components.interfaces.nsILDAPErrors.SUCCESS )  {
                       debugldapsource("binded\n");
                       caller.mBinded = 1;
                       metod(aMsg);
                     } else {                    
                       caller.mFinished = 0;
                       binder(aMsg);                       
                     }
                       //debugldapsource("metod=" + metod +"\n");
                   },

    onLDAPInit: function(aConn, aStatus) {
                  //debugldapsource("Create.generateGetTargetsBoundCallback.getTargetsBoundCallback.onLDAPInit: " + aStatus + " " + password + "\n");
                  if (!Components.isSuccessCode(aStatus)) {
                    //debugldapsource("Create.generateGetTargetsBoundCallback.getTargetsBoundCallback.onLDAPInit: Error\n" );
                    throw aStatus;
                  }

                  //caller.mOperationBind = Components.classes["@mozilla.org/network/ldap-operation;1"].createInstance(Components.interfaces.nsILDAPOperation);
                  debugldapsource ("init oper\n");
                  binder();
                  debugldapsource ("created operation\n");
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
            var callmetod = function(aMsg) {
//               debugldapsource("callmetod query\t" + getquery + "\n");
               if (!( getquery == undefined )) {
                 var query = null;
                 if ( aMsg == undefined || aMsg.operation == undefined ) 
                     query = getquery(aMsg, null);
                 else {
                     query = getquery(aMsg, caller.mdn[aMsg.operation.messageID] );
                     delete caller.mdn[aMsg.operation.messageID];
                 }
                 if ( query ){
                   caller.mOperationSearch = Components.classes["@mozilla.org/network/ldap-operation;1"].createInstance(Components.interfaces.nsILDAPOperation);
                   try {
                     caller.mOperationSearch.init(caller.mConnection, caller.generateGetTargetsQueryCallback(caller, callmetod, callback), null);
                     //mOperationSearch.searchExt(queryes[mFinished], queryURL.scope, filter, caller.kAttributes.length, caller.kAttributes, 0, -1);
                     debugldapsource( "operation search init messageID=" + caller.mOperationSearch.messageID + "\n" );
                     caller.mOperationSearch.searchExt(query.dn, queryURL.scope, query.filter, caller.kAttributes.length, caller.kAttributes, 0, caller.kMaxMess);
                     debugldapsource( "operation search call messageID=" + caller.mOperationSearch.messageID + "\n" );
                     caller.mdn[caller.mOperationSearch.messageID] = {mid: caller.mOperationSearch.messageID, dn: query.dn};
                   } catch (e) {
                     dumperrors("init error: " + e + "\n");
                     return;
                   }
                 }
                 return;
               }
               dumperrors("query getquery undefined\n");               
               return;
             }
//           }

           var caller = this;
//            var queryURL;
 
           if (caller.mBinded ){
              debugldapsource("Already binded\n");
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
              dumperrors ("Error:" + e + "\n");
            }
};



LdapDataSource.prototype.add = function (queryURL, aBindName, getpassword, getquery, callback) {

           /*
            *
            */
           function callmetod(aMsg) {
//             debugldapsource("callmetod add = "+ mFinished + "\t" + queryes + "\n");
             if (!( getquery == undefined )) {
               var query = getquery(aMsg);
               if ( query ){
                 var mOperationSearch = Components.classes["@mozilla.org/network/ldap-operation;1"]
                   .createInstance(Components.interfaces.nsILDAPOperation);
                 try {
                   mOperationSearch.init(caller.mConnection, caller.generateGetTargetsQueryCallback(caller, callmetod, callback), null);
                   mOperationSearch.addExt(query.dn, query.mods);
                 } catch (e) {
                   dumperrors("init error: " + e + "\n");
                   return;
                 }
               }
               return;
             }
               dumperrors("add getquery undefined\n");             
             return;  
           }

           var caller = this;
//            var queryURL;
           
            if (caller.mBinded ){
              debugldapsource("Already binded\n");
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
              dumperrors ("Error:" + e + "\n");
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
                     dumperrors("init error: " + e + "\n");
                     return;
                   }
                 }
                 return;
               }
               dumperrors("mod getquery undefined\n");
               return;
             
           }

           var caller = this;
//            var queryURL;


            if (caller.mBinded ){
              debugldapsource("Already binded\n");
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
              dumperrors ("Error:" + e + "\n");
            }
};


LdapDataSource.prototype.deleteext = function (queryURL, aBindName, getpassword, getquery, callback) {

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
                     mOperationSearch.deleteExt(query.dn);
                   } catch (e) {
                     dumperrors("init error: " + e + "\n");
                     return;
                   }
                 }
                 return;
               }
               dumperrors("mod getquery undefined\n");
               return;
             
           }

           var caller = this;
//            var queryURL;


            if (caller.mBinded ){
              debugldapsource("Already binded\n");
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
              dumperrors ("Error:" + e + "\n");
            }
};


//var components = [LdapDataSource];

//var NSGetModule = XPCOMUtils.generateNSGetModule(components);


/*
var ldapmodif = Components.classes["@mozilla.org/network/ldap-modification;1"].createInstance(Components.interfaces.nsILDAPModification);

 */


