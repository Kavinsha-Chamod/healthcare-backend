const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { encrypt, decrypt } = require('../config/encryption');

const doctorSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  specialization: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
  },
  clinicAddress: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  availableTimes: [
    {
      date: { type: Date },
      time: { type: String },
      isBooked: { type: Boolean, default: false },
    },
  ],
  role: { type: String, required: true, enum: ['doctor', 'admin', 'patient'] },
  resetPasswordOTP: String,
  resetPasswordExpires: Date,
  mfaSecret: String,
  mfaEnabled: { type: Boolean, default: false }
});

doctorSchema.pre('save', async function (next) {
  if (this.isModified('licenseNumber')) {
    this.licenseNumber = encrypt(this.licenseNumber);
  }

  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }

  next();
});

// Method to return the doctor's licenseNumber in decrypted form
doctorSchema.methods.getDecryptedLicenseNumber = function () {
  return decrypt(this.licenseNumber);
};

// Create the model
const Doctor = mongoose.model('doctors', doctorSchema);

module.exports = Doctor;
