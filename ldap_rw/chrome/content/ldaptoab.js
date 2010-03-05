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


function debugldaptoab(str){
  //dump("ldaptoab.js: " + str);
}

function dumperrors(str){
   dump(str + "\n");
   alert(str);
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
      this[met]=   genfun(met, this.__proto__[met] ); 
    } 
  } 

  this.getattrs = function(){
    var attrs = new Array();
    for (var i in this.__proto__) {
      if ( i == "dn" ) continue;
      attrs[attrs.length] = i;
    };
    return attrs;
  }

  // yield not work? why?
  // this.attriter = function(){
  //   for( var i in this.__proto__){
  //     yield i;
  //   }
  // }

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

