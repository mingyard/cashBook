var express = require('express')
var logger = require('morgan')
var bodyParser = require('body-parser')
var app = express()
var config = require('./config.js')
var open = require('./routes/openApi.js')

process.on('uncaughtException', function(err) {
  console.log('[Inside \'uncaughtException\' event]' + err.stack || err.message)
});

var logToken = '[:date] - :method :url :status :res[content-length] - :response-time ms'
logger.token('date', function() {
  return new Date().toLocaleString()
});

app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With")
  res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS")
  if(req.method=="OPTIONS") {
    return res.send(200)
  }
  next();
});

app.use(logger(logToken))
app.use(bodyParser.urlencoded({ extended: false }))  
app.use(bodyParser.json())

app.use('/open', open)

app.listen(config.port, function() {
  console.log('Express server listening on port %d in %s mode', config.port, app.get('env'))
});