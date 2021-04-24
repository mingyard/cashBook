const secret = require("../secret")
const config = require("../config")
const httpUtil = require('../interface/httpUtil')
const moment = require('moment')
const userModel = require('../models/User');
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
                return reject(new Error(result.errmsg))
            }
            resolve(result)
        })
    })
}

//检测用户是否存在
exports.userExsits = (openid) => {
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
function updateUserInfo (userId,data) {
    return new Promise ((resolve, reject) => {
        userModel.findByIdAndUpdate(userId, {$set:data}, (err, result) => {
            if (err) {
                return reject(err)
            }
            resolve(result)
        })
    })
}

//创建session
function createSession (userid,sessionKey) {
    return new Promise((resolve,reject) => {
        const session = MD5(userid+sessionKey).toString()
        const param = {
            userid,
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
    const code = req.body.code
    const info = req.body.info

    if (!code) {
        return res.send(400,'参数错误')
    }
    try {
        const sessionKey = await getSessionKey(code)
        const exsits = await exports.userExsits(sessionKey.openid)
        if (!exsits && !info) {
            res.send(400,'参数错误')
        }
        let data = info
        let userId 
        data.openid  = sessionKey.openid
        if (!exsits) {
            let { id: userId } = await createUser(data)
        } else {
            if (info) {
                await updateUserInfo(data)
            }
            userId = exsits.id
        }
        
        const session = await createSession(userId, sessionKey.session_key)
        res.send(200,session)
    } catch (err) {
        console.log('[%j] login ,code:%j, info:%j, err:%j', new Date().toLocaleString(), code, info, err.stack)        
        res.send(400, err.message)
    }
}


exports.checkUser = async(req,res) => {
    const code = req.body.code
    if (!code) {
        return res.send(400,'参数错误') 
    }
    try {
        const sessionKey = await getSessionKey(code)
        const exsits = await exports.userExsits(sessionKey.openid)
        res.send(200, exsits)
    }catch (err) {
        console.log('[%j] checkUser ,code:%j, err:%j', new Date().toLocaleString(), code, err.stack)        
        res.send(400, err.message)
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