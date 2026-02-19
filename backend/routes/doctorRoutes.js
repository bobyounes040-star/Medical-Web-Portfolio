const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");

const upload = require("../middleware/uploadDoctorAvatar");

const {
  listDoctors,
  createDoctor,
  updateDoctor,
  removeDoctor,
  getDoctorById,
  getAvailableSlots,
  uploadDoctorAvatar,
} = require("../controllers/doctorController");

// Directory + details 
router.get("/", auth, requireRole("patient", "doctor", "admin"), listDoctors);


// Admin management
router.post("/", auth, requireRole("admin"), createDoctor);
router.put("/:id", auth, requireRole("admin"), updateDoctor);
router.delete("/:id", auth, requireRole("admin"), removeDoctor);

// Avatar upload
router.patch(
  "/:id/avatar",
  auth,
  requireRole("admin"),
  (req, res, next) => {
    next();
  },
  upload.single("avatar"),
  (req, res, next) => {
    next();
  },
  uploadDoctorAvatar
);


router.get("/:id", auth, requireRole("patient", "doctor", "admin"), getDoctorById);
router.get("/:id/slots", auth, requireRole("patient", "doctor", "admin"), getAvailableSlots);

module.exports = router;
