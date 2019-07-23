const secret = require("../secret")
const config = require("../config")
const httpUtil = require('../interface/httpUtil')
const moment = require('moment')
const userModel = require('../models/User');
const async = require('async')
const MD5 = require("crypto-js/md5")
const redisClient = require('../redis/redis_client.js').redisClient()

//生成sessionKey
function getSessionKey (code) {
    return new Promise((resolve, reject) => {
        const url = config.wxApiHost + '/sns/jscode2session'
        const param = {
            appid: secret.AppID,
            secret: secret.AppSecret,
            js_code: code,
            grant_type: 'authorization_code'
        }
        httpUtil.getJSON(url, param, (err, result) => {
            if (err) {
                return reject(err)
            }
            if (result.errcode) {
                return reject(result.errmsg)
            }
            resolve(result)
        })
    })
}

//检测用户是否存在
function userExsits(openid) {
    return new Promise ((resolve, reject) => {
        userModel.findOne({openid}, (err, result) => {
            if (err) {
                return reject(err)
            }
            resolve(result)
        })
    })
}

//创建用户
function createUser (data) {
    return new Promise ((resolve, reject) => {
        userModel.create(data, (err, result) => {
            console.log('[%j] login.createUser ,data:%j, result:%j, err:%j', new Date().toLocaleString(),data, result, err)        
            if (err) {
                return reject(err)
            }
            resolve(result)
        })
    })
}

//更新用户信息
function updateUserInfo (data) {
    return new Promise ((resolve, reject) => {
        userModel.updateOne({openid}, {$set:data}, (err, result) => {
            if (err) {
                return reject(err)
            }
            resolve(result)
        })
    })
}

//创建session
function createSession (openid,sessionKey) {
    return new Promise((resolve,reject) => {
        const session = MD5(openid+sessionKey).toString()
        const param = {
            openid,
            sessionKey
        }
        redisClient.set(session, JSON.stringify(param), function (err) {
            if (err) {
                return reject(err)
            }
            redisClient.expire(session, 604800)
            resolve(session)
        })
    }) 
}

/**
 * 登录接口
 * @param code  微信动态code
 * @param info  用户信息
 */
exports.login = async (req,res) => {
    const code = req.params('code')
    const info = req.params('info')

    if (!code || !info) {
        return res.send(400,'参数错误')
    }
    try {
        const sessionKey = await getSessionKey(code)
        const exsits = await userExsits(sessionKey.openid)
        let data = info
        data.openid  = sessionKey.openid
        exsits ? await updateUserInfo(data) : await createUser(data)
        const session = await createSession(sessionKey.openid,sessionKey.session_key)
        res.send(200,session)
    } catch (err) {
        console.log('[%j] login ,code:%j, info:%j, err:%j', new Date().toLocaleString(), code, info, err)        
        return res.send(400, err)
    }
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