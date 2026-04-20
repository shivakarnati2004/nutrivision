const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model cascade — ordered by preference. If one is overloaded, try the next.
const MODEL_CASCADE = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
];

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1500;

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
 * Check if an error is transient (worth retrying).
 */
function isTransientError(error) {
    const msg = error.message || '';
    return (
        msg.includes('503') ||
        msg.includes('429') ||
        msg.includes('Service Unavailable') ||
        msg.includes('high demand') ||
        msg.includes('overloaded') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('fetch failed') ||
        msg.includes('ECONNRESET') ||
        msg.includes('timeout') ||
        msg.includes('ETIMEDOUT') ||
        msg.includes('network') ||
        msg.includes('socket hang up')
    );
}

/**
 * Check if the error indicates the model itself is overloaded (should switch model).
 */
function isModelOverloaded(error) {
    const msg = error.message || '';
    return (
        msg.includes('503') ||
        msg.includes('Service Unavailable') ||
        msg.includes('high demand') ||
        msg.includes('overloaded') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('429')
    );
}

/**
 * Extract text parts only (skip thinking parts) from Gemini response.
 */
function getResponseText(response) {
    try {
        return response.text();
    } catch (e) {
        try {
            const parts = response.candidates[0].content.parts;
            return parts
                .filter(p => p.text && !p.thought)
                .map(p => p.text)
                .join('');
        } catch (e2) {
            throw new Error('Could not extract text from Gemini response');
        }
    }
}

/**
 * Extract JSON object from text that may contain extra content.
 */
function extractJSON(text) {
    // 1. Try markdown code block extraction
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
                depth--;
                if (depth === 0) {
                    try { return JSON.parse(text.substring(firstBrace, i + 1)); } catch (e) { break; }
                }
            }
        }
    }

    // 3. Plain parse
    try { return JSON.parse(text.trim()); } catch (e) { /* continue */ }

    throw new Error('Could not parse nutrition data from API response');
}

/**
 * Sleep for a given number of milliseconds.
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute a Gemini API call with model cascade and retry logic.
 * Tries each model in the cascade with retries before moving to the next.
 *
 * @param {Function} callFn - (modelName) => Promise<result> - The API call to execute
 * @param {string} label - Label for logging (e.g. "image", "text", "chat")
 * @returns {Promise<*>} The parsed result
 */
async function executeWithCascade(callFn, label) {
    const errors = [];

    for (let modelIdx = 0; modelIdx < MODEL_CASCADE.length; modelIdx++) {
        const modelName = MODEL_CASCADE[modelIdx];

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                return await callFn(modelName);
            } catch (error) {
                const tag = `[${label}] ${modelName} attempt ${attempt + 1}/${MAX_RETRIES + 1}`;
                console.error(`${tag}: ${error.message}`);
                errors.push(`${modelName}: ${error.message}`);

                // If the model is overloaded, skip remaining retries and move to next model
                if (isModelOverloaded(error)) {
                    console.log(`⚠️  ${modelName} overloaded — switching to next model`);
                    break;
                }

                // For other transient errors, retry with exponential backoff
                if (isTransientError(error) && attempt < MAX_RETRIES) {
                    const delay = BASE_DELAY_MS * Math.pow(2, attempt);
                    console.log(`⏳ Retrying in ${delay}ms...`);
                    await sleep(delay);
                    continue;
                }

                // Non-transient error — don't retry, don't cascade
                if (!isTransientError(error)) {
                    throw new Error(`Analysis failed: ${error.message}`);
                }
            }
        }
    }

    // All models exhausted
    throw new Error(
        'All AI models are currently busy. Please try again in a few seconds. ' +
        `(Tried: ${MODEL_CASCADE.join(', ')})`
    );
}

/**
 * Analyze a food image and return structured nutrition data.
 */
const analyzeImage = async (imageBuffer, mimeType) => {
    return executeWithCascade(async (modelName) => {
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: 'application/json' },
        });

        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [
                    { text: NUTRITION_PROMPT + '\n\nAnalyze the food in this image and return the JSON:' },
                    { inlineData: { data: imageBuffer.toString('base64'), mimeType } },
                ],
            }],
        });

        const text = getResponseText(result.response);
        console.log(`✅ Image analysis OK (${modelName}), response length: ${text.length}`);
        return extractJSON(text);
    }, 'image');
};

/**
 * Analyze a text food description and return structured nutrition data.
 */
const analyzeText = async (foodDescription) => {
    return executeWithCascade(async (modelName) => {
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: 'application/json' },
        });

        const result = await model.generateContent([
            NUTRITION_PROMPT + `\n\nAnalyze this food: "${foodDescription}"`,
        ]);

        const text = getResponseText(result.response);
        console.log(`✅ Text analysis OK (${modelName}), response length: ${text.length}`);
        return extractJSON(text);
    }, 'text');
};

/**
 * Send a chat message with model cascade support.
 */
const chatWithCoach = async (systemPrompt, chatHistory, message) => {
    return executeWithCascade(async (modelName) => {
        const model = genAI.getGenerativeModel({ model: modelName });

        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessage(message);
        const text = result.response.text();
        console.log(`✅ Chat OK (${modelName}), response length: ${text.length}`);
        return text;
    }, 'chat');
};

module.exports = { analyzeImage, analyzeText, chatWithCoach };
