var _ = require("underscore");
var config = require('../config');
var default_page_size = 10;
var max_page_size = 20;

exports.midPageChecker = function (pageSize) {
    return function (req, res, next) {
        var page = req.param('page');
        if (_.isUndefined(page)) {
            page = 0;
        } else {
            page = parseInt(page, 10);
            if (_.isNaN(page)) {
                page = 0
            }
        }
        var size = req.param('pageSize');
        if (_.isUndefined(size)) {
            if (pageSize && pageSize > 0) {
                size = pageSize;
            } else {
                size = default_page_size;
            }
        } else {
            size = parseInt(size, 10);
            if (_.isNaN(size)) {
                size = default_page_size;
            }
        }
        if (size > max_page_size) {
            return res.send(400, 'param pageSize exceed max limit 20');
        }
        req.pageSpec = {
            limit: size,
            skip: page * size
        }
        next()
    }
}

exports.midSend = function () {
    return function (req, res, next) {
        var send = res.send
        res.send = function (code, data) {
            if (req.lockID) {
                exports.delLock(req.lockID)
            }
            if (config.NODE_ENV == "qa") {
                //console.log(moment(new Date()).format("YYYY/MM/DD HH:mm:ss")+" "+ JSON.stringify(arguments));
            }
            res.send = send
            if (_.isNumber(code)) {
                if (code == 200) {
                    res.send({ status: 'success', code: code, data: data })
                } else {
                    res.send({ status: 'failure', code: code, errMsg: data, message: data })
                }
            } else {
                res.send({ status: 'success', code: 200, data: code })
            }
        }
        next()
    }
}