export const ndaSchema = {
  documentType: 'nda',

  requiredCategories: [
    'definition_confidential',
    'obligations',
    'duration',
    'carve_outs',
    'remedies',
  ],

  riskCategories: ['definition_confidential', 'duration', 'carve_outs'],

  extractionSignals: {
    definition_confidential: {
      headingKeywords: ['confidential information', 'definition', 'defined terms'],
      bodyKeywords: ['confidential information means', 'proprietary information', 'disclosing party'],
      structuralHints: ['shall mean', 'includes', 'defined as'],
      missingRisk: 'No definition of confidential information. Scope of what you must protect is vague.',
    },
    obligations: {
      headingKeywords: ['obligations', 'non-disclosure', 'restrictions', 'duties'],
      bodyKeywords: ['shall not disclose', 'use solely', 'protect', 'standard of care'],
      structuralHints: ['receiving party shall', 'agrees not to'],
      missingRisk: 'No disclosure obligations specified.',
    },
    duration: {
      headingKeywords: ['term', 'duration', 'survival', 'period'],
      bodyKeywords: ['term of', 'years', 'perpetual', 'survive termination', 'expir'],
      structuralHints: ['shall remain in effect', 'for a period of'],
      missingRisk: 'No duration specified. Obligations may continue indefinitely.',
    },
    carve_outs: {
      headingKeywords: ['exceptions', 'exclusions', 'carve-out', 'permitted disclosure'],
      bodyKeywords: ['publicly available', 'independently developed', 'required by law', 'prior knowledge'],
      structuralHints: ['shall not include', 'does not apply to'],
      missingRisk: 'No carve-outs found. Standard exceptions (public domain, legal compulsion) may be missing.',
    },
    remedies: {
      headingKeywords: ['remedies', 'injunctive', 'equitable relief'],
      bodyKeywords: ['injunctive relief', 'irreparable harm', 'specific performance', 'liquidated damages'],
      structuralHints: ['entitled to seek', 'without posting bond'],
      missingRisk: 'No remedies clause found. Enforcement mechanisms are unclear.',
    },
  },
};
