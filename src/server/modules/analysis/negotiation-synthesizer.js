import { generateJSON } from '../../lib/gemini.js';

const PROMPT = `You are synthesizing the analysis of a single clause from a {{DOCUMENT_TYPE}} agreement.

RISK CLASSIFIER OUTPUT:
{{CLASSIFIER_OUTPUT}}

IMPLICATION AGENT OUTPUT:
{{IMPLICATION_OUTPUT}}

COMPARATOR AGENT OUTPUT:
{{COMPARATOR_OUTPUT}}

The signing party is: {{SIGNING_PARTY}}

STEP 1 — ARGUE ACCEPTABLE: Strongest argument this clause is reasonable.
STEP 2 — ARGUE DANGEROUS: Strongest argument this clause harms the signing party.
STEP 3 — SYNTHESIZE: Final verdict and negotiation priority.

Respond with strictly valid JSON only (no markdown fences, no schema placeholders).

Enums (use exact strings):
- negotiationPriority: Accept | Flag for review | Negotiate | Walk away
- redlineSuggestion.action: none | add_language | replace_phrase | remove_clause | request_carve_out

Example shape:
{
  "acceptableArgument": "...",
  "dangerousArgument": "...",
  "finalVerdict": "...",
  "negotiationPriority": "Negotiate",
  "redlineSuggestion": {
    "action": "replace_phrase",
    "originalPhrase": "...",
    "suggestedReplacement": "...",
    "rationale": "..."
  }
}`;

export async function synthesizeNegotiation({
  clause,
  documentType,
  signingParty,
  classifierOutput,
  implicationOutput,
  comparatorOutput,
}) {
  const prompt = PROMPT.replace('{{DOCUMENT_TYPE}}', documentType)
    .replace('{{SIGNING_PARTY}}', signingParty)
    .replace('{{CLASSIFIER_OUTPUT}}', JSON.stringify(classifierOutput, null, 2))
    .replace('{{IMPLICATION_OUTPUT}}', JSON.stringify(implicationOutput, null, 2))
    .replace('{{COMPARATOR_OUTPUT}}', JSON.stringify(comparatorOutput, null, 2));

  const modelTier = process.env.GEMINI_ORCHESTRATOR_TIER === 'pro' ? 'pro' : 'fast';

  return generateJSON(prompt, {
    modelTier,
    maxOutputTokens: 3072,
  });
}
