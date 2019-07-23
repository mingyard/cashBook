'use strict'

const mongoose_client = require('../mongo/mongooseClient')
const master_conn = mongoose_client.mongodbMaster()
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const timestamps = require('mongoose-timestamp')

const CashTypeSchema = new Schema(
    {
        categoryid:         String, //类型id
        categorytitle:      String, //类型标题
        categorydesc:       String, //类型描述
        categorytype:       String, //类型类别
        categoryicon:       String, //类型图标
        parentid:           String,
        classid:            String, 
        status:             String, //状态
        isclear:            String, 
        sorttype:           Number, //短类型
        accountbookbgimg:   String, //背景图片
    },
    { collection: 'cashType'}
);

CashTypeSchema.plugin(timestamps);

module.exports = master_conn.model('cashType', CashTypeSchema);