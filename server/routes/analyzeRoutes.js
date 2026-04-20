const express = require('express');
const multer = require('multer');
const { analyzeImage, analyzeText } = require('../services/gemini');
const { getPool, isDBAvailable } = require('../config/db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for image upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'), false);
        }
    },
});

// POST /api/analyze/image — Analyze food from uploaded image (no auth required)
router.post('/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const nutritionData = await analyzeImage(req.file.buffer, req.file.mimetype);

        res.json({
            success: true,
            data: nutritionData,
        });
    } catch (error) {
        console.error('Image analysis error:', error);
        res.status(500).json({ error: error.message || 'Failed to analyze image' });
    }
});

// POST /api/analyze/text — Analyze food from text description (no auth required)
router.post('/text', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: 'No text provided' });
        }

        const nutritionData = await analyzeText(text.trim());

        res.json({
            success: true,
            data: nutritionData,
        });
    } catch (error) {
        console.error('Text analysis error:', error);
        res.status(500).json({ error: error.message || 'Failed to analyze text' });
    }
});

// POST /api/analyze/speech — Same as text
router.post('/speech', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: 'No speech text provided' });
        }

        const nutritionData = await analyzeText(text.trim());

        res.json({
            success: true,
            data: nutritionData,
        });
    } catch (error) {
        console.error('Speech analysis error:', error);
        res.status(500).json({ error: error.message || 'Failed to analyze speech' });
    }
});

