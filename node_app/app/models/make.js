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



const makeSchema = new mongoose.Schema({
  name: String,
  make_sapcode: String,
  is_deleted: {
    type: Boolean,
    default: true
  },
}, schemaOptions);
makeSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Make', makeSchema);    