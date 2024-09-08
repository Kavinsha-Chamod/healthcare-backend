const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String, required: true },
  dob: { type: Date, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  gender: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  role: { type: String, required: true, enum: ["doctor", "admin", "patient"] },
  resetPasswordOTP: String,
  resetPasswordExpires: Date,
  mfaSecret: String, // Field to store MFA secret
  mfaEnabled: { type: Boolean, default: false },
});

// Hash password before saving the user
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model("users", UserSchema);
