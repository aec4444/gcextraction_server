var util = require('util');

module.exports = {
  getProperty: getProperty,
  filter: filterPlaysByObject  
};

function getProperty(obj, prop) {
  var parts = prop.split('.');

  if (Array.isArray(parts) && parts.length > 1) {
    var last = parts.pop(),
    l = parts.length,
    i = 1,
    current = parts[0];

    while ((obj = obj[current]) && i < l) {
      current = parts[i];
      i++;
    }

    if (obj) {
      return obj[last];
    }
  } else {
    return obj[prop];
  }
}

function filterPlaysByObject(plays, propertyName, propertyValue) {
  var results = [];
  if (propertyName === undefined)
    propertyName = "name";
  
  var isArray = util.isArray(propertyValue);
  
  for (var i = 0; i < plays.length; i++) {
    var getPropertyValue = getProperty(plays[i], propertyName);
    
    if ((!isArray && getPropertyValue == propertyValue) || (isArray && propertyValue.indexOf(getPropertyValue) >= 0))
      results.push(plays[i]);   
  } 
  
  return results;
}