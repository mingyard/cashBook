'use strict'

const mongoose_client = require('../mongo/mongooseClient')
const master_conn = mongoose_client.mongodbMaster()
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const timestamps = require('mongoose-timestamp')

const UserSchema = new Schema(
    {
        openid:             String, //开放平台id
        avatarUrl:          String, //头像
        city:               String, //城市
        country:            String, //国家
        gender:             String, //性别
        language:           String, //语言
        nickName:           String, //昵称
        status:             String, //状态
    },
    { collection: 'user'}
);

UserSchema.plugin(timestamps);

module.exports = master_conn.model('user', UserSchema);