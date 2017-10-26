/**
 * Created by chenjie on 2015/4/20.
 */

var config          = require('../config');
var mongoskin       = require('mongoskin');

var masterDb = mongoskin.db(config.mongodb.master.url, config.mongodb.master.opts)
module.exports = {masterDb: masterDb}