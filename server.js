var express = require('express');
var app = express();

var gameStats = require("./gameStats.js");
var schedule = require("./schedule.js");
var roster = require("./roster.js");
var settings = require("./settings.js");
var gcHttp = require("./util/httpUtil.js");
var filter = require("./util/filterUtil.js");
var async = require("async");

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8081
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'

app.use(express.static('public'));

//#region Routes
app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});
 
app.get('/roster', function (req, res) {
  var options = settings.getFromQuery(req);
  roster.get(options.season, options.name, options.teamId, function(roster) {
    res.send(roster);
  })
})

app.get("/schedule", function(req, res) {
  var options = settings.getFromQuery(req);
  schedule.get(options.season, options.name, options.teamId, function(schedule) {
    res.send(schedule);
  })
});

var processStats = function(req, res, post) {
  var options = settings.getFromQuery(req, post);
  var gameIds = undefined;
  
  if (req && req.query && req.query.games) {
    gameIds = req.query.games;
  }
  else if (req && req.param && req.param.games) {
    gameIds = req.param.games;
  }
  
  schedule.get(options.season, options.name, options.teamId, function(schedule) {
    // filter schedule based on ids
    if (gameIds !== undefined) {
      var newSchedule = [];
      
      schedule.forEach(function(game) {
        if (gameIds.indexOf(game.id) >= 0) {
          newSchedule.push(game);
        }  
      });  
      schedule = newSchedule;
    };
    
    gameStats.getTotals(options, schedule, function(results) {
      res.send(results);
    })
  });
}
app.get("/stats", function(req, res) {
  processStats(req, res, false);
});

app.post("/stats", function(req, res) {
  processStats(req, res, true);
});


app.get("/login", function(req, res) {
  var def = settings.defaults();
  
  gcHttp.login(def.username, def.password, def.csrfmiddlewaretoken, function(data) {
    res.send(data);
  });
});

app.get("/stats/:gameId/:streamId", function(req, res) {
  gameStats.getStats(req.params.gameId, req.params.streamId, function(data) {
    res.send(data);
  });
});

//#endregion

//#region initialization
var server = app.listen(server_port, server_ip_address, function () {
  var host = server.address().address
  var port = server.address().port

  console.log("Gamechanger API listening at http://%s:%s", host, port)
})
//#endregion