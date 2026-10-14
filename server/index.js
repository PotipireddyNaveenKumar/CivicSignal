import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Disable Express fingerprinting
app.disable('x-powered-by');

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

// Security & Header Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Security & Request size limits (strict 50 KB limit)
app.use(cors());
app.use(express.json({ limit: '50kb' }));

/**
 * Lightweight in-memory rate limiter for AI interpretation endpoint.
 * Bounded to 20 requests per IP per minute.
 */
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;

// Cleanup stale IPs periodically to prevent memory bloat
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 30 * 1000).unref();

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'client';
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      success: false,
      error: `Rate limit exceeded: Maximum ${MAX_REQUESTS_PER_WINDOW} requests per minute. Retry in ${retryAfter}s.`,
    });
  }

  record.count += 1;
  next();
}

/**
 * Executes a promise with an enforced timeout.
 */
function withTimeout(promise, ms = 15000) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error('AI interpretation service timed out after 15 seconds.');
      err.status = 504;
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

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
    region: 'Andhra Pradesh Operations Center',
  });
});

/**
 * AI Issue Interpretation Endpoint
 * Analyzes report title and description using structured output.
 */
app.post('/api/ai/interpret-issue', rateLimiter, async (req, res) => {
  try {
    const { title, description, category, location } = req.body || {};

    // 1. Strict input validation & size limits
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Validation error: Issue title must be at least 3 characters long.',
      });
    }

    if (title.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Validation error: Issue title cannot exceed 200 characters.',
      });
    }

    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Validation error: Issue description must be at least 10 characters long.',
      });
    }

    if (description.length > 3000) {
      return res.status(400).json({
        success: false,
        error: 'Validation error: Issue description cannot exceed 3000 characters.',
      });
    }

    if (location && typeof location === 'string' && location.length > 250) {
      return res.status(400).json({
        success: false,
        error: 'Validation error: Location description cannot exceed 250 characters.',
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

    // 4. Invoke model with structured schema and timeout
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
      response = await withTimeout(
        ai.models.generateContent({
          model: primaryModel,
          ...generateOptions,
        }),
        15000
      );
    } catch (primaryErr) {
      if (primaryModel === 'gemini-3-flash-preview' && primaryErr.status !== 504) {
        console.warn(
          'Primary model gemini-3-flash-preview failed, attempting fallback to gemini-3.8-flash:',
          primaryErr.message
        );
        response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            ...generateOptions,
          }),
          15000
        );
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

    // Sanitize category suggestion against whitelist
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

    if (err?.status === 504 || err?.name === 'TimeoutError') {
      return res.status(504).json({
        success: false,
        error: 'AI interpretation service timed out after 15 seconds. Manual submission remains available.',
      });
    }

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

// Disallow non-POST methods on AI endpoint
app.all('/api/ai/interpret-issue', (req, res) => {
  res.status(405).json({
    success: false,
    error: `Method ${req.method} not allowed on this endpoint. Use POST.`,
  });
});

// Start Express listener
app.listen(PORT, () => {
  console.log(`CivicSignal backend listening on port ${PORT}`);
});
