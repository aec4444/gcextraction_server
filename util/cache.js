module.exports = {
    get: getCache,
    set: setCache,
    remove: removeCache
};

var cache = {};

function getCache(key) {
  // see if the cache item exists
  var cacheItem = cache[key];
  if (cacheItem !== undefined) {
    // compare date until now
    var today = new Date();
    if (+today <= +cacheItem.cacheTime)
      return cacheItem.data;
    else 
      removeCache(key);
  }
  
  return undefined;
}

function setCache(data, key, expiry) {
  if (!expiry) {
    expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);
  }
    
  var cacheItem = {data: data, cacheTime: expiry};
  cache[key] = cacheItem;
}

function removeCache(key) {
  delete cache[key];
}