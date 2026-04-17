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

const validateSchema = new mongoose.Schema({
  code: String,
  field: String,
  page: String,
  message: String,
  isAllow: {
    type: Boolean,
    default: true
  },
}, schemaOptions);
validateSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Validate', validateSchema);    