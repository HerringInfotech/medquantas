const mongoose = require('mongoose');

const costLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: String,
  description: String,
  data: mongoose.Schema.Types.Mixed,
}, { strict: false });

module.exports = mongoose.model('CostLog', costLogSchema);
