var exec = require('child_process').exec
var done = null
setInterval(function () {
    var time = new Date()
    var minute= time.getMinutes()
    var second = time.getSeconds()
    var milli = time.getMilliseconds()
    if (second === 59 && milli >= 620 && milli < 640) {
        if (done == minute) {
            return
        }
        done = minute
        var cmd = 'open /users/ming/yard/time/timedeal2.app'
        console.log(" minute: %j, seconds: %j , millis: %j",minute,second,milli)
        exec(cmd, function (err, stdout, stderr) {
            console.log("[%j] time , milli: %j, err: %j, stdout: %j, stderr: %j", new Date().toLocaleString(),new Date().getMilliseconds(), err, stdout, stderr)
        })
    }
}, 10)