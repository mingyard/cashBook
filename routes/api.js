var express = require('express');
var api = express();
var shareInfo = require('./shareInfo.js')
var login = require('./login')
var middleware = require('./middleware')
var cash = require('./cash')
module.exports = api;

api.get('/share/info', shareInfo.getNowShareInfo)

//登陆
api.post('/login', login.login)
//更新用户信息
api.post('/update/userInfo', middleware.getOpenId, login.updateUserInfo)
//获取用户记账本列表
api.post('/cash/list', middleware.getOpenId, cash.cashList)
//创建记账本
api.post('/cash/create', middleware.getOpenId, cash.crateCash)
//获取账本类型列表
api.post("/cashType/list", middleware.getOpenId, cash.getTypeList)