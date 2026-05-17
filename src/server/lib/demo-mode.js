/**
 * Deterministic analysis stubs for CI and offline UI testing (LEXGUARD_DEMO_MODE=true).
 */

const HIGH_RISK_CATEGORIES = new Set([
  'non_compete',
  'ip_assignment',
  'arbitration',
  'limitation_liability',
  'auto_renewal',
  'third_party_sharing',
]);

export function demoClassifyDocument(rawText) {
  const lower = rawText.toLowerCase();

  if (lower.includes('privacy policy') || lower.includes('personal data')) {
    return {
      documentType: 'privacy_policy',
      confidence: 0.88,
      signingParty: 'user',
      jurisdiction: 'India',
    };
  }
  if (lower.includes('terms of service') || lower.includes('subscription')) {
    return {
      documentType: 'saas_tos',
      confidence: 0.9,
      signingParty: 'customer',
      jurisdiction: 'India',
    };
  }
  if (lower.includes('employment') || lower.includes('employee')) {
    return {
      documentType: 'employment',
      confidence: 0.92,
      signingParty: 'employee',
      jurisdiction: 'India',
    };
  }

  return {
    documentType: 'generic',
    confidence: 0.7,
    signingParty: 'unknown',
    jurisdiction: 'India',
  };
}

export function demoAnalyzeClause(clause, documentType, signingParty) {
  const high = HIGH_RISK_CATEGORIES.has(clause.category);
  const severity = high ? 'High' : 'Medium';

  return {
    clause,
    classifier: {
      severity,
      riskType: high ? 'employment' : 'none',
      confidence: 0.85,
      flags: high ? ['demo-flag-unfavorable-term'] : [],
      reasoning: `Demo analysis: ${clause.category} reviewed for ${signingParty} under ${documentType}.`,
    },
    implication: {
      plainExplanation: `This clause may affect your rights regarding ${clause.category.replace(/_/g, ' ')}.`,
      worstCaseScenario: high
        ? 'You could face restrictive obligations or limited legal recourse.'
        : 'Impact is moderate under typical circumstances.',
      affectsYouIf: 'You sign without negotiating this section.',
    },
    comparator: {
      deviationScore: high ? -1 : 0,
      deviationLabel: high ? 'Below standard' : 'Standard',
      keyDifferences: high ? ['Broader than typical market benchmark'] : [],
      benchmarkSummary: 'Compared to corpus benchmarks (demo mode).',
    },
    orchestrator: {
      acceptableArgument: 'The clause may protect legitimate business interests.',
      dangerousArgument: 'The clause may shift risk disproportionately to the signing party.',
      finalVerdict: high ? 'Worth negotiating before signing.' : 'Generally acceptable with review.',
      negotiationPriority: high ? 'Negotiate' : 'Flag for review',
      redlineSuggestion: {
        action: high ? 'replace_phrase' : 'none',
        originalPhrase: '',
        suggestedReplacement: '',
        rationale: 'Demo redline suggestion for testing.',
      },
    },
  };
}
