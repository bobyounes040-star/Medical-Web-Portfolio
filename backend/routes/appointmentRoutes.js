// Imports
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const { createAppointment, getMyAppointments, updateAppointmentStatus, cancelAppointment, rescheduleAppointment } = require("../controllers/appointmentController");


router.post("/", auth, requireRole("patient"), createAppointment);

router.get("/", auth, requireRole("patient", "doctor", "admin"), getMyAppointments);

// Doctor approves/rejects
router.patch("/:id/status", auth, requireRole("doctor"), updateAppointmentStatus);
router.patch("/:id/reschedule", auth, requireRole("patient"), rescheduleAppointment);
router.patch("/:id/cancel", auth, cancelAppointment);


// Patient cancels their pending appointment
router.delete("/:id", auth, requireRole("patient"), cancelAppointment);

module.exports = router;
