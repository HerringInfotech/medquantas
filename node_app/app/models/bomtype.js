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
const bomtypeSchema = new mongoose.Schema({
  name: String,
  is_deleted: {
    type: Boolean,
    default: true
  },
}, schemaOptions);
bomtypeSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Bomtype', bomtypeSchema);    