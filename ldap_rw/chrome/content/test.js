load("chrome://ldaprw/content/abtoldap.js"); 
load("chrome://ldaprw/content/ldaptoab.js"); 
load("chrome://ldaprw/content/ldapsource.js");
load("chrome://ldaprw/content/sync.js");
load("chrome://ldaprw/content/prefs.js");

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
