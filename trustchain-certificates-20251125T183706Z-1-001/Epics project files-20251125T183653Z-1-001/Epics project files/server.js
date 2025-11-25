// server.js
require('dotenv').config(); // MUST BE FIRST
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

const cors = require('cors'); // <--- 1. NEW IMPORT: Import the cors library

const authRoutes = require('./routes/auth'); // <--- NEW IMPORT
const certRoutes = require('./routes/certificate'); // <--- NEW IMPORT

const connectDB = require('./config/db'); // Import the function
connectDB(); // CALL IT HERE

// Middleware
app.use(cors()); // <--- 2. NEW LINE: Apply CORS middleware to allow requests from the frontend/Postman
app.use(express.json()); // Allows the server to read JSON data


// Basic Route
app.get('/', (req, res) => {
    res.send('TrustChain Backend is Running!');
});

app.use('/api/auth', authRoutes); // Use the root path
app.use('/api/certs', certRoutes); // <--- NEW ROUTE USE for certificate logic

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});