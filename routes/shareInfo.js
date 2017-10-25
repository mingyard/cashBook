var httpUtil = require('../interface/httpUtil.js')
var config = require('../config.js')
var _ = require('underscore') 

//实时股票信息
exports.getShareInfo = function (shareIds, cb) {
    if (!_.isArray(shareIds)) {
        shareIds = [shareIds]
    }
    shareIds.join(',')
    httpUtil.getJsonp(config.apiHost + '/data/feed/' + shareIds + ',money.api?time=' + new Date().getTime(), function (err, result) {
        console.log(config.apiHost + '/data/feed/' + shareIds + ',money.api?time=' + new Date().getTime())
        if (err) {
            return cb(err)
        }
        cb(null, result)
    })
}

//获取实时股票信息
exports.getNowShareInfo = function (req, res) {
    var shareId = req.param('shareId')
    if (!shareId) {
        return res.send(400, '参数错误')
    }
    exports.getShareInfo(shareId, function (err, result) {
        if (err) {
            return res.send(400, err)
        }
        res.send(200, result)
    })
}