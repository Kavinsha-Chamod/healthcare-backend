const express = require('express');
const router = express.Router();
const { sendMFA, register, login, forgotPassword, verifyOtp, resetPassword, sendMFADoctor, loginDoctor,  registerDoctor } = require('../controllers/authController');

router.post('/send-mfa', sendMFA);
router.post('/send-mfa-doctor', sendMFADoctor);
router.post('/register', register);
router.post('/register-doctor', registerDoctor);
router.post('/login', login);
router.post('/login-doctor', loginDoctor);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
