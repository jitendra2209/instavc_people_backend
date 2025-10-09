import jwt from 'jsonwebtoken';
import User from '../models/auth.model.js';

export const authenticateToken = async (req, res, next) => {
    try {
        // Check if authorization header exists and has Bearer token
        if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
            return res.status(401).json({
                success: false,
                message: 'No authorization token found'
            });
        }

        try {
            // Get token from header
            const token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-default-secret-key-change-in-production');

            // Get user from token
            const user = await User.findById(decoded.id).select('-password');
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Set user in request object
            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error in authentication',
            error: error.message
        });
    }
};