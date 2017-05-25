/**
 * Created by chenjie on 2015/5/13.
 */

var express = require('express');
var open = express();
module.exports = open;

open.get('/', function (req, res) {
    res.send('hello world')
})