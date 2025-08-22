const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        
        // Add connection options
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
            serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        if (error.name === 'MongooseServerSelectionError') {
            console.error('Failed to connect to MongoDB. Please check:');
            console.error('1. Your internet connection');
            console.error('2. MongoDB Atlas service status');
            console.error('3. Your IP address is whitelisted in MongoDB Atlas');
            console.error('4. Your database credentials are correct');
            console.error(`Detailed error: ${error.message}`);
        } else {
            console.error(`MongoDB connection error: ${error.message}`);
        }
        process.exit(1);
    }
};

module.exports = connectDB;