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

const SalesheetSchema = new mongoose.Schema({
    medo_raw: Array,
    medo_pack: Array,
    system_raw: Array,
    system_pack: Array,
    detailValues: Object,
    percentage: Object,
    system: Object,
    medquantas: Object,
    status: String,
    revision: String,
    code: String,
    name: String,
    productname: String,
    productcode: String,
    locCd: String,
    packID: String,
    userID: String,
    sheetID: String,
    uniqueID: String,
    remarks: { type: Array, default: [] },

    is_deleted: {
        type: Boolean,
        default: true
    },

}, schemaOptions);
SalesheetSchema.virtual('user', {
    ref: 'User',
    localField: 'userID',
    foreignField: '_id',
    justOne: true,
});
SalesheetSchema.index({ name: 1 });
SalesheetSchema.index({ code: 1 });
SalesheetSchema.index({ locCd: 1 });
SalesheetSchema.index({ status: 1 });
SalesheetSchema.index({ createdAt: -1 });

SalesheetSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Salesheet', SalesheetSchema);    