const express = require('express');
const api = express();
const shareInfo = require('./shareInfo')
const login = require('./login')
const middleware = require('./middleware')
const cash = require('./cash')
const bill = require('./bill')
const multer = require('multer');
module.exports = api;

api.get('/share/info', shareInfo.getNowShareInfo)

//登陆
api.post('/login', login.login)

//校验用户是否存在
api.post('/exsit', login.userExsits)

//获取用户记账本列表
api.post('/cash/list', middleware.getUserId, cash.cashList)
//创建记账本
api.post('/cash/create', middleware.getUserId, cash.crateCash)
//退出账本
api.post('/cash/del', middleware.getUserId, cash.checkCash(), cash.del)


//添加账单
api.post("/bill/add", middleware.getUserId, cash.checkCash(), bill.add)
//添加账单类型
api.post("/bill/addType", middleware.getUserId, cash.checkCash(), bill.addType)
//获取账单类型
api.post("/bill/typeList", middleware.getUserId, cash.checkCash(), bill.typeList)
//删除账单类型
api.post("/bill/delType", middleware.getUserId, bill.checkLable, bill.delType)
//修改账单类型
api.post("/bill/updateType", middleware.getUserId, bill.checkLable, bill.updateType)


//获取最后修改账本信息
api.post("/cash/info", middleware.getUserId, cash.checkCash(false),cash.lastCashInfo)
//获取账本类型列表
api.post("/cashType/list", middleware.getUserId, cash.getTypeList)
//获取指定类型账本数量
api.post("/cashType/count", middleware.getUserId, cash.typeCount)


//上传图片接口
api.post("/upload/image", multer().single('file'), cash.uploadImage)
