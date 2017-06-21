/**
 * Created by chenjie on 2015/1/5.
 */

var cluster = require('cluster')
var _ = require('underscore')
var numCPUs = require('os').cpus().length;

var workers = {}
var stopping = false
var workerCount = 0

var addWorker = function () {
    var w = cluster.fork()
    workers[w.process.pid] = w
}

var killChildren = function (ws) {
    _.each(ws, function (w) {
        console.log('try to kill', w.process.pid)
        w.process.kill('SIGTERM')
    })
}

var reload = function () {
    console.log('reload')
    var cpyWorkers = []
    _.map(workers, function (w, pid) {
        cpyWorkers.push(w)
    })
    //setTimeout(killChildren, 3 * 100, cpyWorkers)
    killChildren(cpyWorkers)
}

if (cluster.isMaster){
    process.title = 'share_master'
    var i = process.argv.indexOf('-i')
    i = process.argv[i + 1]
    i = Math.abs(parseInt(i, 10))
    if (!_.isNaN(i) && i < numCPUs){
        workerCount = i
    } else {
        workerCount = numCPUs
    }
    for (var i = 0; i < workerCount; i++){
        addWorker()
    }

    process.on('SIGHUP', reload)
    process.on('SIGTERM', function () {
        console.log('shutting down')
        var cpyWorkers = []
        stopping = true

        _.map(workers, function (w, pid) {
            cpyWorkers.push(w)
        });
        killChildren(cpyWorkers)
        process.exit()
    });

    cluster.on('exit', function (worker) {
        console.log('Worker ' + worker.process.pid + ' die')
        delete workers[worker.process.pid]
        if (!stopping && Object.keys(workers).length < workerCount){
            console.log('unexpected death, fork a new worker')
            addWorker()
        }
    });
} else {
    var server = require('./app').server
    process.title = 'share_worker'

    process.on('SIGTERM', function () {
        console.log('worker receive signal SIGTERM')
        try {
            server.close(function () {
                console.log('work closed')
                process.exit(0)
            });
            setTimeout(function () {
                console.log('process exit closed')
                process.exit(0)
            }, 2000)
        } catch (e) {
            process.exit(0)
        }
    })
}
