'use strict'

const mongoose_client = require('../mongo/mongooseClient')
const master_conn = mongoose_client.mongodbMaster()
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const timestamps = require('mongoose-timestamp')

const CashSchema = new Schema(
    {
        name:           String,     //账本名称
        image:          String,     //账本图片  
        openid:         String,     //用户id
        categoryid:     String,     //类型id
        status:         String,     //状态
    },
    { collection: 'cash'}
);

CashSchema.plugin(timestamps);

module.exports = master_conn.model('cash', CashSchema);