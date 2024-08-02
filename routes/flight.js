const express = require("express");
const router = express.Router();
const pool = require("../db/db");
const authenticate = require("../middlewares/authenticate");
const {
  subscriptionSchema,
  createFlightSchema,
  updateFlightSchema,
} = require("../validation/validation");
const { sendEmailMessage } = require("../kafka/producer");
const generateMessage = require("../generateMessage");

// Get flights data
router.get("",authenticate, async (req, res) => {
  try {
    const query = `
        SELECT 
          flight_id,
          airline,
          status,
          departure_gate,
          arrival_gate,
          scheduled_departure,
          scheduled_arrival,
          actual_departure,
          actual_arrival
        FROM flight_data 
        WHERE is_deleted = FALSE
      `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
});

// Create a flight
router.post("/create",authenticate, async (req, res) => {
  const validation = createFlightSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const {
    flight_id,
    airline,
    status,
    departure_gate,
    arrival_gate,
    scheduled_departure,
    scheduled_arrival,
    actual_departure,
    actual_arrival,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO flight_data (
        flight_id, airline, status, departure_gate, arrival_gate, 
        scheduled_departure, scheduled_arrival, actual_departure, 
        actual_arrival
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        flight_id,
        airline,
        status,
        departure_gate,
        arrival_gate,
        scheduled_departure,
        scheduled_arrival,
        actual_departure,
        actual_arrival,
      ]
    );

    const newFlight = result.rows[0];
    res.status(201).json({
      message: "Flight created",
      flight: newFlight,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Subscribe to a flight
router.post("/subscribe", authenticate, async (req, res) => {
  const validation = subscriptionSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: "Invalid input" });
  }
  const { user_id, flight_id } = req.body;

  try {
    const checkResult = await pool.query(
      `SELECT * FROM subscriptions WHERE user_id = $1 AND flight_id = $2`,
      [user_id, flight_id]
    );

    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: "Subscription already exists" });
    }

    const result = await pool.query(
      `INSERT INTO subscriptions (user_id, flight_id) VALUES ($1, $2) RETURNING *`,
      [user_id, flight_id]
    );

    res.status(201).json({
      message: "Subscription created",
      subscription: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating subscription");
  }
});

// Get subscription detail
router.get("/subscriptions/:user_id", authenticate, async (req, res) => {
  const { user_id } = req.params;
  if (!user_id) {
    return res.status(400).json({ error: "Invalid input" });
  }
  try {
    const result = await pool.query(
      `SELECT flight_id FROM subscriptions WHERE user_id = $1`,
      [user_id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No subscriptions found for this user" });
    }

    const flightIds = result.rows.map((row) => row.flight_id);
    res.status(200).json({
      message: "Subscriptions retrieved successfully",
      flightIds: flightIds,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update flight data
router.put("/update/:flight_id", authenticate ,async (req, res) => {
  const validation = updateFlightSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: "Invalid input" });
  }
  if(req.user.userRole !== "admin"){
    return res.status(403).json({error: "Unauthorized"})
  }
  const flight_id = req.params.flight_id;
  const {
    status,
    departure_gate,
    arrival_gate,
    scheduled_arrival,
    scheduled_departure,
    actual_departure,
    actual_arrival,
  } = req.body;

  const fields = [];
  const values = [];
  let query = "UPDATE flight_data SET ";

  if (status) {
    fields.push(`status = $${fields.length + 1}`);
    values.push(status);
  }
  if (departure_gate) {
    fields.push(`departure_gate = $${fields.length + 1}`);
    values.push(departure_gate);
  }
  if (arrival_gate) {
    fields.push(`arrival_gate = $${fields.length + 1}`);
    values.push(arrival_gate);
  }
  if (scheduled_departure) {
    fields.push(`scheduled_departure = $${fields.length + 1}`);
    values.push(scheduled_departure);
  }
  if (scheduled_arrival) {
    fields.push(`scheduled_arrival = $${fields.length + 1}`);
    values.push(scheduled_arrival);
  }
  if (actual_departure) {
    fields.push(`actual_departure = $${fields.length + 1}`);
    values.push(actual_departure);
  }
  if (actual_arrival) {
    fields.push(`actual_arrival = $${fields.length + 1}`);
    values.push(actual_arrival);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  fields.push(`updated_at = $${fields.length + 1}`);
  values.push(new Date());

  query +=
    fields.join(", ") +
    " WHERE flight_id = $" +
    (fields.length + 1) +
    " RETURNING *";

  values.push(flight_id);

  try {
    await pool.query("BEGIN");
    const result = await pool.query(query, values);
 
    const updatedFlight = result.rows[0];
  
    const message = generateMessage(updatedFlight);

    const email = await pool.query(
      `SELECT u.email 
      FROM subscriptions
      JOIN users u ON u.user_id = subscriptions.user_id
      WHERE flight_id = $1`,
      [flight_id]
    );

    const emailList = email.rows.map((row) => row.email);
    for (const email of emailList) {
      await pool.query(
        'INSERT INTO notifications(flight_id, recipient, message, method) VALUES($1, $2, $3, $4)',[flight_id, email, message,"Email"]
      )
    }
    if(emailList.length > 0){
      sendEmailMessage(emailList, message);
    }


    await pool.query("COMMIT");
    
    res.status(200).json({
      message: "Flight details updated successfully",
      updatedFlight,
      emailMessage: message,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
