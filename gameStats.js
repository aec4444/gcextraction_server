
var filter = require("./util/filterUtil.js");
var gcHttp = require("./util/httpUtil.js");
var rosterLibrary = require("./roster.js");
var async = require("async");

module.exports = {
  getStats: getGameStats,
  getTotals: getTotals
};

var INNINGS_PER_GAME = 7;

//#region Helpers
function getStatsTurnVertical(resultKeys) {
  var results = [];
  for (var k in resultKeys) {
    if (resultKeys.hasOwnProperty(k)) {
      results.push(resultKeys[k]);
    }
  }

  return results;
};
//#endregion

//#region Stats
function getPitchesThrownToData(plays) {
  var pitchEvents = filter.filter(plays, "code", "pitch");
   
  // now go through each pitch event, and build a dictionary of the players and the items we want to capture
  var resultKeys = {};

  var lastBatter = null;
  for (var i = 0; i < pitchEvents.length; i++) {
    var item = pitchEvents[i];

    var batter = item.participants[0].player["$id"];

    var playerResult = resultKeys[batter];
    if (playerResult === undefined || playerResult === null) {
      playerResult = {
        playerId: batter,
        strikesLooking: 0,
        balls: 0,
        strikesSwinging: 0,
        fouls: 0,
        inPlay: 0,
        pa: 0
      };
      resultKeys[batter] = playerResult;
    };

    if (lastBatter === null || lastBatter !== batter) {
      playerResult.pa += 1;
      lastBatter = batter;
    }


    // tabulate
    switch (item.properties.swing) {
      case "take":
        if (item.properties.pitch === "strike")
          playerResult.strikesLooking += 1;
        else
          playerResult.balls += 1;
        break;
      case "miss":
        playerResult.strikesSwinging += 1;
        break;
      case "foul":
        playerResult.fouls += 1;
        break;
      case "hit":
        playerResult.inPlay += 1;
        break;
    }    
  }
  
  return getStatsTurnVertical(resultKeys);
}

function getPlayersFromPitchData(plays) {
  var players = [];

  for (var k in plays.players) {
    if (plays.players.hasOwnProperty(k)) {
      var player = { id: k, name: plays.players[k] };
      players.push(player);
    }
  }

  return players;
}

function getStatsPerCount (plays) {
  // now go through each pitch event, and build a dictionary of the players and the items we want to capture
  var resultKeysCount = {};
  var resultKeysOuts = {};

  for (var i = 0; i < plays.length; i++) {
    var item = plays[i];
    
    // get the batter participant
    if (item.participants !== undefined && item.participants !== null && item.participants.length > 0) {
      var batter = item.participants[0].player["$id"];
      var balls = item.setting.count.balls;
      var strikes = item.setting.count.strikes;
      var outs = item.setting.count.outs;
      var key = batter + "_" + balls + "_" + strikes;

      var playerResult = getStatsPerCountBuildObject(resultKeysCount, batter, key);
      playerResult.balls = balls;
      playerResult.strikes = strikes;
      getStatsPerCountIncrement(playerResult, item);

      key = batter + "_" + outs;
      playerResult = getStatsPerCountBuildObject(resultKeysOuts, batter, key);
      playerResult.outs = outs;
      getStatsPerCountIncrement(playerResult, item);
    }
  }

  return { count: getStatsTurnVertical(resultKeysCount), outs: getStatsTurnVertical(resultKeysOuts) };
};

function getStatsRunners(plays) {
  // now go through each pitch event, and build a dictionary of the players and the items we want to capture
  var resultKeys = {};

  for (var i = 0; i < plays.length; i++) {
    var item = plays[i];
    
    // get the batter participant
    if (item.participants !== undefined && item.participants !== null && item.participants.length > 0) {
      var batter = item.participants[0].player["$id"];

      var baseKey = "";
      
      var bases = item.setting.situation.bases === undefined ? [] : item.setting.situation.bases.sort(function(a, b) {
        if (a.base < b.base)
          return -1;
        else if (a.base > b.base )
          return 1;
        else
          return 0;
      });
      
      for (var base = 0; base < bases.length; base++) {
        baseKey += bases[base].base + "";
      }

      if (baseKey === "")
        baseKey = "0";

      var key = batter + "_" + baseKey;
      var playerResult = getStatsPerCountBuildObject(resultKeys, batter, key);
      playerResult.baseKey = baseKey;
      getStatsPerCountIncrement(playerResult, item);
    }
  };

  return getStatsTurnVertical(resultKeys);
};

