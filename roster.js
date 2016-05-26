var gcHttp = require("./util/httpUtil.js");
var parse = require("./util/parseWebpage.js");

module.exports = {
  get: getRoster
};

function getRoster(season, name, teamId, callback) {
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
      
      callback(roster);
    }
  };
  
  var getData = gcHttp.get("https://gc.com/t/" + season + "/" + name + "-" + teamId + "/roster", callbackPostProcess);
}