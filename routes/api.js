var express = require('express');
var api = express();
var shareInfo = require('./shareInfo.js')
var login = require('./login')
module.exports = api;

api.get('/share/info', shareInfo.getNowShareInfo)

//登陆
api.post('/login', login.login)