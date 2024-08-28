const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  role: { type: String, required: true, enum: ['doctor', 'nurse', 'patient'] },
  resetPasswordOTP: String,
  resetPasswordExpires: Date,
  mfaSecret: String,  // Field to store MFA secret
  mfaEnabled: { type: Boolean, default: false } 
});

// Pre-save hook to hash password before saving it to the database
doctorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    return next(error);
  }
});

// Compare password for login purposes
doctorSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create the model
const Doctor = mongoose.model('doctors', doctorSchema);

module.exports = Doctor;
