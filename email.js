// Email sender using node-mailer
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendEmail = async (to , subject , text) =>{
    const mailOptions = {
        from: {
          name: "Indigohack",
          address: process.env.EMAIL,
        },
        to: to,
        subject: subject,
        html: text,
      };
    await transporter.sendMail(mailOptions);
}

module.exports = sendEmail;