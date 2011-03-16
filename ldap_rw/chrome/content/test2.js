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

load("chrome://ldaprw/content/abtoldap.js"); 
load("chrome://ldaprw/content/ldaptoab.js"); 
load("chrome://ldaprw/content/ldapsource.js");
load("chrome://ldaprw/content/sync.js");
load("chrome://ldaprw/content/prefs.js");
load("chrome://ldaprw/content/utils.js");

var prefs = getprefs();
var pref = prefs.ldapsync;
var abManager = Components.classes["@mozilla.org/abmanager;1"].getService(Components.interfaces.nsIAbManager);

var card = Components.classes["@mozilla.org/addressbook/cardproperty;1"].createInstance(Components.interfaces.nsIAbCard); 
card.displayName = "testCard";


var mybook = pref.book; 
var queryURL = pref.queryURL; 
var mapper = new LdaptoAB(); 
var mappertoldap = new ABtoLdap(); 
var newcards = new Array(); 
var mymsgs = new Array(); 
function callbacksearchresult(aMsg) { 
       mymsgs[mymsgs.length] = aMsg; 
} 

var mymsgs2 = new Array(); 
var mymdn = new Array();

function callback(aMsg, mdn) {
    if( mdn != undefined ) mymdn[mymdn.length] = mdn
    if(aMsg == undefined || aMsg.errorCode == Components.interfaces.nsILDAPErrors.SUCCESS) 
        return {dn: "cn=illll,ou=addressbook,dc=local", filter: "(objectclass=" + pref.objClassesAR[0] + ")"}; 
    mymsgs2[mymsgs2.length] = aMsg; 
}

var ldap = new LdapDataSource();

  var attrs = new Array(); 
  attrs[attrs.length]="objectClass";
  for (var i in mapper.__proto__) { 
    attrs[attrs.length] = i; 
  };
  
  ldap.init(attrs);

ldap.query(queryURL, pref.binddn, gengetpassword(), callback, callbacksearchresult );

/*
  in command shell
  /usr/lib64/mozldap/ldapsearch -b "cn=test,ou=addressbook,dc=local" "(objectClass=*)" 
*/
