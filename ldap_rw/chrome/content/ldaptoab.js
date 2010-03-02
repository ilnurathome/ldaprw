function debugldaptoab(str){
  //dump("ldaptoab.js: " + str);
}

function dumperrors(str){
   dump(str + "\n");
}


/*
 var card = Components.classes["@mozilla.org/addressbook/cardproperty;1"] 
                      .createInstance(Components.interfaces.nsIAbCard);
 var mapper = new LdaptoAB();
 mapper.map(LDAPMessage, AbCard);
 */


function LdaptoAB() {

  function genfun (from, to) {
    return function(operation) {
      debugldaptoab("from = " + from + " to = " + to + " " + this.LDAPMessage.getValues( from ,{} ) +"\n");
      for (var prop in to) {
        var value = this.LDAPMessage.getValues( from ,{} );
        if ( value instanceof Array)
           this.AbCard.setProperty( to[prop] , value[0] );
      }
    }    
  }

  for (var met in this.__proto__) { 
    if (this.__proto__[met] instanceof Array){ 
//      this.__proto__[met]=   genfun(met, this.__proto__[met] ); 
      this[met]=   genfun(met, this.__proto__[met] ); 
    } 
  } 

    // example
  // var card = Components.classes["@mozilla.org/addressbook/cardproperty;1"]
  //                      .createInstance(Components.interfaces.nsIAbCard);
  // var mapper = new LdaptoAB();
  // mapper.map(ldapmessage, card);
  this.map = function(LDAPMessage, AbCard) {
    this.LDAPMessage = LDAPMessage;
    this.AbCard = AbCard;

    this.dn();

    var attrs = this.LDAPMessage.getAttributes({});
    for (var i in attrs) {
      if ( !attrs.hasOwnProperty(i) ) continue;
      if ( this[attrs[i]]==undefined ) continue;
      this[attrs[i]]();
    }
  }

}

LdaptoAB.prototype = {

  dn: function() {
        this.AbCard.setProperty("dn", this.LDAPMessage.dn );
      },
  
  //  Contact > NamefirstName
  //givenName: ["FirstName"],
  givenName: function() {
     this.AbCard.firstName = this.LDAPMessage.getValues( "givenName",{} );
  },
  //sn: ["LastName"],
  sn: function() {
     this.AbCard.lastName = this.LDAPMessage.getValues( "sn",{} );
  },
  //surname: ["LastName"],
  surname: function() {
     this.AbCard.lastName = this.LDAPMessage.getValues( "surname",{} );
  },

  //cn: ["DisplayName"], 
  cn: function() {
     this.AbCard.displayName = this.LDAPMessage.getValues( "cn",{} );
  },
  //commonname: ["DisplayName"], 
  commonname: function() {
     this.AbCard.displayName = this.LDAPMessage.getValues( "commonname",{} );
  },

  mozillaNickname: ["NickName"],
  xmozillanickname: ["NickName"],

  // Contact > Internet
  mail: function() {
          // PrimaryEmail
          var mails = this.LDAPMessage.getValues( "mail",{} );
          debugldaptoab("mails = " + mails + "\n");
          this.AbCard.primaryEmail = mails[0];
          debugldaptoab("mails[0] = " + mails[0] + "\n");
          if ( ! (mails[1]==undefined) ) {
             debugldaptoab("mails[1] = " + mails[1] + "\n");
             this.AbCard.setProperty("SecondEmail", mails[1]);
          } 
        },
  mozillaSecondEmail: ["SecondEmail"],
  xmozillasecondemail: ["SecondEmail"],
  nsAIMid: ["_AimScreenName"], 

  // Contact > Phones
  telephoneNumber: ["WorkPhone"], 
  homePhone: ["HomePhone"],  
  fax: ["FaxNumber"],  
  facsimiletelephonenumber: ["FaxNumber"],

  pager: ["PagerNumber"],
  pagerphone: ["PagerNumber"],
  
  mobile: ["CellularNumber"],
  cellphone: ["CellularNumber"],
  carphone: ["CellularNumber"],

  // Address > Home
  mozillaHomeStreet: ["HomeAddress"],
  mozillaHomeStreet2: ["HomeAddress2"],

  mozillaHomeLocalityName: ["HomeCity"],
  mozillaHomeState: ["HomeState"],
  mozillaHomePostalCode: ["HomeZipCode"],
  mozillaHomeCountryName: ["HomeCountry"],
  mozillaHomeUrl: ["WebPage2"],
  homeurl: ["WebPage2"],
    // Address > Work
  title: ["JobTitle"],
  ou: ["Department"],
  department: ["Department"],
  departmentnumber: ["Department"],
  orgunit: ["Department"],

  o: ["Company"],
  company: ["Company"],
  
  street: ["WorkAddress"],
  streetaddress: ["WorkAddress"],
  postOfficeBox: ["WorkAddress"],

  mozillaWorkStreet2: ["WorkAddress2"],

  l: ["WorkCity"],
  locality: ["WorkCity"],

  st: ["WorkState"],
  region: ["WorkState"],

  postalCode: ["WorkZipCode"],
  zip: ["WorkZipCode"],

  c: ["WorkCountry"],
  countryname: ["WorkCountry"],

  workurl: ["WebPage1"],
  mozillaWorkUrl: ["WebPage1"],
  labeledURI: ["WebPage1"],
            // Other > (custom)
  custom1: ["Custom1"],
  mozillaCustom1: ["Custom1"],
 
  custom2: ["Custom2"],
  mozillaCustom2: ["Custom2"],

  custom3: ["Custom3"],
  mozillaCustom3: ["Custom3"],

  custom4: ["Custom4"],
  mozillaCustom4: ["Custom4"],

    // Other > Notes
  description: ["Notes"],
  notes: ["Notes"],

  jpegPhoto: function() {   
    var dir = Components.classes["@mozilla.org/file/directory_service;1"]
                        .getService(Components.interfaces.nsIProperties)
                        .get("ProfD", Components.interfaces.nsIFile);  
    
    var file = Components.classes["@mozilla.org/file/local;1"]
                         .createInstance(Components.interfaces.nsILocalFile);
    
    dir.append("Photos");
    dir.append(this.LDAPMessage.dn + ".jpg");
    var fullpath = dir.path;

//    if( replace == undefined ) {
    if ( true ){
      file.initWithPath( fullpath );  
      if (file.exists())  
        file.remove(true);  
      file.create(file.NORMAL_FILE_TYPE, 0600);  
    } else {
      dir.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0600);
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
      this.AbCard.setProperty("PhotoURI", "file://" + fullpath);
      this.AbCard.setProperty("PhotoType", "file");
      this.AbCard.setProperty("PhotoName", this.LDAPMessage.dn + ".jpg" );
    } catch(e) {
      dumperrors(e + "\n");
    }
  
    binaryStream.close();  
    fileStream.close();
    
  },

  modifytimestamp: function() {
    var d = this.LDAPMessage.getValues("modifytimestamp", {} ).toString();
    var ldapdate = new Date ( Date.UTC (d.substring(0,4), d.substring(4,6) - 1, d.substring(6,8), d.substring(8,10), d.substring(10,12), d.substring(12,14) ) );

    this.AbCard.setProperty("LastModifiedDate", ldapdate.getTime().toString().substring(0,10));
  }

}

/*

   try{ 
     window.openDialog("chrome://messenger/content/addressbook/abEditCardDialog.xul", "", "chrome,resizable=no,modal,titlebar,centerscreen", {card:card}); 
     } catch(e){ 
       dumperrors(e+"\n"); 
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

