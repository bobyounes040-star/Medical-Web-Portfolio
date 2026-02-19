// Imports
const Appointment = require("../models/appointment");
//const { isValidDate } = require("../utils/validate");
const { to30MinSlot } = require("../utils/slots");
const DoctorProfile = require("../models/DoctorProfile");

// changes time from hours to minutes
function timeToMinutes(t) {
    const [hh, mm] = String(t).split(":").map(Number); // for example let t be 3:20 it will be string then be split on : so 3:20 will become ["3","20"] then after map it will become integer finally hh and mm will be equal to the array values respectively
    return hh * 60 + mm; // then hh will be 3 and mm 20 from hours to minutes its x 60 implies 3 x 60 + 20 this is how this function transforms from hour to minutes
}

// determine wether this appointment slot (date + duration) fit inside the doctor’s availability ranges for that day
function slotFitsAvailability(slotDate, availability, slotMinutes) {
    if (!Array.isArray(availability) || availability.length === 0) return false; // if there’s no schedule data, it can’t fit return false.

    const day = slotDate.getDay(); // gives day-of-week (0–6)
    const minutes = slotDate.getHours() * 60 + slotDate.getMinutes(); // start time in minutes
    const endMinutes = minutes + slotMinutes; // start + when it ends duration 

    const dayObj = availability.find((a) => a.day === day); // It looks for an object whose day matches the slot’s day
    if (!dayObj || !Array.isArray(dayObj.ranges)) return false;

    // checks if the time range specified by the patient is within the doctors working hour
    return dayObj.ranges.some((r) => {
        const startM = timeToMinutes(r.start);
        const endM = timeToMinutes(r.end);
        return minutes >= startM && endMinutes <= endM;
    });
}

//This function rounds time down to the nearest “slot boundary”
function roundToSlot(dateObj, slotMinutes) {
    const d = new Date(dateObj); // Makes a copy of the input date so we don’t modify the original.
    const mins = d.getMinutes();// gets its minutes
    const rounded = Math.floor(mins / slotMinutes) * slotMinutes;// rounding then multiply by slotminutes
    d.setMinutes(rounded, 0, 0);// get the hour rounded minute seconds(0) and millisecond(0)
    return d;
}

//This Export creates appointment”
exports.createAppointment = async (req, res) => {
    try {
        const { doctorId, date } = req.body; // checks if doctor id and date are presented
        if (!doctorId || !date) {
            return res.status(400).json({ message: "doctorId and date are required" });
        }

        const doctor = await DoctorProfile.findById(doctorId);
        if (!doctor) return res.status(404).json({ message: "Doctor not found" });

        const slotMinutes = doctor.slotMinutes || 30;

        const requested = new Date(date); // Makes a copy of the input date so we don’t modify the original.
        if (isNaN(requested.getTime())) {
            return res.status(400).json({ message: "Invalid date" });
        }

        const slot = roundToSlot(requested, slotMinutes);

        if (slot < new Date()) {// Block past bookings
            return res.status(400).json({ message: "Cannot book in the past" });
        }

        if (!slotFitsAvailability(slot, doctor.availability, slotMinutes)) { // ensures the full slot (start to end) fits inside one of the doctor’s time ranges for that weekday.
            return res.status(400).json({ message: "Selected time is not in doctor availability" });
        }

        // prevent double booking (pending/approved block the slot)
        const conflict = await Appointment.findOne({
            doctor: doctor._id,
            date: slot,
            status: { $in: ["pending", "approved"] },
        });

        if (conflict) {
            return res.status(409).json({ message: "This slot is already booked" });
        }

        // Create appointment
        const appt = await Appointment.create({
            patient: req.user.userId,
            doctor: doctor._id,
            date: slot,
            status: "pending",
        });

        return res.json(appt);
    } catch (err) {
        console.error("CREATE APPOINTMENT ERROR:", err);
        return res.status(500).json({ message: "Failed to create appointment", error: err.message });
    }
};

