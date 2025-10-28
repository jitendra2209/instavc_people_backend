import User from '../models/auth.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

// Lazy initialization - Twilio will be initialized on first use
let twilioClient = null;
let twilioInitialized = false;

// Function to get or initialize Twilio client (lazy loading)
function getTwilioClient() {
    if (!twilioInitialized) {
        twilioInitialized = true; // Prevent multiple initialization attempts
        
        if (process.env.TWILIO_SID && process.env.TWILIO_AUTH) {
            console.log('✅ Initializing Twilio with SID:', process.env.TWILIO_SID?.substring(0, 10) + '...');
            twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
        } else {
            console.warn('⚠️ Twilio credentials not found in environment variables');
            console.warn('   TWILIO_SID:', process.env.TWILIO_SID ? 'EXISTS' : 'MISSING');
            console.warn('   TWILIO_AUTH:', process.env.TWILIO_AUTH ? 'EXISTS' : 'MISSING');
        }
    }
    return twilioClient;
}

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET || 'your-default-secret-key-change-in-production',
        { expiresIn: '30d' }
    );
};

function generateOTP(length = 6) {
  return Math.floor(100000 + Math.random() * 900000).toString().slice(-length);
}

// Send OTP via Email using Nodemailer
export async function sendOtpEmail(email, otp) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587, // Use 587 for TLS or 465 for SSL
    secure: false, // true for port 465, false for port 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false // Accept self-signed certificates (for development)
    }
  });
  
  const mailOptions = {
    from: `InstaVC Support <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP Code for InstaVC Password Reset',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Reset OTP</h2>
        <p>Your OTP code is:</p>
        <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr>
        <p style="color: #888; font-size: 12px;">InstaVC Support Team</p>
      </div>
    `,
    text: `Your OTP code is: ${otp}. This OTP will expire in 10 minutes.`,
  };
  
  await transporter.sendMail(mailOptions);
  console.log('Email sent successfully to:', email);
}


// Send OTP via SMS using Twilio
export async function sendOtpSms(phone, otp) {
  console.log('Sending SMS to:', phone, 'OTP:', otp);
  
  // Get Twilio client (lazy initialization)
  const client = getTwilioClient();
  
  // Check if Twilio client is initialized
  if (!client) {
    console.error('❌ Twilio client not initialized. Check your TWILIO_SID and TWILIO_AUTH in .env file');
    throw new Error('SMS service not configured. Please check Twilio credentials.');
  }
  
  try {
    // Build message options
    const messageOptions = {
      body: `Your InstaVC OTP code is: ${otp}`,
      to: phone,
    //   messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      from: process.env.TWILIO_PHONE,
    };
    
   
    
    const message = await client.messages.create(messageOptions);
    
    console.log('✅ SMS sent successfully, SID:', message.sid);
  } catch (error) {
    console.error('Twilio SMS error:', error.message);
    console.error('Error details:', {
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo
    });
    throw error; // Re-throw so the calling function can handle it
  }
}

