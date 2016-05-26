var gcHttp = require("./util/httpUtil.js");
var parse = require("./util/parseWebpage.js");
var filter = require("./util/filterUtil.js");
module.exports = {
  get: getSchedule
}

//#region Schedule
function getSchedule(season, name, teamId, callback) {
  var callbackProcessSchedule = function(dataString) {
    var jsonObject = parse.parse(dataString);
    if (jsonObject !== null) {
      // filter team events where eventtype == game and return those.
      var teamEvents = [];
      var jsonTeamEvents = jsonObject["team_events"];
      
      teamEvents = filter.filter(jsonTeamEvents, "event_type", "game");
      callback(teamEvents);
    }
  };
  
  var getData = gcHttp.get("https://gc.com/t/" + season + "/" + name + "-" + teamId + "/schedule/games", callbackProcessSchedule);
}
//#endregion