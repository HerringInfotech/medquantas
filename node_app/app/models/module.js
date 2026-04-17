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
const moduleSchema = new mongoose.Schema({
  name: String,
  actions: Array,
  is_deleted: {
    type: Boolean,
    default: true
  },
}, schemaOptions);
moduleSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Module', moduleSchema);    