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

const erpItemSyncSchema = new mongoose.Schema({
  itemCode:     { type: String, required: true },
  itemName:     { type: String, required: true },
  itemCategory: { type: String, default: '' },
  uom:          { type: String, default: '' },
  manufacturer: { type: String, default: '' },
  hsnCode:      { type: String, default: '' },
  description:  { type: String, default: '' },
  syncedAt:     { type: Date, default: Date.now },
}, schemaOptions);

erpItemSyncSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('ErpItemSync', erpItemSyncSchema);