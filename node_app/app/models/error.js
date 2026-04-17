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
const errorSchema = new mongoose.Schema({
  itemname: String,
  itemcode: String,
  bomname: String,
  bomcode: String,
  message: String,
}, schemaOptions);
errorSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Error', errorSchema);    