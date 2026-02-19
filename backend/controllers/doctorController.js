// backend/controllers/doctorController.js
const User = require("../models/Users");
const bcrypt = require("bcryptjs");
const DoctorProfile = require("../models/DoctorProfile");
const Appointment = require("../models/appointment");


// --- Doctors list (for directory) ---
exports.listDoctors = async (req, res) => {
  try {
    const doctors = await DoctorProfile.find().sort({ createdAt: -1 });

    const result = doctors.map((d) => ({
      id: d._id,
      email: d.email,
      fullName: d.fullName,
      department: d.department,
      bio: d.bio || "",
      yearsExperience: d.yearsExperience || 0,
      availability: d.availability || [],
      avatarUrl: d.avatarUrl || "",
    }));

    return res.json(result);
  } catch (err) {
    console.error("LIST DOCTORS ERROR:", err);
    return res.status(500).json({ message: "Failed to load doctors", error: err.message });
  }
};

// --- Doctor details ---
exports.getDoctorById = async (req, res) => {
  try {
    const d = await DoctorProfile.findById(req.params.id);
    if (!d) return res.status(404).json({ message: "Doctor not found" });

    return res.json({
      id: d._id,
      email: d.email,
      fullName: d.fullName,
      department: d.department,
      bio: d.bio || "",
      yearsExperience: d.yearsExperience || 0,
      availability: d.availability || [],
      avatarUrl: d.avatarUrl || "",
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load doctor", error: err.message });
  }
};

// --- Admin: create OR update by email (upsert) ---
exports.createDoctor = async (req, res) => {
  try {
    let { email, password, fullName, department, bio, yearsExperience, availability } = req.body;

    if (!email || !fullName || !department) {
      return res.status(400).json({ message: "email, fullName, and department are required" });
    }

    email = email.toLowerCase().trim();

    // If admin is creating a NEW doctor account, password is required
    let user = await User.findOne({ email });

    if (!user && !password) {
      return res.status(400).json({ message: "Password is required when creating a new doctor account." });
    }

    // Create or update the USER record
    if (!user) {
      const passwordHash = await bcrypt.hash(String(password), 10);

      user = await User.create({
        name: fullName.trim(),
        email,
        passwordHash,
        role: "doctor",
        isVerified: true, // admin-created = verified
      });
    } else {
      // Promote to doctor + optionally reset password
      user.role = "doctor";
      user.isVerified = true;
      user.name = fullName.trim();

      if (password && String(password).trim()) {
        user.passwordHash = await bcrypt.hash(String(password), 10);
      }

      await user.save();
    }

    // Upsert DoctorProfile BY EMAIL (NOT user)
    const profile = await DoctorProfile.findOneAndUpdate(
      { email },
      {
        email,
        fullName: fullName.trim(),
        department: department.trim(),
        bio: (bio || "").trim(),
        yearsExperience: Number(yearsExperience) || 0,
        availability: availability || { days: [], start: "08:00", end: "18:00", slotMinutes: 30 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      message: "Doctor created/updated",
      doctor: {
        id: profile._id,              // IMPORTANT: profile id
        email: profile.email,
        fullName: profile.fullName,
        department: profile.department,
        bio: profile.bio,
        yearsExperience: profile.yearsExperience,
        avatarUrl: profile.avatarUrl,
        availability: profile.availability,
      },
    });
  } catch (error) {
    console.error("CREATE DOCTOR ERROR:", error);
    return res.status(500).json({ message: "Failed to create/update doctor", error: error.message });
  }
};
// --- Admin: edit by doctor profile id ---
exports.updateDoctor = async (req, res) => {
  try {
    const { fullName, department, bio, yearsExperience, availability } = req.body;

    const updated = await DoctorProfile.findByIdAndUpdate(
      req.params.id,
      {
        ...(fullName !== undefined ? { fullName: String(fullName).trim() } : {}),
        ...(department !== undefined ? { department: String(department).trim() } : {}),
        ...(bio !== undefined ? { bio: String(bio).trim() } : {}),
        ...(yearsExperience !== undefined ? { yearsExperience: Number(yearsExperience) || 0 } : {}),
        ...(availability !== undefined ? { availability: Array.isArray(availability) ? availability : [] } : {}),
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Doctor not found" });

    return res.json({ message: "Doctor updated", doctor: updated });
  } catch (err) {
    return res.status(500).json({ message: "Update failed", error: err.message });
  }
};

// --- Admin: remove doctor profile + reset user role if exists ---
exports.removeDoctor = async (req, res) => {
  try {
    const profile = await DoctorProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: "Doctor not found" });

    const user = await User.findOne({ email: profile.email });
    if (user) {
      user.role = "patient";
      await user.save();
    }

    await DoctorProfile.findByIdAndDelete(req.params.id);

    return res.json({ message: "Doctor removed (role reset + profile deleted)" });
  } catch (err) {
    return res.status(500).json({ message: "Remove failed", error: err.message });
  }
};

// --- Slots based on NEW availability (multi ranges) ---
function parseTimeToMinutes(t) {
  const [h, m] = String(t).split(":").map(Number);
  return h * 60 + m;
}

function minutesToDate(baseDate, minutes) {
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutes);
  return d;
}

exports.getAvailableSlots = async (req, res) => {
  try {
    const doctorProfileId = req.params.id; // DoctorProfile _id
    const { date } = req.query;            // "YYYY-MM-DD"

    if (!date) return res.status(400).json({ message: "date is required (YYYY-MM-DD)" });

    const profile = await DoctorProfile.findById(doctorProfileId);
    if (!profile) return res.status(404).json({ message: "Doctor not found" });

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const day = selectedDate.getDay(); // 0..6

    const dayAvailability = (profile.availability || []).find((a) => a.day === day);
    if (!dayAvailability?.ranges?.length) return res.json({ slots: [] });

    const slotMinutes = 30;
    const slotMs = slotMinutes * 60 * 1000;

    const startOfDay = new Date(selectedDate);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const booked = await Appointment.find({
      doctor: doctorProfileId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ["cancelled_by_patient", "cancelled_by_doctor", "rejected"] },
    }).select("date");

    const bookedSet = new Set(booked.map((a) => new Date(a.date).toISOString()));

    const now = new Date();
    const slots = [];

    for (const r of dayAvailability.ranges) {
      const startMin = parseTimeToMinutes(r.start);
      const endMin = parseTimeToMinutes(r.end);
      if (endMin <= startMin) continue; // same-day only

      let cursor = minutesToDate(selectedDate, startMin);
      const rangeEnd = minutesToDate(selectedDate, endMin);

      while (cursor < rangeEnd) {
        const iso = cursor.toISOString();
        if (cursor > now && !bookedSet.has(iso)) slots.push(iso);
        cursor = new Date(cursor.getTime() + slotMs);
      }
    }

    return res.json({ slots });
  } catch (err) {
    console.error("SLOTS ERROR:", err);
    return res.status(500).json({ message: "Failed to load slots", error: err.message });
  }
};

// --- Avatar upload (Cloudinary sets req.file.path = URL) ---
exports.uploadDoctorAvatar = async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        message: "No file received by multer",
      });
    }

    const avatarUrl =
      req.file.path ||
      req.file.secure_url ||
      req.file.url;



    if (!avatarUrl) {
      return res.status(400).json({
        message: "Upload ran but Cloudinary returned no URL",
      });
    }

    const updated = await DoctorProfile.findByIdAndUpdate(
      req.params.id,
      { avatarUrl },
      { new: true }
    );

    return res.json({
      message: "Avatar updated",
      avatarUrl
    });

  }
  catch (err) {
    return res.status(500).json({
      message: "Upload failed",
      error: err?.message
    });
  }
};