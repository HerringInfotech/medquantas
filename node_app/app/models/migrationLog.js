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

const migrationLogSchema = new mongoose.Schema({
  type: { type: String, required: true }, // ITEM | BOM | GRN
  lastRunAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["SUCCESS", "FAILED"], default: "SUCCESS" }
}, schemaOptions);
migrationLogSchema.index({ type: 1, lastRunAt: -1 });
migrationLogSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("MigrationLog", migrationLogSchema);  