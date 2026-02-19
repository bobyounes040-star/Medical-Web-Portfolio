const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User",required: true },
    
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "DoctorProfile", required: true },

    patientNameAtBooking: { type: String },

    patientEmailAtBooking: { type: String },

    date: { type: Date, required: true },

    status: { type: String, enum: [ "pending", "approved", "rejected", "cancelled_by_patient", "cancelled_by_doctor"], default: "pending" }
  },
  { timestamps: true }
);

//this is used to prevent duplicate appointment of the same doctor at the same day and time but what it allows same day different time or appointment with a doctor
//at the same day and time with another doctor
appointmentSchema.index({ doctor: 1, date: 1 }, { unique: true });


module.exports = mongoose.model("Appointment", appointmentSchema);

// here we are creating a schema table in a folder named appointments instead of Appointment because DB lower case strings and changes them to plural 
// inside each schema we have the user id then patient id then date and status (didnt add patient name and email only added inside the front end)