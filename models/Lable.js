'use strict'

const mongoose_client = require('../mongo/mongooseClient')
const master_conn = mongoose_client.mongodbMaster()
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const timestamps = require('mongoose-timestamp')

//消费类型表

const LableSchema = new Schema(
    {
        categoryid:         String, //类型id
        categorytitle:      String, //类型标题
        categorydesc:       String, //类型描述
        categorytype:       String, //类型类别
        categoryicon:       String, //类型图标
        parentid:           String, //cashType
        classid:            String, 
        status:             String, //状态
        isclear:            String, 
        type:               String, //收入/支出
        cashid:             String, //账本id
    },
    { collection: 'lable'}
);

LableSchema.plugin(timestamps);

module.exports = master_conn.model('lable', LableSchema);