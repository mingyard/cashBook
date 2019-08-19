const redisClient = require('../redis/redis_client.js').redisClient()
const cashModel = require('../models/Cash');
const cashTypeModel = require('../models/CashType');
const async = require('async')
const _ = require('underscore')
const moment = require('moment')
const config = require('../config')
const fs = require("fs")
const stream = require('stream')
const httpUtil = require('../interface/httpUtil')
const userModel = require('../models/User');

//创建账本
exports.crateCash = async (req,res) => {
    const name = req.body.name
    const image = req.body.image
    const userid = req.userid
    const categoryid = req.body.categoryid
    if (!name || !image || !userid || !categoryid) {
        return res.send(400, '参数错误！')
    }
    const param = {
        name: name,
        image: image,
        userid: userid,
        categoryid: categoryid,
        status: 1, // -1 删除  1正常
    }
    try {
        const cash = await createCash(param)
        await addCashMember(cash.id,userid)
        await addCash(userid,cash.id)
        res.send(200,cash.id)
    } catch (err) {
        console.log('[%j] crateCash , info:%j, err:%j', new Date().toLocaleString(), param, err.stack)        
        res.send(400, err.message)
    }
}

//删除账本
exports.del = async (req,res) => {
    const cashid = req.cash._id
    if (req.cash.status != 1) {
        res.send(400,"已删除")
    }
    try {
        await changeCash(cashid)
        await delCashMember(cashid,userid)
        await delCash(userid,cashid)
    } catch (err) {
        console.log('[%j] del , cashid:%j, err:%j', new Date().toLocaleString(), cashid, err.stack)        
        return res.send(400,err.message)
    }
}

//删除账本
function changeCash (cashid) {
    return new Promise((resolve,reject)=>{
        cashModel.updateOne({_id:cashid},{$set:{status:-1}},(err, result) =>{
            if (err) {
                return resolve(err)
            }
            resolve(result)
        })
    })
}

//获取账本列表
exports.cashList =  async (req, res) => {
    try {
        const list = await allCash(req.userid)
        let listInfo = []
        for (let cashid of list) {
            let info = await cashInfo(cashid)
            listInfo.push(info)
        }
        res.send(200,listInfo)
    } catch (err) {
        console.log('[%j] cashList , userid:%j, err:%j', new Date().toLocaleString(), req.userid, err.stack)        
        return res.send(400,err.message)
    }
}

//获取账本信息
function cashInfo (cashid) {
    return new Promise((res,rej)=>{
        cashModel.findOne({_id: cashid, status: 1}, function (err, result){
            if (err) {
                return rej(err)
            }
            res(result)
        })
    })
}

//获取最后一次修改的账本
exports.lastCashInfo =  async (req, res) => {
    try {
        let cashInfo = req.cash ? (req.cash).toObject() : (await lastCash(req.openId)).toObject()
        cashInfo.members = []
        const members = await getMembersArray(cashInfo.id)
        for (const item of members) {
            const {openid,nickName,avatarUrl} = (await memberInfo(item)).toObject()
            cashInfo.members.push({openid,nickName,avatarUrl})
        }
        res.send(200,cashInfo)
    } catch (err) {
        if (err) {
            return res.send(400,err)
        }
    }
}

//获取最后一次修改的账本
function lastCash(openId) {
    return new Promise((resolve, reject)=>{
        //默认查询条件
        var spec = {
            openid: openId,
            status: 1
        }
        //取最近记录一条
        var options = {
            sort: {
                updatedAt: -1
            }
        }
        cashModel.findOne(spec,{},options,function (err, result){
            if (err) {
                return reject(err)
            }
            resolve(result)
        })
    })
}

//获取成员列表
function getMembersArray(cashId) {
    return new Promise((resolve,reject)=>{
        redisClient.hgetall(cashId, (err, result) => {
            if (err) {
                return reject(err)
            }
            resolve(_.keys(result))
        })
    })
}

function memberInfo(openid) {
    return new Promise((resolve,reject)=> {
        userModel.findOne({openid}, (err, result) => {
            if (err) {
                return reject(err)
            }
            resolve(result)
        })
    })
}

//验证账本信息
exports.checkCash = function (turn = true) {
    return (req,res,next) => {
        const cashId = req.body.cashId
        if (!cashId) {
            if(!turn) {
                return next()
            }
            return res.send(400,"参数错误，缺少cashId")
        }

        cashModel.findById(cashId, function (err, result){
            if (err) {
                return res.send(400, '获取账本失败')
            }
            //判断账本是否存在
            if (!result) {
                return res.send(400, '该账本不存在')
            }
            //判断是否有读取该账本的权限
            if (result.userid != req.userid) {
                return res.send(400, '没有查看该账本权限')
            }
            req.cash = result
            next()
        })
    }
}

