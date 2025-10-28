import { OAuth2Client } from 'google-auth-library';
import User from '../models/auth.model.js';
import jwt from 'jsonwebtoken';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET || 'your-default-secret-key-change-in-production',
        { expiresIn: '30d' }
    );
};

/**
 * @desc    Google OAuth Login/Signup
 * @route   POST /auth/google
 * @access  Public
 */
export const googleAuth = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: 'Google ID token is required'
            });
        }

        // Verify Google ID token
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { 
            email, 
            name, 
            picture, 
            phone_number,  // Google may provide phone number if requested
            sub: googleId 
        } = payload;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email not provided by Google'
            });
        }

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            // User exists - update Google ID and info if not set
            if (!user.googleId) {
                user.googleId = googleId;
            }
            if (picture && !user.profilePicture) {
                user.profilePicture = picture;
            }
            if (phone_number && !user.phone) {
                // Normalize phone number to +91 format if it's Indian number
                let normalizedPhone = phone_number;
                if (!normalizedPhone.startsWith('+')) {
                    normalizedPhone = '+91' + normalizedPhone.replace(/^0+/, '');
                }
                user.phone = normalizedPhone;
            }
            await user.save();

            console.log('Existing user logged in via Google:', user.email);
        } else {
            // Create new user
            const userData = {
                name,
                email,
                googleId,
                password: Math.random().toString(36).slice(-8) + 'Aa1!', // Random password (won't be used)
                authProvider: 'google'
            };

            
            if (phone_number) {
                // Normalize phone number to +91 format
                let normalizedPhone = phone_number;
                if (!normalizedPhone.startsWith('+')) {
                    normalizedPhone = '+91' + normalizedPhone.replace(/^0+/, '');
                }
                userData.phone = normalizedPhone;
            }

            user = await User.create(userData);

            console.log('New user created via Google:', user.email);
        }

        // Generate JWT token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: user.authProvider === 'google' ? 'Google login successful' : 'Logged in successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone || null
                },
                token
            }
        });

    } catch (error) {
        console.error('Google Auth error:', error);
        
        if (error.message && error.message.includes('Token used too late')) {
            return res.status(401).json({
                success: false,
                message: 'Google token expired. Please try again.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Google authentication failed',
            error: error.message
        });
    }
};


