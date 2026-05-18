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
const clientSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  email: String,
  company: String,
}, schemaOptions);
clientSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Clients', clientSchema);    