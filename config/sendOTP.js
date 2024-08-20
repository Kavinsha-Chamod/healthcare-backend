const transporter = require('../config/nodemailer');

const sendOtpEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: 'no-reply@yourapp.com',
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP code is: ${otp}. It is valid for 15 minutes.`,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

module.exports = sendOtpEmail;