//This Export Presents all appointments
exports.getMyAppointments = async (req, res) => {
    try {
        const role = req.user.role;
        let appointments;

        // returns appointment that belong to the currently logged-in patient
        // so it will provide for the user doctors full name, his email which department and his pfp
        if (role === "patient") {
            appointments = await Appointment.find({ patient: req.user.userId }).populate("doctor", "fullName email department avatarUrl");
        }

        // returns appointment that belong to the currently logged-in doctor
        // so it will provide for the user patient name, his email 
        else if (role === "doctor") {
            const profile = await DoctorProfile.findOne({ email: req.user.email });
            if (!profile) return res.json([]);

            appointments = await Appointment.find({ doctor: profile._id }).populate("patient", "name email");
        }

        // provides all the appointments with there doctors name email and department and pf and the patient name and email
        else if (role === "admin") {
            appointments = await Appointment.find()
                .populate("doctor", "fullName email department avatarUrl ")
                .populate("patient", "name email");
        }

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Status must be approved or rejected" });
        }

        const appointment = await Appointment.findById(id);
        if (!appointment) return res.status(404).json({ message: "Appointment not found" });

        // get doctor's profile
        const profile = await DoctorProfile.findOne({ email: req.user.email });
        if (!profile) return res.status(403).json({ message: "No doctor profile" });

        if (appointment.doctor.toString() !== profile._id.toString()) {
            return res.status(403).json({ message: "Not your appointment" });
        }

        if (appointment.status !== "pending") {
            return res.status(409).json({ message: "Already processed" });
        }

        appointment.status = status;
        await appointment.save();

        res.json({ message: "Updated", appointment });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.cancelAppointment = async (req, res) => {
    try {
        const appt = await Appointment.findById(req.params.id);
        if (!appt) return res.status(404).json({ message: "Appointment not found" });

        if (!["pending", "approved"].includes(appt.status)) {
            return res.status(409).json({ message: "Only pending/approved can be cancelled" });
        }

        if (req.user.role === "patient") {
            if (appt.patient.toString() !== req.user.userId) {
                return res.status(403).json({ message: "Not your appointment" });
            }
            appt.status = "cancelled_by_patient";
        }

        else if (req.user.role === "doctor") {
            // doctor owns appointments via DoctorProfile email -> DoctorProfile _id
            const profile = await DoctorProfile.findOne({ email: req.user.email });
            if (!profile) return res.status(403).json({ message: "Doctor profile not found" });

            if (appt.doctor.toString() !== profile._id.toString()) {
                return res.status(403).json({ message: "Not your appointment" });
            }

            appt.status = "cancelled_by_doctor";
        }

        else if (req.user.role === "admin") {
            appt.status = "cancelled_by_doctor"; // or "cancelled_by_admin" if you want
        }

        await appt.save();
        return res.json({ message: "Cancelled", appointment: appt });
    } catch (err) {
        return res.status(500).json({ message: "Cancel failed", error: err.message });
    }
};

exports.rescheduleAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { date } = req.body;

        if (!date) return res.status(400).json({ message: "date is required" });

        const appointment = await Appointment.findById(id);
        if (!appointment) return res.status(404).json({ message: "Appointment not found" });

        // only owner patient
        if (appointment.patient.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Forbidden: not your appointment" });
        }

        // only pending
        if (appointment.status !== "pending") {
            return res.status(409).json({ message: `Cannot reschedule an appointment that is ${appointment.status}` });
        }

        const newDate = to30MinSlot(date);
        if (!newDate) return res.status(400).json({ message: "Invalid date format" });

        if (newDate < new Date()) {
            return res.status(400).json({ message: "Cannot reschedule to a past time" });
        }

        // prevent double booking for same doctor & slot
        const conflict = await Appointment.findOne({
            _id: { $ne: appointment._id },
            doctor: appointment.doctor,
            date: newDate
        });

        if (conflict) {
            return res.status(409).json({ message: "This 30-min slot is already booked." });
        }

        appointment.date = newDate;
        await appointment.save();

        return res.json({ message: "Appointment rescheduled", appointment });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

