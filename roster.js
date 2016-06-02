var gcHttp = require("./util/httpUtil.js");
var parse = require("./util/parseWebpage.js");
var cache = require("./util/cache.js");

module.exports = {
  get: getRoster
};


function getRoster(season, name, teamId, callback) {
  var url = "https://gc.com/t/" + season + "/" + name + "-" + teamId + "/roster";
  
  var callbackPostProcess = function(dataString) {
    var jsonObject = parse.parse(dataString);
    
    if (jsonObject !== null) {
      // loop through entire roster to make the number an actual number
      for (var i= 0; i < jsonObject.roster.length; i++) {
        var item = jsonObject.roster[i];
        item.num = parseInt(item.num);        
      }
      
      // now we have the object, we can send it...
      var roster = jsonObject.roster;
      
      // set the roster into the cache.
      cache.set(roster, url);
      callback(roster);
    }
  };
  
  // see if we have the roster in the cache
  var teamRoster = cache.get(url);
  if (teamRoster)
    callback(teamRoster)
  else
    gcHttp.get(url, callbackPostProcess);
}