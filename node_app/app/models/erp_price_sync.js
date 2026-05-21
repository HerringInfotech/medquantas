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

const erpPriceSyncSchema = new mongoose.Schema({
  itemCode:      { type: String, required: true },
  itemName:      { type: String, required: true },
  mrp:           { type: Number, default: 0 },
  sellingPrice:  { type: Number, default: 0 },
  purchasePrice: { type: Number, default: 0 },
  gstPercent:    { type: Number, default: 0 },
  effectiveDate: { type: String, default: '' },
  syncedAt:      { type: Date, default: Date.now },
}, schemaOptions);

erpPriceSyncSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('ErpPriceSync', erpPriceSyncSchema);
