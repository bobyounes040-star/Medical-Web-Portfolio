
const express = require("express");
const router = express.Router();
const { register, login, verifyEmail, resendVerification, } = require("../controllers/authControllers");

router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);

// optional backward compatibility
router.post("/send-otp", resendVerification);
router.post("/verify-otp", verifyEmail);

module.exports = router;
