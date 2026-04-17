const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const schemaOptions = {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true
};

const emailLogSchema = new mongoose.Schema({
    to: { type: String, required: true },
    subject: { type: String },
    status: { type: String, enum: ['Success', 'Failed'], required: true },
    reason: { type: String },
    type: { type: String, enum: ['DailyAlert', 'DatabaseBackup', 'SaleSheet', 'CostSheet', 'WelcomeEmail', 'ForgotPassword'], required: true },
    metadata: { type: mongoose.Schema.Types.Mixed }
}, schemaOptions);

emailLogSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('EmailLog', emailLogSchema);
