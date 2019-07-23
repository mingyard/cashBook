'use strict'
const mongoose = require('mongoose')
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
const config = require('../config')

const CONN_OPT = {
    useNewUrlParser: true,
    keepAlive: true,
    connectTimeoutMS: 30000,
    poolSize: 5,
    reconnectTries: 30
}

/**
 * Model基类
 * @param tb
 * @returns {Model}
 * @constructor
 */

exports.mongodbMaster = function () {
    const conn = mongoose.createConnection(config.mongodb.master.url, CONN_OPT);
    conn.on('error', error => {
        console.log(error)
    })
    conn.on('connected', () => {
        console.log('Mongoose Master Connected Success: ' + config.mongodb.master.url)
    })
    conn.on('disconnected', () => {
        console.log('mongoose disconnected!')
    })
    return conn
}

exports.mongodbSlave = function () {
    const conn = mongoose.createConnection(config.mongodb.slave.url, CONN_OPT);
    conn.on('error', error => {
        console.log(error)
    })
    conn.on('connected', () => {
        console.log('Mongoose Slave Connected Success: ' + config.mongodb.slave.url)
    })
    conn.on('disconnected', () => {
        console.log('mongoose disconnected!')
    })
    return conn
}
