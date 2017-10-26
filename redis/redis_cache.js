var redisClientUtils       = require('../redis/redis_client.js');
var cacheRedisList = redisClientUtils.cacheRedis();
var cache = false

function hashCode (str){
    var hash = 0;
    if (str.length == 0) return hash;
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash;
    }
    return hash;
}

function getRedis (key){
    var len = cacheRedisList.length;
    var range = parseInt((hashCode(key) & 0x7fffffff) % len, 10)
    return cacheRedisList[range]
}

module.exports = {
    expire: 5 * 60 * 60,
    get: function (key, cb) {
        if (!cache){
            return cb('not cached')
        }
        //var expire = this.expire
        getRedis(key).get(key, function (err, value) {
            if (err) return cb(err);

            if (!value) {
                cb('no cache');
            } else if (value) {
                cb(null, JSON.parse(value, function (k , v){
                    if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z$/.test(v)){
                        v = new Date(Date.parse(v))
                    }
                    return v
                }));
                //getRedis(key).expire(key, expire)
            }
        });
    },
    getMulti: function (collection, key, cb) {
        if (!cache){
            return cb('not cached')
        }
        getRedis(collection).HGET(collection, key, function (err, value) {
            if (err) return cb(err);

            if (!value) {
                cb('no cache');
            } else if (value) {
                cb(null, JSON.parse(value, function (k , v){
                    if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z$/.test(v)){
                        v = new Date(Date.parse(v))
                    }
                    return v
                }));
                //getRedis(collection).expire(collection, 48 * 60 * 60)
            }
        });
    },
    delMulti: function (collection, cb) {
        if (!cache){
            return cb?cb('err'):''
        }
        getRedis(collection).del(collection, function (err){ cb?cb(err):'' });
    },
    del: function (key, cb) {
        if (!cache){
            return cb?cb('err'):''
        }
        getRedis(key).del(key, function (err){ cb?cb(err):'' });
    },
    set: function (key, value, cb) {
        if (!cache){
            return cb?cb('cache is close'):''
        }
        getRedis(key).setex(key, this.expire, value, function (err){ cb?cb(err):'' });
    },
    setMulti: function (collection, key, value, cb) {
        if (!cache){
            return cb?cb('cache is close'):''
        }
        getRedis(collection).HSET(collection, key, value, function (err){ cb?cb(err):'' });
    },
    setKeyExpire: function (key, expire, value, cb) {
        if (!cache){
            return cb?cb('cache is close'):''
        }
        getRedis(key).setex(key, expire, value, function (err){ cb?cb(err):'' });
    }
}