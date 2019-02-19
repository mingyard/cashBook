var request = require('request')
var _ = require('underscore')

exports.getJsonp = function (url, cb,header,param) {
    var options = {
        method: 'GET',
        url: url,
        headers: {
            'content-type': 'application/json',
            'Accept': '*/*'
        }
    }
    if (header) {
        options.headers = _.extend(options.headers,header)        
    }
    if (param) {
        options.body = param
    }
    request(options, function (error, response, body) {
        if (error) return cb(error)
        if (response.statusCode != 200) return cb({code: response.statusCode, data: body})
        try {
            body = JSON.parse(body.replace(/^.*[\(]|\)\;/g,""))
            cb(null, body)
        } catch (e) {
            return cb(null, body)
        }
    })
}

exports.getJSON = function (url,param,cb) {
    if (!cb) {
        cb = param
        param = null
    }
    var options = {
        url: url,
        qs: param,
        headers: {
            'content-type': 'application/json',
            'Accept': '*/*'
        }
    }
    request(options, function (error, response, body) {
        if (error) return cb(error)
        if (response.statusCode != 200) return cb({code: response.statusCode, data: body})
        try {
            var data = JSON.parse(body)
        } catch (e) {
            console.log('exports.getJSON JSON.parse error')
        }
        if (data) {
            return cb(null, data)
        }
        cb(null, body)
    })
}

//request 请求
exports.request = function (options, cb) {
    request(
        options,
        function (error, response, body) {
            if (!error && response && response.statusCode == 200) {
                if (typeof body == 'string') {
                    body = JSON.parse(body);
                }
                cb(null, body);
            } else {
                console.log("[%j], http:request, url:%j, error: %j, body:%j", new Date().toLocaleString(), options.url, response ? response.statusCode : null,body)
                cb(error? error : body)
            }
        }
    )
}