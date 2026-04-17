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

const conversionSchema = new mongoose.Schema({
    fGtypeID: String,
    subtypeID: String,
    dosageID: String,
    total: String,
    uomID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit'
    },
    is_deleted: {
        type: Boolean,
        default: true
    },
}, schemaOptions);
conversionSchema.virtual('fGtypePOP', {
    ref: 'Fgtype',
    localField: 'fGtypeID',
    foreignField: '_id',
    justOne: true
});
conversionSchema.virtual('subtypePOP', {
    ref: 'Fgsubtype',
    localField: 'subtypeID',
    foreignField: '_id',
    justOne: true
});
conversionSchema.virtual('dosagePOP', {
    ref: 'Dosage',
    localField: 'dosageID',
    foreignField: '_id',
    justOne: true
});
conversionSchema.virtual('conversionPOP', {
    ref: 'Conversionmaster',
    localField: '_id',
    foreignField: 'conversionID',
    justOne: false
});
conversionSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Conversion', conversionSchema);    