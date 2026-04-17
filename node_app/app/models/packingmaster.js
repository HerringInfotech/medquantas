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

const packingmasterSchema = new mongoose.Schema({
    packID: String,
    particularFrom: String,
    particularTo: String,
    amount: String,
    is_deleted: {
        type: Boolean,
        default: true
    },
}, schemaOptions);

packingmasterSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Packingmaster', packingmasterSchema);    