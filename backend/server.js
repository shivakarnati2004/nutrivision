const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDB, getPool, isDBAvailable } = require('./config/db');
const analyzeRoutes = require('./routes/analyzeRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Prevent process from crashing on unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️  Unhandled Rejection:', reason);
});

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            return callback(null, true);
        }
        return callback(null, true); // Allow all in production for now
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'NutriVision API is running 🥗',
        database: isDBAvailable() ? 'connected' : 'unavailable'
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/chat', chatRoutes);

// Legacy history endpoint (redirects to analyze/history)
app.get('/api/history', async (req, res) => {
    if (!isDBAvailable()) {
        return res.json({ success: true, data: [] });
    }
    try {
        const pool = getPool();
        const result = await pool.query(
            'SELECT * FROM nutrition_analyses ORDER BY created_at DESC LIMIT 20'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.json({ success: true, data: [] });
    }
});

// Serve static files from client build in production
if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '..', 'frontend', 'dist');
    app.use(express.static(clientBuildPath));

    // SPA fallback — serve index.html for any non-API route
    app.use((req, res, next) => {
        if (!req.path.startsWith('/api') && req.method === 'GET') {
            res.sendFile(path.join(clientBuildPath, 'index.html'));
        } else {
            next();
        }
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.message);
    if (err.message && err.message.includes('Only JPEG')) {
        return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🥗 NutriVision API running on port ${PORT}`);
    console.log(`📊 Health check: /api/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

    initDB().catch((err) => {
        console.log('⚠️  DB init failed:', err.message);
    });
});
