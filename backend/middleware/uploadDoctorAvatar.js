// Multer is Express middleware used for handling file uploads
const multer = require("multer");

// A storage engine that tells Multer where/how to store uploaded files—in this case, Cloudinary
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const cloudinary = require("../utils/cloudinary");

// Creates a “storage engine” for Multer. When a file is uploaded, this engine uploads it to Cloudinary.
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "clinic/doctors", // Cloudinary folder path where images will be stored.
    allowed_formats: ["jpg", "jpeg", "png", "webp"], // types of formats that are accepted 
  },
});

// we finalize it here were we give multer a storage which is new CloudinaryStorage.. because multer needs a storage to upload files
const upload = multer({ storage });

// exporting upload to call it later
module.exports = upload;
