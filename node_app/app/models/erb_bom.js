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

const erbBomSchema = new mongoose.Schema({
    code: String,
    bomcode: String,
    itemname: String,
    bomname: String,
    standQty: String,
    requestQty: String,
    fgCode: String,
    fgName: String,
    itemType: String,
}, schemaOptions);
erbBomSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('erbBom', erbBomSchema);    