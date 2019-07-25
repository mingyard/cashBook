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

//创建记账本
exports.crateCash = function (req, res) {
    const name = req.body.name
    const image = req.body.image
    const openId = req.openId
    const categoryid = req.body.categoryid
    if (!name || !image || !openId || !categoryid) {
        return res.send(400, '参数错误！')
    }
    async.auto ({
        create: function (cb) {
            const time = new Date()
            exports.create({
                name: name,
                image: image,
                openid: openId,
                categoryid: categoryid,
                status: 1, // -1 删除  1正常 
            }, function (err, result) {
                if (err) {
                    return cb(err)
                }
                cb(null, result)
            })
        },
        add: ['create', function (result, cb) {
            var cashId = result.create._id.toString()
            exports.addMember(cashId, openId, '9999999999999',function (err, result) {
                if (err) {
                    return cb(err)
                }
                cb(null, result)
            })
        }]
    }, function (err, result) {
        console.log('[%j] cash.create , result:%j, err:%j', new Date().toLocaleString(), result, err)                
        if (err) {
            return res.send(400, "创建失败")
        }
        res.send(200, result.create._id.toString())
    }) 
}

//删除账本
exports.del = function (req, res) {
    const cashId = req.cash._id
    if (req.cash.status != 1) {
        res.send(400,"已删除")
    }
    cashModel.updateById(cashId,{$set:{status:-1}}, function (err, result){
        if (err) {
            return res.send(400, '删除账本失败')
        }
        res.send(200, '删除成功')
    })
}

//获取账本列表
exports.cashList =  function (req, res) {
    const openId = req.openId
    cashModel.find({openid: openId, status: 1}, function (err, result){
        if (err) {
            return res.send(400, '获取账本失败')
        }
        res.send(200, result)
    })
}

//获取账本列表
exports.info =  function (req, res) {
    //已经获取到账本信息，直接返回
    if (req.cash) {
        return res.send(200,req.cash)
    }

    //默认查询条件
    var spec = {
        openid: req.openId,
        status: 1
    }
    //取最近记录一条
    var options = {
        sort: {
            createdAt: -1
        }
    }
    cashModel.findOne(spec,options,function (err, result){
        if (err) {
            return res.send(400, err)
        }
        res.send(200, result)
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
            if (result.openid != req.openId) {
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
            cashModel.updateById(cashId, {$set: {members: members}}, function (err, result) {
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

//添加账本成员
exports.addMember = function (cashId, userId, time, cb) {
    redisClient.hset(cashId, userId, time, function (err, result) {
        if (err) {
            return cb(err)
        }
        cb(null,result)
    })
}

//获取账本成员redis数据
exports.getMembers = function (cashId, cb) {
    redisClient.hget(cashId, function (err, result) {
        if (err) {
            return cb(err)
        }
        cb(null, _.keys(result))
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

//获取指定类型账本数量
exports.typeCount = function (req, res) {
    const openId = req.openId
    const id = req.body.id
    cashModel.count({openid: openId,categoryid: id}, function (err,result) {
        if (err) {
            return res.send(400, err)
        }
        res.send(200,result)
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