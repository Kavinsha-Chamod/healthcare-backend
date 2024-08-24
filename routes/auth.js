const express = require("express");
const router = express.Router();
const {
  sendMFA,
  register,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  sendMFADoctor,
  loginDoctor,
  registerDoctor,
  getAvailableDoctors,
  getDoctorAvailability,
  doctorForgotPassword,
  verifyOtpDoctor,
  doctorResetPassword,
} = require("../controllers/authController");

router.post("/send-mfa", sendMFA);
router.post("/send-mfa-doctor", sendMFADoctor);
router.post("/register", register);
router.post("/register-doctor", registerDoctor);
router.post("/login", login);
router.post("/login-doctor", loginDoctor);
router.post("/forgot-password", forgotPassword);
router.post("/doctor-forgot-password", doctorForgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/verify-otp-doctor", verifyOtpDoctor);
router.post("/reset-password", resetPassword);
router.post("/doctor-reset-password", doctorResetPassword);

router.get("/doctors", getAvailableDoctors);
router.get("/doctors/:doctorId/availability", getDoctorAvailability);

module.exports = router;
