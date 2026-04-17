const mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate-v2');
var schemaOptions = {
    toObject: {
        virtuals: true
    }, toJSON: {
        virtuals: true
    },
    timestamps: true
};

const stageMasterSchema = new mongoose.Schema({
    typeID: String,
    name: String,
    code: String,
    is_deleted: {
        type: Boolean,
        default: true
    },
}, schemaOptions);

stageMasterSchema.virtual('type_pop', {
    ref: 'Itemtype',
    localField: 'typeID',
    foreignField: '_id',
    justOne: true
});

stageMasterSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('StageMaster', stageMasterSchema);    