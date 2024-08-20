const express = require('express');
const router = express.Router();
const { sendMFA, register, login, forgotPassword, verifyOtp, resetPassword } = require('../controllers/authController');

router.post('/send-mfa', sendMFA);
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
