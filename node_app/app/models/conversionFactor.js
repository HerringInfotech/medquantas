const mongoose = require('mongoose');

const ConversionFactorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, 
  inrToUsd: { type: Number, required: true },
  status: { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('ConversionFactor', ConversionFactorSchema);
