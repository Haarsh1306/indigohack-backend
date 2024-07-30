const express = require("express");
const router = express.Router();
const pool = require("../db/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendOTP, verifyOTP } = require("../otpSender");
const {
  signupSchema,
  veryfyOTPSchema,
  loginSchema,
} = require("../validation/validation");

// Sign up route
router.post("/signup", async (req, res) => {
  try {
    const validation = signupSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: "Invalid Input" });
    }

    const { name, email, password } = req.body;

    //using transaction
    await pool.query("BEGIN");
    const { rowCount } = await pool.query(
      "SELECT 1 FROM users WHERE email = $1",
      [email]
    );

    if (rowCount > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, hashedPassword]
    );

    const user = rows[0];

    await sendOTP(email, user.user_id);

    // commit transaction
    await pool.query("COMMIT");

    res.status(201).json({
      message: "User created successfully. Please verify your email.",
      userId: user.user_id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,  
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error in signup:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify OTP route
router.post("/verify-otp", async (req, res) => {
  try {
    const validation = veryfyOTPSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: "Invalid Input" });
    }

    const { email, otp } = req.body;
    const { rows } = await pool.query(
      "SELECT user_id FROM users WHERE email = $1",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = rows[0].user_id;

    const isVerified = await verifyOTP(userId, otp);

    if (isVerified) {
      res
        .status(201)
        .json({ message: "Email verified successfully", isVerified });
    } else {
      res.status(400).json({ error: "Invalid or expired OTP" });
    }
  } catch (error) {
    console.error("Error in verify OTP:", error);
    res.status(500).json({ errror: "Internal server error" });
  }
});

// Sign in route
router.post("/signin", async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: "Invalid input" });
    }
    // Transaction start
    await pool.query("BEGIN");

    const { email, password } = req.body;
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Email is not registered" });
    }

    const user = rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Wrong password" });
    }

    if (!user.is_verified) {
      await sendOTP(email, user.user_id);
      return res.status(401).json({
        error: "Email not verified, OTP sent again",
        isVerified: user.is_verified,
        userId: user.user_id,
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
      });
    }

    //commit transaction
    await pool.query("COMMIT");

    const token = jwt.sign(
      { userId: user.user_id, userEmail: user.email, userName: user.name, userRole: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({ token, userId: user.user_id, userEmail: user.email, userName: user.name, userRole: user.role });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error in signin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
