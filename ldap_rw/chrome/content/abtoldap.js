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

function CreateLDAPMod (type, vals, operation) {
  var mod = CreateLDAPModification();
  dump( "CreateLDAPMod: type=" + type + "\n" );
  mod.type = type;
  if (operation != undefined) mod.operation = operation;
  dump( "CreateLDAPMod: operation=" + operation + "\n");
  mod.values = CreateNSMutArray();
  if ( mod.values instanceof Components.interfaces.nsIMutableArray ){
    dump( "CreateLDAPMod: vals=" + vals + "\n" );   
    for (var i in vals) {
      var val = CreateLdapBerVal();
      dump( "CreateLDAPMod: vals[" + i + "]=" + vals[i] + "\n" );
      val.setFromUTF8(vals[i], false);
      mod.values.appendElement(val, false);
    }
  }
  return mod;
}

function ABtoLdap() {
  this.map = function(AbCard, LdapModifications, OldCard) {
         this.LdapModifications = LdapModifications;
         this.AbCard = AbCard;

         dump("map begin\n");

         var props = this.AbCard.properties;
         var dn = this.AbCard.getProperty("dn",null);
         if ( dn == null) {
           this.LdapModifications.appendElement( CreateLDAPMod( "objectClass", ["top", "person", "inetorgperson" ] ), false );
         }

         while ( props.hasMoreElements() ){
           var attr = props.getNext();
           if (attr instanceof Components.interfaces.nsIProperty){
             //if (attr.value){
               if( this[attr.name]==undefined ) continue;
               if( OldCard == undefined ) {
                 this[attr.name]( Components.interfaces.nsILDAPModification.MOD_ADD | Components.interfaces.nsILDAPModification.MOD_BVALUES );
               } else {
                 var oldprop = OldCard.getProperty(attr.name, null);
                 if ( oldprop != null ){
                   if ( oldprop != attr.value ){
                     this[attr.name]( Components.interfaces.nsILDAPModification.MOD_REPLACE | Components.interfaces.nsILDAPModification.MOD_BVALUES );
                    dump("mod attr=" + attr.name + "\t" + attr.value + "\n");                    
                   }
                 }else {
                   this[attr.name]( Components.interfaces.nsILDAPModification.MOD_ADD | Components.interfaces.nsILDAPModification.MOD_BVALUES );
                   dump("add attr=" + attr.name + "\t" + attr.value + "\n");
                 }
               }
             //}
           }
         }
         return dn;
       }
}

