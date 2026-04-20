const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { getPool, isDBAvailable } = require('../config/db');
const { chatWithCoach } = require('../services/gemini');
require('dotenv').config();

const router = express.Router();

const COACH_SYSTEM_PROMPT = `You are Raju Danger 🙂123 — a friendly, knowledgeable, and energetic AI health and nutrition assistant. You help users with:

- Nutrition advice and meal planning
- Exercise recommendations
- Weight management guidance
- Understanding food labels and nutrition data
- Healthy habit formation
- Answering health and wellness questions
- Providing motivation and support

Guidelines:
- Be warm, encouraging, energetic, and professional
- Give specific, actionable advice
- Use emojis occasionally to keep things friendly
- If the user shares their profile (age, weight, height, BMI, exercise level), personalize your advice
- Always remind users to consult a healthcare professional for medical advice
- Keep responses concise but helpful (2-3 paragraphs max)
- If asked about non-health topics, politely redirect to health/nutrition topics`;

// POST /api/chat - Chat with AI coach
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get user profile for personalized context
        let userContext = '';
        if (isDBAvailable()) {
            try {
                const pool = getPool();
                const userResult = await pool.query(
                    'SELECT name, gender, age, height_cm, weight_kg, bmi, exercise_level, health_conditions, health_goals FROM users WHERE id = $1',
                    [req.user.id]
                );
                if (userResult.rows.length > 0) {
                    const u = userResult.rows[0];
                    userContext = `\n\nUser Profile: Name: ${u.name || 'Unknown'}, Gender: ${u.gender || 'Unknown'}, Age: ${u.age || 'Unknown'}, Height: ${u.height_cm || 'Unknown'}cm, Weight: ${u.weight_kg || 'Unknown'}kg, BMI: ${u.bmi || 'Unknown'}, Exercise Level: ${u.exercise_level || 'Unknown'}, Health Conditions: ${u.health_conditions || 'None'}, Health Goals: ${u.health_goals || 'None'}`;
                }
            } catch (e) {
                // Continue without user context
            }
        }

        // Build chat history for Gemini
        const chatHistory = [
            {
                role: 'user',
                parts: [{ text: COACH_SYSTEM_PROMPT + userContext + '\n\nPlease acknowledge you understand your role.' }],
            },
            {
                role: 'model',
                parts: [{ text: 'I understand! I\'m Raju Danger 🙂123, your personal health and nutrition assistant. I\'m here to help you stay energetic, eat well, and achieve your fitness goals! 💪 How can I help you today?' }],
            },
            ...history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            })),
        ];

        // Use the centralized cascade function from gemini.js
        const responseText = await chatWithCoach(
            COACH_SYSTEM_PROMPT + userContext,
            chatHistory,
            message
        );

        res.json({
            success: true,
            message: responseText,
        });
    } catch (error) {
        console.error('Chat error:', error.message);

        // Return user-friendly error
        const isOverloaded = error.message.includes('busy') || error.message.includes('503') || error.message.includes('overloaded');
        const statusCode = isOverloaded ? 503 : 500;
        const userMessage = isOverloaded
            ? 'AI is temporarily busy. Please try again in a few seconds.'
            : 'Failed to get response. Please try again.';

        res.status(statusCode).json({ error: userMessage });
    }
});

module.exports = router;
