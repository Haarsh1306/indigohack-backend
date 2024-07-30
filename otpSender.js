// Otp sending related methods
const pool = require("./db/db");
const sendEmail = require("./email");
const generateMessage = require("./generateMessage");

async function sendOTP(email, userId) {
  try {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiration = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query("BEGIN");

    const checkRes = await pool.query("SELECT * FROM otps WHERE user_id = $1", [
      userId,
    ]);

    if (checkRes.rowCount > 0) {
      await pool.query(
        "UPDATE otps SET otp_code = $1, expires_at = $2 WHERE user_id = $3",
        [otpCode, otpExpiration, userId]
      );
    } else {
      await pool.query(
        "INSERT INTO otps (user_id, otp_code, expires_at) VALUES ($1, $2, $3)",
        [userId, otpCode, otpExpiration]
      );
    }

    const subject = "Your OTP for verification at Indigohack";
    const message = generateMessage(null, otpCode);
    await sendEmail(email, subject, message);

    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
  }
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
  await pool.query("UPDATE otps SET is_used = TRUE WHERE user_id = $1", [
    userId,
  ]);

  return true;
}

module.exports = { sendOTP, verifyOTP };
