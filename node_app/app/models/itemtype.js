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



const itemtypeSchema = new mongoose.Schema({
  name: String,
  code: String,
  is_deleted: {
    type: Boolean,
    default: true
  },
}, schemaOptions);
itemtypeSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Itemtype', itemtypeSchema);    