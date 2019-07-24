const middleware = require('./routes/middleware.js')
const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const multer = require('multer');
const app = express();
const config = require('./config');
const api = require("./routes/api");


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
logger.token('date', function () {
    return new Date().toLocaleString();
});
app.use(logger(logToken))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(multer());

app.use(middleware.midSend())
app.use('/api', api)

exports.server = require('http').createServer(app)
exports.server.listen(config.port, function () {
    console.log('Express server listening on port %d in %s mode', config.port, app.get('env'));
});