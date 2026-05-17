/**
 * Deterministic cross-clause checks — always available (no Vertex quota).
 * Vertex AI merges additional findings when LEXGUARD_CROSS_CLAUSE_AI is enabled.
 */

const AMBIGUOUS_PHRASES = [
  { re: /(?:at\s+)?(?:its|the|company'?s?)?\s*sole\s+discretion/i, issue: 'Gives one party unchecked power without criteria or appeal' },
  { re: /\breasonable\b/i, issue: '"Reasonable" is subjective and undefined — each party may interpret it differently' },
  { re: /including\s+but\s+not\s+limited\s+to/i, issue: 'Open-ended list that could expand scope indefinitely' },
  { re: /as\s+(?:determined|decided)\s+by/i, issue: 'Gives one party unilateral decision-making authority' },
  { re: /may\s+(?:at\s+any\s+time|terminate|modify|change)/i, issue: 'Permissive language without clear constraints or notice' },
  { re: /from\s+time\s+to\s+time/i, issue: 'Undefined frequency — changes may occur without predictable limits' },
  { re: /in\s+our\s+sole\s+discretion/i, issue: 'Unilateral discretion with no objective standard' },
];

function emptyResult() {
  return {
    ambiguities: [],
    contradictions: [],
    missingDefinitions: [],
    exploitativePatterns: [],
    sources: ['heuristic'],
  };
}

export function heuristicCrossClause(clauses) {
  const result = emptyResult();
  if (!clauses?.length) return result;

  for (const c of clauses) {
    const text = c.text || '';

    for (const { re, issue } of AMBIGUOUS_PHRASES) {
      const match = text.match(re);
      if (match) {
        result.ambiguities.push({
          clause: c.category,
          phrase: match[0],
          issue,
          severity: 'Medium',
        });
      }
    }

    if (/irrevocably\s+assigns/i.test(text) && c.category === 'ip_assignment') {
      result.exploitativePatterns.push({
        clause: c.category,
        pattern: 'Irrevocable IP assignment with no carve-out for pre-existing work or personal projects',
        severity: 'High',
      });
    }

    if (/waives?\s+(?:any|all)\s+(?:right|claim)/i.test(text)) {
      result.exploitativePatterns.push({
        clause: c.category,
        pattern: 'Broad waiver of rights that may include statutory or consumer protections',
        severity: 'Critical',
      });
    }

    if (/binding\s+arbitration/i.test(text) && !/opt[- ]?out/i.test(text)) {
      result.exploitativePatterns.push({
        clause: c.category,
        pattern: 'Mandatory binding arbitration without a clear opt-out or small-claims carve-out',
        severity: 'High',
      });
    }

    if (/automatically\s+renew/i.test(text) && !/cancel|notice/i.test(text)) {
      result.exploitativePatterns.push({
        clause: c.category,
        pattern: 'Auto-renewal language without adjacent cancellation or notice instructions',
        severity: 'High',
      });
    }

    if (/unlimited\s+liability|no\s+limitation\s+of\s+liability/i.test(text) && c.category === 'limitation_liability') {
      result.exploitativePatterns.push({
        clause: c.category,
        pattern: 'No effective liability cap — exposure may be uncapped',
        severity: 'Critical',
      });
    }
  }

  const termination = clauses.find((c) => c.category === 'termination');
  const notice = clauses.find((c) => c.category === 'notice_period');
  if (termination && notice) {
    const extractDays = (text) => {
      const paren = [...text.matchAll(/\((\d+)\)\s*days?/gi)];
      if (paren.length) return paren[paren.length - 1][1];
      const plain = [...text.matchAll(/\b(\d+)\s*days?/gi)];
      return plain.length ? plain[plain.length - 1][1] : null;
    };
    const termDays = extractDays(termination.text);
    const noticeDays = extractDays(notice.text);
    if (termDays && noticeDays && termDays !== noticeDays) {
      result.contradictions.push({
        clause1: 'termination',
        clause2: 'notice_period',
        description: `Termination specifies ${termDays} days notice but notice period clause specifies ${noticeDays} days`,
        severity: 'High',
      });
    }
  }

  const hasConfidentialityDef = clauses.some(
    (c) => c.category === 'confidentiality' && /confidential\s+information\s+means/i.test(c.text)
  );
  if (
    !hasConfidentialityDef &&
    clauses.some((c) => /confidential\s+information/i.test(c.text) && c.category !== 'confidentiality')
  ) {
    result.missingDefinitions.push({
      term: 'Confidential Information',
      usedIn: 'multiple clauses',
      risk: 'Without a precise definition, confidentiality scope and exceptions are unclear',
    });
  }

  return result;
}

function itemKey(kind, item) {
  if (kind === 'ambiguities') return `${item.clause}:${item.phrase?.toLowerCase()}`;
  if (kind === 'contradictions') return `${item.clause1}:${item.clause2}:${item.description?.slice(0, 40)}`;
  if (kind === 'missingDefinitions') return `${item.term}:${item.usedIn}`;
  if (kind === 'exploitativePatterns') return `${item.clause}:${item.pattern?.slice(0, 48)}`;
  return JSON.stringify(item);
}

export function mergeCrossClauseResults(heuristic, ai) {
  if (!ai) return heuristic;
  const merged = emptyResult();
  merged.sources = ['heuristic', 'vertex'];

  for (const kind of ['ambiguities', 'contradictions', 'missingDefinitions', 'exploitativePatterns']) {
    const seen = new Set();
    for (const item of [...(heuristic[kind] || []), ...(ai[kind] || [])]) {
      const key = itemKey(kind, item);
      if (seen.has(key)) continue;
      seen.add(key);
      merged[kind].push(item);
    }
  }
  return merged;
}
