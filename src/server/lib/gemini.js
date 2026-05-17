import { VertexAI } from '@google-cloud/vertexai';
import dotenv from 'dotenv';
import { runVertexTask, extendVertexCooldown } from './vertex-queue.js';

dotenv.config();

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.VERTEX_AI_LOCATION || 'us-central1';
const MODEL_PRO = process.env.GEMINI_MODEL || 'gemini-2.5-pro';
const MODEL_FAST = process.env.GEMINI_FAST_MODEL || 'gemini-2.5-flash';
const MAX_RETRIES = Number(process.env.GEMINI_MAX_RETRIES) || 6;

let vertexAI = null;
const modelCache = new Map();

function normalizeError(err, fallback = 'Vertex AI request failed') {
  if (err instanceof Error && err.message) return err;
  if (err instanceof Error) return new Error(fallback);
  const message = err?.message ?? (err != null ? String(err) : fallback);
  return new Error(message || fallback);
}

function getVertexAI() {
  if (!PROJECT || process.env.LEXGUARD_DEMO_MODE === 'true') return null;
  if (!vertexAI) {
    vertexAI = new VertexAI({ project: PROJECT, location: LOCATION });
  }
  return vertexAI;
}

function getModel(tier = 'pro') {
  const vertex = getVertexAI();
  if (!vertex) return null;

  const modelId = tier === 'fast' ? MODEL_FAST : MODEL_PRO;
  if (!modelCache.has(modelId)) {
    modelCache.set(modelId, vertex.getGenerativeModel({ model: modelId }));
  }
  return modelCache.get(modelId);
}

function isRateLimitError(err) {
  const msg = String(err?.message || err);
  return (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('Too Many Requests') ||
    msg.includes('Resource exhausted')
  );
}

