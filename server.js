const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

connectDB();
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from your frontend's origin
}));
app.use(express.json());

app.get('/', (req, res) => res.send('API Running'));
app.use('/auth', require('./routes/auth'));


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
