require('dotenv').config();
const express = require('express');
const { sendOTP } = require('./otpSender');
const app = express();

app.use(express.json());

app.use('/api/v1/user', require('./routes/user'));

app.listen(3000, () => {   
    console.log('Server is running on http://localhost:3000');
});