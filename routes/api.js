const express = require('express');
const api = express();
const shareInfo = require('./shareInfo')
const login = require('./login')
const middleware = require('./middleware')
const cash = require('./cash')
module.exports = api;

api.get('/share/info', shareInfo.getNowShareInfo)

//登陆
api.post('/login', login.login)
//获取用户记账本列表
api.post('/cash/list', middleware.getOpenId, cash.cashList)
//创建记账本
api.post('/cash/create', middleware.getOpenId, cash.crateCash)
api.post('/cash/del', middleware.getOpenId, cash.checkCash(), cash.del)
//获取账本信息
api.post("/cash/info", middleware.getOpenId, cash.checkCash(false), cash.info)
//获取账本类型列表
api.post("/cashType/list"/*, middleware.getOpenId*/, cash.getTypeList)
//获取指定类型账本数量
api.post("/cashType/count", middleware.getOpenId, cash.typeCount)
//上传图片接口
api.post("/upload/image", middleware.getOpenId, cash.uploadImage)