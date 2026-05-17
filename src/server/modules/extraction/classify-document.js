import { generateJSON, isDemoMode, truncateForPrompt } from '../../lib/gemini.js';
import { demoClassifyDocument } from '../../lib/demo-mode.js';

const CLASSIFIER_PROMPT = `You are a legal document classifier. Given the first 2000 characters of a legal document, identify its type.

Respond with strictly valid JSON only. No preamble. No markdown fences.

Enums:
- documentType: employment | freelance | nda | saas_tos | privacy_policy | vendor | rental | insurance | loan | unknown
- signingParty: employee | freelancer | customer | vendor | tenant | borrower | user | unknown

Example:
{
  "documentType": "employment",
  "confidence": 0.92,
  "signingParty": "employee",
  "jurisdiction": "India"
}

Document excerpt:
{{DOCUMENT_EXCERPT}}`;

export async function classifyDocument(rawText, options = {}) {
  if (isDemoMode()) {
    return demoClassifyDocument(rawText);
  }

  const excerpt = truncateForPrompt(rawText.slice(0, 2000), 2000);
  const prompt = CLASSIFIER_PROMPT.replace('{{DOCUMENT_EXCERPT}}', excerpt);

  return generateJSON(prompt, {
    modelTier: 'fast',
    maxOutputTokens: 512,
    onThrottle: options.onThrottle,
  });
}
