/**
 * Created by chenjie on 2015/4/20.
 */

var db          = require('./mongo.js');
var _           = require('underscore');
var mongoskin   = require( 'mongoskin' );
var ObjectID    = mongoskin.ObjectID;
var deepcopy    = require("deepcopy");
var GridStore = mongoskin.GridStore;

var redisCache = require('../redis/redis_cache.js');
var strIdCollections = [];
var collectionIndex = {
}

function dbUtils (collection, slave){
    this.collection = collection;
    this.slave = slave
    if (slave){
        this.curDb = db.slaveDb
    } else {
        this.curDb = db.masterDb
    }
    this.curDb.bind(this.collection);
}

dbUtils.ObjectID = ObjectID
dbUtils.GridStore = GridStore

dbUtils.getNonceStrId = function (){
    var $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var maxPos = $chars.length;
    var noceStr = "";
    for (var i = 0; i < 2; i++) {
        noceStr += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    noceStr += new ObjectID()
    return noceStr;
};

dbUtils.toId = function (id){
    if (_.isArray(id)){
        var arr = []
        _.each(id, function (o){
            if (!(o instanceof ObjectID)) {
                o = o.toString()
                arr.push(new ObjectID(o))
            } else {
                arr.push(o)
            }
        })
        return arr
    } else {
        if (!(id instanceof ObjectID)) {
            id = id.toString()
            return new ObjectID(id)
        } else {
            return id
        }
    }
}

dbUtils.isValidId = function (id){
    if (/^[0-9a-zA-Z]{24}$/.test(id)){
        return true
    } else {
        return false
    }
}

dbUtils.id2Str = function (id){
    if (_.isArray(id)){
        var arr = []
        _.each(id, function (o){
            arr.push(o.toString())
        })
        return arr
    } else {
        return id.toString()
    }
}

function obj2str (obj){
    for (var k in obj) {
        if (_.isString(obj[k])){
            continue
        } else if (_.isRegExp(obj[k])){
            obj[k] = obj[k].toString()
        } else {
            obj2str(obj[k])
        }
    }
}

function deepCopy (source) {
    return deepcopy(source);
}
exports.deepCopyObj=deepCopy;

function updateCache (collection, doc) {
    if (doc && collectionIndex[collection]) {
        var cache_key = collection;
        _.each(collectionIndex[collection], function (key){
            if (doc[key]){
                console.log('updateCache: %j', collection + '-' + doc[key])
                redisCache.delMulti(collection + '-' + doc[key]);
                cache_key += '-' + doc[key]
            }
        })
        if (collectionIndex[collection].length > 1){
            redisCache.delMulti(cache_key);
        }
    }
}
dbUtils.updateCache = updateCache

dbUtils.db = db

dbUtils.prototype = {
    //add cache in function
    insert: function (doc, callback) {
        var thisDb = this.curDb;
        thisDb[this.collection].insert(doc, callback)
        redisCache.delMulti(this.collection);
        if (doc._id) {
            redisCache.del(this.collection + '+' + doc._id.toString())
        }
        updateCache(this.collection, doc) //how do others?
    },
    save: function (doc, callback) {
        var thisDb = this.curDb;
        var collection = this.collection;
        thisDb[this.collection].save(doc, function (err, o){
            if (!err && doc._id) {
                redisCache.del(collection + '+' + doc._id.toString())
            }
            callback(err, doc)
        })
        redisCache.delMulti(this.collection);
        updateCache(this.collection, doc)
    },
    findOne: function (spec, options, callback) {
        var collection = this.collection;
        var thisDb = this.curDb;
        if (!_.contains(strIdCollections, collection)) {
            if (spec._id && !(spec._id instanceof ObjectID)) {
                spec._id = new ObjectID(spec._id);
            }
        }
        if (_.isFunction (options)) {
            callback = options;
            options = {};
        }
        var specs = deepCopy(spec);
        obj2str(specs);
        var redisKey = collection + "_" + JSON.stringify(specs).split(' ').join('') + JSON.stringify(options).split(' ').join('');
        //redisKey=CryptoJS.MD5(redisKey).toString();
        redisCache.getMulti(collection, redisKey, function (err, o) {
            if (err) {
                thisDb[collection].findOne(spec, options, function (err, db_result) {
                    var cache = '';
                    if (!err) {
                        cache = JSON.stringify(db_result);
                        redisCache.setMulti(collection, redisKey, cache);
                    }
                    callback(err, db_result);
                })
            } else {
                callback(null, o);
            }
        });
    },
    findById: function (_id, options, callback) {
        if (_.isFunction (options)) {
            callback = options
            options = {}
        }

        var collection = this.collection;
        var thisDb = this.curDb;
        if (_.contains(strIdCollections, collection)){
            _id = _id.toString()
        } else {
            if (!(_id instanceof ObjectID)) {
                if (!dbUtils.isValidId(_id)) {
                    return callback("id is invalid");
                }
                _id = new ObjectID(_id)
            }
        }

        var redisKey = collection + '+' + _id.toString();
        //var redisKey = _id + JSON.stringify(options).split(' ').join('');
        redisCache.get(redisKey, function (err, o) {
            if (err) {
                thisDb[collection].findById(_id, options, function (err, db_result) {
                    var cache = '';
                    if (!err) {
                        cache = JSON.stringify(db_result);
                        redisCache.set(redisKey, cache);
                    }
                    callback(err, db_result);
                })
            } else {
                console.log(collection + ',findById from cache, key:' + redisKey);
                callback(null, o);
            }
        });
    },
    find: function (spec, field, options, callback) {
        var collection = this.collection;
        var thisDb = this.curDb;

        if (spec._id){
            if (_.contains(strIdCollections, collection)){
                if (spec._id['$in'] && _.isArray(spec._id['$in'])){
                    spec._id['$in'] = dbUtils.id2Str(spec._id['$in'])
                } else {
                    spec._id = dbUtils.id2Str(spec._id)
                }
            } else {
                if (spec._id['$in'] && _.isArray(spec._id['$in'])){
                    spec._id['$in'] = dbUtils.toId(spec._id['$in'])
                } else {
                    spec._id = dbUtils.toId(spec._id)
                }
            }
        }

        if (_.isFunction (field)) {
            callback = field
            field = null
            options = null
        } else if (_.isFunction (options)) {
            callback = options
            options = null
        }

        var specs = deepCopy(spec)
        obj2str(specs)
        var redisKey = JSON.stringify(specs).split(' ').join('') + JSON.stringify(field).split(' ').join('') + JSON.stringify(options).split(' ').join('');
        var findKey = collection
        if (collectionIndex[collection]){
            _.each(collectionIndex[collection], function (key){
                if (spec[key]){
                    findKey += '-' + spec[key]
                }
            })
        }
        redisCache.getMulti(findKey, redisKey, function (err, o) {
            if (err) {
                thisDb[collection].findItems(spec, field, options, function (err, db_result) {
                    var cache = '';
                    if (!err) {
                        cache = JSON.stringify(db_result);
                        redisCache.setMulti(findKey, redisKey, cache);
                    }
                    callback(err, db_result);
                })
            } else {
                console.log(findKey + ',find from cache, spec:' + JSON.stringify(spec));
                callback(null, o);
            }
        });
    },
    count: function (spec, callback) {
        var collection = this.collection;
        var thisDb = this.curDb;

        var redisKey = JSON.stringify(spec).split(' ').join('') + "_MUTIL" + "_COUNT";
        //redisKey=CryptoJS.MD5(redisKey).toString();
        redisCache.getMulti(collection, redisKey, function (err, result){
            if (err){
                thisDb[collection].count(spec, function (err, db_result){
                    redisCache.setMulti(collection, redisKey, JSON.stringify({count: db_result}));
                    callback(err, db_result);
                })
            } else if (result && result.count >= 0){
                callback(null, result.count)
            } else {
                callback(null, 0)
            }
        })
    },
    countNoCache: function (spec, callback) {
        var collection = this.collection;
        var thisDb = this.curDb;
        thisDb[collection].count(spec, function (err, db_result) {
            callback(err, db_result);
        })
    },
    update: function (spec, update_spec, options, callback) {
        var collection = this.collection;
        var thisDb = this.curDb;

        if (_.isFunction (options)){
            callback = options
            options = null
        }
        if (spec._id){
            if (spec._id['$in'] && _.isArray(spec._id['$in'])){
                _.each(spec._id['$in'], function (o){
                    redisCache.del(collection + '+' + o.toString())
                })
                if (_.contains(strIdCollections, collection)){
                    spec._id['$in'] = dbUtils.id2Str(spec._id['$in'])
                } else {
                    spec._id['$in'] = dbUtils.toId(spec._id['$in'])
                }
            } else {
                redisCache.del(collection + '+' + spec._id.toString())
                if (_.contains(strIdCollections, collection)){
                    spec._id = dbUtils.id2Str(spec._id)
                } else {
                    spec._id = dbUtils.toId(spec._id)
                }
            }
        }
        redisCache.delMulti(this.collection);
        thisDb[this.collection].update(spec, update_spec, options, callback);
    },
    updateById: function (_id, update_spec, options, callback) {
        if (_.isFunction (options)){
            callback = options
            options = null
        }
        var collection = this.collection;
        var thisDb = this.curDb;
        if (_.contains(strIdCollections, collection)){
            _id = _id.toString()
        } else {
            if (!(_id instanceof ObjectID)) {
                if (!dbUtils.isValidId(_id)) {
                    return callback("id is invalid");
                }
                _id = new ObjectID(_id)
            }
        }

        thisDb[collection].updateById(_id, update_spec, options, function (err, count){
            if (!err){
                thisDb[collection].findById(_id, function (err, db_result) {
                    if (!err && db_result) {
                        redisCache.set(collection + '+' + _id.toString(), JSON.stringify(db_result));
                        updateCache(collection, db_result)
                    }
                })
            }
            callback(err, count)
        })
        redisCache.del(collection + '+' + _id.toString())
        redisCache.delMulti(collection);
    },
    findAndModify: function (spec, sort, update_spec, options, callback) {
        if (_.isFunction (options)){
            callback = options
            options = null
        }
        var thisDb = this.curDb;
        var collection = this.collection;
        thisDb[this.collection].findAndModify(spec, sort, update_spec, options, callback)

        redisCache.delMulti(this.collection);
        if (spec._id){
            console.log('del:' + collection + '+' + spec._id.toString())
            redisCache.del(collection + '+' + spec._id.toString())
        }
    },
    removeById:function (_id, callback){
        var collection = this.collection;
        var thisDb = this.curDb;
        if (_.contains(strIdCollections, collection)){
            _id = _id.toString()
        } else {
            if (!(_id instanceof ObjectID)) {
                if (!dbUtils.isValidId(_id)) {
                    return callback("id is invalid");
                }
                _id = new ObjectID(_id)
            }
        }
        var collectionName = this.collection
        thisDb[collectionName].findById(_id,function (err, db_result){
            if (err) {
                return callback(err);
            }
            if (db_result){
                updateCache(collection, db_result)
                db_result.collectionName = collectionName
                thisDb.collection('rubbish').save(db_result,function (err, result){
                    if (err){
                        return callback(err);
                    }
                    thisDb[collectionName].removeById(_id,function (err,doc){
                        callback(err, doc);
                        redisCache.del(collection + '+' + _id.toString())
                        redisCache.delMulti(collectionName);
                    })
                });
            } else {
                return callback("not find by id "+_id);
            }
        });
    },
    findByIdNoCache: function (_id, options, callback) {
        if (_.isFunction (options)) {
            callback = options
            options = {}
        }

        var collection = this.collection;
        var thisDb = this.curDb;
        if (_.contains(strIdCollections, collection)){
            _id = _id.toString()
        } else {
            if (!(_id instanceof ObjectID)) {
                if (!dbUtils.isValidId(_id)) {
                    return callback("id is invalid");
                }
                _id = new ObjectID(_id)
            }
        }
        thisDb[collection].findById(_id, options, function (err, db_result) {
            return callback(err, db_result);
        });
    },
    findOneNoCache: function (spec, options, callback) {
        var collection = this.collection;
        var thisDb = this.curDb;
        if (!_.contains(strIdCollections, collection)) {
            if (spec._id && !(spec._id instanceof ObjectID)) {
                spec._id = new ObjectID(spec._id);
            }
        }
        if (_.isFunction (options)) {
            callback = options;
            options = {};
        }
        thisDb[collection].findOne(spec, options, function (err, db_result) {
            return callback(err, db_result);
        });
    },
    findNoCache: function (spec, field, options, callback) {
        var collection = this.collection;
        var thisDb = this.curDb;
        if (_.isFunction (field)) {
            callback = field
            field = null
            options = null
        } else if (_.isFunction (options)) {
            callback = options
            options = null
        }
        thisDb[collection].findItems(spec, field, options, function (err, db_result) {
            callback(err, db_result);
        });
    },
    remove:function (spec,callback){
        var collectionName = this.collection;
        var thisDb = this.curDb;
        thisDb[collectionName].findItems(spec,function (err, db_results){
            if (db_results) {
                var r=[];
                _.each(db_results,function (result){
                    delete result._id;
                    r.push(_.extend({},result))
                })
                thisDb.collection('rubbish').insert(r,function (err, result){
                    if(err){
                        return callback(err);
                    }
                    thisDb[collectionName].remove(spec,function (err,doc){
                        callback(err, doc);
                        redisCache.delMulti(collectionName);
                    })
                });
            } else {
                return callback("not find by id "+_id);
            }
        });
    },
    removeNoBat: function (spec, callback){
        var collectionName = this.collection;
        var thisDb = this.curDb;
        thisDb[collectionName].remove(spec,function (err,doc){
            callback(err, doc);
            redisCache.delMulti(collectionName);
        })
    },
    aggregate: function (option, callback){
        var collectionName = this.collection;
        var thisDb = this.curDb;
        thisDb[collectionName].aggregate(option, function (err, db_results){
            callback(err, db_results);
        });
    },
    drop: function (callback){
        var collectionName = this.collection;
        var thisDb = this.curDb;
        thisDb[collectionName].drop(function (err, db_results){
            callback(err, db_results);
        });
    },
    distinct: function (field, spec, callback) {
        var collection = this.collection;
        var thisDb = this.curDb;
        if (_.isFunction (spec)) {
            callback = spec;
            spec = {};
        }
        thisDb[collection].distinct(field, spec, function (err, db_result) {
            callback(err, db_result);
        });
    }
};

module.exports = dbUtils;
