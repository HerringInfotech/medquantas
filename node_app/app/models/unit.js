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
const unitSchema = new mongoose.Schema({
  name: String,
  abbreviation: String,
  is_deleted: {
    type: Boolean,
    default: true
  },
}, schemaOptions);
unitSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Unit', unitSchema);    