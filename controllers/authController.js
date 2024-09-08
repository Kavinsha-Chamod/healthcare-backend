const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const transporter = require('../config/nodemailer');
const sendOtpEmail = require('../config/sendOTP');
const { encrypt } = require('../config/encryption');

const { secret, expiresIn } = require('../config/jwt');

exports.sendMFA = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate a new MFA secret if not already set
    if (!user.mfaSecret) {
      user.mfaSecret = speakeasy.generateSecret().base32;
      user.mfaEnabled = true; // Enable MFA for the user
      await user.save();
    }

    console.log('Generated MFA secret:', user.mfaSecret);

    // Generate an MFA code
    const token = speakeasy.totp({
      secret: user.mfaSecret,
      encoding: 'base32'
    });

    console.log('Generated MFA code:', token);

    // Send the MFA code via email
    const message = `
      <h1>Multi-Factor Authentication Code</h1>
      <p>Your MFA code is: <strong>${token}</strong></p>
    `;

    await transporter.sendMail({
      to: user.email,
      subject: 'Your MFA Code',
      html: message
    });

    res.status(200).json({ message: 'MFA code sent to email' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.login = async (req, res) => {
  const { email, password, mfaCode } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Stored MFA secret:', user.mfaSecret);

    if (user.mfaEnabled) {
      const isMfaValid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: mfaCode,
        window: 2,
      });
      console.log('MFA code valid:', isMfaValid);
      if (!isMfaValid) {
        return res.status(400).json({ message: 'Invalid MFA code' });
      }
    }

    const payload = {
      id: user._id,
      role: user.role,
    };

    const token = jwt.sign(payload, secret, { expiresIn });
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};


exports.register = async (req, res) => {
  const { firstName, lastName, phoneNumber, address, dob, email, password, gender, role } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    user = new User({ firstName, lastName, phoneNumber, address, dob, email, password, gender, role });

    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, secret, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Token expired or invalid' });
    req.user = decoded;
    next();
  });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await user.save();
    await sendOtpEmail(user.email, otp);

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid OTP or OTP expired' });
    }

    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('New password:', newPassword);

    user.password = newPassword;

    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

exports.sendMFADoctor = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the doctor by email
    let doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate a new MFA secret if not already set
    if (!doctor.mfaSecret) {
      doctor.mfaSecret = speakeasy.generateSecret().base32;
      doctor.mfaEnabled = true; // Enable MFA for the doctor
      await doctor.save();
    }

    console.log('Generated MFA secret:', doctor.mfaSecret);

    // Generate an MFA code
    const token = speakeasy.totp({
      secret: doctor.mfaSecret,
      encoding: 'base32'
    });

    console.log('Generated MFA code:', token);

    // Send the MFA code via email
    const message = `
      <h1>Multi-Factor Authentication Code</h1>
      <p>Your MFA code is: <strong>${token}</strong></p>
    `;

    await transporter.sendMail({
      to: doctor.email,
      subject: 'Your MFA Code',
      html: message
    });

    res.status(200).json({ message: 'MFA code sent to email' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.loginDoctor = async (req, res) => {
  const { email, password, mfaCode } = req.body;

  try {
    // Find the doctor by email and exclude sensitive fields like password and mfaSecret
    let doctor = await Doctor.findOne({ email }).select('-password -mfaSecret');
    if (!doctor) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Retrieve the password hash separately since it was excluded from the doctor object
    const doctorWithPassword = await Doctor.findOne({ email });

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, doctorWithPassword.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify MFA if enabled
    if (doctor.mfaEnabled) {
      const isMfaValid = speakeasy.totp.verify({
        secret: doctorWithPassword.mfaSecret, // Use the full object to access the mfaSecret
        encoding: 'base32',
        token: mfaCode,
        window: 2, // Allow 2-step window for time variance
      });
      if (!isMfaValid) {
        return res.status(400).json({ message: 'Invalid MFA code' });
      }
    }

    // If MFA is valid, generate a JWT token
    const payload = {
      id: doctor._id,
      role: doctor.role,
    };

    const token = jwt.sign(payload, secret, { expiresIn });
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.registerDoctor = async (req, res) => {
  const { fullName, email, password, specialization, phone, licenseNumber, clinicAddress, role } = req.body;

  try {
    // Check if doctor with email already exists
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({ message: 'Doctor with this email already exists' });
    }

    // Encrypt the license number for the search
    const encryptedLicenseNumber = encrypt(licenseNumber);

    // Check if doctor with the same encrypted license number already exists
    const existingLicense = await Doctor.findOne({ licenseNumber: encryptedLicenseNumber });
    if (existingLicense) {
      return res.status(400).json({ message: 'Doctor with this license number already exists' });
    }

    // Create new doctor object
    const newDoctor = new Doctor({
      fullName,
      email,
      password,
      specialization,
      phone,
      licenseNumber: encryptedLicenseNumber, // Save encrypted license number
      clinicAddress,
      role
    });

    // Save the doctor to the database
    await newDoctor.save();

    res.status(201).json({ message: 'Doctor registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAvailableDoctors = async (req, res) => {
  try {
    // Exclude the 'password' field from the result using 'select'
    const doctors = await Doctor.find().select('-password -licenseNumber');
    
    res.status(200).json(doctors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};


// Get available times for a doctor
exports.getDoctorAvailability = async (req, res) => {
  const { doctorId } = req.params;
  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.status(200).json(doctor.availableTimes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};


exports.doctorForgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    doctor.resetPasswordOTP = otp;
    doctor.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await doctor.save();
    await sendOtpEmail(doctor.email, otp);

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.verifyOtpDoctor = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const doctor = await Doctor.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!doctor) {
      return res.status(400).json({ message: 'Invalid OTP or OTP expired' });
    }

    doctor.resetPasswordOTP = undefined;
    doctor.resetPasswordExpires = undefined;
    await doctor.save();

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.doctorResetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const doctor = await Doctor.findOne({ email });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    console.log('New password:', newPassword);

    doctor.password = newPassword;

    await doctor.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};