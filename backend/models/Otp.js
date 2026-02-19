const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    code: { type: String, required: true },
    purpose: { type: String, enum: ["email_verify"], default: "email_verify" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Otp", otpSchema);

// here we are creating a schema table in a folder named otps instead of Otp because DB lower case strings and changes them to plural 
// inside each schema we have the user id email, code, purpose, and at what time does the code expires
//timestamps: true meaning mongo DB by default will add when was it created and when was it updated