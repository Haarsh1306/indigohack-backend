require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authenticateToken = require("./middlewares/authenticate");
const { startConsumer } = require("./kafka/consumer");
const { connectProducer} = require("./kafka/producer");
const app = express();
app.use(cors());

app.use(express.json());

// Route related to user login and signup
app.use("/api/v1/user", require("./routes/user"));

// Route related to flight and subscription to a flight
app.use("/api/v1/flight", require("./routes/flight"));

// Route to validate jwt
app.get("/api/v1/getme", authenticateToken, (req, res) => {

  res.status(200).json({
    message: "Authenticated",
    userId: req.user.userId,
    userEmail: req.user.userEmail,
    userName: req.user.userName,
    userRole: req.user.userRole,
  });
});

// Starting kafka service
startConsumer().catch(console.error);
connectProducer().catch(console.error);

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
