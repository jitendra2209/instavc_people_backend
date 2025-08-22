const express = require('express');
const router = express.Router();
const {
    signup,
    login,
    getMe,
    forgotPassword,
    resetPassword
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', signup);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get('/currentUser', protect, getMe);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgotpassword', forgotPassword);

/**
 * @route   POST /api/auth/resetpassword
 * @desc    Reset password using OTP
 * @access  Public
 */
router.post('/resetpassword', resetPassword);

module.exports = router;