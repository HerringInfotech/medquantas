// grab the things we need
const mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate-v2');
const commonHelper = require('../helpers/commonHelper');
var schemaOptions = {
  toObject: {
    virtuals: true
  }
  , toJSON: {
    virtuals: true
  },
  timestamps: true
};


const settingSchema = new mongoose.Schema({
  name: String,
  image: String,
  alert_time: String,
  alert_emails: [String],
  alert_enabled: { type: Boolean, default: true },
  backup_time: String,
  backup_emails: [String],
}, schemaOptions);


settingSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Setting', settingSchema);    