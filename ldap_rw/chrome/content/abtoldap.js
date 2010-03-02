function debugabtoldap(str){
//  dump("abtoldap.js: " + str);
}

/*
load("chrome://ldaprw/content/abtoldap.js");                                                          
 */

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
  debugabtoldap( "CreateLDAPMod: type=" + type + "\n" );
  mod.type = type;
  if (operation != undefined) mod.operation = operation;
  debugabtoldap( "CreateLDAPMod: operation=" + operation + "\n");
  mod.values = CreateNSMutArray();
  if ( mod.values instanceof Components.interfaces.nsIMutableArray ){
    debugabtoldap( "CreateLDAPMod: vals=" + vals + "\n" );   
    for (var i in vals) {
      var val = CreateLdapBerVal();
//      debugabtoldap( "CreateLDAPMod: vals[" + i + "]=" + vals[i] + "\n" );
      val.setFromUTF8(vals[i], false);
      mod.values.appendElement(val, false);
    }
  }
  return mod;
}

function CreateLDAPModBin (type, vals, operation) {
  var mod = CreateLDAPModification();
  debugabtoldap( "CreateLDAPMod: type=" + type + "\n" );
  mod.type = type;
  if (operation != undefined) mod.operation = operation;
  debugabtoldap( "CreateLDAPMod: operation=" + operation + "\n");
  mod.values = CreateNSMutArray();
  if ( mod.values instanceof Components.interfaces.nsIMutableArray ){
    debugabtoldap( "CreateLDAPMod: vals=" + vals + "\n" );   
    for (var i in vals) {
      var val = CreateLdapBerVal();
      debugabtoldap( "CreateLDAPMod: vals[" + i + "]=" + vals[i] + "\n" );
      val.set( vals[i].length , vals[i]);
      mod.values.appendElement(val, false);
    }
  }
  return mod;
}





function ABtoLdap() {

  function genfun (from, to) {
    return function(operation) {
      //      debugabtoldap("from = " + from + " to = " + to + "\n");
      for (var i in to) {
        this.LdapModifications.appendElement( CreateLDAPMod( to[i], [this.AbCard.getProperty( from, "")], operation ), false  );
      }
    }
  }

  for (var i in this.__proto__) { 
    if (this.__proto__[i] instanceof Array){ 
//      this.__proto__[i]=   genfun(i, this.__proto__[i] ); 
      this[i]=   genfun(i, this.__proto__[i] ); 
    } 
  } 


  this.map = function(AbCard, LdapModifications, OldCard) {
         this.LdapModifications = LdapModifications;
         this.AbCard = AbCard;
         this.mail =0;

         debugabtoldap("map begin\n");

         var props = this.AbCard.properties;


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
                    debugabtoldap("mod attr=" + attr.name + "\n" ); // + attr.value + "\n");                    
                   }
                 }else {
                   this[attr.name]( Components.interfaces.nsILDAPModification.MOD_ADD | Components.interfaces.nsILDAPModification.MOD_BVALUES );
                   debugabtoldap("add attr=" + attr.name + "\n"); // + "\t" + attr.value + "\n");
                 }
               }
             //}
           }
         }
         return ;
       }
}

ABtoLdap.prototype = {
/*
  dn: function(operation) {
        this.LdapModifications.appendElement( CreateLDAPMod("dn", [this.AbCard.getProperty("dn","")], operation));
      },
*/
 // TestTest : ["ldaptest"],
  // Contact > Name
  FirstName : ["givenName"],

  LastName: ["sn"], //["surname"],

  DisplayName: ["cn"], //["commonname"],

  NickName: ["mozillaNickname"], //["xmozillanickname"],

          // Contact > Internet
  PrimaryEmail: function(operation){ //["mail"],
    if (!this.mail){
      this.LdapModifications.appendElement( CreateLDAPMod( "mail", [ this.AbCard.getProperty( "PrimaryEmail", ""), this.AbCard.getProperty( "SecondEmail", "")], operation ), false  );
    }
    this.mail++;
  },

  SecondEmail: function(operation){ //["mail"],
    if (!this.mail){
      this.LdapModifications.appendElement( CreateLDAPMod( "mail", [ this.AbCard.getProperty( "PrimaryEmail", ""), this.AbCard.getProperty( "SecondEmail", "")], operation ), false  );
    }
    this.mail++;
  },

          // Contact > Phones
  WorkPhone: ["telephoneNumber"],
  HomePhone: ["homePhone"],
  FaxNumber: ["facsimiletelephonenumber"], // ["fax"], //
  PagerNumber: ["pager"],
  CellularNumber: ["mobile"], //["cellphone", "carphone"],
  _AimScreenName: ["nsAIMid"],


          // Address > Home
  HomeAddress: ["mozillaHomeStreet"],
  HomeAddress2: ["mozillaHomeStreet2"],
  HomeCity: ["mozillaHomeLocalityName"],
                
  HomeState: ["mozillaHomeState"],
  HomeZipCode: ["mozillaHomePostalCode"],
  HomeCountry: ["mozillaHomeCountryName"],
  WebPage2: ["mozillaHomeUrl"], //["homeurl"],



          // Address > Work
  JobTitle: ["title"],
  Department: ["ou"], //["department", "departmentnumber", "orgunit"],
  Company: ["o"], //["company"],
  WorkAddress: ["street"], //["streetaddress", "postOfficeBox"],
  WorkAddress2: ["mozillaWorkStreet2"],
  WorkCity: ["l"], //["locality"],
  WorkState: ["st"], //["region"],
  WorkZipCode: ["postalCode"], //["zip"],
  WorkCountry: ["c"], // my be to use objClass friendlyCountry RFC 4524 //["countryname"],
  WebPage1: ["mozillaWorkUrl"], //["labeledURI"],



          // Other > (custom)
  Custom1: ["mozillaCustom1"],//["custom1"], //
  Custom2: ["mozillaCustom2"],//["custom2"], //
  Custom3: ["mozillaCustom3"],//["custom3"], //
  Custom4: ["mozillaCustom4"],//["custom4"], //
         // Other > Notes
  Notes:   ["description"],//["notes"], //

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
                     //var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
                     //file.initWithFile(pfile);  
                     var file = pfile;
                     var fileStream = Components.classes['@mozilla.org/network/file-input-stream;1'].createInstance(Components.interfaces.nsIFileInputStream);
                     fileStream.init(file, -1, -1, false);  
                     var binaryStream = Components.classes['@mozilla.org/binaryinputstream;1'].createInstance(Components.interfaces.nsIBinaryInputStream);  
                     binaryStream.setInputStream(fileStream);  
                     var array = binaryStream.readByteArray(fileStream.available());  
//                     var bytes = binaryStream.readBytes(fileStream.available());  

                     this.LdapModifications.appendElement( CreateLDAPModBin("jpegPhoto", [array], operation),false);
//                     this.LdapModifications.appendElement( CreateLDAPModBin("jpegPhoto", [bytes], operation),false);

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
       debugabtoldap(e+"\n"); 
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