ABtoLdap.prototype = {
/*
  dn: function(operation) {
        this.LdapModifications.appendElement( CreateLDAPMod("dn", [this.AbCard.getProperty("dn","")], operation));
      },
*/
  // Contact > Name
  FirstName : function(operation) {
                this.LdapModifications.appendElement( CreateLDAPMod("givenName", [this.AbCard.firstName], operation) , false);
              },

  LastName: function(operation) {
                this.LdapModifications.appendElement( CreateLDAPMod("sn", [this.AbCard.firstName], operation) , false);
                //this.LdapModifications.appendElement( CreateLDAPMod("surname", [this.AbCard.firstName], operation) , false);
            },

  DisplayName: function(operation) {
                this.LdapModifications.appendElement( CreateLDAPMod("cn", [this.AbCard.displayName], operation) , false);
                //this.LdapModifications.appendElement( CreateLDAPMod("commonname", [this.AbCard.displayName], operation) , false);
            },

  NickName: function(operation) {
                this.LdapModifications.appendElement( CreateLDAPMod("mozillaNickname", [this.AbCard.getProperty("NickName")], operation) , false);
                this.LdapModifications.appendElement( CreateLDAPMod("xmozillanickname", [this.AbCard.getProperty("NickName","")], operation) , false);
            },



          // Contact > Internet
  PrimaryEmail: function(operation) {
                  this.LdapModifications.appendElement( CreateLDAPMod("mail", [this.AbCard.getProperty("PrimaryEmail", "")], operation ), false  );
                } ,
  SecondEmail: function(operation) {
                  this.LdapModifications.appendElement( CreateLDAPMod("mail", [this.AbCard.getProperty("PrimaryEmail", "")], operation ), false  );
               },



          // Contact > Phones
  WorkPhone: function(operation) {
               this.LdapModifications.appendElement( CreateLDAPMod("telephoneNumber", [this.AbCard.getProperty("WorkPhone", "")], operation),false);
             },
  HomePhone: function(operation) {
               this.LdapModifications.appendElement( CreateLDAPMod("homePhone", [this.AbCard.getProperty("HomePhone", "")], operation),false);
             },
  FaxNumber: function(operation) {
               this.LdapModifications.appendElement( CreateLDAPMod("fax", [this.AbCard.getProperty("FaxNumber", "")], operation),false);
               //this.LdapModifications.appendElement( CreateLDAPMod("facsimiletelephonenumber", [this.AbCard.getProperty("FaxNumber", "")], operation),false);
             },
  PagerNumber: function(operation) {
                 this.LdapModifications.appendElement( CreateLDAPMod("pager", [this.AbCard.getProperty("PagerNumber", "")], operation),false);
               },
  CellularNumber: function(operation) {
                    this.LdapModifications.appendElement( CreateLDAPMod("mobile", [this.AbCard.getProperty("CellularNumber", "")], operation),false);
                    //this.LdapModifications.appendElement( CreateLDAPMod("cellphone", [this.AbCard.getProperty("CellularNumber", "")], operation),false);
                    //this.LdapModifications.appendElement( CreateLDAPMod("carphone", [this.AbCard.getProperty("CellularNumber", "")], operation),false);
                  },


          // Address > Home
  HomeAddress: function(operation) {
                    this.LdapModifications.appendElement( CreateLDAPMod("mozillaHomeStreet", [this.AbCard.getProperty("HomeAddress", "")], operation),false);
               },
  HomeAddress2: function(operation) {
                  this.LdapModifications.appendElement( CreateLDAPMod("mozillaHomeStreet2", [this.AbCard.getProperty("HomeAddress2", "")], operation),false);
                },
  HomeCity: function(operation) {
              this.LdapModifications.appendElement( CreateLDAPMod("mozillaHomeLocalityName", [this.AbCard.getProperty("HomeCity", "")], operation),false);
            },
                
  HomeState: function(operation) {
                    this.LdapModifications.appendElement( CreateLDAPMod("mozillaHomeState", [this.AbCard.getProperty("HomeState", "")], operation),false);
             },
  HomeZipCode: function(operation) {
                    this.LdapModifications.appendElement( CreateLDAPMod("mozillaHomePostalCode", [this.AbCard.getProperty("HomeZipCode", "")], operation),false);
               },
  HomeCountry: function(operation) {
                    this.LdapModifications.appendElement( CreateLDAPMod("mozillaHomeCountryName", [this.AbCard.getProperty("HomeCountry", "")], operation),false);
               },
  WebPage2: function(operation) {
                    this.LdapModifications.appendElement( CreateLDAPMod("mozillaHomeUrl", [this.AbCard.getProperty("WebPage2", "")], operation),false);
                    //this.LdapModifications.appendElement( CreateLDAPMod("homeurl", [this.AbCard.getProperty("WebPage2", "")], operation),false);
            },



          // Address > Work
  JobTitle: function(operation) {
                    this.LdapModifications.appendElement( CreateLDAPMod("title", [this.AbCard.getProperty("JobTitle", "")], operation),false);
            },
  Department: function(operation) {
                    this.LdapModifications.appendElement( CreateLDAPMod("ou", [this.AbCard.getProperty("Department", "")], operation),false);
                    //this.LdapModifications.appendElement( CreateLDAPMod("department", [this.AbCard.getProperty("Department", "")], operation),false);
                    //this.LdapModifications.appendElement( CreateLDAPMod("departmentnumber", [this.AbCard.getProperty("Department", "")], operation),false);
                    //this.LdapModifications.appendElement( CreateLDAPMod("orgunit", [this.AbCard.getProperty("Department", "")], operation),false);
              },
  Company: function(operation) {
                    this.LdapModifications.appendElement( CreateLDAPMod("o", [this.AbCard.getProperty("Company", "")], operation),false);
                    //this.LdapModifications.appendElement( CreateLDAPMod("company", [this.AbCard.getProperty("Company", "")], operation),false);
           },
  WorkAddress: function(operation) {
                    this.LdapModifications.appendElement( CreateLDAPMod("street", [this.AbCard.getProperty("WorkAddress", "")], operation),false);
                    //this.LdapModifications.appendElement( CreateLDAPMod("streetaddress", [this.AbCard.getProperty("WorkAddress", "")], operation),false);
                    //this.LdapModifications.appendElement( CreateLDAPMod("postOfficeBox", [this.AbCard.getProperty("WorkAddress", "")], operation),false);
               },
  WorkAddress2: function(operation) {
                    this.LdapModifications.appendElement( CreateLDAPMod("mozillaWorkStreet2", [this.AbCard.getProperty("WorkAddress2", "")], operation),false);
                },
  WorkCity: function(operation) {
                    this.LdapModifications.appendElement( CreateLDAPMod("l", [this.AbCard.getProperty("WorkCity", "")], operation),false);
                    //this.LdapModifications.appendElement( CreateLDAPMod("locality", [this.AbCard.getProperty("WorkCity", "")], operation),false);
            },
  WorkState: function(operation) {
                    this.LdapModifications.appendElement( CreateLDAPMod("st", [this.AbCard.getProperty("WorkState", "")], operation),false);
                    //this.LdapModifications.appendElement( CreateLDAPMod("region", [this.AbCard.getProperty("WorkState", "")], operation),false);
             },
  WorkZipCode: function(operation) {
                    this.LdapModifications.appendElement( CreateLDAPMod("postalCode", [this.AbCard.getProperty("WorkZipCode", "")], operation),false);
                    //this.LdapModifications.appendElement( CreateLDAPMod("zip", [this.AbCard.getProperty("WorkZipCode", "")], operation),false);
               },
  WorkCountry: function(operation) {
                    this.LdapModifications.appendElement( CreateLDAPMod("c", [this.AbCard.getProperty("WorkCountry", "")], operation),false);
                    //this.LdapModifications.appendElement( CreateLDAPMod("countryname", [this.AbCard.getProperty("WorkCountry", "")], operation),false);
               },
  WebPage1: function(operation) {
                    this.LdapModifications.appendElement( CreateLDAPMod("mozillaWorkUrl", [this.AbCard.getProperty("WebPage1", "")], operation),false);
                    //this.LdapModifications.appendElement( CreateLDAPMod("labeledURI", [this.AbCard.getProperty("WebPage1", "")], operation),false);
            },



          // Other > (custom)
  Custom1: function(operation) {
                    this.LdapModifications.appendElement( CreateLDAPMod("custom1", [this.AbCard.getProperty("Custom1", "")], operation),false);
                    //this.LdapModifications.appendElement( CreateLDAPMod("mozillaCustom1", [this.AbCard.getProperty("Custom1", "")], operation),false);
           },
  Custom2: function(operation) {
                    this.LdapModifications.appendElement( CreateLDAPMod("custom2", [this.AbCard.getProperty("Custom2", "")], operation),false);
                    //this.LdapModifications.appendElement( CreateLDAPMod("mozillaCustom2", [this.AbCard.getProperty("Custom2", "")], operation),false);
           },
  Custom3: function(operation) {
                    this.LdapModifications.appendElement( CreateLDAPMod("custom3", [this.AbCard.getProperty("Custom3", "")], operation),false);
                    //this.LdapModifications.appendElement( CreateLDAPMod("mozillaCustom3", [this.AbCard.getProperty("Custom3", "")], operation),false);
           },
  Custom4: function(operation) {
                    this.LdapModifications.appendElement( CreateLDAPMod("custom4", [this.AbCard.getProperty("Custom4", "")], operation),false);
                    //this.LdapModifications.appendElement( CreateLDAPMod("mozillaCustom4", [this.AbCard.getProperty("Custom4", "")], operation),false);
           },
         // Other > Notes
  Notes: function(operation) {
                    this.LdapModifications.appendElement( CreateLDAPMod("notes", [this.AbCard.getProperty("Notes", "")], operation),false);
                    //this.LdapModifications.appendElement( CreateLDAPMod("description", [this.AbCard.getProperty("Notes", "")], operation),false);
         },

  PhotoName: function(operation) {
             },
  PhotoURI: function(operation) {
            },
  PhotoType: function(operation) {
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
                     var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
                     file.initWithFile(pfile);  
                     var fileStream = Components.classes['@mozilla.org/network/file-input-stream;1'].createInstance(Components.interfaces.nsIFileInputStream);
                     fileStream.init(file, 1, 0, false);  
                     var binaryStream = Components.classes['@mozilla.org/binaryinputstream;1'].createInstance(Components.interfaces.nsIBinaryInputStream);  
                     binaryStream.setInputStream(fileStream);  
                     var array = binaryStream.readByteArray(fileStream.available());  

                     this.LdapModifications.appendElement( CreateLDAPMod("jpegPhoto", [array], operation),false);

                     binaryStream.close();  
                     fileStream.close();  
                   }
               };
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

