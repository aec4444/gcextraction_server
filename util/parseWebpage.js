module.exports = {
  parse: parseGamechangerWebpage
};

function parseGamechangerWebpage(dataString) {
  // parse the data string
  var parseJsonString = "$.parseJSON(\"";

  var parseJsonIndex = dataString.indexOf(parseJsonString);
  if (parseJsonIndex >= 0) {
    parseJsonIndex += parseJsonString.length;
    var endIndex = dataString.indexOf('"', parseJsonIndex);

    var json = dataString.substring(parseJsonIndex, endIndex);
    var r = /\\u([\d\w]{4})/gi;
    json = json.replace(r, function(match, grp) {
      return String.fromCharCode(parseInt(grp, 16));
    });
    json = unescape(json);

    var jsonObject = JSON.parse(json);
    return jsonObject;
  }
  return null;
}