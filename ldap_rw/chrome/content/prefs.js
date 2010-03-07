function dumperrors(str){
       dump(str+ "\n");
       alert(str);
}

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
//        list[key] = {};
         list[key] = {
            binddn:     myprefs.getCharPref(key + ".auth.dn"),
            uri:        myprefs.getCharPref(key + ".uri"),
            attrRdn:    myprefs.getCharPref(key + ".attrRdn"),
            objClasses: myprefs.getCharPref(key + ".objClasses"),
            maxHits:    myprefs.getIntPref(key + ".maxHits"),

            objClassesAR: myprefs.getCharPref(key + ".objClasses").replace(/\s*/g, '').split(","),
            get queryURL() { return Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(this.uri, null, null).QueryInterface(Components.interfaces.nsILDAPURL) },
          
          
            bookname:   key,
            get book() {
              var abManager = Components.classes["@mozilla.org/abmanager;1"].getService(Components.interfaces.nsIAbManager);              
              return abManager.getDirectory( "moz-abmdbdirectory://" + this.filename );
            }
          }

        try {
          var abprefs = prefs.getBranch("ldap_2.servers." + key + ".");
          list[key].description= abprefs.getCharPref("description");
          list[key].dirType=    abprefs.getIntPref("dirType");
          list[key].filename=   abprefs.getCharPref("filename");          
        } catch(e) {
          dumperrors("Error getprefs " + e + "\n"
                   + "Please check preferences");
          if (window.location != "chrome://ldaprw/content/prefs.xul")
            window.open("chrome://ldaprw/content/prefs.xul", "Preferences", "chrome");
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
  prefs.setCharPref( prefix + ".objClasses", newpref.objClasses);

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

