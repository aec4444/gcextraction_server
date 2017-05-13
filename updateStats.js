var gcHttp = require("./util/httpUtil.js");
var filter = require("./util/filterUtil.js");
var cache = require("./util/cache.js");
var settings = require("./settings.js");

module.exports = {
  update: updateStats
}

//#region Schedule
function updateStats(gameId, streamId, stats, callback) { 
  var url = "https://gc.com/do-save-edits/" + gameId + "/" + streamId;

  var processStats = function(dataString) {
  };
  
  var def = settings.defaults();
  gcHttp.login(def.username, def.password, def.csrfmiddlewaretoken, function(data) {
      gcHttp.post(url, stats, def.csrfmiddlewaretoken, undefined, function(dataString) { processStats(dataString);});
  });
}
//#endregion