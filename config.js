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
        "host": "59.110.229.198",
        "port": 6379,
        "password": 'ming$8888'
    },
    "mongodb": {
        "master": {url: "mongodb://cash:book@59.110.229.198/cashBook", opts: {}},
    },
}
var QQ_CONFIG = {
    "NODE_ENV": "qq",
    "domain": "http://mingyard.com:8888",
    "apiHost": "http://api.money.126.net",
    "wxApiHost": "https://api.weixin.qq.com",
    "uploadHost": "http://friends.yaotv.tvm.cn",
    "redis": {
        "host": "127.0.0.1",
        "port": 6379,
        "password": 'ming$8888'
    },
    "mongodb": {
        "master": {url: "mongodb://cash:book@127.0.0.1:27017/cashBook", opts: {useNewUrlParser:true}},
    },
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