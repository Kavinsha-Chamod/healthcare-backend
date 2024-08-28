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
  try {
    const appointments = await Appointment.find({ doctor: doctorId }).populate('patient', 'firstName lastName');
    res.status(200).json(appointments);
  } catch (err) {
    console.error('Error fetching doctor appointments:', err);
    res.status(500).json({ message: 'Error fetching doctor appointments' });
  }
};

exports.addDefaultSlots = async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.body; 

  console.log('Received date:', date); 

  if (!date) {
    return res.status(400).json({ message: 'Date is required' });
  }

  const dateString = date;

  const timeSlots = Array.from({ length: 2 }, (_, i) => {
    const startHour = 10 + Math.floor(i / 2); 
    const startMinutes = i % 2 === 0 ? '00' : '30'; 
    const endMinutes = i % 2 === 0 ? '30' : '00'; 
    const endHour = i % 2 === 0 ? startHour : startHour + 1;

    return {
      date: date, 
      time: `${startHour}:${startMinutes} AM - ${endHour}:${endMinutes} AM`,
      isBooked: false,
    };
  });

  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Remove slots for past dates
    doctor.availableTimes = doctor.availableTimes.filter(slot => {
      const slotDate = new Date(slot.date);
      return slotDate >= new Date();
    });

    const existingSlotsForDate = doctor.availableTimes.filter(slot => slot.date === dateString);

    if (existingSlotsForDate.length === 0) {
      doctor.availableTimes.push(...timeSlots);
    } else {
      doctor.availableTimes = doctor.availableTimes.map(slot => {
        if (slot.date === dateString) {
          return timeSlots.find(newSlot => newSlot.time === slot.time) || slot;
        }
        return slot;
      });
    }

    await doctor.save();

    res.status(200).json({ message: 'Default time slots added or updated successfully', timeSlots });
  } catch (error) {
    console.error('Error adding default time slots:', error);
    res.status(500).json({ message: 'Error adding default time slots' });
  }
};

exports.bookSlot = async (req, res) => {
  const { doctorId } = req.params;
  const { date, timeSlot } = req.body;

  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const slot = doctor.availableTimes.find(
      (slot) => slot.time === timeSlot && !slot.isBooked
    );

    if (!slot) {
      return res.status(404).json({ message: 'Time slot not available' });
    }

    slot.isBooked = true;
    await doctor.save();

    res.status(200).json({ message: 'Appointment booked successfully', slot });
  } catch (error) {
    console.error('Error booking time slot:', error);
    res.status(500).json({ message: 'Error booking time slot' });
  }
};

exports.updateDoctorAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const { status } = req.body; // Get status from the request body

  try {
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Only update the status if it is provided in the request body
    appointment.status = status || appointment.status;

    await appointment.save();

    res.status(200).json({ message: 'Appointment status updated successfully', appointment });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

