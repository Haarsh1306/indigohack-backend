require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authenticateToken = require('./middlewares/authenticate');
const { startConsumer } = require('./kafka/consumer');
const { connectProducer, sendEmailMessage } = require('./kafka/producer');
const app = express();
app.use(cors());

app.use(express.json());

app.use('/api/v1/user', require('./routes/user'));
app.use('/api/v1/flight', require('./routes/flight'));

app.get('/api/v1/getme', authenticateToken, (req, res) => {
    res.json({ message: 'Authenticated', user: req.user });
});

startConsumer().catch(console.error);
connectProducer().catch(console.error);

app.listen(3000, () => {   
    console.log('Server is running on http://localhost:3000');
});