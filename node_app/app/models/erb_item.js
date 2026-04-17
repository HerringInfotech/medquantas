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

const erbItemSchema = new mongoose.Schema({
    code: String,
    name: String,
    type: String,
    subtype: String,
    buyunit: String,
    convertUnit: String,
}, schemaOptions);
erbItemSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('erbItem', erbItemSchema);    