function getStatsHitDistribution(plays) {
  plays = filter.filter(plays, "code", ["1B", "2B", "3B", "HR"]);

  // now go through each pitch event, and build a dictionary of the players and the items we want to capture
  var resultKeys = {};

  for (var i = 0; i < plays.length; i++) {
    var item = plays[i];
    
    // get the batter participant
    var batter = item.participants[0].player["$id"];
    var whereBall = item.properties.defender;

    var key = batter + "_" + whereBall;
    var playerResult = resultKeys[key];
    if (playerResult === undefined) {
      resultKeys[key] = {
        count: 0,
        pos: whereBall,
        playerId: batter
      };
    }
    resultKeys[key].count++;
  }

  return getStatsTurnVertical(resultKeys);
};

function getStatsPerCountBuildObject(resultKeys, playerId, key) {
  var playerResult = resultKeys[key];
  if (playerResult === undefined || playerResult === null) {
    playerResult = {
      AB: 0,
      H: 0,
      "1B": 0,
      "2B": 0,
      "3B": 0,
      HR: 0,
      RBI: 0,
      BB: 0,
      K: 0,
      HBP: 0,
      strikes: 0,
      balls: 0,
      outs: 0,
      playerId: playerId
    };
    resultKeys[key] = playerResult;
  };

  return playerResult;
};

function getStatsPerCountIncrement(playerResult, item) {
  // tabulate
  switch (item.code) {
    case "1B":
    case "2B":
    case "3B":
    case "HR":
      playerResult.AB += 1;
      playerResult.H++;
      playerResult[item.code]++;
      break;
    case "BB":
      playerResult.BB += 1;
      break;
    case "HB":
      playerResult.HBP += 1;
      break;
    case "E":
    case "FC":
    case "OF":
    case "OG":
    case "OL":
      playerResult.AB += 1;
      break;
    case "K":
    case "KO":
    case "SO":
      playerResult.AB += 1;
      playerResult.K += 1;
      break;
  }
};

function getPositionCounts(plays, players) {
  plays = filter.filter(plays, "code", ["OF", "OG", "OL", "FC", "KO", "SO", "DP", "rDT", "rOA", "rCS", "rCR", "rDO", "SHB", "rPO, ", "rOOA"]);

  // now go through each pitch event, and build a dictionary of the players and the items we want to capture
  var resultKeys = {};

  var firstPlayAway = true;
  var firstPlayHome = true;

  for (var i = 0; i < plays.length; i++) {
    var item = plays[i];
    
    // get the batter participant
    var fielders = item.fielders;
    for (var k in fielders) {
      if (fielders.hasOwnProperty(k)) {
        // check to see if we have this player with this position
        var key = fielders[k] + "_" + k;
        var keyTotal = fielders[k] + "_total";

        var playerResult = resultKeys[key];
        if (playerResult === undefined) {
          resultKeys[key] = {
            pos: k,
            playerId: fielders[k],
            count: 0,
            start: 0
          };

          resultKeys[keyTotal] = {
            pos: "total",
            playerId: fielders[k],
            count: 0,
            start: 0
          };
        }
        resultKeys[key].count++;
        resultKeys[keyTotal].count++;

        if ((item.half === 0 && firstPlayAway) || (item.half === 1 && firstPlayHome)) {
          resultKeys[key].start++;
        }
      }
    }

    if (item.half === 0)
      firstPlayAway = false;

    if (item.half === 1)
      firstPlayHome = false;
  }

  return getStatsTurnVertical(resultKeys);
};

function gameBoxScoreFindTeam(json) {
  var team = filter.filter(json.teams, "status", "ACT");
  if (team !== undefined && team !== null && team.length > 0) {
    team = team[0];
    
    return team;
  }
  
  return null;
}
    
