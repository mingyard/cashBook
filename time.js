var moment = require('moment')
var exec = require('child_process').exec
setInterval(function () {
    var milli = new Date().getMilliseconds()
    console.log("date: %j, milli: %j, ", moment().format('HH:mm:ss'), milli)
    if (new Date().getSeconds === 59 && milli >= 500) {
        console.log("运行！")
        var cmd = 'open /users/ming/yard/time/timedeal.app'
        exec(cmd, function (err, stdout, stderr) {
            console.log("[%j] time , milli: %j, err: %j, stdout: %j, stderr: %j", new Date().toLocaleString(),new Date().getMilliseconds(), err, stdout, stderr);
        });
    }
}, 50)