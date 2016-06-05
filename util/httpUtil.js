var request = require('request');
var settings = require('../settings.js');

module.exports = {
  get: callHttpGet,
  login: login
};

function login(email, password, token, callback) {
  var options = {
    url: "https://gc.com/do-login",
/*
      headers: {
      "Accept-Encoding": "gzip, deflate",
      'User-Agent': "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36",
      'Host': "gc.com",
      'Connection': "keep-alive",
      'Cache-Control': "max-age=0",
      'Origin': "https://gc.com",
      'Content-Type': "application/x-www-form-urlencoded",
      'Referer': "https://gc.com/login",
      'Cookie': "exp_id=2bbfd5e5-8a1e-49b0-b0ca-a5b7f0719e0f; csrftoken=" + token
    },
*/    
    qs: {
      email: email, 
      password: password,
      csrfmiddlewaretoken: token
    }
  };
  
  request(options, function(error, response, body) {
    var x = error;
    callback(body);
  });
}

function callHttpGet(url, callback) {
  var options = {
    url: url,
    headers: {
      'User-Agent': "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36",
      'Origin': "https://gc.com",
      'Cache-Control': "max-age=0",
      "Cookie": "exp_id=2bbfd5e5-8a1e-49b0-b0ca-a5b7f0719e0f; hsfirstvisit=https%3A%2F%2Fgc.com%2F|https%3A%2F%2Fgc.com%2Fgame-56ede515afff9300248102e4|1464103447920; __qca=P0-805125727-1464103448733; _cb_ls=1; __gads=ID=b635be6367341d6c:T=1464104147:S=ALNI_MbSZ4eTpPqIRtLnzjYUM4wrYCY43A; km_lv=x; _gat=1; last_team_viewed=56ede2f1deafb60023e9cdc7; _ga=GA1.2.1846725655.1464103448; _sp_id.9212=15a606e47dd95f19.1464103448.22.1465091951.1464964606.f8514d9e-d31a-4b24-9427-46867e25bdd6; _sp_ses.9212=*; __hstc=239609820.da011dc7862d7bab912be2c5f4d24189.1464103447922.1464963324444.1465091909479.22; __hssrc=1; __hssc=239609820.6.1465091909479; hubspotutk=da011dc7862d7bab912be2c5f4d24189; _chartbeat2=CPLJtnDS4fayCGEDZs.1464103448990.1465091951504.111000001111; kvcd=1465091952388; km_ai=aec4444%40gmail.com; km_ni=aec4444%40gmail.com; km_vs=1; km_uq=; _chartbeat5=290,15,%2Ft%2Fspring-2016%2Fpride-10u-56ede2f1deafb60023e9cdc7%3Fgc-redirect-count%3D1%26destination%3D%252Fgame-575282cb4efe00e9ae000002%252Frecap-story%26entity-id%3D575282cb4efe00e9ae000002%26entity-type%3Dgame,https%3A%2F%2Fgc.com%2F,C9WvlzBY4mRyplPx-C3CxXtWl5O,*%5B%40id%3D'main_container'%5D%2Fdiv%5B1%5D%2Fdiv%5B1%5D%2Fdiv%5B1%5D%2Ful%5B1%5D%2Fli%5B1%5D%2Fa%5B1%5D,c,CskikMCPrlXMDwMeGlBZ1Uj7CiLIuv; csrftoken=6C8U31SosO6TQdxm5BZx5b51Wg1MDtjO; gcdotcom_secure_sessionid=z0k1qjoxxckm9v3odyvx0fu9uvckxt53; gcdotcom_sessionid=phmhdij7nwkh8x3o64svdjzzjqdsrvu1"
//      'Cookie': "exp_id=2bbfd5e5-8a1e-49b0-b0ca-a5b7f0719e0f; hsfirstvisit=https%3A%2F%2Fgc.com%2F|https%3A%2F%2Fgc.com%2Fgame-56ede515afff9300248102e4|1464103447920; __qca=P0-805125727-1464103448733; _cb_ls=1; __gads=ID=b635be6367341d6c:T=1464104147:S=ALNI_MbSZ4eTpPqIRtLnzjYUM4wrYCY43A; _gat=1; last_team_viewed=56ede2f1deafb60023e9cdc7; _ga=GA1.2.1846725655.1464103448; _sp_id.9212=15a606e47dd95f19.1464103448.1.1464105947.1464103448.8da6146d-6c84-4fcb-881b-4f6db71e2e97; _sp_ses.9212=*; csrftoken=6C8U31SosO6TQdxm5BZx5b51Wg1MDtjO; gcdotcom_secure_sessionid=z0k1qjoxxckm9v3odyvx0fu9uvckxt53; gcdotcom_sessionid=phmhdij7nwkh8x3o64svdjzzjqdsrvu1; __hstc=239609820.da011dc7862d7bab912be2c5f4d24189.1464103447922.1464103447922.1464103447922.1; __hssrc=1; __hssc=239609820.10.1464103447922; hubspotutk=da011dc7862d7bab912be2c5f4d24189; _chartbeat2=CPLJtnDS4fayCGEDZs.1464103448990.1464105947726.1; _chartbeat5=; kvcd=1464105948671; km_ai=angela_hauser%40bloomfield.edu; km_ni=angela_hauser%40bloomfield.edu; km_vs=1; km_lv=1464105949; km_uq="
    }
  };
  
  request(options, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      // use the body as data.
      callback(body);
    }  
  });
}