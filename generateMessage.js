// Function to generate email message in form of html
const generateMessage = (flight = null, otpCode = null) => {
  const htmlStyle = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #0047AB; color: white; padding: 10px; text-align: center; }
      .content { background-color: #f9f9f9; padding: 20px; }
      .footer { background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
      th { background-color: #f2f2f2; }
    </style>
  `;

  const otpMessage = ` <html>
    <head>${htmlStyle}</head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Otp For Indigohack Login</h2>
        </div>
        <div class="content">
          <p>Dear User,</p>
          <p>Your OTP for Indigohack login is <strong>${otpCode}</strong></p>
        </div>
        <div class="footer">
          <p>Best regards,<br>IndigoHack 2024</p>
        </div>
      </div>
    </body>
    </html> `;

    if (otpCode!=null) return otpMessage;

  const cancelledMessage = `
    <html>
    <head>${htmlStyle}</head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Flight Update</h2>
        </div>
        <div class="content">
          <p>Dear User,</p>
          <p>We regret to inform you that your flight with flight number <strong>${flight.flight_id}</strong> has been cancelled.</p>
          <p>We sincerely apologize for any inconvenience this may cause. Please contact our customer service for further assistance and rebooking options.</p>
        </div>
        <div class="footer">
          <p>Best regards,<br>IndigoHack 2024</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const updateMessage = `
    <html>
    <head>${htmlStyle}</head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Flight Update</h2>
        </div>
        <div class="content">
          <p>Dear User,</p>
          <p>We wanted to inform you of an update regarding your flight with flight number <strong>${
            flight.flight_id
          }</strong>:</p>
          <table>
            <tr>
              <th>Detail</th>
              <th>Status</th>
            </tr>
            <tr>
              <td>Status</td>
              <td>${flight.status || "Not updated"}</td>
            </tr>
            <tr>
              <td>Departure Gate</td>
              <td>${flight.departure_gate || "Not updated"}</td>
            </tr>
            <tr>
              <td>Arrival Gate</td>
              <td>${flight.arrival_gate || "Not updated"}</td>
            </tr>
            <tr>
              <td>Scheduled Departure</td>
              <td>${
                flight.scheduled_departure
                  ? new Date(flight.scheduled_departure).toLocaleString()
                  : "Not updated"
              }</td>
            </tr>
            <tr>
              <td>Scheduled Arrival</td>
              <td>${
                flight.scheduled_arrival
                  ? new Date(flight.scheduled_arrival).toLocaleString()
                  : "Not updated"
              }</td>
            </tr>
            <tr>
              <td>Actual Departure</td>
              <td>${
                flight.actual_departure
                  ? new Date(flight.actual_departure).toLocaleString()
                  : "Not updated"
              }</td>
            </tr>
            <tr>
              <td>Actual Arrival</td>
              <td>${
                flight.actual_arrival
                  ? new Date(flight.actual_arrival).toLocaleString()
                  : "Not updated"
              }</td>
            </tr>
          </table>
          <p>Thank you for choosing our airline.</p>
        </div>
        <div class="footer">
          <p>Best regards,<br>IndigoHack 2024</p>
        </div>
      </div>
    </body>
    </html>
  `;
 
  return flight.status === "Cancelled" ? cancelledMessage : updateMessage;
};

module.exports = generateMessage;
