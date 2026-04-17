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

const erbRateSchema = new mongoose.Schema({
    code: String,
    name: String,
    rate: String,
    convert: String,
    grnRate: String,
    gst: String,
    currency: String,
}, schemaOptions);
erbRateSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('erbRate', erbRateSchema);    