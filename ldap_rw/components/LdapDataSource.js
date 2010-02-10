Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function getService(aContract, aInterface) {
	return Components.classes[aContract].getService(Components.interfaces[aInterface]);
}

function createInstance(aContract, aInterface)
{
	return Components.classes[aContract].createInstance(Components.interfaces[aInterface]);
}


function getProxyThread(aObject, aInterface) {

	var mainThread;

  mainThread = Components.classes["@mozilla.org/thread-manager;1"].getService().mainThread;
	
	var proxyMgr = Components.classes["@mozilla.org/xpcomproxy;1"].getService(
                                  Components.interfaces.nsIProxyObjectManager);

		dump("about to get proxy\n");
   
	return proxyMgr.getProxyForObject(mainThread, aInterface, aObject, 5);
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
	mOperation: {},
	mMessages: new Array(),
	mMessagesEntry: new Array(),

	mFinished: 0,

  kInited: -1,

		/*function (iid) {
										if (iid.equals(Components.interfaces.nsISupports) )
											return this;

										throw Components.results.NS_ERROR_NO_INTERFACE;
									},*/

	init: function() {
					if (this.kInited == -1 ){
							this.mIOSvc = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService)
							this.mLDAPSvc = Components.classes["@mozilla.org/network/ldap-service;1"].getService(Components.interfaces.nsILDAPService);
							
					}
					this.kInited = 0;
					this.mStatus = 0;
				},

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

	create: function (aLdapUri, aBindName, password) {
					function generateGetTargetsBoundCallback(){
						function getTargetsBoundCallback () {}

						getTargetsBoundCallback.prototype = { 
							QueryInterface: function QI(iid) {
																if (iid.equals(Components.interfaces.nsISupports) ||
																		iid.equals(Components.interfaces.nsILDAPMessageListener))
																	return this;
																
																throw Components.results.NS_ERROR_NO_INTERFACE;
															},

							onLDAPMessage: function (aMsg) {
															 dump("Create.generateGetTargetsBoundCallback.getTargetsBoundCallback: " + aMsg.type + "\n");
															 if (aMsg.type != aMsg.RES_BIND) {
																 dump("bind failed\n");
																 return;
															 }

															 var searchOp = Components.classes["@mozilla.org/network/ldap-operation;1"].createInstance(Components.interfaces.nsILDAPOperation);
															 try {
																 searchOp.init(connection, generateGetTargetsSearchCallback(), null);
																 searchOp.searchExt(queryURL.dn, queryURL.scope, queryURL.filter, 0, new Array(), 0, -1);
															 } catch (e) {
																 dump("init error: " + e + "\n");
																 return
															 }
														 },

							onLDAPInit: function(aConn, aStatus) {
														dump("Create.generateGetTargetsBoundCallback.getTargetsBoundCallback.onLDAPInit: " + aStatus + " " + password + "\n");
														
														if (!Components.isSuccessCode(aStatus)) {
															dump("Create.generateGetTargetsBoundCallback.getTargetsBoundCallback.onLDAPInit: Error\n" );
															throw aStatus;
														}
																	

														var operation = Components.classes["@mozilla.org/network/ldap-operation;1"].createInstance(Components.interfaces.nsILDAPOperation);
														dump ("init oper\n");
														try {
															operation.init(connection, getProxyThread(this, Components.interfaces.nsILDAPMessageListener), null);
															operation.simpleBind(password);														
														} catch (e) {
															dump("init error: " + e + "\n");
															return
														}
														dump ("created operation\n");

														return;
													}
						}
						return getProxyThread(new getTargetsBoundCallback(), Components.interfaces.nsILDAPMessageListener);
					}
					

					function generateGetTargetsSearchCallback() {
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
								dump("Create.generateGetTargetsSearchCallback.getTargetsSearchCallback: " + aMsg.type + "\n");
								caller.mMessages[caller.mMessages.length] = aMsg;
								if (aMsg.type == aMsg.RES_SEARCH_ENTRY) {
									caller.mMessagesEntry[caller.mMessagesEntry.length] = aMsg;
								}
								else if (aMsg.type == aMsg.RES_SEARCH_RESULT) {		
									mFinished = 1;
								}
							}
						}

							return getProxyThread(new getTargetsSearchCallback(), Components.interfaces.nsILDAPMessageListener);
						}

						var caller = this;
						var queryURL;

						dump ( "Create: " + aLdapUri + " " + aBindName + " " + password + "\n");
						if (queryURL == null) {
							queryURL = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(aLdapUri, null, null).QueryInterface(Components.interfaces.nsILDAPURL);
						}
						dump ( queryURL.host + "\n" );
						dump ( queryURL.dn + "\n" );
						dump ( queryURL.scope + "\n" );
						dump ( queryURL.filter + "\n" );
						

						var connection = 	Components.classes["@mozilla.org/network/ldap-connection;1"].createInstance().QueryInterface(Components.interfaces.nsILDAPConnection);

						try {
							connection.init(queryURL, aBindName, generateGetTargetsBoundCallback(), null, Components.interfaces.nsILDAPConnection.VERSION3 );
						} catch (e) {
							dump ("Error:" + e + "\n");
						}
					}	
}

var components = [LdapDataSource];

var NSGetModule = XPCOMUtils.generateNSGetModule(components);


/*
function testSearch() {
	var basedn = "ou=private,ou=addressbook,dc=local";
	var url = "ldap://ilnurhp.local/ou=addressbook,dc=local??sub?(objectclass=*)";
	var binddb = "uid=ilnur,ou=people,dc=local";

//	var ldap = new LdapDataSource();
  var ldap = Components.classes["@ilnurathome.dyndns.org/LdapDataSource;1"].
								createInstance(Components.interfaces.nsILdapDataSource);
	
	ldap.init();
	try {
		ldap.create(url, binddb, "04en5fhjkm");
	} catch (e) {
		dump ("Error: " + e + "\n" );
	}

	while(!ldap.mFinished) {

	}

//	return rv, listener.myar;
}
*/
