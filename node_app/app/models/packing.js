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


const packingSchema = new mongoose.Schema({
    packingID: String,
    uomID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit'
    },
    total: String,
    is_deleted: {
        type: Boolean,
        default: true
    },
}, schemaOptions);

packingSchema.virtual('Packing_pop', {
    ref: 'Packtype',
    localField: 'packingID',
    foreignField: '_id',
    justOne: true
});
packingSchema.virtual('packmasterPOP', {
    ref: 'Packingmaster',
    localField: '_id',
    foreignField: 'packID',
    justOne: false
});

packingSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Packing', packingSchema);    