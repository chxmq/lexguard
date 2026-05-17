import { generateJSON, isDemoMode, truncateForPrompt } from '../../lib/gemini.js';

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

function demoAmbiguity(clauses, documentType) {
  const result = {
    ambiguities: [],
    contradictions: [],
    missingDefinitions: [],
    exploitativePatterns: [],
  };

  for (const c of clauses) {
    const text = c.text.toLowerCase();

    // Detect ambiguous phrases
    const ambiguousPhrases = [
      { re: /at\s+(its|the|company'?s?)\s+sole\s+discretion/i, issue: 'Gives one party unchecked power without criteria or appeal' },
      { re: /reasonable\b/i, issue: '"Reasonable" is subjective and undefined — each party will interpret it differently' },
      { re: /including\s+but\s+not\s+limited\s+to/i, issue: 'Open-ended list that could expand scope indefinitely' },
      { re: /as\s+(?:determined|decided)\s+by/i, issue: 'Gives one party unilateral decision-making authority' },
      { re: /may\s+(?:at\s+any\s+time|terminate|modify|change)/i, issue: 'Permissive language without constraints or notice requirements' },
    ];

    for (const { re, issue } of ambiguousPhrases) {
      const match = c.text.match(re);
      if (match) {
        result.ambiguities.push({
          clause: c.category,
          phrase: match[0],
          issue,
          severity: 'Medium',
        });
      }
    }

    // Detect exploitative patterns
    if (/irrevocably\s+assigns/i.test(text) && c.category === 'ip_assignment') {
      result.exploitativePatterns.push({
        clause: c.category,
        pattern: 'Irrevocable IP assignment with no exceptions for pre-existing work or personal projects',
        severity: 'High',
      });
    }
    if (/waives?\s+(?:any|all)\s+(?:right|claim)/i.test(text)) {
      result.exploitativePatterns.push({
        clause: c.category,
        pattern: 'Broad waiver of rights that may include statutory protections',
        severity: 'Critical',
      });
    }
  }

  // Check for contradictions between clauses
  const termination = clauses.find((c) => c.category === 'termination');
  const notice = clauses.find((c) => c.category === 'notice_period');
  if (termination && notice) {
    const termDays = termination.text.match(/(\d+)\s*(?:\(\d+\))?\s*days?\s*(?:written\s+)?notice/i);
    const noticeDays = notice.text.match(/(\d+)\s*(?:\(\d+\))?\s*days?\s*/i);
    if (termDays && noticeDays && termDays[1] !== noticeDays[1]) {
      result.contradictions.push({
        clause1: 'termination',
        clause2: 'notice_period',
        description: `Termination clause specifies ${termDays[1]} days but notice period clause specifies ${noticeDays[1]} days`,
        severity: 'High',
      });
    }
  }

  // Missing definitions
  if (clauses.some((c) => /confidential\s+information/i.test(c.text) && c.category !== 'confidentiality')) {
    result.missingDefinitions.push({
      term: 'Confidential Information',
      usedIn: 'multiple clauses',
      risk: 'Without a precise definition, scope of confidentiality obligations is unclear',
    });
  }

  return result;
}

export async function analyzeCrossClause(clauses, documentType, signingParty) {
  if (isDemoMode()) {
    return demoAmbiguity(clauses, documentType);
  }

  const useVertex =
    clauses.length > 0 && process.env.LEXGUARD_CROSS_CLAUSE_AI === 'true';

  if (!useVertex) {
    return null;
  }

  const clausesText = clauses
    .map((c) => `[${c.category}]\n${truncateForPrompt(c.text, 600)}`)
    .join('\n\n---\n\n');

  const prompt = PROMPT
    .replace('{{DOCUMENT_TYPE}}', documentType)
    .replace('{{SIGNING_PARTY}}', signingParty)
    .replace('{{CLAUSES_TEXT}}', clausesText);

  try {
    return await generateJSON(prompt, {
      modelTier: 'fast',
      maxOutputTokens: 3072,
    });
  } catch (err) {
    console.warn('[AmbiguityDetector] Vertex cross-clause analysis failed:', err.message);
    return null;
  }
}
