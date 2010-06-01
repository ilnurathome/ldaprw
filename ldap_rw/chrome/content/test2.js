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