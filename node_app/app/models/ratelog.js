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


const ratelogSchema = new mongoose.Schema({
  item_ID: String,
  user_ID: String,
  changedate: String,
  exist_price: String,
  new_price: String
}, schemaOptions);

ratelogSchema.virtual('item_pop', {
  ref: 'Item',
  localField: 'item_ID',
  foreignField: '_id',
  justOne: true
});

ratelogSchema.virtual('user_pop', {
  ref: 'User',
  localField: 'user_ID',
  foreignField: '_id',
  justOne: true
});

ratelogSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Ratelog', ratelogSchema);    