function getGameStats(gameId, streamId, callback) {
  // get all the stats for the games.
  
  var tasks = [];
  var results = {
    results: [],
    players: [],
    count: [],
    outs: [], 
    runners: [],
    dist: [],
    field: [],
    stats: [],
    pitchStats: []
  };
  
  var gameResults = [];
  
  if (streamId !== undefined && streamId !== null) {
    tasks.push(function(taskCallback) {
      var url = "https://push.gamechanger.io/push/game/" + gameId + "/stream/" + streamId + "?index=0";
      
      gcHttp.get(url, function(d) {
        // got the data, now what?
        var json = JSON.parse(d);
        
        //manipulate to fix 1 play by play
        if (gameId === "571d1525d3960016150002bd") {
          for (var i = 0; i < json.events[0].length; i++) {
            var play = json.events[0][i];
            if (play.id === "571d1525d396001c37000326")
              play.code = "1B";
          }
        }
        
        // now process stats appropriately for the correct return.
        var plays = json.events[0];
        
        var countOutsInfo = getStatsPerCount(plays);
        var players = getPlayersFromPitchData(json);
        
        results.results = getPitchesThrownToData(plays);
        results.players = players,
        results.count = countOutsInfo.count,
        results.outs = countOutsInfo.outs, 
        results.runners = getStatsRunners(plays);
        results.dist = getStatsHitDistribution(plays);
        results.field = getPositionCounts(plays, players);
        
        taskCallback();
      });
    });
  }
  
  tasks.push(function(taskCallback) {
    var url = "https://gc.com/game-" + gameId + "/stats.json?stat_type=batting";
    gcHttp.get(url, function(d) {
      // got the data, now what?
      var json = JSON.parse(d);
      
      // find the pride team, which has status = "ACT"
      team = gameBoxScoreFindTeam(json);
      
      if (team !== undefined && team !== null) {
        // go through each player
        team.players.forEach(function(statPlayer) {
          var stats = statPlayer.stats.offense;
          delete stats["PS/PA"];
          delete stats["C%"];

          // go through stats and make them all numeric
          for(var k in stats) {
            if (stats.hasOwnProperty(k))
              stats[k] = parseInt(stats[k]);
          }
          
          results.stats.push({
            playerId: statPlayer["player_id"],
            stats: stats
          });
        })
      }
      
      taskCallback();
    });
  });
 
  //pitching 
  tasks.push(function(taskCallback) {
        var url = "https://gc.com/game-" + gameId + "/stats.json?stat_type=pitching";
    gcHttp.get(url, function(d) {
      // got the data, now what?
      var json = JSON.parse(d);
      
      // find the pride team, which has status = "ACT"
      team = gameBoxScoreFindTeam(json);
      
      if (team !== undefined && team !== null) {
        // go through each player
        team.players.forEach(function(statPlayer) {
          var stats = statPlayer.stats.defense;
          delete stats["BAA"];
          delete stats["BB/INN"];
          delete stats["P/BF"];
          delete stats["P/IP"];
          delete stats["SB%"];
          delete stats["K/BB"];

          var pitched = stats["GP:P"];
          if (pitched > 0) {
            // go through stats and make them all numeric
            for(var k in stats) {
              if (stats.hasOwnProperty(k) && k !== "outs")
                stats[k] = parseInt(stats[k]);
            }
            
            // add outs separately
            var outsString = stats["outs"];
            var outsDecimal = outsString.indexOf(".");
            var decimalString = outsString.substring(outsDecimal + 1);
            var integerString = outsString.substring(0, outsDecimal);
            var integerValue = parseInt(integerString);
            var decimalValue = parseInt(decimalString);
            
            stats["outs"] = integerValue * 3 + decimalValue;
            
            results.pitchStats.push({
              playerId: statPlayer["player_id"],
              stats: stats
            });
          }
        })
      }
      
      taskCallback();
    });
  })

  // do the tasks
  async.parallel(tasks, function() {
    // build the return object.
    callback(results);
  });
  
}
//#endregion

//#region
function processItem(results, list, roster, createCallback, updateCallback) {
  if (results === undefined || results === null)
    results = [];
  
  list.forEach(function(item) {
    // get the player from the roster
    var player = filter.filter(roster, "player_id", item.playerId);
    if (player !== undefined && player !== null && player.length > 0) {
      processFoundItem(results, item, player[0], createCallback, updateCallback);
    }
  });
  
  return results;
};

function processFoundItem(results, result, player, createCallback, updateCallback) {
  var resultList = filter.filter(results, "playerId", result.playerId);
  if (resultList === undefined || resultList === null || resultList.length === 0) {
    if (typeof createCallback === "function") 
      createCallback(results, result, player)
  }
  else if (typeof updateCallback === "function") {
    updateCallback(resultList[0], result, player);
  }
}

function processInitialize(results, list, initializeCallback) {
  if (results === undefined || results === null || results.length === 0) {
    results = [];
    
    list.forEach(function(result) {
      initializeCallback(results, result);
    });
  }
  
  return results;
}

function processUpdate(item, result, key) {
  for (var k in item[key]) {
    if (item[key].hasOwnProperty(k) && k !== "player" && k !== "playerId" && k !== "outs" && k !== "strikes" && k !== "balls" && k !== "baseKey") {
      item[key][k] += result[k];
    }
  }
}

