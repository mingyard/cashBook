var getPixels = require('get-pixels')
var async = require('async')
var exec = require('child_process').exec

var images = []
var ids = [1,2,3,4,5,6,7,8]
var number = 0

//分辨率配置
var minX = 400
var maxX = 1240
var minY = 860
var maxY = 1560
var leftX = 176

var ArrayX = maxX - minX
var ArrayY = maxY - minY

//领种子点
var getGlodPoint = {
    X: 770,
    Y: 2200
}

//关闭广告点
var closeAd1 = {
    X:1370,
    Y:450
}
var closeAd2 = {
    X:1350,
    Y:880
}

//关闭确认页
var closePoint = {
    X:1350,
    Y:528
}

//滑块点击位置
var slidePoint = {
    X:280,
    Y:1700
}

//滑块速度
var slideTime = 7000

//装载图片
function getImageArray (image,callback) {
    //像素数组
    var pointArray = new Array(ArrayX)
    for (var i = 0 ; i < pointArray.length ; i++) {
        pointArray[i] = new Array(ArrayY)
    }
    getPixels("./public/" + image + '.png', function (err, pixels){
        if (err) {
            return callback("image:%j , 装载失败",image)
        }
    
        for (var i = minX; i < maxX; i++) {
            for (var j = minY; j < maxY; j++) {
                pointArray[i - minX][j - minY] =  getPointRGB(pixels,i,j)
            }
        }
        console.log("image:%j , 装载完毕！",image)
        callback(null,{name:image,pointArray:pointArray})
    })
}

//装载图库
function loadImages (cb) {
    async.eachSeries(ids, function (item, callback) {
        getBlackImage("screen" + item, function (err,result) {
            if (err) {
                return callback(err)
            }
            images.push(result)
            callback()
        })
    }, function (err) {
        if (err) {
            console.log('装载图库失败 err:%j',err)
            return (err)
        }
        console.log('图库装在完毕')
        cb()
    })
}

//根据两张素材，计算底板图像
function getBlackImage (image, callback) {
    async.auto({
        frist: function (cb) {
            getImageArray(image, function (err, result) {
                if (err) {
                    return cb(err)
                }
                cb(null, result)
            })
        },
        second: ['frist', function (result,cb) {
            getImageArray(image + '-1', function (err, result) {
                if (err) {
                    return cb(err)
                }
                cb(null, result)
            })
        }],
        final: ['second', function (result,cb) {
            var frist = result.frist.pointArray
            var second = result.second.pointArray
            // var count = 0
            for (var i = 0; i < ArrayX; i++) {
                for (var j = 0; j < ArrayY; j++) {
                    if (frist[i][j].R != second[i][j].R || frist[i][j].G != second[i][j].G || frist[i][j].B != second[i][j].B) {
                        var fristY = getPonitY(frist[i][j])
                        var secondY = getPonitY(second[i][j])
                        if (fristY < secondY) {
                            // count++
                            frist[i][j] = second[i][j]
                        }
                    }
                }
            }
            // console.log('替换是像素点:%j',count)
            cb(null, frist)
        }]
    }, function (err,result) {
        if (err) {
            return callback(err)
        }
        callback(null, {name:image, pointArray:result.final})
    })
}

//获取点的GRB
function getPointRGB (pixels,x,y) {
    var R = pixels.get(x,y,0)
    var G = pixels.get(x,y,1)
    var B = pixels.get(x,y,2)
    return {R:R,G:G,B:B}
}

//获取点的亮度
function getPonitY (point) {
    return Math.round(0.257 * point.R + 0.504 * point.G + 0.098 * point.B + 16)
}

//目标图片与图库文件对比
function contrastImage (callback) {
    async.auto({
        target: function (cb) {
            getImageArray('screen', function (err, result) {
                if (err) {
                    return cb(err)
                }
                cb(null, result)
            })
        },
        checkImage:['target', function (result, cb) {
            var target = result.target.pointArray
            checkImage(target, function (err,result) {
                if (err) {
                    return cb(err)
                }
                cb(null, result)
            })
        }],
        contrast:['checkImage', function (result, cb) {
            var blackImage = result.checkImage.pointArray
            var target = result.target.pointArray
            for (var i = 0; i < ArrayX; i++) {
                var count = 0
                for (var j = 0; j < ArrayY; j++) {
                    var blackImageY = getPonitY(blackImage[i][j])
                    var targetY = getPonitY(target[i][j])
                    if (targetY < blackImageY) {
                        count++
                        if (count > 100) {
                            return cb(null, i + 400)
                        }
                    }
                }
            }
            cb('没有找到阴影位置')
        }]
    }, function (err, result) {
        if (err) {
            return callback(err)
        }
        console.log('对比完成！')        
        callback(null, result.contrast)
    })
}

//判断图片名称
function checkImage (imageArray, cb) {
    //多点检测
    async.eachSeries(images, function (item, callback) {
        var number = 0
        var count = 0
        for (var i = 0; i < ArrayX; i+=50) {
            for (var j = 0; j < ArrayY; j+=50) {
                number++
                if (imageArray[i][j].R == item.pointArray[i][j].R && imageArray[i][j].G == item.pointArray[i][j].G && imageArray[i][j].B == item.pointArray[i][j].B) {
                    count++
                }
            }
        }
        console.log('识别点 number :%j , count:%j', number, count)
        if (count / number > 0.8) {   
            return callback(item)
        }
        callback()
    }, function (err) {
        if (err) {
            console.log('识别图片:%j',err.name) 
            return cb(null,err)
        }
        cb("图库中未找到该图片！")
    })
}


