const express = require('express');

const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv').config();
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
const authRoutes = require('./routes/auth.routes');
//connect to database
connectDB();
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(morgan('dev')); // Logging
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true }));
// Configure CORS for all routes
app.use(cors({
    origin: '*', // In production, replace with your Flutter app's domain
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong in middleware!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Routes
app.use('/auth', authRoutes)

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
    res.json({
        message: 'The server is running '
    });
});