function sumPitchData(results, game, roster) {
  return processItem(results.pitchData, game.results, roster, 
    function(resultList, result, player) {
      resultList.push(result);
      result.player = player;
      result.games = 1;
    },
    function (pitchDataItem, result) {
      pitchDataItem.pa += result.pa;
      pitchDataItem.games += 1;
      pitchDataItem.strikesLooking += result.strikesLooking,
      pitchDataItem.balls += result.balls,
      pitchDataItem.strikesSwinging += result.strikesSwinging,
      pitchDataItem.fouls += result.fouls,
      pitchDataItem.inPlay += result.inPlay;
    }
  );
}

function sumCountData(results, game, roster) {
  // hitting in the count
  var updateCountData = function (countDataItem, result) {
    var key = result.balls + "" + result.strikes;
    processUpdate(countDataItem, result, key);
  };

  return processItem(results.countData, game.count, roster, 
    function(resultList, result, player) {
      var item = {
        player: player
      }
      var playerId = result.playerId;
      
      getStatsPerCountBuildObject(item, playerId, "00");
      getStatsPerCountBuildObject(item, playerId,"10");
      getStatsPerCountBuildObject(item, playerId,"20");
      getStatsPerCountBuildObject(item, playerId,"30");
      getStatsPerCountBuildObject(item, playerId,"01");
      getStatsPerCountBuildObject(item, playerId,"11");
      getStatsPerCountBuildObject(item, playerId,"21");
      getStatsPerCountBuildObject(item, playerId,"31");
      getStatsPerCountBuildObject(item, playerId,"02");
      getStatsPerCountBuildObject(item, playerId,"12");
      getStatsPerCountBuildObject(item, playerId,"22");
      getStatsPerCountBuildObject(item, playerId,"32");

      resultList.push(item);
      updateCountData(item, result);
    }, 
    updateCountData
  );
}

function sumOutsData(results, game, roster) {
  var updateOutsData = function (outDataItem, result) {
    var key = result.outs + "";
    processUpdate(outDataItem, result, key);
  };
  return processItem(results.outsData, game.outs, roster, 
    function(outData, result, player) {
      var item = {
        player: player,
        playerId: result.playerId
      }
      getStatsPerCountBuildObject(item, player, "0");
      getStatsPerCountBuildObject(item, player, "1");
      getStatsPerCountBuildObject(item, player, "2");

      outData.push(item);
      updateOutsData(item, result);
    },
    updateOutsData 
  );
}

function sumRunnersData(results, game, roster) {
  var updateRunnersData = function(item, result) {
    var key = result.baseKey + "";
    processUpdate(item, result, key);
  };
  
  return processItem(results.runnersData, game.runners, roster, 
    function(resultList, result, player) {
      var item = {
        player: player,
        playerId: result.playerId
      }
      getStatsPerCountBuildObject(item, player, "0");
      getStatsPerCountBuildObject(item, player, "1");
      getStatsPerCountBuildObject(item, player, "12");
      getStatsPerCountBuildObject(item, player, "13");
      getStatsPerCountBuildObject(item, player, "123");
      getStatsPerCountBuildObject(item, player, "2");
      getStatsPerCountBuildObject(item, player, "23");
      getStatsPerCountBuildObject(item, player, "3");

      resultList.push(item);
      updateRunnersData(item, result);
    }, 
    updateRunnersData
  );
}

function sumDistData(results, game, roster) {
  // initialize distribution
  results.distData = processInitialize(results.distData, roster, function(list, player) {
    var item = {
      player: player,
      playerId: player.player_id
    }

    var positions = ["P", 'C', "1B", "2B", "3B", "SS", 'LF', "CF", 'RF', "SF", "F10"];
    positions.forEach(function(pos) {
      item[pos] = 0;
    });
    list.push(item);
  });
      
  // do the dist work
  game.dist.forEach(function(result) {
    processFoundItem(results.distData, result, undefined, undefined, 
      function(hitDistItem, result) {
        hitDistItem[result.pos] += result.count;
      }
    );
  });
  
  return results.distData;
}

function sumFieldData(results, game, roster) {
  // initialize the fielding data
  results.fieldData = processInitialize(results.fieldData, roster, function(list, player) {
    var item = {
      player: player,
      playerId: player.player_id
    }

    var positions = ["P", 'C', "1B", "2B", "3B", "SS", 'LF', "CF", 'RF', "SF", "F10", "total"];
    positions.forEach(function (pos) {
      item[pos] = {
        thirds: 0,
        games: 0,
        start: 0
      };
    });
    list.push(item);
  });
      
  // do the fielding work
  game.field.forEach(function (result) {
    processFoundItem(results.fieldData, result, undefined, undefined, 
      function(fieldDataItem, result) {
        fieldDataItem[result.pos].thirds += result.count;
        fieldDataItem[result.pos].games++;
        fieldDataItem[result.pos].start += result.start;
      }
    );
  });
  
  return results.fieldData;
}

