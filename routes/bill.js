const redisClient = require('../redis/redis_client.js').redisClient()
const billModel = require('../models/Bill')
const lableModel = require('../models/Lable')
const httpUtil = require('../interface/httpUtil')

//添加账单
exports.add = async (req,res) => {
    const {userid,cash:{id:cashid}} = req
    const {lableid,amount,notes,image,members} = req.body
    try {
        const bill = await create({
            userid,
            cashid,
            amount,
            lableid,
            notes,
            image,
            status: 1,
            members
        }) 
        res.send(200,bill)
    } catch (err) {
        return res.send(400,err.message)
    }
}

//添加账单记录
function create(data){
    return new Promise((res,rej)=>{
        billModel.create(data,(err,result)=>{
            if (err) return rej(err)
            res(result)
        })
    })
}

//获取账单自定义类型
exports.typeList = async (req,res) => {
    const {cashId:cashid} = req.body
    lableModel.find({cashid:{$in:["",cashid]},status:1},(err,result)=>{
        if (err) {
            return res.send(400,err)
        }
        res.send(200,result)
    })
}

//添加账单自定义类型
exports.addType = (req,res) => {
    const {
        cashId,
        categoryTitle,
        categoryIcon,
        parentId,
        type,
    } = req.body
    let data = {
        cashid: cashId,
        categorytitle: categoryTitle,
        categoryicon: categoryIcon,
        parentid: parentId,
        type: type,
        status: "1",
    }
    lableModel.create(data,(err,result) => {
        if (err) {
            return res.send(400,err)
        }
        res.send(200,result)
    })
}

exports.checkLable = (req,res,next) => {
    const {lableid} = req.body
    if (!lableid) {
        return res.send(400,"参数错误，缺少lableid")
    }

    lableModel.findById(lableid,(err,result)=>{
        if (err) {
            return res.send(400,err)
        }
        if (!result) {
            return res.send(400,"该类型不存在")
        }
        req.lable = result
        next()
    })
}

//删除账单自定义类型
exports.delType = (req,res) => {
    const {lableid} = req.body
    lableModel.updateOne({_id:lableid},{$set:{status:-1}},(err, result) =>{
        if (err) {
            return res.send(400,err)
        }
        res.send(200,result)
    })
}

//修改账单自定义类型
exports.updateType = (req,res) => {
    const {
        cashId,
        categoryTitle,
        categoryIcon,
        parentId,
        type
    } = req.body
    const update = {
        categorytitle: categoryTitle,
        categoryicon: categoryIcon,
        parentid: parentId,
        type: type
    }
    lableModel.updateOne({_id:cashId},{$set:update},(err, result) =>{
        if (err) {
            return res.send(400,err)
        }
        res.send(200,result)
    })
}


