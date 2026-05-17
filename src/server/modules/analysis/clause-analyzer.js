import { generateJSON, isDemoMode, truncateForPrompt } from '../../lib/gemini.js';
import { demoAnalyzeClause } from '../../lib/demo-mode.js';
import { logger } from '../../lib/logger.js';
import { retrieveBenchmarks } from '../rag/retriever.js';
import { synthesizeNegotiation } from './negotiation-synthesizer.js';

const PROMPT = `You are LexGuard's legal analysis engine. Analyze ONE clause from a {{DOCUMENT_TYPE}} for the {{SIGNING_PARTY}}.

Clause category (pre-identified): {{CLAUSE_CATEGORY}}

Benchmark excerpts:
{{BENCHMARK_CLAUSES}}

Perform ALL analyses below in one response. Be specific — no generic boilerplate. Reference Indian jurisdiction where relevant.

Respond with strictly valid JSON only (no markdown fences, no comments, no schema placeholders).

Enums (use exact strings):
- classifier.severity: Informational | Low | Medium | High | Critical
- classifier.riskType: financial | employment | privacy | ip | legal_process | termination | ambiguity | none
- comparator.deviationLabel: Unusually restrictive | Below standard | Standard | Above standard | Unusually favorable
- orchestrator.negotiationPriority: Accept | Flag for review | Negotiate | Walk away
- orchestrator.redlineSuggestion.action: none | add_language | replace_phrase | remove_clause | request_carve_out

Required JSON shape:
{
  "classifier": {
    "severity": "High",
    "riskType": "employment",
    "confidence": 0.85,
    "flags": ["..."],
    "reasoning": "..."
  },
  "implication": {
    "plainExplanation": "...",
    "worstCaseScenario": "...",
    "affectsYouIf": "..."
  },
  "comparator": {
    "deviationScore": -1,
    "deviationLabel": "Below standard",
    "keyDifferences": ["..."],
    "benchmarkSummary": "..."
  },
  "orchestrator": {
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
  }
}

Clause:
{{CLAUSE_TEXT}}`;

export async function analyzeClause(clause, documentType, signingParty, options = {}) {
  if (isDemoMode()) {
    return demoAnalyzeClause(clause, documentType, signingParty);
  }

  const benchmarks = await retrieveBenchmarks(clause.text, documentType, clause.category);
  const benchmarkText = benchmarks
    .map((b, i) => `[${i + 1}] ${truncateForPrompt(b.text, 400)}`)
    .join('\n\n');

  const prompt = PROMPT.replace('{{DOCUMENT_TYPE}}', documentType)
    .replace('{{SIGNING_PARTY}}', signingParty)
    .replace('{{CLAUSE_CATEGORY}}', clause.category)
    .replace('{{BENCHMARK_CLAUSES}}', benchmarkText || 'Standard templates unavailable.')
    .replace('{{CLAUSE_TEXT}}', truncateForPrompt(clause.text, 1600));

  try {
    const result = await generateJSON(prompt, {
      modelTier: 'fast',
      maxOutputTokens: 4096,
      onThrottle: options.onThrottle,
    });

    if (result.classifier && result.implication && result.comparator && result.orchestrator) {
      return {
        clause,
        classifier: result.classifier,
        implication: result.implication,
        comparator: result.comparator,
        orchestrator: result.orchestrator,
      };
    }
  } catch (err) {
    logger.warn('ClauseAnalysis', `Combined call failed for ${clause.category}`, err.message);
  }

  return runClauseAnalysisTwoStep(clause, documentType, signingParty, benchmarkText, options);
}

const ANALYSIS_ONLY_PROMPT = `You are LexGuard's legal analysis engine. Analyze ONE clause from a {{DOCUMENT_TYPE}} for the {{SIGNING_PARTY}}.

Clause category: {{CLAUSE_CATEGORY}}

Benchmark excerpts:
{{BENCHMARK_CLAUSES}}

Respond with strictly valid JSON only.

{
  "classifier": { "severity": "High", "riskType": "employment", "confidence": 0.85, "flags": [], "reasoning": "..." },
  "implication": { "plainExplanation": "...", "worstCaseScenario": "...", "affectsYouIf": "..." },
  "comparator": { "deviationScore": -1, "deviationLabel": "Below standard", "keyDifferences": [], "benchmarkSummary": "..." }
}

Clause:
{{CLAUSE_TEXT}}`;

async function runClauseAnalysisTwoStep(clause, documentType, signingParty, benchmarkText, options = {}) {
  const shortPrompt = ANALYSIS_ONLY_PROMPT.replace('{{DOCUMENT_TYPE}}', documentType)
    .replace('{{SIGNING_PARTY}}', signingParty)
    .replace('{{CLAUSE_CATEGORY}}', clause.category)
    .replace('{{BENCHMARK_CLAUSES}}', benchmarkText || 'Standard templates unavailable.')
    .replace('{{CLAUSE_TEXT}}', truncateForPrompt(clause.text, 1600));

  const result = await generateJSON(shortPrompt, {
    modelTier: 'fast',
    maxOutputTokens: 2048,
    onThrottle: options.onThrottle,
  });

  const orchestrator = await synthesizeNegotiation({
    clause,
    documentType,
    signingParty,
    classifierOutput: result.classifier,
    implicationOutput: result.implication,
    comparatorOutput: result.comparator,
  });

  return {
    clause,
    classifier: result.classifier,
    implication: result.implication,
    comparator: result.comparator,
    orchestrator,
  };
}
