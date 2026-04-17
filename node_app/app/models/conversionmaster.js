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

const conversionmasterSchema = new mongoose.Schema({
    conversionID: String,
    particularFrom: String,
    particularTo: String,
    particular: String,
    amount: String,
    is_deleted: {
        type: Boolean,
        default: true
    },
}, schemaOptions);

conversionmasterSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Conversionmaster', conversionmasterSchema);    