//获取待验证图片
function getCheckImage (cb) {
    async.auto({
        screen: function (cb) {
            exec('adb shell screencap /sdcard/screen.png', function (err) {
                if (err) {
                    return cb(err)
                }
                // console.log("截图成功！")
                cb()
            })
        },
        save: ['screen', function (result,cb) {
            exec('adb pull /sdcard/screen.png /Users/ming/yard/cashBookApi/public/screen.png', function (err) {
                if (err) {
                    return cb(err)
                }
                // console.log("截图保存成功！")
                cb()
            })  
        }]
    }, function (err) {
        if (err) {
            return cb(err)
        }
        console.log("截图完成")        
        cb()
    })
}

//自动过验证码
function atuoPass (cb) {
    async.auto({
        image:  function (cb) {
            getCheckImage(function (err) {
                if (err) {
                    return cb(err)
                }
                cb()
            })
        },
        check: ['image', function (result,cb) {
            contrastImage(function (err,result) {
                if (err) {
                    return cb(err)
                }
                cb(null,result)
            })
        }],
        final:['check', function (result, cb) {
            var point = result.check
            // console.log('对比完成, 目标点:%j',point)
            // console.log('移动距离:%j', point - leftX)
            var endPoint = point + slidePoint.X - leftX
            // console.log('终点:%j', endPoint)
            slide (slidePoint,{X:endPoint,Y:slidePoint.Y},slideTime,function (err) {
                if (err) {
                    return cb(err)
                }
                cb()
            })
        }]
    }, function (err) {
        if (err) {
            return cb(err)
        }
        console.log("通过验证码")        
        cb()
    })
}

//滑动 & 长按
function slide (beginPoint,endPoint,time,cb) {
    exec('adb shell input swipe '+ beginPoint.X + ' ' + beginPoint.Y + ' ' + endPoint.X + ' ' + endPoint.Y + ' ' + time, function (err) {
        if (err) {
            return cb('滑动失败:'+err)
        }
        cb()
    })
}

//点击
function click (point,time,cb) {
    exec('adb shell input tap '+ point.X + ' ' + point.Y, function (err) {
        if (err) {
            return cb('点击失败:'+err)
        }
        setTimeout(function () {
            cb()
        },time)
    })
}

//关闭广告
function closeAd (cb) {
    async.auto({
        //广告1        
        ad1: function (cb) {
            click(closeAd1,500,function (err) {
                if (err) {
                    return cb('广告 ad1 关闭失败, err:'+err)
                }
                cb()
            })
        },
        //广告2     
        ad2: ['ad1', function (result, cb) {
            click(closeAd2,500,function (err) {
                if (err) {
                    return cb('广告 ad2 关闭失败, err:'+err)
                }
                cb()
            })
        }]
    }, function (err) {
        if (err) {
            return cb(err)
        }
        console.log('广告关闭')        
        cb()
    })
}


//自动流程
function autoDo (cb) {
    async.auto({
        //下拉
        pullDown: function (cb) {
            slide ({X:780,Y:840},{X:780,Y:1520},1000,function (err) {
                if (err) {
                    return cb(err)
                }
                setTimeout(function () {
                    cb()
                },7000)
            })
        },
        //领种子
        getGlod: ['pullDown' , function (result,cb) {
            click(getGlodPoint,3000,function (err) {
                if (err) {
                    return cb(err)
                }
                cb()
            })
        }],
        //过验证
        pass: ['getGlod', function (result, cb) {
            atuoPass(function (err) {
                if (err) {
                    return cb(err)
                }
                setTimeout(function () {
                    cb()  
                },5000)
            })
        }],
        //关闭广告
        closeAd: ['pass' , function (result, cb) {
            //广告1
            closeAd(function (err) {
                if (err) {
                    return cb(err)
                }
                setTimeout(function () {
                    cb()   
                },1000)
            })
        }],
        //关闭恭喜页
        close: ['closeAd' , function (result, cb) {
            click(closePoint,1000,function (err) {
                if (err) {
                    return cb(err)
                }
            })
            console.log('关闭恭喜页')
            cb()
        }]
    },function (err) {
        if (err) {
            return cb(err)
        }
        console.log('本次摇种子完成')
        cb()
    })
}


//递归调用
function forever () {
    autoDo(function (err) {
        number++
        console.log("运行%j次",number)                 
        if (err) {
            console.log("atuoPass err:%j",err)
            if (err == '图库中未找到该图片！') {
                forever()  
            }
            return 
        }
        setTimeout(function () {
            forever()        
        },1000 * 60 * 2.7)
    })
}

//主方法
loadImages(function (err) {
    if (err) {
        console.log(err)
        return
    }
    forever()
}) 

// exec('adb shell input swipe 308 1700 ' + 1148 + ' 1700', function () {
//     console.log()
// })