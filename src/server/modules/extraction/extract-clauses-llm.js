import { generateJSON, truncateForPrompt } from '../../lib/gemini.js';
import { loadSchema } from './schemas/index.js';

const PROMPT = `You are a legal clause segmenter. Extract clause text from a {{DOCUMENT_TYPE}} agreement.

Return strictly valid JSON only (no markdown):
{
  "clauses": [
    {
      "category": "exact_category_id",
      "text": "full clause text verbatim from document",
      "confidence": 0.0
    }
  ]
}

Use ONLY these category ids (include every clause you can find):
{{CATEGORY_LIST}}

Rules:
- Copy clause text from the document; do not invent text.
- One entry per category maximum.
- confidence 0.5-1.0 based on how clearly the section matches the category.
- If a category is not present, omit it.

Document:
{{DOCUMENT_TEXT}}`;

export async function extractClausesWithLlm(rawText, documentType, options = {}) {
  const schema = loadSchema(documentType);
  const categories = schema.requiredCategories;
  const categoryList = categories.join(', ');

  const prompt = PROMPT.replace('{{DOCUMENT_TYPE}}', documentType)
    .replace('{{CATEGORY_LIST}}', categoryList)
    .replace('{{DOCUMENT_TEXT}}', truncateForPrompt(rawText, 14000));

  const result = await generateJSON(prompt, {
    modelTier: 'fast',
    maxOutputTokens: 8192,
    onThrottle: options.onThrottle,
  });

  const clauses = Array.isArray(result?.clauses) ? result.clauses : [];
  const allowed = new Set(categories);

  return clauses
    .filter((c) => c?.category && allowed.has(c.category) && String(c.text || '').trim().length > 40)
    .map((c) => ({
      category: c.category,
      text: String(c.text).trim(),
      startIndex: 0,
      endIndex: 0,
      confidence: Math.min(1, Math.max(0.5, Number(c.confidence) || 0.75)),
      extractionMethod: 'llm',
    }));
}

export function shouldUseLlmExtraction(heuristicExtracted, heuristicMissing, documentType) {
  if (process.env.LEXGUARD_LLM_EXTRACT === 'false') return false;

  const schema = loadSchema(documentType);
  const required = schema.requiredCategories.length;
  const found = heuristicExtracted.length;
  const missingRisk = heuristicMissing.length;

  if (required === 0) return false;
  if (found / required < 0.55) return true;
  if (missingRisk >= 2) return true;
  if (process.env.LEXGUARD_LLM_EXTRACT === 'always') return true;

  return false;
}
