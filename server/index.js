import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Allowed civic categories matching client engine
const ALLOWED_CATEGORIES = [
  'Roads',
  'Waste Management',
  'Public Safety',
  'Accessibility',
  'Environment',
  'Public Services',
  'Other',
];

// Security & Request size limits (strict 50 KB limit)
app.use(cors());
app.use(express.json({ limit: '50kb' }));

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(
    process.env.GEMINI_API_KEY &&
      !process.env.GEMINI_API_KEY.includes('YOUR_') &&
      process.env.GEMINI_API_KEY.trim().length > 10
  );

  res.json({
    status: 'ok',
    aiConfigured: hasKey,
    model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
  });
});

/**
 * AI Issue Interpretation Endpoint
 * Analyzes report title and description using structured output.
 */
app.post('/api/ai/interpret-issue', async (req, res) => {
  try {
    const { title, description, category, location } = req.body || {};

    // 1. Strict input validation
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Validation error: Issue title must be at least 3 characters long.',
      });
    }

    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Validation error: Issue description must be at least 10 characters long.',
      });
    }

    // 2. Check server environment API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('YOUR_') || apiKey.trim().length < 10) {
      return res.status(503).json({
        success: false,
        unconfigured: true,
        error:
          'AI Issue Intelligence is unconfigured on the server. To enable, configure GEMINI_API_KEY in the server environment (.env).',
      });
    }

    // 3. Initialize Google Gen AI client
    const ai = new GoogleGenAI({ apiKey });
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

    const promptText = `
Analyze this community civic report:
Title: "${title.trim()}"
Location provided: "${(location || 'Unspecified').trim()}"
User Selected Category: "${(category || 'Unspecified').trim()}"
Description:
"${description.trim()}"

Identify observable physical hazards, suggest the most accurate category, assess deterioration urgency, highlight missing municipal details, and recommend a next step for public workers. Do not invent facts or claims not supported by the description.
`.trim();

    // 4. Invoke model with structured schema
    const generateOptions = {
      contents: promptText,
      config: {
        systemInstruction:
          'You are a civic issue triage assistant. Analyze neighborhood community problems factually. Do not hallucinate or invent location details. Do not claim to physically verify real hazards. Do not assign numerical priority scores. Return only structured JSON containing: categorySuggestion (one of Roads, Waste Management, Public Safety, Accessibility, Environment, Public Services, Other), hazardIndicators (array of short strings), urgencySuggestion (one of routine, progressive, immediate), missingInformation (array of strings specifying details needed by field crews), and recommendedNextStep (string).',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categorySuggestion: {
              type: Type.STRING,
              description: 'The most applicable infrastructure category.',
            },
            hazardIndicators: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Observed public hazards or physical risks mentioned.',
            },
            urgencySuggestion: {
              type: Type.STRING,
              description: 'Suggested deterioration urgency: routine, progressive, or immediate.',
            },
            missingInformation: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Information field crews would need that is missing from the report.',
            },
            recommendedNextStep: {
              type: Type.STRING,
              description: 'Advisory operational recommendation for municipal review.',
            },
          },
          required: [
            'categorySuggestion',
            'hazardIndicators',
            'urgencySuggestion',
            'missingInformation',
            'recommendedNextStep',
          ],
        },
      },
    };

    let response;
    try {
      response = await ai.models.generateContent({
        model: primaryModel,
        ...generateOptions,
      });
    } catch (primaryErr) {
      if (primaryModel === 'gemini-3-flash-preview') {
        console.warn(
          'Primary model gemini-3-flash-preview failed, attempting fallback to gemini-3.8-flash:',
          primaryErr.message
        );
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          ...generateOptions,
        });
      } else {
        throw primaryErr;
      }
    }

    const rawText = response.text;
    if (!rawText) {
      return res.status(502).json({
        success: false,
        error: 'Received empty response from Gemini model.',
      });
    }

    // 5. Parse and validate returned JSON
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return res.status(502).json({
        success: false,
        error: 'Failed to parse structured model response as valid JSON.',
      });
    }

    // Sanitize category suggestion
    let categorySuggestion = parsed.categorySuggestion || 'Other';
    if (!ALLOWED_CATEGORIES.includes(categorySuggestion)) {
      categorySuggestion = 'Other';
    }

    const interpretation = {
      categorySuggestion,
      hazardIndicators: Array.isArray(parsed.hazardIndicators) ? parsed.hazardIndicators : [],
      urgencySuggestion: ['routine', 'progressive', 'immediate'].includes(parsed.urgencySuggestion)
        ? parsed.urgencySuggestion
        : 'progressive',
      missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : [],
      recommendedNextStep:
        typeof parsed.recommendedNextStep === 'string'
          ? parsed.recommendedNextStep
          : 'Schedule routine municipal field inspection.',
    };

    return res.json({
      success: true,
      interpretation,
    });
  } catch (err) {
    console.error('Gemini interpretation error:', err?.message || err);

    // Differentiate rate limits, timeouts, and auth errors
    const status = err?.status || err?.code || 500;
    const msg = err?.message || '';

    if (status === 429 || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({
        success: false,
        error: 'Gemini API rate limit or quota exceeded. Please try again in a few moments.',
      });
    }

    if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
      return res.status(503).json({
        success: false,
        error: 'Invalid Gemini API key configured on server. Please verify your GEMINI_API_KEY in .env.',
      });
    }

    return res.status(502).json({
      success: false,
      error: 'An error occurred while contacting the Gemini interpretation service.',
    });
  }
});

// Start Express listener
app.listen(PORT, () => {
  console.log(`CivicSignal backend listening on port ${PORT}`);
});
