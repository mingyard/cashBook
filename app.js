var middleware = require('./routes/middleware.js')
var express = require('express');
var app = express();
var config = require('./config.js');
var api = require("./routes/api.js");
// var time = require("./time")
// var input = require("./input")

process.on('uncaughtException', function (err) {
    console.log('[Inside \'uncaughtException\' event]' + err.stack || err.message);
});

app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With,apptvmid,apptoken");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    if (req.method === "OPTIONS") {
        return res.send(200);
    }
    next();
});

var logToken = '[:date] - :method :url :status :res[content-length] - :response-time ms';
express.logger.token('date', function () {
    return new Date().toLocaleString();
});
app.use(express.logger(logToken))
app.use(express.bodyParser({
    maxFieldsSize: 1 * 1024 * 1024
}))

app.use(middleware.midSend())
app.use(app.router)
app.use('/api', api)

exports.server = require('http').createServer(app)
exports.server.listen(config.port, function () {
    console.log('Express server listening on port %d in %s mode', config.port, app.get('env'));
});