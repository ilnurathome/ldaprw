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


function debugabtoldap(str){
  dump("abtoldap.js: " + str);
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
  if (!vals) return null;
  if (vals.length=0) return null;
  var mod = CreateLDAPModification();
  debugabtoldap( "CreateLDAPMod: type=" + type + "\n" );
  mod.type = type;
  if (operation != undefined) mod.operation = operation;
  debugabtoldap( "CreateLDAPMod: operation=" + operation + "\n");
  mod.values = CreateNSMutArray();
  if ( mod.values instanceof Components.interfaces.nsIMutableArray ){
    debugabtoldap( "CreateLDAPMod: vals=" + vals + "\n" );   
    for (var i in vals) {
      if(vals[i] == null) {
        debugabtoldap("CreateLDAPMod: vals[" + i + "] is null\n");
        continue;
      }else{
      var val = CreateLdapBerVal();
//      debugabtoldap( "CreateLDAPMod: vals[" + i + "]=" + vals[i] + "\n" );
      val.setFromUTF8(vals[i], false);
      mod.values.appendElement(val, false);
      }
    }
  }
  if(mod.values.length = 0) return null;
  return mod;
}

function CreateLDAPModBin (type, vals, operation) {
  if (!vals) return null;
  if (vals.length=0) return null;
  var mod = CreateLDAPModification();
  debugabtoldap( "CreateLDAPMod: type=" + type + "\n" );
  mod.type = type;
  if (operation != undefined) mod.operation = operation;
  debugabtoldap( "CreateLDAPMod: operation=" + operation + "\n");
  mod.values = CreateNSMutArray();
  if ( mod.values instanceof Components.interfaces.nsIMutableArray ){
    debugabtoldap( "CreateLDAPMod: vals=" + vals + "\n" );   
    for (var i in vals) {
      if(!vals[i]) continue;
      var val = CreateLdapBerVal();
      debugabtoldap( "CreateLDAPMod: vals[" + i + "]=" + vals[i] + "\n" );
      val.set( vals[i].length , vals[i]);
      mod.values.appendElement(val, false);
    }
  }
  if(mod.values.length = 0) return null;  
  return mod;
}





function ABtoLdap() {

  function genfun (from, to) {
    return function(operation) {
      //      debugabtoldap("from = " + from + " to = " + to + "\n");
      for (var i in to) {
        var mods =  CreateLDAPMod( to[i], [this.AbCard.getProperty( from, "")], operation );
        if (mods)
          this.LdapModifications.appendElement( mods, false  );
      }
    }
  }

  for (var i in this.__proto__) { 
    if (this.__proto__[i] instanceof Array){ 
      this[i]=  genfun(i, this.__proto__[i] ); 
    } 
  } 


  this.getattrs = function(){
    var attrs = new Array();
    for (var i in mapper.__proto__) {
      attrs[attrs.length] = i;
    };
    return attrs;
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
      var mods = CreateLDAPMod( "mail", [ this.AbCard.getProperty( "PrimaryEmail", ""), this.AbCard.getProperty( "SecondEmail", "")], operation );
      if (mods)
        this.LdapModifications.appendElement( mods , false  );
    }
    this.mail++;
  },

  SecondEmail: function(operation){ //["mail"],
    if (!this.mail){
      var mods = CreateLDAPMod( "mail", [ this.AbCard.getProperty( "PrimaryEmail", ""), this.AbCard.getProperty( "SecondEmail", "")], operation );
      if (mods)
        this.LdapModifications.appendElement( mods , false  );
    }
    this.mail++;
  },
  
  PreferMailFormat: function(operation){
   var mods;
   var mailformat = this.AbCard.getProperty( "PreferMailFormat", 0);
   if (mailformat == 2) {   
     mods = CreateLDAPMod("mozillaUseHtmlMail", ["TRUE"], operation );
   } else if (mailformat == 1) {
     mods = CreateLDAPMod("mozillaUseHtmlMail", ["FALSE"], operation );
   } else if (mailformat == 0) {
     mods = CreateLDAPMod("mozillaUseHtmlMail", ["FALSE"], Components.interfaces.nsILDAPModification.MOD_DELETE );
   }
   if (mods)
     this.LdapModifications.appendElement( mods, false  );     
  },

          // Contact > Phones
  WorkPhone: ["telephoneNumber"],
  HomePhone: ["homePhone"],
  FaxNumber: ["facsimileTelephoneNumber"], // ["fax"], //
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
                     var file = pfile;
                     var fileStream = Components.classes['@mozilla.org/network/file-input-stream;1'].createInstance(Components.interfaces.nsIFileInputStream);
                     fileStream.init(file, -1, -1, false);  
                     var binaryStream = Components.classes['@mozilla.org/binaryinputstream;1'].createInstance(Components.interfaces.nsIBinaryInputStream);  
                     binaryStream.setInputStream(fileStream);  
                     var array = binaryStream.readByteArray(fileStream.available());  

                     var mods = CreateLDAPModBin("jpegPhoto", [array], operation);
                     if (mods)
                       this.LdapModifications.appendElement( mods,false);
                     binaryStream.close();  
                     fileStream.close();  
                   }
               };
             }
}



