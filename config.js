var _ = require('underscore')
var NODE_ENV = require('./env-config.js')
NODE_ENV = NODE_ENV.toString().toUpperCase()

var DEV_CONFIG = {
    "NODE_ENV": "dev",
    "domain": "http://localhost:8888",
    "apiHost": "http://api.money.126.net",
    "wxApiHost": "https://api.weixin.qq.com",
    "uploadHost": "http://qa-friends.yaotv.tvm.cn/upload/imagev3",
    "redis": {
        "host": "39.107.236.41",
        "port": 6379
    },
    "mongodb": {
        "master": {url: "mongodb://cash:book@39.107.236.41:27017/cashBook", opts: {}},
        // "slave": {url: "mongodb://b2bStock:b2bStock@39.107.236.41:22/b2bStock", opts: {}}
    },
    "cache_redis": [
    ]
}
var QQ_CONFIG = {
    "NODE_ENV": "qq",
    "domain": "http://mingyard.com:8888",
    "apiHost": "http://api.money.126.net",
    "wxApiHost": "https://api.weixin.qq.com",
    "uploadHost": "http://friends.yaotv.tvm.cn",
    "redis": {
        "host": "127.0.0.1",
        "port": 6379
    },
    "mongodb": {
        "master": {url: "mongodb://cash:book@127.0.0.1:27017/cashBook", opts: {useNewUrlParser:true}},
        // "slave": {url: "mongodb://b2bStock:b2bStock@10.10.42.26:27017/b2bStock", opts: {}}
    },
    "cache_redis": [
    ]
};

var CONFIG = {
    "port": 8888
};

if (NODE_ENV == 'QQ') {
    CONFIG = _.extend(CONFIG, QQ_CONFIG)
} else {
    CONFIG = _.extend(CONFIG, DEV_CONFIG)
}
module.exports = CONFIG;