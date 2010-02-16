function CreateLDAPModification() {
	return Components.classes["@mozilla.org/network/ldap-modification;1"].createInstance(Components.interfaces.nsILDAPModification);
}

function CreateNSMutArray() {
	return Components.classes["@mozilla.org/array;1"].createInstance(Components.interfaces.nsIMutableArray);
 ;
}

function CreateLdapBerVal() {
	return Components.classes["@mozilla.org/network/ldap-ber-value;1"].createInstance(Components.interfaces.nsILDAPBERValue);
}

function CreateLDAPMod (type, vals) {
	var mod = CreateLDAPModification();
	dump( "CreateLDAPMod: type=" + type + "\n" );
	mod.type = type;
	mod.values = CreateNSMutArray();
	if ( mod.values instanceof Components.interfaces.nsIMutableArray ){
    dump( "CreateLDAPMod: vals=" + vals + "\n" );		
		for (i in vals) {
			var val = CreateLdapBerVal();
      dump( "CreateLDAPMod: vals[" + i + "]=" + vals[i] + "\n" );
			val.setFromUTF8(vals[i], false);
			mod.values.appendElement(val, false);
		}
	}
	return mod;
}

function ABtoLdap() {
}

ABtoLdap.prototype = {


  // Contact > Name
	FirstName : function() {
								this.LdapModifications.appendElement( CreateLDAPMod("givenName", [this.AbCard.firstName]) , false);
							},

	LastName: function() {
								this.LdapModifications.appendElement( CreateLDAPMod("sn", [this.AbCard.firstName]) , false);
								//this.LdapModifications.appendElement( CreateLDAPMod("surname", [this.AbCard.firstName]) , false);
						},

	DisplayName: function() {
								this.LdapModifications.appendElement( CreateLDAPMod("cn", [this.AbCard.displayName]) , false);
								//this.LdapModifications.appendElement( CreateLDAPMod("commonname", [this.AbCard.displayName]) , false);
						},

	NickName: function() {
								this.LdapModifications.appendElement( CreateLDAPMod("mozillaNickname", [this.AbCard.getProperty("NickName")]) , false);
								this.LdapModifications.appendElement( CreateLDAPMod("xmozillanickname", [this.AbCard.getProperty("NickName","")]) , false);
						},



          // Contact > Internet
  PrimaryEmail: function() {
									this.LdapModifications.appendElement( CreateLDAPMod("mail", [this.AbCard.getProperty("PrimaryEmail", "")] ), false  );
								} ,
	SecondEmail: function() {
									this.LdapModifications.appendElement( CreateLDAPMod("mail", [this.AbCard.getProperty("PrimaryEmail", "")] ), false  );
							 },



				  // Contact > Phones
	WorkPhone: function() {
							 this.LdapModifications.appendElement( CreateLDAPMod("telephoneNumber", [this.AbCard.getProperty("WorkPhone", "")]),false);
						 },
  HomePhone: function() {
							 this.LdapModifications.appendElement( CreateLDAPMod("homePhone", [this.AbCard.getProperty("HomePhone", "")]),false);
						 },
  FaxNumber: function() {
							 this.LdapModifications.appendElement( CreateLDAPMod("fax", [this.AbCard.getProperty("FaxNumber", "")]),false);
							 //this.LdapModifications.appendElement( CreateLDAPMod("facsimiletelephonenumber", [this.AbCard.getProperty("FaxNumber", "")]),false);
						 },
  PagerNumber: function() {
								 this.LdapModifications.appendElement( CreateLDAPMod("pager", [this.AbCard.getProperty("PagerNumber", "")]),false);
							 },
  CellularNumber: function() {
										this.LdapModifications.appendElement( CreateLDAPMod("mobile", [this.AbCard.getProperty("CellularNumber", "")]),false);
										//this.LdapModifications.appendElement( CreateLDAPMod("cellphone", [this.AbCard.getProperty("CellularNumber", "")]),false);
								    //this.LdapModifications.appendElement( CreateLDAPMod("carphone", [this.AbCard.getProperty("CellularNumber", "")]),false);
									},


          // Address > Home
  HomeAddress: function() {
										this.LdapModifications.appendElement( CreateLDAPMod("mozillaHomeStreet", [this.AbCard.getProperty("HomeAddress", "")]),false);
							 },
  HomeAddress2: function() {
									this.LdapModifications.appendElement( CreateLDAPMod("mozillaHomeStreet2", [this.AbCard.getProperty("HomeAddress2", "")]),false);
								},
  HomeCity: function() {
							this.LdapModifications.appendElement( CreateLDAPMod("mozillaHomeLocalityName", [this.AbCard.getProperty("HomeCity", "")]),false);
						},
								
  HomeState: function() {
										this.LdapModifications.appendElement( CreateLDAPMod("mozillaHomeState", [this.AbCard.getProperty("HomeState", "")]),false);
						 },
  HomeZipCode: function() {
										this.LdapModifications.appendElement( CreateLDAPMod("mozillaHomePostalCode", [this.AbCard.getProperty("HomeZipCode", "")]),false);
							 },
  HomeCountry: function() {
										this.LdapModifications.appendElement( CreateLDAPMod("mozillaHomeCountryName", [this.AbCard.getProperty("HomeCountry", "")]),false);
							 },
  WebPage2: function() {
										this.LdapModifications.appendElement( CreateLDAPMod("mozillaHomeUrl", [this.AbCard.getProperty("WebPage2", "")]),false);
										//this.LdapModifications.appendElement( CreateLDAPMod("homeurl", [this.AbCard.getProperty("WebPage2", "")]),false);
						},



          // Address > Work
  JobTitle: function() {
										this.LdapModifications.appendElement( CreateLDAPMod("title", [this.AbCard.getProperty("JobTitle", "")]),false);
						},
  Department: function() {
										this.LdapModifications.appendElement( CreateLDAPMod("ou", [this.AbCard.getProperty("Department", "")]),false);
										//this.LdapModifications.appendElement( CreateLDAPMod("department", [this.AbCard.getProperty("Department", "")]),false);
										//this.LdapModifications.appendElement( CreateLDAPMod("departmentnumber", [this.AbCard.getProperty("Department", "")]),false);
										//this.LdapModifications.appendElement( CreateLDAPMod("orgunit", [this.AbCard.getProperty("Department", "")]),false);
							},
  Company: function() {
										this.LdapModifications.appendElement( CreateLDAPMod("o", [this.AbCard.getProperty("Company", "")]),false);
										//this.LdapModifications.appendElement( CreateLDAPMod("company", [this.AbCard.getProperty("Company", "")]),false);
					 },
  WorkAddress: function() {
										this.LdapModifications.appendElement( CreateLDAPMod("street", [this.AbCard.getProperty("WorkAddress", "")]),false);
										//this.LdapModifications.appendElement( CreateLDAPMod("streetaddress", [this.AbCard.getProperty("WorkAddress", "")]),false);
										//this.LdapModifications.appendElement( CreateLDAPMod("postOfficeBox", [this.AbCard.getProperty("WorkAddress", "")]),false);
							 },
  WorkAddress2: function() {
										this.LdapModifications.appendElement( CreateLDAPMod("mozillaWorkStreet2", [this.AbCard.getProperty("WorkAddress2", "")]),false);
								},
  WorkCity: function() {
										this.LdapModifications.appendElement( CreateLDAPMod("l", [this.AbCard.getProperty("WorkCity", "")]),false);
										//this.LdapModifications.appendElement( CreateLDAPMod("locality", [this.AbCard.getProperty("WorkCity", "")]),false);
						},
  WorkState: function() {
										this.LdapModifications.appendElement( CreateLDAPMod("st", [this.AbCard.getProperty("WorkState", "")]),false);
										//this.LdapModifications.appendElement( CreateLDAPMod("region", [this.AbCard.getProperty("WorkState", "")]),false);
						 },
  WorkZipCode: function() {
										this.LdapModifications.appendElement( CreateLDAPMod("postalCode", [this.AbCard.getProperty("WorkZipCode", "")]),false);
										//this.LdapModifications.appendElement( CreateLDAPMod("zip", [this.AbCard.getProperty("WorkZipCode", "")]),false);
							 },
  WorkCountry: function() {
										this.LdapModifications.appendElement( CreateLDAPMod("c", [this.AbCard.getProperty("WorkCountry", "")]),false);
										//this.LdapModifications.appendElement( CreateLDAPMod("countryname", [this.AbCard.getProperty("WorkCountry", "")]),false);
							 },
  WebPage1: function() {
										this.LdapModifications.appendElement( CreateLDAPMod("mozillaWorkUrl", [this.AbCard.getProperty("WebPage1", "")]),false);
										//this.LdapModifications.appendElement( CreateLDAPMod("labeledURI", [this.AbCard.getProperty("WebPage1", "")]),false);
						},



          // Other > (custom)
  Custom1: function() {
										this.LdapModifications.appendElement( CreateLDAPMod("custom1", [this.AbCard.getProperty("Custom1", "")]),false);
										//this.LdapModifications.appendElement( CreateLDAPMod("mozillaCustom1", [this.AbCard.getProperty("Custom1", "")]),false);
					 },
  Custom2: function() {
										this.LdapModifications.appendElement( CreateLDAPMod("custom2", [this.AbCard.getProperty("Custom2", "")]),false);
										//this.LdapModifications.appendElement( CreateLDAPMod("mozillaCustom2", [this.AbCard.getProperty("Custom2", "")]),false);
					 },
  Custom3: function() {
										this.LdapModifications.appendElement( CreateLDAPMod("custom3", [this.AbCard.getProperty("Custom3", "")]),false);
										//this.LdapModifications.appendElement( CreateLDAPMod("mozillaCustom3", [this.AbCard.getProperty("Custom3", "")]),false);
					 },
  Custom4: function() {
										this.LdapModifications.appendElement( CreateLDAPMod("custom4", [this.AbCard.getProperty("Custom4", "")]),false);
										//this.LdapModifications.appendElement( CreateLDAPMod("mozillaCustom4", [this.AbCard.getProperty("Custom4", "")]),false);
					 },
         // Other > Notes
  Notes: function() {
										this.LdapModifications.appendElement( CreateLDAPMod("notes", [this.AbCard.getProperty("Notes", "")]),false);
										//this.LdapModifications.appendElement( CreateLDAPMod("description", [this.AbCard.getProperty("Notes", "")]),false);
				 },

  PhotoURI: function() {
						},
	PhotoType: function() {
							 var photoURI = this.AbCard.getProperty("PhotoURI", "");
							 switch( this.AbCard.getProperty("PhotoType", "") ) {
								 case "file":
									 try {
										 var pfile = Components.classes["@mozilla.org/network/io-service;1"]
											 .getService(Components.interfaces.nsIIOService)
											 .newURI(photoURI, null, null)
											 .QueryInterface(Components.interfaces.nsIFileURL)
											 .file;

									 } catch (e) {}
								   if (pfile) {
										 file.initWithFile(pfile);  
										 var fileStream = Components.classes['@mozilla.org/network/file-input-stream;1'].createInstance(Components.interfaces.nsIFileInputStream);
										 fileStream.init(file, 1, 0, false);  
										 var binaryStream = Components.classes['@mozilla.org/binaryinputstream;1'].createInstance(Components.interfaces.nsIBinaryInputStream);  
										 binaryStream.setInputStream(fileStream);  
										 var array = binaryStream.readByteArray(fileStream.available());  

										 this.LdapModifications.appendElement( CreateLDAPMod("jpegPhoto", [array]),false);

										 binaryStream.close();  
										 fileStream.close();  
									 }
							 };
						 },


	map: function(AbCard, LdapModifications) {
				 this.LdapModifications = LdapModifications;
				 this.AbCard = AbCard;

				 dump("map begin");

				 var props = this.AbCard.properties;

				 while ( props.hasMoreElements() ){
					 var attr = props.getNext();
					 if (attr instanceof Components.interfaces.nsIProperty){
						 dump("attr=" + attr.name + "\t" + attr.value + "\n");
						 if (attr.value){
							 if( this[attr.name]==undefined ) continue;
							 this[attr.name]();
						 }
					 }
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
 const kVcardFields =
        [ // Contact > Name
         ["FirstName", "FirstName"],
         ["LastName", "LastName"],
         ["DisplayName", "DisplayName"],
         ["NickName", "NickName"],
          // Contact > Internet
         ["PrimaryEmail", "PrimaryEmail"],
         ["SecondEmail", "SecondEmail"],
         ["ScreenName", "_AimScreenName"], // NB: AIM.
          // Contact > Phones
         ["WorkPhone", "WorkPhone"],
         ["HomePhone", "HomePhone"],
         ["FaxNumber", "FaxNumber"],
         ["PagerNumber", "PagerNumber"],
         ["CellularNumber", "CellularNumber"],
          // Address > Home
         ["HomeAddress", "HomeAddress"],
         ["HomeAddress2", "HomeAddress2"],
         ["HomeCity", "HomeCity"],
         ["HomeState", "HomeState"],
         ["HomeZipCode", "HomeZipCode"],
         ["HomeCountry", "HomeCountry"],
         ["WebPage2", "WebPage2"],
          // Address > Work
         ["JobTitle", "JobTitle"],
         ["Department", "Department"],
         ["Company", "Company"],
         ["WorkAddress", "WorkAddress"],
         ["WorkAddress2", "WorkAddress2"],
         ["WorkCity", "WorkCity"],
         ["WorkState", "WorkState"],
         ["WorkZipCode", "WorkZipCode"],
         ["WorkCountry", "WorkCountry"],
         ["WebPage1", "WebPage1"],
          // Other > (custom)
         ["Custom1", "Custom1"],
         ["Custom2", "Custom2"],
         ["Custom3", "Custom3"],
         ["Custom4", "Custom4"],
          // Other > Notes
         ["Notes", "Notes"]];

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

