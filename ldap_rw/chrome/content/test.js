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

// var win = window.open("chrome://messenger/content/addressbook/addressbook.xul", "AddressBook", "chrome");

var messgs=[]; 
function callbacksearchres(aMsg){ 
  messgs[messgs.length] = aMsg; 
}

function gensearchquery(query, filter) { 
  var querycount = 0; 
  return function (aMsg) {
    dump("searchquery:" + query + "\t" + querycount + "\n");
    if (aMsg != undefined ){
      dump("aMsg.errorCode:"+aMsg.errorCode + "\n");
    } 
    if ( querycount < 1 ) { 
      querycount++; return {dn: query, filter: filter } ; 
    } return null;
  }
}


var mapper = new LdaptoAB(); 
var attrs = new Array();
for (var i in mapper.__proto__) {
  if ( i == "dn" ) continue; 
  attrs[attrs.length] = i; 
}; 

var curpref = getprefs().ldapsync
getpassword = gengetpassword(curpref.uri); 
ldap = new LdapDataSource();

ldap.init(attrs, curpref.maxHits);


var book =getprefs().ldapsync.book;

var allcards = book.childCards;

var cards=[];
var rdns=[];
var filter="";

while( cards.length<10 && allcards.hasMoreElements()){ 
  var card = allcards.getNext();
  if( ! (card instanceof Components.interfaces.nsIAbCard) ) 
    throw Error("Some Error");
  cards[cards.length] = card;
  var dn = card.getProperty("dn","");
  var rdn = dn.split(',')[0].replace(/^\s+|\s+$/g,''); 
  rdns[rdns.length]=rdn; 
  filter += "(" + rdn + ")";
}

var filt = "(|" + filter + ")";

messgs=[]
ldap.query(curpref.queryURL, curpref.binddn, getpassword , gensearchquery(curpref.queryURL.dn, filt), callbacksearchres);

for (var i in messgs){ 
  dump(messgs[i].dn + "\n"); 
}





load("chrome://ldaprw/content/abtoldap.js"); 
load("chrome://ldaprw/content/ldaptoab.js"); 
load("chrome://ldaprw/content/ldapsource.js");
load("chrome://ldaprw/content/sync.js");
load("chrome://ldaprw/content/prefs.js");



 var count_sa=0; 
 var count_ua=0; 
 var count_aa=0; 
 var count_sg=0; 
 var count_ug=0; 
 var count_ag=0; 

 var count_s=0; 
 var count_u=0; 
 var count_a=0; 
 function mystat(type, msg){ 
   switch(type) { 
     case QUEUESEARCHADD: count_s++; count_sa++; break; 
     case QUEUESEARCHGET: count_s--; count_sg++; break; 
     case QUEUEUPDATEADD: count_u++; count_ua++; break; 
     case QUEUEUPDATEGET: count_u--; count_ug++; break; 
     case QUEUEADDADD: count_a++; count_aa++; break; 
     case QUEUEADDGET: count_a--; count_ag++; break;
   } 
   dump(type + "\t" + msg 
       + " " + count_s+" "+count_u+" "+count_a
       + " " + count_sa+" "+count_ua+" "+count_aa
       + " " + count_sg+" "+count_ug+" "+count_ag
       +"\n"); 
 }
ldapsync(mystat);
