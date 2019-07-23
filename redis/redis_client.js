const redis = require('redis')
const config = require('../config.js')

exports.redisClient = function (){
    const client = redis.createClient(config.redis.port, config.redis.host)
    client.on('error', function (err) {
        console.log('Error ' + err)
    })
    return client
}