//添加账本成员接口
exports.addMembers = function (req, res) {
    const openIds = req.param('openids')
    const cashId = req.param('cashId')
    async.auto({
        add: function (cb) {
            async.eachSeries(openIds, function (item) {
                exports.addMember(cashId, item, new Date().getTime(), function () {})
            }, function () {
                cb()
            })
        },
        members: ['add', function (cb) {
            exports.getMembers(cashId, function (err, result) {
                if (err) {
                    return cb(err)
                }
                cb(null, result)
            }) 
        }],
        update: ['members', function (result, cb) {
            var members = result.members
            cashModel.updateOne({_id:cashId}, {$set: {members: members}}, function (err, result) {
                if (err) {
                    return cb(err)
                }
                cb(null, result)
            })
        }]
    }, function (err, result) {
        console.log('[%j] cash.addMembers , result:%j, err:%j', new Date().toLocaleString(), result, err)
        if (err) {
            return res.send(400, err)
        }
        res.send(200, '添加成功')
    })
}

//创建账本
exports.create = function (param, cb) {
    cashModel.create(param, function (err, result) {
        if (err) {
            return cb(err)
        }
        cb(null, result)
    })
}

//创建账本
function createCash(param) {
    return new Promise((resolve,reject) => {
        cashModel.create(param,(err,result) => {
            if (err) {
                return reject(err)
            }
            resolve(result)
        })
    })
}

//添加账本成员
function addCashMember(cashid,userid) {
    return new Promise((resolve,reject) => {
        const time = new Date().getTime()
        redisClient.zadd("cash_"+cashid,time,userid,(err,result) => {
            if (err) {
                return reject(err)
            }
            resolve(result)
        })
    })
}
//删除账本成员
function delCashMember(cashid,userid) {
    return new Promise((resolve,reject) => {
        redisClient.zrem("cash_"+cashId,userId,(err,result) => {
            if (err) {
                return reject(err)
            }
            resolve(result)
        })
    })
}

//添加账本成员
exports.addMember = function (cashId, userId, time, cb) {
    redisClient.hset(cashId, userId, time, function (err, result) {
        if (err) {
            return cb(err)
        }
        cb(null,result)
    })
}

//获取账本成员
function getMembers(cashid) {
    return new Promise((resolve,reject)=>{
        redisClient.zrangebyscore("cash_" + cashid,'-inf','+inf',(err,result)=>{
            if (err) {
                return reject(err)
            }
            resolve(result)
        })
    })
}

//获取账本成员redis数据
exports.getMembers = function (cashId, cb) {
    redisClient.hgetall(cashId, function (err, result) {
        if (err) {
            return cb(err)
        }
        cb(null, _.keys(result))
    })
}

//添加用户参与账本
function addCash(userid,cashid) {
    return new Promise((resolve,reject) => {
        const time = new Date().getTime()
        redisClient.zadd('cashList_' + userid,time,cashid,(err,result)=>{
            if (err) {
                return reject(err)
            }
            resolve(result)
        })
    })
}

//删除用户参与账本
function delCash(userid,cashid) {
    return new Promise((resolve,reject) => {
        redisClient.zrem('cashList_' + userid,cashid,(err,result)=>{
            if (err) {
                return reject(err)
            }
            resolve(result)
        })
    })
}

//获取用户参与账本列表
function allCash(userid) {
    return new Promise((resolve,reject) => {
        redisClient.zrangebyscore('cashList_' + userid,'-inf','+inf',(err,result)=> {
            if (err) {
                return reject(err)
            }
            resolve(result)
        })
    })
}

//获取账本类型
exports.getTypeList = function (req, res) {
    cashTypeModel.find({status:"1"}, function (err, result) {
        if (err) {
            return res.send(400, err)
        }
        data = {
            single: [],
            multiple: []
        }
        result.forEach(element => {
            if (element.categorytype == 0)
                data.single.push(element)
            if (element.categorytype == 1)
                data.multiple.push(element)
        })
        res.send(200, data)
    })
}

//获取账本类型
function typeList() {
    return new Promise((resolve,reject) => {
        cashTypeModel.find({status:"1"}, function (err, result) {
            if (err) {
                return reject(err)
            }
            resolve(result)
        })
    })
}

//获取指定类型账本数量
exports.typeCount = function (req, res) {
    const userid = req.userid
    const id = req.body.id
    cashModel.count({userid: userid,categoryid: id, status: 1}, function (err,result) {
        if (err) {
            return res.send(400, err)
        }
        res.send(200,result)
    })
}

//获取指定类型账本数量
function typeCount (param) {
    return new Promise((resolve,reject) => {
        cashModel.count(param, function (err,result) {
            if (err) {
                return reject(err)
            }
            resolve(result)
        })
    })
}

//上传图片接口
exports.uploadImage = function (req, res) {
    const file = req.file
    const options = { 
        method: 'POST',
        url: config.uploadHost + "/upload/imagev3",
        headers: {
            'content-type': 'multipart/form-data'
        },
        formData: { 
            file: {
                value: bufferToStream(file.buffer),
                options: {
                    filename: file.originalname,
                    contentType: file.mimetype,
                    knownLength: file.size,
                }
            }
        }
    }
    httpUtil.request(options, function (err, result) {
        if (err) {
            return res.send(400,err)
        }
        if (result.code !== 200) {
            return res.send(400,result.message)
        }
        res.send(200,{imageUrl:result.data.imageUrl})
    })
}

function bufferToStream(buffer) {
    const duplexStream = new stream.Duplex();
    duplexStream.push(buffer);
    duplexStream.push(null);
    return duplexStream;
}