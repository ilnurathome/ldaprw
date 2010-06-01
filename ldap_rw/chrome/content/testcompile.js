
load("chrome://ldaprw/content/prefs.js");

///////// copy from compiler
systime = function() {return (new Date()).getTime();};
  var minrandom = 1000;
  var maxrandom = 9999;
random = function() { return Math.floor(Math.random() * (maxrandom-minrandom+1) ) + minrandom; }
//////////////////////////////

var progsys = function(card) {
  return card.getProperty('DisplayName','') + '-' + card.getProperty('LastName','') + '-' + systime();
};

// rename _eval_ to eval before test
var progeval = function(card) {
  return _eval_("card.getProperty('DisplayName','') + '-' + card.getProperty('LastName','') + '-' + systime() ");
};


var prog = compiler("DisplayName + '-' + LastName + '-' +systime");
var prograndom = compiler("DisplayName + '-' + LastName + '-' +systime + '-' + random");

var card = Components.classes["@mozilla.org/addressbook/cardproperty;1"].createInstance(Components.interfaces.nsIAbCard); 
card.displayName = "testCard";
card.lastName="test"

function bench(n, func, card){
  var start = new Date();
  for( var i=n; i--; ){
    func(card);
  }
  var end = new Date();
  return end - start;
}


// run manually
var n = 100000;

var timeeval = bench(n, progeval, card);
print(n/timeeval);

var time = bench(n, prog, card);
print(n/time);
print(timeeval/time); // about 1.33

var timesys = bench(n, progsys, card);
print(n/timesys);
print(timeeval/timesys); // about 1.40
print(time/timesys); // about 1.05 


