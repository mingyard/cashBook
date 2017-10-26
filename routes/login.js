var secret = require("../secret")
var config = require("../config")
var httpUtil = require('../interface/httpUtil')
var moment = require('moment')
var dbUtils = require('../mongoSkin/mongoUtils.js')
var userCollection= new dbUtils("user")
var async = require('async')
var MD5 = require("crypto-js/md5")
var redisClient = require('../redis/redis_client.js').redisClient()

exports.getSessionKey = function (code, cb) {
    var url = config.wxApiHost + '/sns/jscode2session'
    var param = {
        appid: secret.AppID,
        secret: secret.AppSecret,
        js_code: code,
        grant_type: 'authorization_code',
    }
    httpUtil.getJSON(url, param, function (err, result) {
        if (err) {
            return cb(err)
        }
        if (result.errcode) {
            return cb(result.errmsg)
        }
        cb(null, result)
    })
}

exports.createUser = function (openid, cb) {
    var time = new Date()
    var data = {
        openid: openid,
        createTime:  time.getTime(),
        strTime: moment(time).format('YYYY-MM-DD HH:mm:ss')
    }
    async.auto({
        check: function (cb) {
            userCollection.find({openid: openid}, function (err, result) {
                if (err) {
                    return cb(err)
                }
                if (result.length == 0) {
                    return cb(null, false)
                }
                cb(null, true)
            })
        },
        save: [ 'check', function (result, cb) {
            var check = result.check
            if (check) {
                return cb('该用户已存在')
            }
            userCollection.save(data, function (err, result) {
                if (err) {
                    return cb(err)
                }
                cb(null, result)
            })
        }]
    }, function (err, result) {
        console.log('[%j] login.createUser ,data:%j, result:%j, err:%j', new Date().toLocaleString(),data, result,err)        
        if (err) {
            return cb(err)
        }
        cb(null, result.save._id)
    })
}

exports.login = function (req, res) {
    var code = req.param('code')
    if (!code) {
        return res.send(400,'参数错误')
    }
    async.auto({
        getSessionKey: function (cb) {
            exports.getSessionKey(code, function (err, result) {
                if (err) {
                    return cb(err)
                }
                cb(null, result)
            })
        },
        createUser: [ 'getSessionKey', function (result, cb) {
            var openid = result.getSessionKey.openid
            exports.createUser(openid, function (err, result) {
                if (err) {
                    return cb(err)
                }
                cb(null, result)
            })
        }],
        createSession: [ 'createUser', function (result, cb) {
            var info = result.getSessionKey
            exports.createSession(info.openid, info.session_key, function (err, result) {
                if (err) {
                    return cb(err)
                }
                cb(null, result)
            })
        }]
    }, function (err, result) {
        console.log('[%j] login.login ,code:%j, result:%j, err:%j', new Date().toLocaleString(),code, result,err)                
        if (err) {
            return res.send(400, err)
        }
        res.send(200, result.createSession)
    })
}

//检查session
exports.checkSession = function (session, cb) {
    redisClient.exsits(session, function (err, result) {
        if (err) {
            return cb(err)
        }
        cb(null,result)
    })
}

//创建session
exports.createSession = function (openid,sessionKey,cb) {
    var session = MD5(openid+sessionKey).toString()
    var param = {
        openid : openid,
        sessionKey : sessionKey
    }
    redisClient.set(session, JSON.stringify(param), function (err) {
        if (err) {
            return cb(err)
        }
        redisClient.expire(session, 604800, function () {})
        cb(null, session)
    })
}

//获取本地查找微信sessionKey
exports.getSessionInfo = function (session, cb) {
    redisClient.get(session, function (err, result) {
        if (err) {
            return cb(err)
        }
        if (!result) {
            return cb('session已过期')
        }
        cb(null, result)
    })
}

// exports.getSiessonKey(
//     '011xgfr52xDeTN0Mhnr52NE9r52xgfri',
//     function (err, result) {
//         console.log(err,result)
//     }
// )