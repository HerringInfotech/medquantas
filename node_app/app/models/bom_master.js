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

const bomMasterSchema = new mongoose.Schema(
  {
    name: String,
    code: String,
    locCd: String,
    batch: String,

    costunit: String,
    manufacture_qty: String,
    manufacture_total: String,
    manufacture_matval: String,
    pack_qty: String,
    pack_total: String,
    pack_matval: String,
    analytical_value: String,
    punch_value: String,
    freight: String,
    percentage: String,

    bomraw: Array,
    rawstage: Array,
    packstage: Array,
    revision: String,
    status: String,
    fg_id: String,

    create_time: {
      type: Date,
      default: null,
    },
    verified_time: {
      type: Date,
      default: null,
    },
    approve_time: {
      type: Date,
      default: null,
    },
    remarks: Array,
    create_user: String,
    verified_user: String,
    approve_user: String,
    create_decline: String,
    verified_decline: String,

    is_deleted: {
      type: Boolean,
      default: true,
    },
  },
  schemaOptions
);

// bomMasterSchema.virtual('customer_pop', {
//   ref: 'Customer',
//   localField: 'customerID',
//   foreignField: '_id',
//   justOne: true
// });

// bomMasterSchema.virtual('pack_pop', {
//   ref: 'Packtype',
//   localField: 'packID',
//   foreignField: '_id',
//   justOne: true
// });

// bomMasterSchema.virtual('user_pop', {
//   ref: 'User',
//   localField: 'userID',
//   foreignField: '_id',
//   justOne: true
// });


bomMasterSchema.index({ name: 1 });
bomMasterSchema.index({ fg_id: 1 });
bomMasterSchema.index({ code: 1 });
bomMasterSchema.index({ locCd: 1 });
bomMasterSchema.index({ status: 1 });
bomMasterSchema.index({ createdAt: -1 });

bomMasterSchema.plugin(mongoosePaginate);


module.exports = mongoose.model("BomMaster", bomMasterSchema);
