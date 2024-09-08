const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'doctors', // Reference to Doctor model
    required: true,
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users', // Reference to User model
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String, // Format: 'HH:MM'
    required: true,
  },
  status: {
    type: String,
    enum: ['confirmed', 'completed', 'cancelled'],
    default: 'confirmed',
  },
  notes: {
    type: String,
    default: '',
  },
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
