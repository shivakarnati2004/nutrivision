const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getPool, isDBAvailable } = require('../config/db');
const { generateToken } = require('../middleware/auth');
const { sendOTP } = require('../services/email');
require('dotenv').config();

const router = express.Router();

const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || '6');
const OTP_EXPIRY = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');

// Generate random OTP
const generateOTP = () => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < OTP_LENGTH; i++) {
        otp += digits[crypto.randomInt(0, 10)];
    }
    return otp;
};

// POST /api/auth/signup - Send OTP for signup
router.post('/signup', async (req, res) => {
    if (!isDBAvailable()) return res.status(503).json({ error: 'Database unavailable' });

    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const pool = getPool();

        // Check if user already exists
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Account already exists. Please login.' });
        }

        // Generate and save OTP
        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY * 60 * 1000);

        // Delete old OTPs for this email
        await pool.query('DELETE FROM otps WHERE email = $1 AND purpose = $2', [email, 'signup']);

        await pool.query(
            'INSERT INTO otps (email, otp_code, purpose, expires_at) VALUES ($1, $2, $3, $4)',
            [email, otpCode, 'signup', expiresAt]
        );

        // Send OTP email
        await sendOTP(email, otpCode, 'signup');

        res.json({ success: true, message: 'OTP sent to your email' });
    } catch (error) {
        console.error('Signup error:', error.message);
        res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
    }
});

// POST /api/auth/verify-otp - Verify OTP and create account with profile data
router.post('/verify-otp', async (req, res) => {
    if (!isDBAvailable()) return res.status(503).json({ error: 'Database unavailable' });

    try {
        const { email, otp, password, profileData } = req.body;
        if (!email || !otp || !password) {
            return res.status(400).json({ error: 'Email, OTP and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const pool = getPool();

        // Find valid OTP
        const otpResult = await pool.query(
            'SELECT * FROM otps WHERE email = $1 AND otp_code = $2 AND purpose = $3 AND used = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [email, otp, 'signup']
        );

        if (otpResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Mark OTP as used
        await pool.query('UPDATE otps SET used = true WHERE id = $1', [otpResult.rows[0].id]);

        // Hash password and create user
        const passwordHash = await bcrypt.hash(password, 12);

        // Calculate BMI if profile data provided
        let bmi = null;
        let onboardingComplete = false;
        const pd = profileData || {};

        if (pd.height_cm && pd.weight_kg) {
            const h = pd.height_cm / 100;
            bmi = (pd.weight_kg / (h * h)).toFixed(1);
        }

        if (pd.name) onboardingComplete = true;

        const userResult = await pool.query(
            `INSERT INTO users (email, password_hash, is_verified, name, gender, height_cm, weight_kg, age, 
             exercise_level, health_goals, health_conditions, bmi, onboarding_complete) 
             VALUES ($1, $2, true, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            [email, passwordHash, pd.name || null, pd.gender || null,
             pd.height_cm || null, pd.weight_kg || null, pd.age || null,
             pd.exercise_level || null, pd.health_goals || null, pd.health_conditions || null,
             bmi, onboardingComplete]
        );

        const user = userResult.rows[0];
        const token = generateToken(user.id, user.email);

        res.json({
            success: true,
            message: 'Account created successfully',
            token,
            user: {
                id: user.id, email: user.email, name: user.name,
                gender: user.gender, height_cm: user.height_cm, weight_kg: user.weight_kg,
                age: user.age, exercise_level: user.exercise_level, bmi: user.bmi,
                health_goals: user.health_goals, onboarding_complete: user.onboarding_complete,
            }
        });
    } catch (error) {
        console.error('Verify OTP error:', error.message);
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
});

// POST /api/auth/login - Email + password login
router.post('/login', async (req, res) => {
    if (!isDBAvailable()) return res.status(503).json({ error: 'Database unavailable' });

    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const pool = getPool();
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user.id, user.email);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                onboarding_complete: user.onboarding_complete,
            }
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ error: 'Login failed' });
    }
});

// POST /api/auth/forgot-password - Send OTP for password reset
router.post('/forgot-password', async (req, res) => {
    if (!isDBAvailable()) return res.status(503).json({ error: 'Database unavailable' });

    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const pool = getPool();

        // Check user exists
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length === 0) {
            return res.status(400).json({ error: 'No account found with this email' });
        }

        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY * 60 * 1000);

        await pool.query('DELETE FROM otps WHERE email = $1 AND purpose = $2', [email, 'reset']);
        await pool.query(
            'INSERT INTO otps (email, otp_code, purpose, expires_at) VALUES ($1, $2, $3, $4)',
            [email, otpCode, 'reset', expiresAt]
        );

        await sendOTP(email, otpCode, 'reset');

        res.json({ success: true, message: 'OTP sent to your email' });
    } catch (error) {
        console.error('Forgot password error:', error.message);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// POST /api/auth/reset-password - Verify OTP and set new password
router.post('/reset-password', async (req, res) => {
    if (!isDBAvailable()) return res.status(503).json({ error: 'Database unavailable' });

    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ error: 'Email, OTP and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const pool = getPool();

        const otpResult = await pool.query(
            'SELECT * FROM otps WHERE email = $1 AND otp_code = $2 AND purpose = $3 AND used = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [email, otp, 'reset']
        );

        if (otpResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        await pool.query('UPDATE otps SET used = true WHERE id = $1', [otpResult.rows[0].id]);

        const passwordHash = await bcrypt.hash(newPassword, 12);
        await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2', [passwordHash, email]);

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Reset password error:', error.message);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

module.exports = router;
