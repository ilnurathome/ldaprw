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

		dump("about to get proxy\n");
   
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

	mFinished: 0,

  kInited: -1,

		/*function (iid) {
										if (iid.equals(Components.interfaces.nsISupports) )
											return this;

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
							this.mIOSvc = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService)
							this.mLDAPSvc = Components.classes["@mozilla.org/network/ldap-service;1"].getService(Components.interfaces.nsILDAPService);
							
					}
					this.kInited = 0;
					this.mStatus = 0;
				},

// ************** CREATE ***************
	query: function (aLdapUri, aBindName, password) {
					function generateGetTargetsBoundCallback(){

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
//															 dump("Create.generateGetTargetsBoundCallback.getTargetsBoundCallback: " + aMsg.type + "\n");
															 if (aMsg.type != aMsg.RES_BIND) {
																 dump("bind failed\n");
																 return;
															 }

															 caller.mOperationSearch = Components.classes["@mozilla.org/network/ldap-operation;1"].createInstance(Components.interfaces.nsILDAPOperation);
															 try {
																 caller.mOperationSearch.init(caller.mConnection, generateGetTargetsSearchCallback(), null);
																 dump("caller.mOperationSearch");
																 dump(caller.mOperationSearch);
																 dump("\n");
																 dump(caller.mOperationSearch.connection);
  															 caller.mOperationSearch.searchExt(queryURL.dn, queryURL.scope, queryURL.filter, 0, new Array(), 0, -1);
															 } catch (e) {
																 dump("init error: " + e + "\n");
																 return
															 }
														 },

							onLDAPInit: function(aConn, aStatus) {
//														dump("Create.generateGetTargetsBoundCallback.getTargetsBoundCallback.onLDAPInit: " + aStatus + " " + password + "\n");
														
														if (!Components.isSuccessCode(aStatus)) {
//															dump("Create.generateGetTargetsBoundCallback.getTargetsBoundCallback.onLDAPInit: Error\n" );
															throw aStatus;
														}
																	

														caller.mOperationBind = Components.classes["@mozilla.org/network/ldap-operation;1"].createInstance(Components.interfaces.nsILDAPOperation);
														dump ("init oper\n");
														try {
															caller.mOperationBind.init(caller.mConnection, getProxyThread(this, Components.interfaces.nsILDAPMessageListener), null);
															dump("caller.mOperationBind");
															dump(caller.mOperationBind);
															dump("\n");
															dump(caller.mOperationBind.connection);
 															caller.mOperationBind.simpleBind(password);																		} catch (e) {
															dump("init error: " + e + "\n");
															return
														}
														dump ("created operation\n");
														return;
													}
						}
						return getProxyThread(new getTargetsBoundCallback(), Components.interfaces.nsILDAPMessageListener);
					}
					

					//////////////////////////////////////////////////////
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
//								dump("Create.generateGetTargetsSearchCallback.getTargetsSearchCallback: " + aMsg.type + "\n");
								caller.mMessages[caller.mMessages.length] = aMsg;
								if (aMsg.type == aMsg.RES_SEARCH_ENTRY) {
									caller.mMessagesEntry[caller.mMessagesEntry.length] = aMsg;
								}
								else if (aMsg.type == aMsg.RES_SEARCH_RESULT) {	
//									dump("search complete");
									caller.mFinished = 1;
//									caller.mOperationSearch.abandonExt();
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
						

						this.mConnection = 	Components.classes["@mozilla.org/network/ldap-connection;1"].createInstance().QueryInterface(Components.interfaces.nsILDAPConnection);

						try {
							this.mConnection.init(queryURL, aBindName, generateGetTargetsBoundCallback(), null, Components.interfaces.nsILDAPConnection.VERSION3 );
						} catch (e) {
							dump ("Error:" + e + "\n");
						}
					}	
}

var components = [LdapDataSource];

var NSGetModule = XPCOMUtils.generateNSGetModule(components);

function write(imgname, array, replace) {
	var dir = Components.classes["@mozilla.org/file/directory_service;1"].  
                       getService(Components.interfaces.nsIProperties).  
                       get("ProfD", Components.interfaces.nsIFile);  

	var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
	dir.append("Photos");
	dir.append(imgname);
	var fullpath = dir.path;

	if(replace) {
				file.initWithPath( fullpath );  
		if (file.exists())  
			file.remove(true);  
		file.create(file.NORMAL_FILE_TYPE, 0666);  
	} else {
		dir.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0666);
		file = dir;
	}

	var fileStream = Components.classes['@mozilla.org/network/file-output-stream;1']
									.createInstance(Components.interfaces.nsIFileOutputStream);  
	fileStream.init(file, 2, 0x200, false);  
	var binaryStream = Components.classes['@mozilla.org/binaryoutputstream;1']  
                    .createInstance(Components.interfaces.nsIBinaryOutputStream);  
	binaryStream.setOutputStream(fileStream);  
	binaryStream.writeByteArray(array , array.length);  
	binaryStream.close();  
	fileStream.close();
	return file.path;
}

/*
45 [scriptable, uuid(f64ef501-0623-11d6-a7f2-b65476fc49dc)]
46 interface nsILDAPModification : nsISupports
51   attribute long operation;
/**
74    * The attribute to modify.
75    */
76   attribute ACString type;
77 
78   /**
79    * The array of values this modification sets for the attribute
80    */
81   attribute nsIArray values;

var ldapmodif = Components.classes["@mozilla.org/network/ldap-modification;1"].createInstance(Components.interfaces.nsILDAPModification);

 */

/*
function testSearch() {
	var basedn = "ou=private,ou=addressbook,dc=local";
	var url = "ldap://ilnurhp.local/ou=addressbook,dc=local??sub?(objectclass=*)";
	var binddn = "uid=ilnur,ou=people,dc=local";

//	var ldap = new LdapDataSource();
  var ldap = Components.classes["@ilnurathome.dyndns.org/LdapDataSource;1"].
								createInstance(Components.interfaces.nsILdapDataSource);

	var mainThread = Components.classes["@mozilla.org/thread-manager;1"].getService().mainThread;
	

	ldap.init();
	try {
		ldap.query(url, binddn, "04en5fhjkm");
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

	write ( ar[47].dn + '.jpg', ar[47].getBinaryValues("jpegPhoto",{})[0].get({}) );

//	return rv, listener.myar;
}
*/