function MLtoLdap() {

  function genfun (from, to) {
    return function(operation) {
      //      debugabtoldap("from = " + from + " to = " + to + "\n");
      for (var i in to) {
        var mods =  CreateLDAPMod( to[i], [this.ml.card.getProperty( from, "")], operation );
        if (mods)
          this.LdapModifications.appendElement( mods, false  );
      }
    }
  }

  for (var i in this.__proto__) { 
    if (this.__proto__[i] instanceof Array){ 
      this[i]=  genfun(i, this.__proto__[i] ); 
    } 
  } 

  this.getattrs = function(){
    var attrs = new Array();
    for (var i in mapper.__proto__) {
      attrs[attrs.length] = i;
    };
    return attrs;
  }

  this.map = function(ml, LdapModifications, oldmaillist) {
         debugabtoldap("mailing list map begin\n");
         this.LdapModifications = LdapModifications;
         this.ml = ml;


         if (ml.card == undefined ){
           throw "MLtoLdap.map ml.card does not exists";
         }
         if (! (ml.card instanceof Components.interfaces.nsIAbCard) ){
           throw "MLtoLdap.map ml.card does not nsIAbCard";
         }

         var props = this.ml.card.properties;

         while ( props.hasMoreElements() ){
           var attr = props.getNext();
           if (attr instanceof Components.interfaces.nsIProperty){
             //if (attr.value){
               if( this[attr.name]==undefined ) continue;
               if( oldmaillist == undefined ) {
                 this[attr.name]( Components.interfaces.nsILDAPModification.MOD_ADD | Components.interfaces.nsILDAPModification.MOD_BVALUES );
               } else {
                 var oldprop = oldmaillist.card.getProperty(attr.name, null);
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

 
         /*
          * Temprorary variant
          * What to fill the member attribute???
          * cn=test test, mail=test@test
          * or
          * full dn to card entry
          * cn=test test, ou=addressbook, dc=domain, dc=local
          * ???
          * */
         if (ml.node == undefined ) {
           throw "MLtoLdap.map ml.node does not exists";
         }
         if ( !(ml.node instanceof Components.interfaces.nsIAbDirectory) ) {
           throw "MLtoLdap.map ml.node does not nsIAbDirectory";
         }
        var addresslistenum = ml.node.addressLists.enumerate();
         var members = new Array();
         while( addresslistenum.hasMoreElements() ){
           var card = addresslistenum.getNext();
           if ( card instanceof Components.interfaces.nsIAbCard ){
             members[members.length] = "cn=" + card.displayName + ",mail=" + card.primaryEmail;
           }          
         }

         debugabtoldap("mailing list map processing\n");

         if ( oldmaillist == undefined ) {
           var operation = Components.interfaces.nsILDAPModification.MOD_ADD | Components.interfaces.nsILDAPModification.MOD_BVALUES;
           var mods = CreateLDAPMod( "member", members, operation );
           if (mods)
             this.LdapModifications.appendElement( mods, false  );
         } else {
           throw "MLtoLdap.map Not implemented";
         }
         return ;
       }
}

MLtoLdap.prototype = {

  DisplayName: ["cn"], //["commonname"],
  NickName: ["mozillaNickname"], //["xmozillanickname"],
  Department: ["ou"], //["department", "departmentnumber", "orgunit"],
  Company: ["o"], //["company"],
  Notes:   ["description"],//["notes"], //
  description:   ["description"],//["notes"], //
}

