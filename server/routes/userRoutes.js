const express = require('express');
const { getPool, isDBAvailable } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Calculate BMI
const calculateBMI = (weightKg, heightCm) => {
    if (!weightKg || !heightCm || heightCm === 0) return null;
    const heightM = heightCm / 100;
    return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
};

// POST /api/user/onboarding - Save onboarding data
router.post('/onboarding', authMiddleware, async (req, res) => {
    if (!isDBAvailable()) return res.status(503).json({ error: 'Database unavailable' });

    try {
        const { name, gender, height_cm, weight_kg, age, exercise_level, health_conditions, health_goals } = req.body;

        if (!name) return res.status(400).json({ error: 'Name is required' });

        const bmi = calculateBMI(weight_kg, height_cm);

        const pool = getPool();
        const result = await pool.query(
            `UPDATE users SET 
                name = $1, gender = $2, height_cm = $3, weight_kg = $4, 
                age = $5, bmi = $6, exercise_level = $7, health_conditions = $8,
                health_goals = $9, onboarding_complete = true, updated_at = NOW()
             WHERE id = $10
             RETURNING id, email, name, gender, height_cm, weight_kg, age, bmi, exercise_level, health_conditions, health_goals, onboarding_complete`,
            [name, gender, height_cm, weight_kg, age, bmi, exercise_level, health_conditions, health_goals, req.user.id]
        );

        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('Onboarding error:', error.message);
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

// GET /api/user/profile - Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
    if (!isDBAvailable()) return res.status(503).json({ error: 'Database unavailable' });

    try {
        const pool = getPool();
        const result = await pool.query(
            'SELECT id, email, name, gender, height_cm, weight_kg, age, bmi, exercise_level, health_conditions, health_goals, onboarding_complete, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('Get profile error:', error.message);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// PUT /api/user/profile - Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
    if (!isDBAvailable()) return res.status(503).json({ error: 'Database unavailable' });

    try {
        const { name, gender, height_cm, weight_kg, age, exercise_level, health_conditions, health_goals } = req.body;

        const bmi = calculateBMI(weight_kg, height_cm);

        const pool = getPool();
        const result = await pool.query(
            `UPDATE users SET 
                name = COALESCE($1, name), gender = COALESCE($2, gender), 
                height_cm = COALESCE($3, height_cm), weight_kg = COALESCE($4, weight_kg), 
                age = COALESCE($5, age), bmi = COALESCE($6, bmi), 
                exercise_level = COALESCE($7, exercise_level), 
                health_conditions = COALESCE($8, health_conditions),
                health_goals = COALESCE($9, health_goals),
                updated_at = NOW()
             WHERE id = $10
             RETURNING id, email, name, gender, height_cm, weight_kg, age, bmi, exercise_level, health_conditions, health_goals, onboarding_complete`,
            [name, gender, height_cm, weight_kg, age, bmi, exercise_level, health_conditions, health_goals, req.user.id]
        );

        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('Update profile error:', error.message);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

module.exports = router;
