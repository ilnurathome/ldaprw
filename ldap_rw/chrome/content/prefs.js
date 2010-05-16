function dumperrors(str){
       dump(str+ "\n");
       alert(str);
}

var defaultpref = {
  objClasses:  "inetorgperson, mozillaAbPersonAlpha, organizationalPerson,person",
  maillistClasses: "groupOfNames",
  attrRdn: "cn",
  basisRdn: "DisplayName"
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
              return abManager.getDirectory( "moz-abmdbdirectory://" + this.filename );
            }
         };

        try{
         list[key].bookname = key;
         list[key].binddn = myprefs.getCharPref(key + ".auth.dn");
         list[key].uri = myprefs.getCharPref(key + ".uri");
         list[key].attrRdn = MygetCharPref(myprefs, key + ".attrRdn", defaultpref.attrRdn);
         list[key].basisRdn = MygetCharPref(myprefs, key + ".basisRdn", defaultpref.basisRdn);
         list[key].objClasses = MygetCharPref(myprefs,key + ".objClasses", defaultpref.objClasses);
         list[key].maillistClasses = MygetCharPref(myprefs,key + ".maillistClasses", defaultpref.maillistClasses);
         list[key].maxHits = myprefs.getIntPref(key + ".maxHits");

         list[key].objClassesAR = list[key].objClasses.replace(/\s*/g, '').split(",");
         list[key].maillistClassesAR = list[key].maillistClasses.replace(/\s*/g, '').split(",");                     

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

