const mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate-v2");
var schemaOptions = {
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
  },
  timestamps: true,
};

const priceMasterSchema = new mongoose.Schema(
  {
    itemID: String,
    name: String,
    code: String,
    stdrate: String,
    rate: String,
    prevrate: String,
    prevGrnrate: String,
    basicUpdatedate: String,
    grnUpdatedate: String,
    gst: String,
    gstCGST: String,
    gstSGST: String,
    grnRate: String,
    convert: String,
    currency: String,
    bsrt: String,
    is_deleted: {
      type: Boolean,
      default: true,
    },
  },
  schemaOptions
);

priceMasterSchema.virtual('item_pop', {
  ref: 'ItemMaster',
  localField: 'itemID',
  foreignField: '_id',
  justOne: true
});

priceMasterSchema.plugin(mongoosePaginate);
priceMasterSchema.index({ code: 1 });
priceMasterSchema.index({ name: 1 });
priceMasterSchema.index({ itemID: 1 });
priceMasterSchema.index({ item_rate: 1 });
priceMasterSchema.index({ is_deleted: 1 });
priceMasterSchema.index({ grnRate: 1 });
priceMasterSchema.index({ _syncedAt: 1 });
priceMasterSchema.index({ createdAt: -1 });

module.exports = mongoose.model("PriceMaster", priceMasterSchema);
