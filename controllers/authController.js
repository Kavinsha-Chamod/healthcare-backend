const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const User = require('../models/User');
const transporter = require('../config/nodemailer');
const sendOtpEmail = require('../config/sendOTP');
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
      id: user.id,
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
