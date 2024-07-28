const pool = require("./db/db");
const sendEmail = require("./email");

async function sendOTP(email, userId) {

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiration = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      "INSERT INTO otps (user_id, otp_code, expires_at) VALUES ($1, $2, $3)",
      [userId, otpCode, otpExpiration]
    );

    const subject = "Your OTP for verification at Indigohack";
    const message = `Your OTP is: ${otpCode}`;
    await sendEmail(email, subject, message);
}

async function verifyOTP(userId, otp) {
  const result = await pool.query(
    "SELECT * FROM otps WHERE user_id = $1 AND otp_code = $2 AND expires_at > NOW()",
    [userId, otp]
  );

  if (result.rows.length === 0) return false;

  await pool.query("UPDATE users SET is_verified = TRUE WHERE user_id = $1", [
    userId,
  ]);
  await pool.query("UPDATE otps SET is_used = TRUE WHERE user_id = $1", [userId]);

  return true;
}

module.exports = { sendOTP, verifyOTP };
