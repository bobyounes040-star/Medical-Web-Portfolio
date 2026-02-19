// models/User.js (or Users.js)
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    role: { type: String, enum: ["patient", "doctor", "admin"], default: "patient" },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

// here we are creating a schema table in a folder named users instead of User because DB lower case strings and changes them to plural 
// inside each schema we have the user id name, email, password of the email but hashed for privacy and security reasons role is it doctor patient or admin isverified checks if the account is valid
// timestamps: true meaning mongo DB by default will add when was it created and when was it updated