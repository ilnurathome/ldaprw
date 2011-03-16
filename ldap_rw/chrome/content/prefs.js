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

var escapeRDNre = /([\\\",=<>#;+])/g;

function dumperrors(str){
       dump(str+ "\n");
       alert(str);
}

var defaultpref = {
  objClasses:  "inetorgperson, mozillaAbPersonAlpha, organizationalPerson,person",
  maillistClasses: "groupOfNames",
  attrRdn: "cn",
  basisRdn: "DisplayName",
};

function getprefs(){
  // Used for resolve simple problems with preferences such as unexisten value
  function MygetCharPref(pref, key, unexists){ 
    try {
      return pref.getCharPref(key);
    }catch(e) {
      return unexists;
    }
  }
  // Used for resolve simple problems with preferences such as unexisten value
  function MygetIntPref(pref, key, unexists){ 
    try {
      return pref.getIntPref(key);
    }catch(e) {
      return unexists;
    }
  }
  var list = new Array();
  
  var prefs = Components.classes["@mozilla.org/preferences-service;1"] .getService(Components.interfaces.nsIPrefService);

  var myprefs = prefs.getBranch("extensions.ldaprw.ldap_2.servers.");

  var count = { value: 0 };  
  var mychilds = myprefs.getChildList("", count);
  if (mychilds instanceof Array) {
    for (var c in mychilds){
      var key = mychilds[c].split('.')[0];
      if ( list[key] == undefined ) {
         list[key] = {
           get queryURL() { 
             return Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(this.uri, null, null).QueryInterface(Components.interfaces.nsILDAPURL) },
           get book() {
              var abManager = Components.classes["@mozilla.org/abmanager;1"].getService(Components.interfaces.nsIAbManager);              
              return new dirWrapper(abManager.getDirectory( "moz-abmdbdirectory://" + this.filename ) );
            }
         };

        try{
         list[key].bookname = key;
         list[key].binddn = myprefs.getCharPref(key + ".auth.dn");
         list[key].uri = myprefs.getCharPref(key + ".uri");
         list[key].attrRdn = MygetCharPref(myprefs, key + ".attrRdn", defaultpref.attrRdn);
         list[key].basisRdn = MygetCharPref(myprefs, key + ".basisRdn", defaultpref.basisRdn);
         list[key].genRdn = compiler(list[key].basisRdn);
         list[key].objClasses = MygetCharPref(myprefs,key + ".objClasses", defaultpref.objClasses);
         list[key].maillistClasses = MygetCharPref(myprefs,key + ".maillistClasses", defaultpref.maillistClasses);
         list[key].maxHits = myprefs.getIntPref(key + ".maxHits");

         list[key].objClassesAR = list[key].objClasses.replace(/\s*/g, '').split(",");
         list[key].maillistClassesAR = list[key].maillistClasses.replace(/\s*/g, '').split(",");              

         list[key].liveaccepted = MygetIntPref(myprefs, key + ".liveaccepted", 0);
         list[key].liveduration = MygetIntPref(myprefs, key + ".liveduration", 0);

          var abprefs = prefs.getBranch("ldap_2.servers." + key + ".");
          list[key].description= abprefs.getCharPref("description");
          list[key].dirType=    abprefs.getIntPref("dirType");
          list[key].filename=   abprefs.getCharPref("filename");          
        } catch(e) {
          if (window.location != "chrome://ldaprw/content/prefs.xul"){
            dumperrors("Error getprefs " + e + "\n"
                   + "Please check preferences");
            window.open("chrome://ldaprw/content/prefs.xul", "Preferences", "chrome");
          }
        }
      }
    }
  }
  return list;
}

function setpref(newpref) {

  var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
  prefs = prefs.getBranch("extensions.ldaprw.");
  var prefix = "ldap_2.servers." + newpref.bookname;
  prefs.setCharPref( prefix + ".auth.dn", newpref.binddn);
  prefs.setCharPref( prefix + ".uri", newpref.uri);

  prefs.setCharPref( prefix + ".attrRdn", newpref.attrRdn);
  prefs.setCharPref( prefix + ".basisRdn", newpref.basisRdn);
  prefs.setCharPref( prefix + ".objClasses", newpref.objClasses);
  prefs.setCharPref( prefix + ".maillistClasses", newpref.maillistClasses);

  prefs.setIntPref( prefix + ".maxHits", newpref.maxHits);

  prefs.setIntPref( prefix + ".liveaccepted", newpref.liveaccepted);
  prefs.setIntPref( prefix + ".liveduration", newpref.liveduration);
}

function delpref(bookname) {
  var prefs = Components.classes["@mozilla.org/preferences-service;1"] .getService(Components.interfaces.nsIPrefService);
  prefs = prefs.getBranch("extensions.ldaprw.ldap_2.servers.");
  prefs.deleteBranch(bookname);
}


function testsetpref() {
  var prefs = Components.classes["@mozilla.org/preferences-service;1"] .getService(Components.interfaces.nsIPrefService);
  prefs = prefs.getBranch("extensions.ldaprw.");
  prefs.setCharPref("ldap_2.servers.ldapsync.auth.dn", "uid=ilnur,ou=people,dc=local");
  prefs.setCharPref("ldap_2.servers.ldapsync.uri", "ldap://ilnurhp.local/ou=addressbook,dc=local??sub?(|(objectClass=person)(objectClass=inetOrgPerson))");
  prefs.setCharPref("ldap_2.servers.ldapsync.uri", "ldap://ilnurhp.local/ou=addressbook,dc=local??sub?(objectClass=*)");
}



// very very simple compiler
function compiler(str){
  // temprorary regexp
  //var re = /(?:[A-z\d]+)|(?:\+)|(?:\'[^']+\')/g;
  //var re = /[A-z\d]+|\+|\'[^']+\'/g;
  //var re =  /(?:[A-z\d]+)|(?:\'[^']+\')/g;
  //var re =  /[A-z\d]+|\'[^']+\'/g;
  var re = /\s*\+\s*/;
  var minrandom = 1000;
  var maxrandom = 9999;

  var env0 = {
     systime: function() {return (new Date()).getTime();},
     random:  function() {
       return Math.floor(Math.random() * (maxrandom-minrandom+1) ) + minrandom;
     }
  }

  //var strgr = str.match(re);
  var strgr = str.split(re);
  if (!strgr || strgr.length==0 || !strgr[0].match(/[A-z]+/)) throw "Syntax error";
  var length = strgr.length;

  var commands = []; //[{cmd:func, out:reg1, in: reg1}]
//  var registres = [0];
//  var registresL = registres.length;

  for (var i=0; i<length; i++) {
    var cmd = strgr[i];
    if ( env0[cmd] ) {
      commands[commands.length] = env0[cmd];
      continue;
    };
    var cmdgr = cmd.match(/\'([^']+)\'/);
    if (cmdgr) {
      commands[commands.length] = function(str) { return function() {return str} }(cmdgr[1]);
      continue;
    };
    commands[commands.length] = function(prop){ return function(card) { return card.getProperty(prop,"").replace(escapeRDNre, "\\$1");} }(strgr[i]);
  }

  return function(card) {
    //var res = [];
//    commands.forEach( function(value){return res[res.length]=value(card); } );
    var l = commands.length;
    var res = "";
    for (var i=0; i<l; i++){
    //  res[res.length] = commands[i](card);
       res +=  commands[i](card);
    }
    return res; //res.join('');
  };
}


