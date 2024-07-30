// Validation schema
const zod = require('zod');

const signupSchema = zod.object({
    name: zod.string().min(3).max(50),
    email: zod.string().email(),
    password: zod.string().min(6).max(50)
});

const veryfyOTPSchema = zod.object({
    email: zod.string().email(),
    otp: zod.string().length(6)
});

const loginSchema = zod.object({
    email: zod.string().email(),
    password: zod.string().min(6).max(50)
}); 

const subscriptionSchema = zod.object({
    user_id: zod.string().uuid(),
    flight_id: zod.string()
});

const createFlightSchema = zod.object({
    flight_id: zod.string(),
    airline: zod.string(),
    status: zod.string(),
    departure_gate: zod.string(),
    arrival_gate: zod.string(),
    scheduled_departure: zod.string(),
    scheduled_arrival: zod.string(),
    actual_departure: zod.string(),
    actual_arrival: zod.string()
});

const updateFlightSchema = zod.object({
    status: zod.string().optional(),
    departure_gate: zod.string().optional(),
    arrival_gate: zod.string().optional(),
    scheduled_departure: zod.string().optional(),
    scheduled_arrival: zod.string().optional(),
    actual_departure: zod.string().optional(),
    actual_arrival: zod.string().optional()

});
module.exports = {signupSchema, veryfyOTPSchema,loginSchema, subscriptionSchema , createFlightSchema, updateFlightSchema};