var config = require('../config')
var db = require('monk')(config.mongodb.master.url)

function collection (collection) {
    return db.get(collection)
}

module.exports = collection