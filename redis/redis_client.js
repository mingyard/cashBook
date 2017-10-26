var redis = require('redis')
var config = require('../config.js')
var cache_redis_list = config.cache_redis

exports.cacheRedis = function (){
    console.log('init cache redis')
    var cacheRedisArr = []
    for (var i = 0; i < cache_redis_list.length; i++){
        console.log(cache_redis_list[i])
        var client = redis.createClient(cache_redis_list[i].port, cache_redis_list[i].host);
        client.on('error', function (err) {
            console.log('Error ' + err);
        });
        cacheRedisArr.push(client)
    }
    return cacheRedisArr;
}

exports.redisClient = function (){
    var client = redis.createClient(config.redis.port, config.redis.host)
    client.on('error', function (err) {
        console.log('Error ' + err)
    })
    return client
}