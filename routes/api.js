const express = require("express");
const router = express.Router();
const {
  createAppointment,
  getAppointments,
  updateAppointment,
  deleteAppointment,
  getDoctorAppointments,
  addDefaultSlots,
  bookSlot,
  updateDoctorAppointment,
} = require("../controllers/apiController");

router.post("/appointments", createAppointment);
router.get("/appointments/:userId", getAppointments);
router.put("/appointments/:appointmentId", updateAppointment);
router.delete("/appointments/:appointmentId", deleteAppointment);

router.get("/doctor-appointments/:doctorId", getDoctorAppointments);
router.post("/appointments/:doctorId/add-default-slots", addDefaultSlots);
router.post("/appointments/:doctorId/book-slot", bookSlot);
router.put("/doctor-appointments/:appointmentId", updateDoctorAppointment);

module.exports = router;
