const mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate-v2');
// mongoose.set('useFindAndModify', false);
//create schemaOptions
var schemaOptions = {
  toObject: {
    virtuals: true
  }
  , toJSON: {
    virtuals: true
  },
  timestamps: true
};


/**
 * catagory schema
 */
const supplierSchema = new mongoose.Schema({
  name: String,
  email: String,
  mobile: String,
  address: String,
  code: String,
  vendor_sapcode: String,
  is_deleted: {
    type: Boolean,
    default: true
  },
}, schemaOptions);
supplierSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Supplier', supplierSchema);    