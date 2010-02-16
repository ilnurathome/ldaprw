/*
 var card = Components.classes["@mozilla.org/addressbook/cardproperty;1"] 
                      .createInstance(Components.interfaces.nsIAbCard);
 var mapper = new LdaptoAB();
 mapper.map(LDAPMessage, AbCard);
 */


function LdaptoAB() {
}

LdaptoAB.prototype = {
	
	//  Contact > Name
	givenName: function() {this.AbCard.firstName = this.LDAPMessage.getValues("givenName", {} );},
	sn: function() {this.AbCard.lastName = this.LDAPMessage.getValues("sn", {} );},
	surname: function() { this.sn(); },

	cn: function() { 
		// DisplayName
		this.AbCard.displayName = this.LDAPMessage.getValues( "cn", {} );
	},
	commonname: function() {
								this.AbCard.displayName = this.LDAPMessage.getValues( "commonname",{} );
							},

	mozillaNickname: function() {
										 // NickName
									   this.AbCard.setProperty("NickName", this.LDAPMessage.getValues( "mozillaNickname",{} ) );
									 },
	xmozillanickname: function() {
											// NickName
									   this.AbCard.setProperty("NickName", this.LDAPMessage.getValues( "xmozillanickname",{} ) );
										},

	// Contact > Internet
	mail: function() {
					// PrimaryEmail
          var mails = this.LDAPMessage.getValues( "mail",{} );
					this.AbCard.primaryEmail = mails[0];
					if ( !mails[1]==undefined )	this.AbCard.setProperty("SecondEmail", mails[1]);
				},
	mozillaSecondEmail: function() {
												// SecondEmail
										  	this.AbCard.setProperty("SecondEmail",  this.LDAPMessage.getValues( "mozillaSecondEmail",{} ));
											},
	xmozillasecondemail: function() {
										  	this.AbCard.setProperty("SecondEmail",  this.LDAPMessage.getValues( "xmozillasecondemail",{} ));
											 },
	nsAIMid: function() {
		//_AimScreenName
										  	this.AbCard.setProperty("_AimScreenName",  this.LDAPMessage.getValues( "nsAIMid",{} ));
	},

	// Contact > Phones
	telephoneNumber: function() {
										 // WorkPhone
										  	this.AbCard.setProperty("WorkPhone",  this.LDAPMessage.getValues( "telephoneNumber",{} ));
									 },
  homePhone: function() {
							 // HomePhone
										  	this.AbCard.setProperty("HomePhone",  this.LDAPMessage.getValues( "homePhone",{} ));
						 },
	fax: function () {
				 // FaxNumber
										  	this.AbCard.setProperty("FaxNumber",  this.LDAPMessage.getValues( "fax",{} ));
			 },
	facsimiletelephonenumber: function () { 
										  	this.AbCard.setProperty("FaxNumber",  this.LDAPMessage.getValues( "facsimiletelephonenumber",{} ));
															
														},

  pager: function () {
		// PagerNumber
	 	this.AbCard.setProperty("PagerNumber",  this.LDAPMessage.getValues( "pager",{} ));
	},
  pagerphone: function() { 
										  	this.AbCard.setProperty("PagerNumber",  this.LDAPMessage.getValues( "pagerphone",{} ));								
							},
	
  mobile: function() {
		// CellularNumber
										  	this.AbCard.setProperty("CellularNumber",  this.LDAPMessage.getValues( "mobile",{} ));
	},
  cellphone: function() {
										  	this.AbCard.setProperty("CellularNumber",  this.LDAPMessage.getValues( "cellphone",{} ));
						 },
  carphone: function() {
										  	this.AbCard.setProperty("CellularNumber",  this.LDAPMessage.getValues( "carphone",{} ));							
						},

	// Address > Home
  mozillaHomeStreet: function() {
										  	this.AbCard.setProperty("HomeAddress",  this.LDAPMessage.getValues( "mozillaHomeStreet",{} ));
										 },
  mozillaHomeStreet2: function() {
										  	this.AbCard.setProperty("HomeAddress2",  this.LDAPMessage.getValues( "mozillaHomeStreet2",{} ));		
										 },

	mozillaHomeLocalityName: function() {
										  	this.AbCard.setProperty("HomeCity",  this.LDAPMessage.getValues( "mozillaHomeLocalityName",{} ));		
										 },
  mozillaHomeState: function() {
										  	this.AbCard.setProperty("HomeState",  this.LDAPMessage.getValues( "mozillaHomeState",{} ));		
										},
  mozillaHomePostalCode: function() {
										  	this.AbCard.setProperty("HomeZipCode",  this.LDAPMessage.getValues( "mozillaHomePostalCode",{} ));		
												 },
  mozillaHomeCountryName: function() {
										  	this.AbCard.setProperty("HomeCountry",  this.LDAPMessage.getValues( "mozillaHomeCountryName",{} ));		
													},
  mozillaHomeUrl: function() {
										  	this.AbCard.setProperty("WebPage2",  this.LDAPMessage.getValues( "mozillaHomeUrl",{} ));		
									},
  homeurl: function() {
										  	this.AbCard.setProperty("WebPage2",  this.LDAPMessage.getValues( "homeurl",{} ));		
					 },
   	// Address > Work
  title: function() {
										  	this.AbCard.setProperty("JobTitle",  this.LDAPMessage.getValues( "title",{} ));		
				 },
  ou: function() {
										  	this.AbCard.setProperty("Department",  this.LDAPMessage.getValues( "ou",{} ));		
				 },
  department: function() {
										  	this.AbCard.setProperty("Department",  this.LDAPMessage.getValues( "department",{} ));		
				 },
  departmentnumber: function() {
										  	this.AbCard.setProperty("Department",  this.LDAPMessage.getValues( "departmentnumber",{} ));		
				 },
  orgunit: function() {
										  	this.AbCard.setProperty("Department",  this.LDAPMessage.getValues( "orgunit",{} ));		
				 },

  o: function() {
										  	this.AbCard.setProperty("Company",  this.LDAPMessage.getValues( "o",{} ));		
				 },
  company: function() {
										  	this.AbCard.setProperty("Company",  this.LDAPMessage.getValues( "company",{} ));		
				 },
  
  street: function() {
										  	this.AbCard.setProperty("WorkAddress",  this.LDAPMessage.getValues( "street",{} ));		
					},
  streetaddress: function() {
										  	this.AbCard.setProperty("WorkAddress",  this.LDAPMessage.getValues( "streetaddress",{} ));		
				 },
  postOfficeBox: function() {
										  	this.AbCard.setProperty("WorkAddress",  this.LDAPMessage.getValues( "postOfficeBox",{} ));		
				 },

  mozillaWorkStreet2: function() {
										  	this.AbCard.setProperty("WorkAddress2",  this.LDAPMessage.getValues( "mozillaWorkStreet2",{} ));		
				 },

  l: function() {
										  	this.AbCard.setProperty("WorkCity",  this.LDAPMessage.getValues( "l",{} ));		
				 },
  locality: function() {
										  	this.AbCard.setProperty("WorkCity",  this.LDAPMessage.getValues( "locality",{} ));		
				 },

	st: function() {
										  	this.AbCard.setProperty("WorkState",  this.LDAPMessage.getValues( "st",{} ));		
				 },
  region: function() {
										  	this.AbCard.setProperty("WorkState",  this.LDAPMessage.getValues( "region",{} ));		
				 },

  postalCode: function() {
										  	this.AbCard.setProperty("WorkZipCode",  this.LDAPMessage.getValues( "postalCode",{} ));		
				 },
  zip: function() {
										  	this.AbCard.setProperty("WorkZipCode",  this.LDAPMessage.getValues( "zip",{} ));		
				 },

  c: function() {
										  	this.AbCard.setProperty("WorkCountry",  this.LDAPMessage.getValues( "c",{} ));		
				 },
  countryname: function() {
										  	this.AbCard.setProperty("WorkCountry",  this.LDAPMessage.getValues( "countryname",{} ));		
				 },

  workurl: function() {
										  	this.AbCard.setProperty("WebPage1",  this.LDAPMessage.getValues( "workurl",{} ));		
				 },
  mozillaWorkUrl: function() {
										  	this.AbCard.setProperty("WebPage1",  this.LDAPMessage.getValues( "mozillaWorkUrl",{} ));		
				 },
  labeledURI: function() {
										  	this.AbCard.setProperty("WebPage1",  this.LDAPMessage.getValues( "labeledURI",{} ));		
				 },
          	// Other > (custom)
	custom1: function() {
										  	this.AbCard.setProperty("Custom1",  this.LDAPMessage.getValues( "custom1",{} ));
					 },
	mozillaCustom1: function() {
										  	this.AbCard.setProperty("Custom1",  this.LDAPMessage.getValues( "mozillaCustom1",{} ));
					 },
 
	custom2: function() {
										  	this.AbCard.setProperty("Custom2",  this.LDAPMessage.getValues( "custom2",{} ));
					 },
	mozillaCustom2: function() {
										  	this.AbCard.setProperty("Custom2",  this.LDAPMessage.getValues( "mozillaCustom2",{} ));
					 },

	custom3: function() {
										  	this.AbCard.setProperty("Custom3",  this.LDAPMessage.getValues( "custom3",{} ));
					 },
	mozillaCustom3: function() {
										  	this.AbCard.setProperty("Custom3",  this.LDAPMessage.getValues( "mozillaCustom3",{} ));
					 },

	custom4: function() {
										  	this.AbCard.setProperty("Custom4",  this.LDAPMessage.getValues( "custom4",{} ));
					 },
	mozillaCustom4: function() {
										  	this.AbCard.setProperty("Custom4",  this.LDAPMessage.getValues( "mozillaCustom4",{} ));
					 },
   	// Other > Notes

	jpegPhoto: function() {		
		var dir = Components.classes["@mozilla.org/file/directory_service;1"]
                        .getService(Components.interfaces.nsIProperties)
                        .get("ProfD", Components.interfaces.nsIFile);  
		
		var file = Components.classes["@mozilla.org/file/local;1"]
					               .createInstance(Components.interfaces.nsILocalFile);
		
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
	
		var array = this.LDAPMessage.getBinaryValues("jpegPhoto",{})[0].get({});
		try {
			binaryStream.writeByteArray(array , array.length);
			this.AbCard.setProperty("PhotoURI", fullpath);
			this.AbCard.setProperty("PhotoType", "file");
		} catch(e) {
			dump(e + "\n");
		}
	
		binaryStream.close();  
		fileStream.close();
		
	},


	// example
	// var card = Components.classes["@mozilla.org/addressbook/cardproperty;1"]
	//                      .createInstance(Components.interfaces.nsIAbCard);
	// var mapper = new LdaptoAB();
	// mapper.map(ldapmessage, card);
	map: function(LDAPMessage, AbCard) {
		this.LDAPMessage = LDAPMessage;
		this.AbCard = AbCard;

		var attrs = this.LDAPMessage.getAttributes({});
		for (var i in attrs) {
			if ( !attrs.hasOwnProperty(i) ) continue;
			if ( this[attrs[i]]==undefined ) continue;
			this[attrs[i]]();
		}
	}
}

