function debugldapsource(str){
//  dump("ldapsource.js: " + str);
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


function QILdapListner(iid) {
  if (iid.equals(Components.interfaces.nsISupports) ||
      iid.equals(Components.interfaces.nsILDAPMessageListener))
    return this;
  
  throw Components.results.NS_ERROR_NO_INTERFACE;
};

function generateGetTargetsCallback (onLDAPInit, onLDAPMessage) {
  function getTargetsCallback () {};
  getTargetsCallback.prototype = {
       QueryInterface: QILdapListner,
       onLDAPInit: function(aConn, aStatus) {
         if (!Components.isSuccessCode(aStatus)) {
           //debugldaprw_ab("Create.generateGetTargetsBoundCallback.getTargetsBoundCallback.onLDAPInit: Error\n" );
           throw aStatus;
         }
         onLDAPInit();
       },
       onLDAPMessage: onLDAPMessage
  }
  return getProxyThread( new getTargetsCallback(),
                         Components.interfaces.nsILDAPMessageListener );
}

function func() {
 var mConnection =  Components.classes["@mozilla.org/network/ldap-connection;1"].createInstance().QueryInterface(Components.interfaces.nsILDAPConnection);

 var mOperationBind;

 /*
var uri = "ldap://ilnurhp.local/ou=addressbook,dc=local??sub?(objectclass=*)"; 
var queryURL = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(uri, null, null).QueryInterface(Components.interfaces.nsILDAPURL);
var binddn = "uid=ilnur,ou=people,dc=local";

  */


    function getpassword() {
      var passwordManager = Components.classes["@mozilla.org/login-manager;1"].
                         getService(Components.interfaces.nsILoginManager);
      var logins = passwordManager.findLogins( {}, queryURL.prePath, null, uri); 
      return logins[0].password;
    };


    var mBinded =0;
 function(){
   mOperationBind = Components.classes["@mozilla.org/network/ldap-operation;1"].createInstance(Components.interfaces.nsILDAPOperation);
   try {
     mOperationBind.init(mConnection, 
         getTargetsCallback( function(){},
           function(aMsg){
              if (aMsg.type != aMsg.RES_BIND) {
                 throw Error("Bind failed");
                 return;
              }
              mBinded = 1;
           } ), 
         null);
     
     mOperationBind.simpleBind(getpassword());                                   
   } catch (e) {
     debugldapsource("Errors");
   }
 }

 var mInited=0; 
 try {
   mConnection.init(queryURL, binddn, 
       generateGetTargetsCallback(function(){mInited=1;},
         function(){} ), 
       null, 
       Components.interfaces.nsILDAPConnection.VERSION3 );
 } catch (e) {
   debugldapsource ("Error:" + e + "\n");
 }


}

