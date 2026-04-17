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

const saleshistorySchema = new mongoose.Schema({
    productcode: String,
    productname: String,
    user: String,
    type: String,
    email: String,
    status: String,
}, schemaOptions);

saleshistorySchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Saleshistory', saleshistorySchema);    