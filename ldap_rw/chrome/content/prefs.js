function getprefs(){
  var list = new Array();
  
  var prefs = Components.classes["@mozilla.org/preferences-service;1"] .getService(Components.interfaces.nsIPrefService);

  var myprefs = prefs.getBranch("extensions.ldaprw.ldap_2.servers.");

  var count = { value: 0 };  
  var mychilds = myprefs.getChildList("", count);
  if (mychilds instanceof Array) {
    for (var c in mychilds){
      var key = mychilds[c].split('.')[0];
      if ( list[key] == undefined ) {
        list[key] = {};
        var abprefs = prefs.getBranch("ldap_2.servers." + key + ".");
        list[key].binddn = myprefs.getCharPref(key + ".auth.dn");
        list[key].uri = myprefs.getCharPref(key + ".uri");

        list[key].description = abprefs.getCharPref("description");
        list[key].dirType = abprefs.getIntPref("dirType");
        list[key].filename = abprefs.getCharPref("filename");
      }
    }
  }
  return list;
}

function setpref() {
  var prefs = Components.classes["@mozilla.org/preferences-service;1"] .getService(Components.interfaces.nsIPrefService);
  prefs = prefs.getBranch("extensions.ldaprw.");
  prefs.setCharPref("ldap_2.servers.ldapsync.auth.dn", "uid=ilnur,ou=people,dc=local");
  prefs.setCharPref("ldap_2.servers.ldapsync.uri", "ldap://ilnurhp.local/ou=addressbook,dc=local??sub?(|(objectClass=person)(objectClass=inetOrgPerson))");
  prefs.setCharPref("ldap_2.servers.ldapsync.uri", "ldap://ilnurhp.local/ou=addressbook,dc=local??sub?(objectClass=*)");
}

