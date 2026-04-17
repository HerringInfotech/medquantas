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


const packtypeSchema = new mongoose.Schema({
  name: String,
  code: String,
  is_deleted: {
    type: Boolean,
    default: true
  },
}, schemaOptions);


packtypeSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Packtype', packtypeSchema);    