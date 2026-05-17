import { generateJSON, isDemoMode, truncateForPrompt } from '../../lib/gemini.js';
import {
  heuristicCrossClause,
  mergeCrossClauseResults,
} from '../../../shared/cross-clause-heuristics.js';

const PROMPT = `You are a legal ambiguity and contradiction detector for a {{DOCUMENT_TYPE}} agreement, analyzing from the perspective of the {{SIGNING_PARTY}}.

Analyze the following extracted clauses for:

1. AMBIGUOUS LANGUAGE: Phrases that are vague, undefined, or open to interpretation (e.g., "reasonable", "may", "at sole discretion", "as determined by", "including but not limited to").

2. CONTRADICTIONS: Conflicts between clauses (e.g., one says 30 days notice, another says 60; confidentiality scope contradicting IP assignment scope).

3. MISSING DEFINITIONS: Key terms used but never defined (e.g., "Confidential Information" used without definition, "Cause" for termination undefined).

4. EXPLOITATIVE PATTERNS: Language that shifts all risk/liability to the signing party.

Clauses to analyze:
{{CLAUSES_TEXT}}

Respond with strictly valid JSON only (no markdown fences).

Schema:
{
  "ambiguities": [
    {
      "clause": "category name of the clause",
      "phrase": "exact phrase that is ambiguous",
      "issue": "why this is problematic",
      "severity": "Low" | "Medium" | "High"
    }
  ],
  "contradictions": [
    {
      "clause1": "first clause category",
      "clause2": "second clause category",
      "description": "what contradicts",
      "severity": "Medium" | "High" | "Critical"
    }
  ],
  "missingDefinitions": [
    {
      "term": "the undefined term",
      "usedIn": "clause category where it appears",
      "risk": "what could go wrong"
    }
  ],
  "exploitativePatterns": [
    {
      "clause": "clause category",
      "pattern": "description of the pattern",
      "severity": "Medium" | "High" | "Critical"
    }
  ]
}`;

export function isCrossClauseAiEnabled() {
  return process.env.LEXGUARD_CROSS_CLAUSE_AI !== 'false';
}

export async function analyzeCrossClause(clauses, documentType, signingParty) {
  const heuristic = heuristicCrossClause(clauses);

  if (isDemoMode() || !isCrossClauseAiEnabled() || !clauses.length) {
    return heuristic;
  }

  const clausesText = clauses
    .map((c) => `[${c.category}]\n${truncateForPrompt(c.text, 600)}`)
    .join('\n\n---\n\n');

  const prompt = PROMPT.replace('{{DOCUMENT_TYPE}}', documentType)
    .replace('{{SIGNING_PARTY}}', signingParty)
    .replace('{{CLAUSES_TEXT}}', clausesText);

  try {
    const ai = await generateJSON(prompt, {
      modelTier: 'fast',
      maxOutputTokens: 3072,
    });
    return mergeCrossClauseResults(heuristic, ai);
  } catch (err) {
    console.warn('[AmbiguityDetector] Vertex cross-clause analysis failed:', err.message);
    return heuristic;
  }
}
