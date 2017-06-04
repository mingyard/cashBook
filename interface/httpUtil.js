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