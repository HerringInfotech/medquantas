const mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate-v2');
var schemaOptions = {
    toObject: {
        virtuals: true
    }
    , toJSON: {
        virtuals: true
    },
    timestamps: true
};

const storeSchema = new mongoose.Schema({
    localCode: String,
    name: String,
    code: String,
    loctpsrs: String,
    locationID: String,
    is_deleted: {
        type: Boolean,
        default: true
    },
}, schemaOptions);
storeSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Store', storeSchema);