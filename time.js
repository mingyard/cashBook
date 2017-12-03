var exec = require('child_process').exec
var schedule = require('node-schedule')

// var CronJob = require('cron').CronJob;
// new CronJob('59 * * * * *', function () {
//     var i = 0
//     var time = new Date()
//     var minute= time.getMinutes()
//     var second = time.getSeconds()
//     setInterval(function () {
//         if (i == 54) {
//             var cmd = 'open /users/ming/yard/time/timedeal2.app'
//             console.log(" minute: %j, seconds: %j , millis: %j",minute,second,i*10)
//             exec(cmd, function (err, stdout, stderr) {
//                 console.log("[%j] time , milli: %j, err: %j, stdout: %j, stderr: %j", new Date().toLocaleString(),new Date().getMilliseconds(), err, stdout, stderr)
//             })
//         }
//         i++
//     }, 10)
// }, null, true);

//2017-11-16 millis >= 500 && millis < 520 
//运行日志
// minute: 29, seconds: 59 , millis: 502
// ["2017-11-16 22:29:59"] time , milli: 609, err: null, stdout: "", stderr: ""
//服务器排名10 到达服务器时间097
// new schedule.scheduleJob('59 29 22 * * *', function () {
//     var done = false
//     setInterval(function () {
//         var time = new Date()
//         var minute = time.getMinutes()
//         var second = time.getSeconds()
//         var millis = time.getMilliseconds()
//         if (millis >= 500 && millis < 520) {
//             if (done) {
//                 return
//             }
//             done = true
//             var cmd = 'open /users/ming/yard/time/timedeal2.app'
//             console.log(" minute: %j, seconds: %j , millis: %j",minute,second,millis)
//             exec(cmd, function (err, stdout, stderr) {
//                 console.log("[%j] time , milli: %j, err: %j, stdout: %j, stderr: %j", time.toLocaleString(),new Date().getMilliseconds(), err, stdout, stderr)
//             })
//         }
//     }, 10)
// });


//2017-11-17  millis = 475 
//运行日志
// minute: 29, seconds: 59 , millis: 481
// ["2017-11-16 22:29:59"] time , milli: 555, err: null, stdout: "", stderr: ""
//服务器排名10 到达服务器时间114



//2017-11-18  millis = 450 
//运行日志
// minute: 29, seconds: 59 , millis: ?
// ["2017-11-16 22:29:59"] time , milli: 530, err: null, stdout: "", stderr: ""



//2017-11-21  millis = 460 
//运行日志
//25分开始
// minute: 29, seconds: 59 , millis: 461
// ["2017-11-21 22:29:59"] time , milli: 538



//2017-11-30  millis = 460 
//运行日志
//22分开始
//抢跑失败
// minute: 29, seconds: 59 , millis: 467
// ["2017-11-30 22:29:59"] time , milli: 544

//2017-12-03  millis = 465 
// minute: 29, seconds: 59 , millis: 466
// ["2017-12-03 22:29:59"] time , milli: 543
// minute: 29, seconds: 59 , millis: 466
// ["2017-12-03 22:29:59"] time , milli: 553

new schedule.scheduleJob('59 * * * * *', function () {
    while (new Date().getMilliseconds() != 467) {
        continue
    }
    placeOrder()
    var time = new Date()    
    console.log(" minute: %j, seconds: %j , millis: %j",time.getMinutes(),time.getSeconds(),time.getMilliseconds())
})

function placeOrder () {
    exec('open /users/ming/yard/time/timedeal.app', function () {
        console.log("[%j] time , milli: %j", new Date().toLocaleString(),new Date().getMilliseconds())
    })
}