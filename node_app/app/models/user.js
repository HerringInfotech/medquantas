const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const crypto = require('crypto');
const commonHelper = require('../helpers/commonHelper');

// Create schemaOptions
const schemaOptions = {
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
  },
  timestamps: true,
};

/**
 * User schema
 */
const userSchema = new mongoose.Schema({
  role: String,
  name: String,
  email: String,
  mobile: String,
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  salt: String,
  password: String,
  lastLogin: {
    type: Date,
    default: null,
  },
  image: String,
  is_deleted: {
    type: Boolean,
    default: true
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now,
  },
}, schemaOptions);

userSchema.plugin(mongoosePaginate);

userSchema.methods.hashPassword = function (password) {
  if (this.salt && password) {
    return crypto
      .pbkdf2Sync(password, this.salt, 10000, 64, 'sha512')
      .toString('base64');
  }
  return password;
};

// On every save, add the date and hash the password
userSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    this.salt = crypto.randomBytes(16).toString('base64');
    this.password = this.hashPassword(this.password);
    this.passwordChangedAt = Date.now();
  }
  next();
});

/**
 * Create instance method for authenticating user
 */
userSchema.methods.comparePassword = function (candidatePassword) {
  if (!this.password || !this.salt) {
    return false;
  }
  const hashedCandidatePassword = this.hashPassword(candidatePassword);
  return crypto.timingSafeEqual(
    Buffer.from(this.password, 'base64'),
    Buffer.from(hashedCandidatePassword, 'base64')
  );
};

userSchema.virtual('role_pop', {
  ref: 'Role',
  localField: 'role',
  foreignField: '_id',
  justOne: true
});

userSchema.virtual('original_image').get(function () {
  if (this.image) {
    return commonHelper.getLiveurl() + "/assets/profile/" + this.image;
  }
});

module.exports = mongoose.model('User', userSchema);
