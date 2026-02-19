const mongoose = require("mongoose");

const doctorProfileSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true }, 
    
    fullName: String, 
    
    department: String, 
    
    bio: String,

    yearsExperience: { type: Number, default: 0 },

    availability: {
      type: [
        {
          day: {
            type: Number,
            required: true,
            min: 0,
            max: 6
          },
          ranges: [
            {
              start: { type: String, required: true },
              end: { type: String, required: true }
            }
          ]
        }
      ],
      default: []
    },

    avatarUrl: {
      type: String,
      default: ""
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("DoctorProfile", doctorProfileSchema);

// here we are creating a schema table in a folder named doctorprofiles instead of DoctorProfile because DB lower case strings and changes them to plural 
// inside each schema we have the user id doctor email, Name, which department, Bio then years of experience, then which day and time available avatarurl which is the doctor profile picture
//timestamps: true meaning mongo DB by default will add when was it created and when was it updated