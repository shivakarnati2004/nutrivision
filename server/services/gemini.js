const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = 'gemini-2.5-flash';

const NUTRITION_PROMPT = `You are an expert nutritionist AI. Analyze the given food and provide DETAILED nutrition data.

Respond with a JSON object with this structure:
{
  "food_name": "Name of the food item(s)",
  "serving_size": "e.g., 1 medium (182g)",
  "calories": number,
  "macronutrients": {
    "protein": { "amount": number, "unit": "g", "daily_value_percent": number },
    "carbohydrates": { "amount": number, "unit": "g", "daily_value_percent": number },
    "total_fat": { "amount": number, "unit": "g", "daily_value_percent": number },
    "saturated_fat": { "amount": number, "unit": "g", "daily_value_percent": number },
    "trans_fat": { "amount": number, "unit": "g" },
    "fiber": { "amount": number, "unit": "g", "daily_value_percent": number },
    "sugar": { "amount": number, "unit": "g" },
    "cholesterol": { "amount": number, "unit": "mg", "daily_value_percent": number },
    "sodium": { "amount": number, "unit": "mg", "daily_value_percent": number }
  },
  "vitamins": [
    { "name": "Vitamin A", "amount": number, "unit": "mcg", "daily_value_percent": number },
    { "name": "Vitamin C", "amount": number, "unit": "mg", "daily_value_percent": number },
    { "name": "Vitamin D", "amount": number, "unit": "mcg", "daily_value_percent": number },
    { "name": "Vitamin E", "amount": number, "unit": "mg", "daily_value_percent": number },
    { "name": "Vitamin K", "amount": number, "unit": "mcg", "daily_value_percent": number },
    { "name": "Vitamin B6", "amount": number, "unit": "mg", "daily_value_percent": number },
    { "name": "Vitamin B12", "amount": number, "unit": "mcg", "daily_value_percent": number },
    { "name": "Folate", "amount": number, "unit": "mcg", "daily_value_percent": number }
  ],
  "minerals": [
    { "name": "Calcium", "amount": number, "unit": "mg", "daily_value_percent": number },
    { "name": "Iron", "amount": number, "unit": "mg", "daily_value_percent": number },
    { "name": "Potassium", "amount": number, "unit": "mg", "daily_value_percent": number },
    { "name": "Magnesium", "amount": number, "unit": "mg", "daily_value_percent": number },
    { "name": "Zinc", "amount": number, "unit": "mg", "daily_value_percent": number },
    { "name": "Phosphorus", "amount": number, "unit": "mg", "daily_value_percent": number }
  ],
  "health_score": number (1-100),
  "health_notes": ["string"],
  "allergens": ["string"],
  "diet_tags": ["string"]
}

health_score should be 1-100 based on overall nutritional value.
Be accurate with real nutritional data. Fill in ALL fields with realistic values.`;

/**
 * Extract text parts only (skip thinking parts) from Gemini response
 */
function getResponseText(response) {
    try {
        // Try response.text() first
        return response.text();
    } catch (e) {
        // If text() fails, manually extract from candidates
        try {
            const parts = response.candidates[0].content.parts;
            const textParts = parts
                .filter(p => p.text && !p.thought)
                .map(p => p.text)
                .join('');
            return textParts;
        } catch (e2) {
            throw new Error('Could not extract text from Gemini response');
        }
    }
}

/**
 * Extract JSON object from text that may contain extra content
 */
function extractJSON(text) {
    // 1. Try to extract from markdown code block
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (codeBlockMatch) {
        try { return JSON.parse(codeBlockMatch[1].trim()); } catch (e) { /* continue */ }
    }

    // 2. Find the outermost JSON object using brace matching
    const firstBrace = text.indexOf('{');
    if (firstBrace !== -1) {
        let depth = 0;
        let inString = false;
        let escape = false;
        for (let i = firstBrace; i < text.length; i++) {
            const ch = text[i];
            if (escape) { escape = false; continue; }
            if (ch === '\\') { escape = true; continue; }
            if (ch === '"') { inString = !inString; continue; }
            if (inString) continue;
            if (ch === '{') depth++;
            if (ch === '}') {
                depth--; if (depth === 0) {
                    const jsonStr = text.substring(firstBrace, i + 1);
                    try { return JSON.parse(jsonStr); } catch (e) { break; }
                }
            }
        }
    }

    // 3. Plain parse
    try { return JSON.parse(text.trim()); } catch (e) { /* continue */ }

    throw new Error('Could not parse nutrition data from API response');
}

const analyzeImage = async (imageBuffer, mimeType, retries = 2) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const model = genAI.getGenerativeModel({
                model: MODEL_NAME,
                generationConfig: {
                    responseMimeType: 'application/json',
                },
            });

            const imagePart = {
                inlineData: {
                    data: imageBuffer.toString('base64'),
                    mimeType: mimeType,
                },
            };

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [
                    { text: NUTRITION_PROMPT + '\n\nAnalyze the food in this image and return the JSON:' },
                    imagePart,
                ]}],
            });

            const text = getResponseText(result.response);
            console.log('Gemini image response length:', text.length);

            return extractJSON(text);
        } catch (error) {
            console.error(`Gemini image analysis error (attempt ${attempt + 1}/${retries + 1}):`, error.message);
            if (attempt < retries && (error.message.includes('fetch failed') || error.message.includes('ECONNRESET') || error.message.includes('timeout'))) {
                console.log(`Retrying in ${(attempt + 1) * 2} seconds...`);
                await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
                continue;
            }
            throw new Error('Failed to analyze image: ' + error.message);
        }
    }
};

const analyzeText = async (foodDescription) => {
    try {
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: {
                responseMimeType: 'application/json',
            },
        });

        const result = await model.generateContent([
            NUTRITION_PROMPT + `\n\nAnalyze this food: "${foodDescription}"`,
        ]);

        const text = getResponseText(result.response);
        console.log('Gemini text response length:', text.length);

        return extractJSON(text);
    } catch (error) {
        console.error('Gemini text analysis error:', error.message);
        throw new Error('Failed to analyze food: ' + error.message);
    }
};

module.exports = { analyzeImage, analyzeText };
