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
const fgmasterSchema = new mongoose.Schema({
  name: String,
  brand_code: String,
  duplicate_code: String,
  // customer_id: String,
  // type_id: String,
  // subtype_id: String,
  pack_id: String,
  fg_sapcode: String,
  is_deleted: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    default: 'Active'
  },
  isBom: {
    type: Boolean,
    default: false
  },
  isSheet: {
    type: Boolean,
    default: false
  },
}, schemaOptions);

fgmasterSchema.virtual('Customer_pop', {
  ref: 'Customer',
  localField: 'customer_id',
  foreignField: '_id',
  justOne: true
});

fgmasterSchema.virtual('Pack_pop', {
  ref: 'Packtype',
  localField: 'pack_id',
  foreignField: '_id',
  justOne: true
});

fgmasterSchema.virtual('Fgtype_pop', {
  ref: 'Fgtype',
  localField: 'type_id',
  foreignField: '_id',
  justOne: true
});

fgmasterSchema.virtual('Fgsubtype_pop', {
  ref: 'Fgsubtype',
  localField: 'subtype_id',
  foreignField: '_id',
  justOne: true
});

fgmasterSchema.index({ name: 1 });
fgmasterSchema.index({ brand_code: 1 });
fgmasterSchema.index({ status: 1 });
fgmasterSchema.index({ duplicate_code: 1 });
fgmasterSchema.index({ fg_sapcode: 1 });

fgmasterSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Fgmaster', fgmasterSchema);    