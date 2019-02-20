var redisClient = require('../redis/redis_client.js').redisClient()
var dbUtils = require('../mongoSkin/mongoUtils.js')
var cashCollection= new dbUtils("cash")
var cashTypeCollection = new dbUtils("cashType")
var async = require('async')
var _ = require('underscore')
var moment = require('moment')
var request = require('request')
var config = require('../config')
var fs = require("fs")
var httpUtil = require('../interface/httpUtil')

//创建记账本
exports.crateCash = function (req, res) {
    var name = req.param('name')
    var image = req.param('image')
    var openId = req.openId
    var categoryid = req.param('categoryid')
    if (!name || !image || !openId || !categoryid) {
        return res.send(400, '参数错误！')
    }
    async.auto ({
        create: function (cb) {
            exports.create({
                name: name,
                image: image,
                openId: openId,
                categoryid: categoryid,
                createTime: new Date(),
                strTime: moment().format('YYYY-MM-DD HH:mm:ss')
            }, function (err, result) {
                if (err) {
                    return cb(err)
                }
                cb(null, result)
            })
        },
        add: ['create', function (result, cb) {
            var cashId = result.create._id
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
        res.send(200, "创建成功")
    }) 
}

//获取账本列表
exports.cashList =  function (req, res) {
    var openId = req.openId
    cashCollection.find({openId: openId}, function (err, result){
        if (err) {
            return res.send(400, '获取账本失败')
        }
        res.send(200, result)
    })
}

//添加账本成员接口
exports.addMembers = function (req, res) {
    var openIds = req.param('openids')
    var cashId = req.param('cashId')
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
            cashCollection.updateById(cashId, {$set: {members: members}}, function (err, result) {
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
    cashCollection.save(param, function (err, result) {
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
    cashTypeCollection.find({status:"1"}, function (err, result) {
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
    var openId = req.openId
    var id = req.param('id')
    cashCollection.count({openId: openId,categoryid: id}, function (err,result) {
        if (err) {
            return res.send(400, err)
        }
        res.send(200,result)
    })
}

//上传图片接口
exports.uploadImage = function (req, res) {
    var file = req.files.file
    var options = { 
            method: 'POST',
            url: config.uploadHost + "/upload/imagev3",
            headers: {
                'content-type': 'multipart/form-data'
            },
            formData: { 
                file: {
                    value: fs.createReadStream(file.path),
                    options: {
                        filename: file.path
                    }
                }
            }
        }
        httpUtil.request(options, function (err, result) {
        if (err) {
            res.send(400,err)
        }
        res.send(200,{imageUrl:result.data.imageUrl})
    })
}