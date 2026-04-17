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



const costsheetSchema = new mongoose.Schema({
  medo_raw: Array,
  medo_pack: Array,
  system_raw: Array,
  system_pack: Array,
  detailValues: Object,
  percentage: Object,
  system: Object,
  medopharm: Object,
  status: String,
  revision: String,
  code: String,
  name: String,
  productname: String,
  productcode: String,
  locCd: String,
  packID: String,

  is_deleted: {
    type: Boolean,
    default: true
  },

}, schemaOptions);
costsheetSchema.index({ name: 1 });
costsheetSchema.index({ code: 1 });
costsheetSchema.index({ productcode: 1 });
costsheetSchema.index({ locCd: 1 });
costsheetSchema.index({ status: 1 });
costsheetSchema.index({ createdAt: -1 });

costsheetSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Costsheet', costsheetSchema);    