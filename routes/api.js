const express = require("express");
const router = express.Router();
const {
  createAppointment,
  getAppointments,
  updateAppointment,
  deleteAppointment,
  getDoctorAppointments,
} = require("../controllers/apiController");

router.post("/appointments", createAppointment);
router.get("/appointments/:userId", getAppointments);
router.put("/appointments/:appointmentId", updateAppointment);
router.delete("/appointments/:appointmentId", deleteAppointment);

router.get("/doctor-appointments/:doctorId", getDoctorAppointments);

module.exports = router;
