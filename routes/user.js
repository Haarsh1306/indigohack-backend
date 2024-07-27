const router = require("express").Router();
const pool = require("../db/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendOTP, verifyOTP } = require("../otpSender");
const {
  signupSchema,
  veryfyOTPSchema,
  loginSchema,
} = require("../validation/validation");

router.post("/signup", async (req, res) => {
  try {
    const validation = signupSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    const { name, email, password } = req.body;

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rowCount > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING user_id",
      [name, email, hashedPassword]
    );

    const userId = newUser.rows[0].user_id;

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiration = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      "INSERT INTO otps (user_id, otp_code, expires_at) VALUES ($1, $2, $3)",
      [userId, otpCode, otpExpiration]
    );

    await sendOTP(email, otpCode);

    res.status(201).json({
      message: "User created successfully. Please verify your email.",
      userId,
    });
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const validation = veryfyOTPSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const { email, otp } = req.body;
    const result = await pool.query(
      "SELECT user_id FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const userId = result.rows[0].user_id;
    console.log(userId);

    const isVerified = await verifyOTP(userId, otp);

    if (isVerified) {
      res.json({ message: "Email verified successfully" });
    } else {
      res.status(400).json({ message: "Invalid or expired OTP" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error verifying OTP", error: error.message });
  }
});

router.post("/signin", async (req, res) => {
  try {

    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    console.log("debug")
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error });
  }
});

module.exports = router;
