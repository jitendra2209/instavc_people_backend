import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    phone: {
        type: String,
        required: false,
        unique: true,
        sparse: true // allow documents without phone to still be unique
    },
    password: {
        type: String,
        required: function() {
            // Password is required only if not using Google OAuth
            return !this.googleId;
        },
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    // Google OAuth fields
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows null values to be non-unique
    },
    authProvider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    // OTP fields for password reset
    otp: {
        type: String,
        select: false // Don't include in queries by default
    },
    otpExpiresAt: {
        type: Date,
        select: false
    },
    otpType: {
        type: String,
        enum: ['email', 'phone'],
        select: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Match user entered OTP to hashed OTP in database
userSchema.methods.matchOTP = async function(enteredOTP) {
    if (!this.otp || !this.otpExpiresAt) {
        return false;
    }
    
    // Check if OTP is expired
    if (new Date() > this.otpExpiresAt) {
        // Clear expired OTP
        this.otp = undefined;
        this.otpExpiresAt = undefined;
        this.otpType = undefined;
        await this.save();
        return false;
    }
    
    return await bcrypt.compare(enteredOTP, this.otp);
};

// Clear OTP after successful verification
userSchema.methods.clearOTP = async function() {
    this.otp = undefined;
    this.otpExpiresAt = undefined;
    this.otpType = undefined;
    await this.save();
};

const User = mongoose.model('User', userSchema);

export default User;