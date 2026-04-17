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

const itemMasterSchema = new mongoose.Schema(
  {
    code: String,
    name: String,
    typeCode: String,
    subtypeCode: String,
    percentage: {
      type: Number,
      default: 0
    },
    buyUnit: String,
    convertUnit: String,
    convertRate: String,
    creditDate: String,
    uqcConvertRate: String,
    itemSymbol: String,
    gsind: String,
    hsnCode: String,
    standOutQty: String,
    requestQty: String,
    is_deleted: {
      type: Boolean,
      default: true,
    },
  },
  schemaOptions
);

itemMasterSchema.index({ name: 1 });
itemMasterSchema.index({ code: 1 });
itemMasterSchema.index({ typeCode: 1 });
itemMasterSchema.index({ createdAt: -1 });

itemMasterSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("ItemMaster", itemMasterSchema);
