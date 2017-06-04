var express = require('express');
var api = express();
var shareInfo = require('./shareInfo.js')
module.exports = api;

api.get('/share/info', shareInfo.getNowShareInfo)