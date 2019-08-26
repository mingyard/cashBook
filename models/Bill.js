'use strict'

const mongoose_client = require('../mongo/mongooseClient')
const master_conn = mongoose_client.mongodbMaster()
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const timestamps = require('mongoose-timestamp')

const BillSchema = new Schema(
    {
        cashid:         String,     //账本id
        userid:         String,     //用户id
        amount:         String,     //总金额
        lableid:        String,     //类型id
        status:         String,     //状态
        notes:          String,     //备注
        image:          String,     //备注图片url
        members:        Array,      //参与成员
    },
    { collection: 'bill'}
);

BillSchema.plugin(timestamps);

module.exports = master_conn.model('bill', BillSchema);