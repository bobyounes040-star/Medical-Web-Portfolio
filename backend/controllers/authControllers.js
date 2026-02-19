// controllers/authControllers.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/Users");
const Otp = require("../models/Otp");
const sendEmail = require("../utils/sendEmail");

const normalizeEmail = (email) => String(email || "").toLowerCase().trim();

const signToken = (user) => {
    return jwt.sign(
        { userId: user._id, email: user.email, role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

const generateCode = () => String(crypto.randomInt(100000, 1000000)); // 6 digits

exports.register = async (req, res) => {
    try {
        let { name, email, password } = req.body;

        name = String(name || "").trim();
        email = normalizeEmail(email);
        password = String(password || "");

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required." });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters." });
        }

        const isAdmin = process.env.ADMIN_EMAIL && email === normalizeEmail(process.env.ADMIN_EMAIL) ;
        
        let user = await User.findOne({ email });

        // if already verified -> block
        if (user && user.isVerified) {
            return res.status(409).json({ message: "Email already registered. Please login." });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        if (!user) {
            user = await User.create({
                name,
                email,
                passwordHash,
                role: isAdmin ? "admin" : "patient",
                isVerified: isAdmin ? true : false,
            });
        } else {
            // existing but not verified -> update name/password + resend code
            user.name = name;
            user.passwordHash = passwordHash;
            user.role = isAdmin ? "admin" : user.role;
            if (isAdmin) user.isVerified = true;
            await user.save();
        }

        // ✅ Admin: skip verification and login directly
        if (user.role === "admin" && user.isVerified) {
            const token = signToken(user);
            return res.json({
                message: "Logged in as admin",
                token,
                user: { id: user._id, name: user.name, email: user.email, role: user.role },
            });
        }

        // send verification code
        const code = generateCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

        await Otp.deleteMany({ email });
        await Otp.create({ email, code, expiresAt });

        await sendEmail(email, code);

        return res.json({ message: "Verification code sent to email.", email });
    } catch (err) {
        console.error("REGISTER ERROR:", err);
        return res.status(500).json({ message: "Register failed", error: err.message });
    }
};

exports.resendVerification = async (req, res) => {
    try {
        let { email } = req.body;
        email = normalizeEmail(email);

        if (!email) return res.status(400).json({ message: "Email is required." });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "No account found for this email." });

        if (user.isVerified) return res.status(400).json({ message: "This email is already verified." });

        const code = generateCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await Otp.deleteMany({ email });
        await Otp.create({ email, code, expiresAt });

        await sendEmail(email, code);

        return res.json({ message: "New verification code sent.", email });
    } catch (err) {
        console.error("RESEND ERROR:", err);
        return res.status(500).json({ message: "Resend failed", error: err.message });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        let { email, code } = req.body;
        email = normalizeEmail(email);
        code = String(code || "").trim();

        if (!email || !code) {
            return res.status(400).json({ message: "Email and code are required." });
        }

        const otp = await Otp.findOne({ email });
        if (!otp) return res.status(400).json({ message: "No OTP found. Please resend." });

        if (otp.expiresAt < new Date()) {
            await Otp.deleteMany({ email });
            return res.status(400).json({ message: "Code expired. Please resend." });
        }

        if (otp.code !== code) return res.status(400).json({ message: "Invalid code." });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found." });

        user.isVerified = true;
        await user.save();
        await Otp.deleteMany({ email });

        const token = signToken(user);

        return res.json({
            message: "Email verified. Logged in.",
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error("VERIFY EMAIL ERROR:", err);
        return res.status(500).json({ message: "Verification failed", error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        let { email, password } = req.body;
        email = normalizeEmail(email);
        password = String(password || "");

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials." });

        if (!user.passwordHash) {
            return res.status(400).json({ message: "This account has no password set. Please sign up again." });
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: "Please verify your email first.", needsVerification: true });
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(400).json({ message: "Invalid credentials." });

        const token = signToken(user);

        return res.json({
            message: "Logged in",
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({ message: "Login failed", error: err.message });
    }
};
