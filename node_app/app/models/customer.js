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

const customerSchema = new mongoose.Schema({
    customer_code: String,
    name: String,
    email: String,
    gst: String,
    address: String,
    state: String,
    city: String,
    is_deleted: {
        type: Boolean,
        default: true
    }
}, schemaOptions);

customerSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Customer', customerSchema);    