function isRetryableError(err) {
  const msg = String(err?.message || err);
  return (
    isRateLimitError(err) ||
    msg.includes('Empty response') ||
    msg.includes('MAX_TOKENS') ||
    msg.includes('Unexpected token') ||
    msg.includes('JSON')
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractResponseText(result) {
  const response = result?.response;
  const candidate = response?.candidates?.[0];

  if (!candidate) {
    return {
      text: '',
      meta: {
        finishReason: 'NO_CANDIDATES',
        blockReason: response?.promptFeedback?.blockReason,
      },
    };
  }

  const parts = candidate.content?.parts || [];
  const text = parts
    .map((p) => p.text || '')
    .join('')
    .trim();

  return {
    text,
    meta: {
      finishReason: candidate.finishReason,
      blockReason: response?.promptFeedback?.blockReason,
    },
  };
}

function stripCodeFences(text) {
  return String(text)
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

function extractJsonObject(text) {
  const start = text.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function repairJson(text) {
  return text
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/\b(undefined)\b/g, 'null');
}

function isJsonParseError(err) {
  return err instanceof SyntaxError || /JSON|Unexpected token|property name/i.test(String(err?.message));
}

export function parseAgentOutput(raw) {
  const clean = stripCodeFences(raw);
  const candidates = [clean, extractJsonObject(clean)].filter(Boolean);

  let lastError;
  for (const candidate of [...new Set(candidates)]) {
    const repaired = repairJson(candidate);
    try {
      return JSON.parse(repaired);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new SyntaxError(`Invalid JSON from model: ${clean.slice(0, 160)}`);
}

async function callModel(request, tier) {
  const model = getModel(tier);
  if (!model) {
    throw new Error('Vertex AI is not configured. Set GOOGLE_CLOUD_PROJECT and credentials.');
  }

  return runVertexTask(async () => {
    try {
      const result = await model.generateContent(request);
      const { text, meta } = extractResponseText(result);

      if (!text) {
        throw new Error(`Empty response from Gemini (${JSON.stringify(meta)})`);
      }

      return { text, meta };
    } catch (err) {
      throw normalizeError(err);
    }
  });
}

async function generateWithRetry(request, tier, options = {}) {
  let lastError;
  const useFallback = isDemoMode() && options.demoFallback;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callModel(request, tier);
    } catch (err) {
      lastError = normalizeError(err);
      if (!isRetryableError(lastError) || attempt === MAX_RETRIES) {
        break;
      }
      const delayMs = isRateLimitError(lastError)
        ? Math.min(45_000, 4000 * 2 ** attempt)
        : Math.min(15_000, 1500 * 2 ** attempt);
      if (isRateLimitError(lastError)) {
        extendVertexCooldown(delayMs);
        options.onThrottle?.({
          message: 'Vertex AI rate limit — waiting before retry',
          retryInMs: delayMs,
          attempt: attempt + 1,
          maxRetries: MAX_RETRIES,
        });
      }
      console.warn(
        `[Vertex] ${lastError.message.slice(0, 100)} (attempt ${attempt + 1}/${MAX_RETRIES}), wait ${delayMs}ms`
      );
      await sleep(delayMs);
    }
  }

  if (useFallback) {
    return { text: null, fallback: options.demoFallback() };
  }

  throw lastError ?? new Error('Vertex AI request failed after retries');
}

export async function generateJSON(prompt, options = {}) {
  const tier = options.modelTier || 'fast';
  if (!getModel(tier)) {
    if (isDemoMode() && options.demoFallback) return options.demoFallback();
    throw new Error('Vertex AI not configured. Set GOOGLE_CLOUD_PROJECT and credentials.');
  }

  const request = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options.temperature ?? 0.2,
      maxOutputTokens: options.maxOutputTokens ?? 4096,
      responseMimeType: 'application/json',
    },
  };

  const parseRetries = Math.max(0, Number(process.env.GEMINI_JSON_PARSE_RETRIES) || 1);
  let lastError = new Error('Failed to parse JSON from Vertex AI');

  for (let parseAttempt = 0; parseAttempt <= parseRetries; parseAttempt += 1) {
    const outcome = await generateWithRetry(request, tier, options);

    if (outcome?.fallback !== undefined) {
      return outcome.fallback;
    }

    if (!outcome?.text) {
      lastError = new Error('Vertex AI returned no text');
      break;
    }

    try {
      return parseAgentOutput(outcome.text);
    } catch (err) {
      lastError = normalizeError(err, 'Invalid JSON from Vertex AI');
      if (!isJsonParseError(lastError) || parseAttempt === parseRetries) {
        break;
      }
      console.warn(
        `[Vertex] JSON parse failed (attempt ${parseAttempt + 1}/${parseRetries + 1}), retrying model call...`
      );
      await sleep(1500);
    }
  }

  throw lastError;
}

export async function generateText(prompt, options = {}) {
  const tier = options.modelTier || 'fast';
  if (!getModel(tier)) {
    if (isDemoMode() && options.demoFallback) return options.demoFallback();
    throw new Error('Vertex AI not configured.');
  }

  const request = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options.temperature ?? 0.4,
      maxOutputTokens: options.maxOutputTokens ?? 8192,
    },
  };

  const outcome = await generateWithRetry(request, tier, options);
  if (outcome.fallback !== undefined) return outcome.fallback;
  return outcome.text;
}

export function isDemoMode() {
  return process.env.LEXGUARD_DEMO_MODE === 'true';
}

export function truncateForPrompt(text, max = 2400) {
  if (!text || text.length <= max) return text;
  return `${text.slice(0, max)}\n[...truncated for analysis]`;
}

const OCR_PROMPT = `Extract all readable text from this document (image or PDF page). Preserve paragraph breaks and section headings.
Return plain text only — no markdown, no commentary. If nothing is legible, return an empty string.`;

/**
 * Multimodal OCR via Gemini Flash (no Document AI required).
 */
export async function extractTextFromImage(buffer, mimeType = 'image/png') {
  const tier = 'fast';
  const model = getModel(tier);
  if (!model) {
    throw new Error('Vertex AI is not configured for image OCR.');
  }

  const base64 = Buffer.isBuffer(buffer) ? buffer.toString('base64') : Buffer.from(buffer).toString('base64');
  const request = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: OCR_PROMPT },
          { inlineData: { mimeType, data: base64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
    },
  };

  const outcome = await generateWithRetry(request, tier, {});
  return outcome.text?.trim() || '';
}