/*

	 try{ 
	   window.openDialog("chrome://messenger/content/addressbook/abEditCardDialog.xul", "", "chrome,resizable=no,modal,titlebar,centerscreen", {card:card}); 
		 } catch(e){ 
		   dump(e+"\n"); 
		}

 */


/*
// default mapping of addressbook properties to ldap attributes
pref("ldap_2.servers.default.attrmap.FirstName", "givenName");
pref("ldap_2.servers.default.attrmap.LastName", "sn,surname");
pref("ldap_2.servers.default.attrmap.DisplayName", "cn,commonname");
pref("ldap_2.servers.default.attrmap.NickName", "mozillaNickname,xmozillanickname");
pref("ldap_2.servers.default.attrmap.PrimaryEmail", "mail");
pref("ldap_2.servers.default.attrmap.SecondEmail", "mozillaSecondEmail,xmozillasecondemail");
pref("ldap_2.servers.default.attrmap.WorkPhone", "telephoneNumber");
pref("ldap_2.servers.default.attrmap.HomePhone", "homePhone");
pref("ldap_2.servers.default.attrmap.FaxNumber", "facsimiletelephonenumber,fax");
pref("ldap_2.servers.default.attrmap.PagerNumber", "pager,pagerphone");
pref("ldap_2.servers.default.attrmap.CellularNumber", "mobile,cellphone,carphone");
pref("ldap_2.servers.default.attrmap.WorkAddress", "street,streetaddress,postOfficeBox");
pref("ldap_2.servers.default.attrmap.HomeAddress", "mozillaHomeStreet");
pref("ldap_2.servers.default.attrmap.WorkAddress2", "mozillaWorkStreet2");
pref("ldap_2.servers.default.attrmap.HomeAddress2", "mozillaHomeStreet2");
pref("ldap_2.servers.default.attrmap.WorkCity", "l,locality");
pref("ldap_2.servers.default.attrmap.HomeCity", "mozillaHomeLocalityName");
pref("ldap_2.servers.default.attrmap.WorkState", "st,region");
pref("ldap_2.servers.default.attrmap.HomeState", "mozillaHomeState");
pref("ldap_2.servers.default.attrmap.WorkZipCode", "postalCode,zip");
pref("ldap_2.servers.default.attrmap.HomeZipCode", "mozillaHomePostalCode");
pref("ldap_2.servers.default.attrmap.WorkCountry", "c,countryname");
pref("ldap_2.servers.default.attrmap.HomeCountry", "mozillaHomeCountryName");
pref("ldap_2.servers.default.attrmap.JobTitle", "title");
pref("ldap_2.servers.default.attrmap.Department", "ou,department,departmentnumber,orgunit");
pref("ldap_2.servers.default.attrmap.Company", "o,company");
pref("ldap_2.servers.default.attrmap._AimScreenName", "nsAIMid,nscpaimscreenname");
pref("ldap_2.servers.default.attrmap.WebPage1", "mozillaWorkUrl,workurl,labeledURI");
pref("ldap_2.servers.default.attrmap.WebPage2", "mozillaHomeUrl,homeurl");
pref("ldap_2.servers.default.attrmap.BirthYear", "birthyear");
pref("ldap_2.servers.default.attrmap.BirthMonth", "birthmonth");
pref("ldap_2.servers.default.attrmap.BirthDay", "birthday");
pref("ldap_2.servers.default.attrmap.Custom1", "mozillaCustom1,custom1");
pref("ldap_2.servers.default.attrmap.Custom2", "mozillaCustom2,custom2");
pref("ldap_2.servers.default.attrmap.Custom3", "mozillaCustom3,custom3");
pref("ldap_2.servers.default.attrmap.Custom4", "mozillaCustom4,custom4");
pref("ldap_2.servers.default.attrmap.Notes", "description,notes");
pref("ldap_2.servers.default.attrmap.PreferMailFormat", "mozillaUseHtmlMail,xmozillausehtmlmail");
pref("ldap_2.servers.default.attrmap.LastModifiedDate", "modifytimestamp");

*/