/**
 * @desc    Register new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signup = async (req, res) => {
    try {
        console.log('Signup request received:', req.body);
        const { email, password, name, phone } = req.body;

        // Validate request body
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and password'
            });
        }

        // Format phone if provided
        let normalizedPhone = null;
        if (phone) {
            normalizedPhone = phone;
            if (!/^\+91/.test(phone)) {
                normalizedPhone = `+91${phone.replace(/^0+/, '')}`;
            }
        }

        console.log('Checking for existing user with email:', email);
        if (normalizedPhone) {
            console.log('Checking for existing user with phone:', normalizedPhone);
        }

        // Check for existing user by email or phone (with +91 prefix)
        const userExists = await User.findOne({ 
            $or: [
                { email },
                ...(normalizedPhone ? [{ phone: normalizedPhone }] : [])
            ] 
        });

        if (userExists) {
            console.log('User already exists:', userExists.email);
            return res.status(400).json({
                success: false,
                message: 'User with this email or phone already exists'
            });
        }

        console.log('Creating new user...');
        // Create new user
        const userData = {
            name,
            email,
            password
        };
        
        if (normalizedPhone) {
            userData.phone = normalizedPhone;
        }

        const user = await User.create(userData);
        console.log('User created successfully:', user._id);

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
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
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Error in signup',
            error: error.message
        });
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate request body
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check if user exists and include password field
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        // Send response without password
        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email
                },
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error in login',
            error: error.message
        });
    }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting user info',
            error: error.message
        });
    }
};

/**
 * @desc    Forgot password (now email OR phone)
 * @route   POST /auth/forgotPassword
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
    try {
        console.log('Forgot password request received:', req.body);
        const { email, phone } = req.body;
        
        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an email or phone number',
            });
        }
        
        // Normalize phone number if provided
        let normalizedPhone = null;
        if (phone) {
            normalizedPhone = phone;
            if (!/^\+91/.test(phone)) {
                normalizedPhone = `+91${phone.replace(/^0+/, '')}`;
            }
            console.log('Normalized phone:', normalizedPhone);
        }
        
        // Find user by email or normalized phone
        const query = email ? { email } : { phone: normalizedPhone };
        console.log('Finding user with query:', query);
        
        const user = await User.findOne(query);
        if (!user) {
            console.log('User not found for:', query);
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        
        console.log('User found:', user);
        const rawOtp = generateOTP();
        const hashedOtp = await bcrypt.hash(rawOtp, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
        
        // Store OTP in user document
        user.otp = hashedOtp;
        user.otpExpiresAt = expiresAt;
        user.otpType = email ? 'email' : 'phone';
        await user.save();

        console.log('OTP generated:', rawOtp, 'for', email ? 'email' : 'phone');
        
        // Send OTP via email or SMS
        if (email) {
            try {
                await sendOtpEmail(email, rawOtp);
            } catch (emailError) {
                console.log(`[DEV MODE] Would send OTP ${rawOtp} to email: ${email}`);
                console.error('Email error (continuing anyway):', emailError.message);
                // Don't throw the error so the flow continues
            }
        } else {
            console.log('Attempting to send SMS to:', normalizedPhone);
            try {
                await sendOtpSms(normalizedPhone, rawOtp);
            } catch (smsError) {
                console.log(`[DEV MODE] Would send OTP ${rawOtp} to phone: ${normalizedPhone}`);
                console.error('SMS error (continuing anyway):', smsError.message);
                // Don't throw the error so the flow continues
            }
        }
        
        res.json({
            success: true,
            message: `OTP sent to your ${email ? 'email' : 'phone'}`,
            // Always include OTP for testing purposes
            otp: rawOtp,
            debug: {
                userId: user._id,
                type: email ? 'email' : 'phone',
                expiresAt: expiresAt
            }
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error in forgot password',
            error: error.message,
        });
    }
};

/**
 * @desc    Reset password using OTP (email OR phone)
 * @route   POST /auth/resetPassword
 * @access  Public
 */
export const resetPassword = async (req, res) => {
    try {
        console.log('Reset password request received:', req.body);
        const { email, phone, otp, newPassword } = req.body;
        
        if ((!email && !phone) || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email or phone, OTP, and new password',
            });
        }
        
        // Normalize phone number if provided
        let normalizedPhone = null;
        if (phone) {
            normalizedPhone = phone;
            if (!/^\+91/.test(phone)) {
                normalizedPhone = `+91${phone.replace(/^0+/, '')}`;
            }
            console.log('Normalized phone:', normalizedPhone);
        }
        
        // Find user by email or normalized phone
        const query = email ? { email } : { phone: normalizedPhone };
        console.log('Finding user with query:', query);
        
        // Find user with password and OTP fields
        const user = await User.findOne(query).select('+password +otp +otpExpiresAt +otpType');
        if (!user) {
            console.log('User not found for:', query);
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        console.log('User found:', user._id);
        
        // Check if user has OTP and it matches the type
        if (!user.otp || !user.otpExpiresAt) {
            console.log('No OTP found for user:', user._id);
            return res.status(400).json({ success: false, message: 'OTP not found. Please request a new OTP.' });
        }
        
        // Verify OTP type matches
        const expectedType = email ? 'email' : 'phone';
        if (user.otpType !== expectedType) {
            console.log('OTP type mismatch:', user.otpType, 'vs', expectedType);
            return res.status(400).json({ success: false, message: 'OTP type mismatch' });
        }
        
        // Validate OTP (this also checks expiration and clears if expired)
        const isOtpValid = await user.matchOTP(otp);
        if (!isOtpValid) {
            console.log('Invalid or expired OTP provided');
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }
        
        console.log('OTP validated, updating password');
        user.password = newPassword;
        await user.save();
        
        // Clear OTP after successful password reset
        await user.clearOTP();
        
        console.log('Password reset successful for user:', user._id);
        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error in reset password',
            error: error.message,
        });
    }
};