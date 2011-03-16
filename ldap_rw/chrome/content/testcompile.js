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


