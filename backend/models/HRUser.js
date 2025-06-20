const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HRUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  company: {
    name: { type: String, required: true },
    position: { type: String },
    size: { type: String },
    address: { type: String }
  },
  businessLicense: { type: String },
  role: { type: String, default: 'hr' },
  status: { type: String, default: 'active' },
  isVerified: { type: Boolean, default: false },
  avatar: { type: String, default: '' }
}, { timestamps: true });

HRUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

HRUserSchema.methods.matchPassword = function(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// 生成JWT Token
HRUserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET || 'nexjob_secret_key',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

module.exports = mongoose.model('HRUser', HRUserSchema); 