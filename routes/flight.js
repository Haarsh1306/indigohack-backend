const express = require("express");
const router = express.Router();
const pool = require("../db/db");
const authenticate = require("../middlewares/authenticate");
const { subscriptionSchema, createFlightSchema } = require("../validation/validation");

router.get("", async (req, res) => {
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

router.post('/create', async (req, res) => {

  const validation = createFlightSchema.safeParse(req.body);
  if(!validation.success) {
    return res.status(400).json({ error: 'Invalid input' });
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
    actual_arrival
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
        actual_arrival
      ]
    );

    const newFlight = result.rows[0];
    res.status(201).json({
      message: 'Flight created',
      flight: newFlight
    });
  } catch (error) {
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post("/subscribe", authenticate, async (req, res) => {
  const validation = subscriptionSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: "Invalid input" });
  }
  const { user_id, flight_id } = req.body;

  try {
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

module.exports = router;
