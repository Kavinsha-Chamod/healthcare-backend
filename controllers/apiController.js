const Appointment = require('../models/Appointment'); // Assuming Appointment model is created
const User = require('../models/User'); // If you need to associate appointments with users
const Doctor = require('../models/Doctor'); // If you need to associate appointments with doctors
const mongoose = require('mongoose');

// Create a new appointment
exports.createAppointment = async (req, res) => {
  const { patient, doctor, date, time, status, notes } = req.body;

  try {
    console.log('Received request to create appointment with data:', req.body);

    const appointment = new Appointment({
      patient: patient,
      doctor: doctor,
      date,
      time,
      status,
      notes,
    });

    await appointment.save();
    console.log('Appointment created successfully:', appointment);
    res.status(201).json({ message: 'Appointment created successfully', appointment });

  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).send('Error creating appointment');
  }
};

exports.getAppointments = async (req, res) => {
  const { userId } = req.params; 

  try {
    const appointments = await Appointment.find({ patient: userId }).populate('doctor', 'fullName');
    res.status(200).json(appointments);
  } catch (err) {
    console.error('Error fetching patient appointments:', err);
    res.status(500).json({ message: 'Error fetching patient appointments' });
  }
};

// Update an appointment
exports.updateAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const { date, time, notes } = req.body;

  try {
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.date = date || appointment.date;
    appointment.time = time || appointment.time;
    appointment.notes = notes || appointment.notes;

    await appointment.save();

    res.status(200).json({ message: 'Appointment updated successfully', appointment });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.deleteAppointment = async (req, res) => {
  const { appointmentId } = req.params;

  try {
    const appointment = await Appointment.findByIdAndDelete(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.status(200).json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};


/////////////////////////////////////////////////////////////////////////////////////

exports.getDoctorAppointments = async (req, res) => {
  const { doctorId } = req.params;
  console.log('Fetching appointments for doctor:', doctorId);
  
  try {
    // Ensure the doctorId is being used correctly in the query
    const appointments = await Appointment.find({ doctor: doctorId }).populate('patient', 'firstName lastName');
    console.log('Fetched appointments:', appointments);
    res.status(200).json(appointments);
  } catch (err) {
    console.error('Error fetching doctor appointments:', err);
    res.status(500).json({ message: 'Error fetching doctor appointments' });
  }
};