function sumStatsData(results, game, roster) {
  return processItem(results.statsData, game.stats, roster,
    function(resultList, result, player) {
      var item = {
        player: player,
        playerId: result.playerId,
        stats: result.stats
      }
      resultList.push(item);
    },
    function(item, result) {
      for (var k in item.stats) {
        if (item.stats.hasOwnProperty(k) && k !== "playerId" && k !== "player") {
          item.stats[k] += result.stats[k];
        }
      }      
    } 
  );
}

function sumPitchStatsData(results, game, roster) {
  return processItem(results.pitchStatsData, game.pitchStats, roster,
    function(resultList, result, player) {
      var item = {
        player: player,
        playerId: result.playerId,
        stats: result.stats
      }
      resultList.push(item);
    },
    function(item, result) {
      for (var k in item.stats) {
        if (item.stats.hasOwnProperty(k) && k !== "playerId" && k !== "player") {
          item.stats[k] += result.stats[k];
        }
      }      
    } 
  );
}

function getTotals(options, schedule, resultCallback) {
  // get the stats via the schedule asynchronously, and then get the roster and go.
  var asyncTasks = [];
  var roster = null;
  var allStats = [];
  var results = {
    pitchData: [],
    countData: [],
    outsData: [],
    runnersData: [],
    distData: [],
    fieldData: [],
    statsData: [],
    pitchStatsData: []
  };
  
  // get the roster
  asyncTasks.push(function(callback) {
    rosterLibrary.get(options.season, options.name, options.teamId, function(result) {
      roster = result;
      callback();
    });
  });
  
  schedule.forEach(function(game) {
    // only streamed games can get most these stats
    asyncTasks.push(function(callback) {
      getGameStats(game.id, game["stream_id"], function(stats) {
        allStats.push(stats);
        callback();
      });
    });
  });
  
  // run all tasks, and call the method when done.
  async.parallel(asyncTasks, function() {
    allStats.forEach(function(game) {
      results.pitchData = sumPitchData(results, game, roster);
      //results.countData = sumCountData(results, game, roster);
      results.outsData = sumOutsData(results, game, roster);
      results.runnersData = sumRunnersData(results, game, roster);
      results.distData = sumDistData(results, game, roster);
      results.fieldData = sumFieldData(results, game, roster);
      results.statsData = sumStatsData(results, game, roster);
      results.pitchStatsData = sumPitchStatsData(results, game, roster);
    });

    // go through regular stats and calculate things like AVG
    results.statsData.forEach(function (player) {
      player.stats.AVG = player.stats.H / (player.stats.AB || 1);
      player.stats.OBP = (player.stats.H + player.stats.BB + player.stats.HBP) / ((player.stats.AB + player.stats.BB + player.stats.HBP) || 1);
      player.stats.SLG = (player.stats.H + player.stats["2B"] + (2* player.stats["3B"]) + (3*player.stats.HR)) / (player.stats.AB || 1);
      player.stats.OPS = player.stats.OBP + player.stats.SLG;
      player.stats.AVGRISP = player.stats.HRISP / (player.stats.ABRISP || 1);
      player.stats.QABPCT = player.stats.QAB / (player.stats.PA || 1);
    });
    
    // go through pitching stats and calculate things like ERA.
    results.pitchStatsData.forEach(function(player) {
      var ip = ((player.stats.outs) / 3);
      var bf = (player.stats.BF);
      var pitches = player.stats["#P"];
      var ab =  player.stats["AB"];
      
      player.stats.ERA = player.stats.ER * INNINGS_PER_GAME / ip;
      player.stats.IP = Math.floor(player.stats.outs / 3) + "." + (player.stats.outs % 3);
      player.stats.WHIP = (player.stats.H + player.stats.BB) / ip;
      player.stats.P_IP = player.stats["#P"] / ip;
      player.stats.P_BF = player.stats["#P"] / bf;
      player.stats.Less3Pct = player.stats["<3"] / bf;
      player.stats.StrikePct = player.stats["TS"] / pitches;
      player.stats.BAA = player.stats["H"] / ab;
    });
    
    resultCallback(results);
  });
  
  
}
//#endregion