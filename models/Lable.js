'use strict'

const mongoose_client = require('../mongo/mongooseClient')
const master_conn = mongoose_client.mongodbMaster()
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const timestamps = require('mongoose-timestamp')

//消费类型表

const LableSchema = new Schema(
    {
        icon:         String,     //图标id
        name:         String,     //名称
        status:       String,     //状态
        cashid:       String,     //账本id
    },
    { collection: 'lable'}
);

LableSchema.plugin(timestamps);

module.exports = master_conn.model('lable', LableSchema);