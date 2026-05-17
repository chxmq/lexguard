const KEYWORD_MAP = [
  { category: 'non_compete', patterns: [/non[- ]?compete/i, /competitive/i, /restraint/i] },
  { category: 'ip_assignment', patterns: [/intellectual property/i, /\bip\b/i, /invention/i, /work product/i] },
  { category: 'termination', patterns: [/terminat/i, /resign/i, /separation/i] },
  { category: 'compensation', patterns: [/salary/i, /compensation/i, /remuneration/i, /bonus/i] },
  { category: 'confidentiality', patterns: [/confidential/i, /non[- ]?disclosure/i, /\bnda\b/i] },
  { category: 'dispute_resolution', patterns: [/arbitrat/i, /dispute/i, /jurisdiction/i, /governing law/i] },
  { category: 'notice_period', patterns: [/notice period/i, /days notice/i] },
];

export function inferClauseCategory(question, clauses = [], selectedCategory = null) {
  if (selectedCategory) return selectedCategory;

  const q = question.toLowerCase();
  for (const { category, patterns } of KEYWORD_MAP) {
    if (patterns.some((re) => re.test(q))) return category;
  }

  const severityRank = { Critical: 4, High: 3, Medium: 2, Low: 1, Informational: 0 };
  const top = [...clauses].sort(
    (a, b) =>
      (severityRank[b.classifier?.severity] ?? 0) - (severityRank[a.classifier?.severity] ?? 0),
  )[0];

  return top?.clause?.category ?? top?.category ?? 'non_compete';
}
