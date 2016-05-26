module.exports = {
  defaults: getDefaults,
  getFromQuery: getTeamInfo
}

function getDefaults() {
  var gamechangerSettings = {
    teamId: '56ede2f1deafb60023e9cdc7',
    name: "pride-10u",
    season: "spring-2016",
    //username: "angela_hauser@bloomfield.edu",
    //password: "Jhouse@48jr",
    username: 'aec4444@gmail.com',
    password: 'dellp100',
    csrfmiddlewaretoken: "y6bKvv5mqjCjTYczxKIimsgvoV1KgJ66"
  };

  return gamechangerSettings;  
}

function getTeamInfo(req, post) {
  var gamechangerSettings = getDefaults();
  var options = {};
  
  if (post) 
    options = {
      teamId: (req && req.params.id) || gamechangerSettings.teamId,
      name: (req && req.params.name) || gamechangerSettings.name,
      season: (req && req.params.season) || gamechangerSettings.season,
      username: (req && req.params.username) || gamechangerSettings.username,
      password: (req && req.params.password) || gamechangerSettings.password
    };
  else
    options = {
      teamId: (req && req.query.id) || gamechangerSettings.teamId,
      name: (req && req.query.name) || gamechangerSettings.name,
      season: (req && req.query.season) || gamechangerSettings.season,
      username: (req && req.query.username) || gamechangerSettings.username,
      password: (req && req.query.password) || gamechangerSettings.password
    };
    
  return options;
}