// POST /api/analyze/save — Save analysis to history (requires auth)
router.post('/save', authMiddleware, async (req, res) => {
    if (!isDBAvailable()) return res.status(503).json({ error: 'Database unavailable' });

    try {
        const { input_type, input_text, food_name, nutrition_data, food_weight_grams } = req.body;

        const pool = getPool();
        const result = await pool.query(
            `INSERT INTO nutrition_analyses (user_id, input_type, input_text, food_name, nutrition_data, food_weight_grams) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [req.user.id, input_type || 'text', input_text, food_name, JSON.stringify(nutrition_data), food_weight_grams || 100]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Save analysis error:', error.message);
        res.status(500).json({ error: 'Failed to save analysis' });
    }
});

// GET /api/analyze/history — Get user's history with optional period filter
router.get('/history', authMiddleware, async (req, res) => {
    if (!isDBAvailable()) return res.json({ success: true, data: [] });

    try {
        const pool = getPool();
        const { period } = req.query;

        let dateFilter = '';
        if (period === 'day') {
            dateFilter = "AND created_at >= NOW() - INTERVAL '1 day'";
        } else if (period === 'week') {
            dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
        } else if (period === 'month') {
            dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
        }

        const result = await pool.query(
            `SELECT * FROM nutrition_analyses WHERE user_id = $1 ${dateFilter} ORDER BY created_at DESC LIMIT 100`,
            [req.user.id]
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('History fetch error:', error.message);
        res.json({ success: true, data: [] });
    }
});

// GET /api/analyze/stats — Get aggregated nutrition stats (enhanced)
router.get('/stats', authMiddleware, async (req, res) => {
    if (!isDBAvailable()) return res.json({ success: true, data: null });

    try {
        const pool = getPool();
        const { period } = req.query;

        let dateFilter = '';
        if (period === 'day') {
            dateFilter = "AND created_at >= NOW() - INTERVAL '1 day'";
        } else if (period === 'week') {
            dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
        } else if (period === 'month') {
            dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
        }

        const result = await pool.query(
            `SELECT nutrition_data, food_name, food_weight_grams, created_at, input_type
             FROM nutrition_analyses 
             WHERE user_id = $1 ${dateFilter}
             ORDER BY created_at ASC`,
            [req.user.id]
        );

        let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0, totalFiber = 0;
        let totalSugar = 0, totalSodium = 0, totalSatFat = 0, totalCholesterol = 0;
        const dailyData = {};
        const mealList = [];

        result.rows.forEach(row => {
            const nd = typeof row.nutrition_data === 'string' ? JSON.parse(row.nutrition_data) : row.nutrition_data;
            if (!nd) return;

            const wr = (row.food_weight_grams || 100) / 100;
            const cal = (nd.calories || 0) * wr;
            const prot = (nd.macronutrients?.protein?.amount || 0) * wr;
            const carb = (nd.macronutrients?.carbohydrates?.amount || 0) * wr;
            const fat = (nd.macronutrients?.total_fat?.amount || 0) * wr;
            const fiber = (nd.macronutrients?.fiber?.amount || 0) * wr;
            const sugar = (nd.macronutrients?.sugar?.amount || 0) * wr;
            const sodium = (nd.macronutrients?.sodium?.amount || 0) * wr;
            const satFat = (nd.macronutrients?.saturated_fat?.amount || 0) * wr;
            const chol = (nd.macronutrients?.cholesterol?.amount || 0) * wr;

            totalCalories += cal;
            totalProtein += prot;
            totalCarbs += carb;
            totalFat += fat;
            totalFiber += fiber;
            totalSugar += sugar;
            totalSodium += sodium;
            totalSatFat += satFat;
            totalCholesterol += chol;

            // Group by date (or hour for 'day' view)
            let dateKey;
            const d = new Date(row.created_at);
            if (period === 'day') {
                dateKey = d.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true });
            } else {
                dateKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            if (!dailyData[dateKey]) {
                dailyData[dateKey] = { date: dateKey, calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, meals: 0 };
            }
            dailyData[dateKey].calories += cal;
            dailyData[dateKey].protein += prot;
            dailyData[dateKey].carbs += carb;
            dailyData[dateKey].fat += fat;
            dailyData[dateKey].fiber += fiber;
            dailyData[dateKey].meals += 1;

            // Per-meal list for bar chart
            mealList.push({
                name: row.food_name || nd.food_name || 'Food',
                calories: Math.round(cal),
                protein: Math.round(prot * 10) / 10,
                carbs: Math.round(carb * 10) / 10,
                fat: Math.round(fat * 10) / 10,
                weight: row.food_weight_grams || 100,
                type: row.input_type || 'text',
                time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            });
        });

        // Round all daily data values
        Object.values(dailyData).forEach(d => {
            d.calories = Math.round(d.calories);
            d.protein = Math.round(d.protein * 10) / 10;
            d.carbs = Math.round(d.carbs * 10) / 10;
            d.fat = Math.round(d.fat * 10) / 10;
            d.fiber = Math.round(d.fiber * 10) / 10;
        });

        res.json({
            success: true,
            data: {
                totalEntries: result.rows.length,
                totalCalories: Math.round(totalCalories),
                totalProtein: Math.round(totalProtein * 10) / 10,
                totalCarbs: Math.round(totalCarbs * 10) / 10,
                totalFat: Math.round(totalFat * 10) / 10,
                totalFiber: Math.round(totalFiber * 10) / 10,
                totalSugar: Math.round(totalSugar * 10) / 10,
                totalSodium: Math.round(totalSodium * 10) / 10,
                totalSatFat: Math.round(totalSatFat * 10) / 10,
                totalCholesterol: Math.round(totalCholesterol * 10) / 10,
                dailyData: Object.values(dailyData),
                mealList,
            }
        });
    } catch (error) {
        console.error('Stats error:', error.message);
        res.json({ success: true, data: null });
    }
});

// DELETE /api/analyze/history/:id — Delete a history item
router.delete('/history/:id', authMiddleware, async (req, res) => {
    if (!isDBAvailable()) return res.status(503).json({ error: 'Database unavailable' });

    try {
        const pool = getPool();
        await pool.query(
            'DELETE FROM nutrition_analyses WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        res.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        console.error('Delete history error:', error.message);
        res.status(500).json({ error: 'Failed to delete' });
    }
});

module.exports = router;
