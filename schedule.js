var gcHttp = require("./util/httpUtil.js");
var parse = require("./util/parseWebpage.js");
var filter = require("./util/filterUtil.js");
var cache = require("./util/cache.js");
var settings = require("./settings.js");

module.exports = {
  get: getSchedule
}

//#region Schedule
function getSchedule(season, name, teamId, callback) {
  var url = "https://gc.com/t/" + season + "/" + name + "-" + teamId + "/schedule/games";
  
  var callbackProcessSchedule = function(dataString, lastAttempt) {
    var jsonObject = parse.parse(dataString);
    if (jsonObject !== null) {
      // filter team events where eventtype == game and return those.
      var teamEvents = [];
      var jsonTeamEvents = jsonObject["team_events"];
      
      teamEvents = filter.filter(jsonTeamEvents, "event_type", "game");
      
      cache.set(teamEvents, url);
      callback(teamEvents);
    }
    else if (!lastAttempt) {
      var def = settings.defaults();
      gcHttp.login(def.username, def.password, def.csrfmiddlewaretoken, function(data) {
        gcHttp.get(url, function(dataString) { callbackProcessSchedule(dataString, true);});
      });
    }
  };
  
  var schedule = cache.get(url);
  if (schedule)
    callback(schedule);
  else
    gcHttp.get(url, callbackProcessSchedule);
}
//#endregion