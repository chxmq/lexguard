export const employmentSchema = {
  documentType: 'employment',

  requiredCategories: [
    'compensation',
    'termination',
    'notice_period',
    'non_compete',
    'ip_assignment',
    'confidentiality',
    'dispute_resolution',
    'governing_law',
  ],

  riskCategories: ['non_compete', 'ip_assignment', 'dispute_resolution'],

  extractionSignals: {
    compensation: {
      headingKeywords: ['compensation', 'salary', 'remuneration', 'pay', 'benefits'],
      bodyKeywords: ['salary', 'base pay', 'bonus', 'CTC', 'remuneration', 'per annum'],
      structuralHints: ['shall receive', 'paid', 'compensation package'],
      missingRisk: 'No compensation terms found. Pay structure may be undefined.',
    },
    termination: {
      headingKeywords: ['termination', 'separation', 'end of employment'],
      bodyKeywords: ['terminate', 'termination for cause', 'without cause', 'dismissal'],
      structuralHints: ['may terminate', 'employment shall cease'],
      missingRisk: 'No termination clause found. Exit conditions are unclear.',
    },
    notice_period: {
      headingKeywords: ['notice', 'notice period', 'resignation'],
      bodyKeywords: ['notice period', 'days notice', 'written notice', 'resign'],
      structuralHints: ['shall provide', 'months notice'],
      missingRisk: 'No notice period specified. Either party may have unclear exit timelines.',
    },
    non_compete: {
      headingKeywords: ['non-compete', 'non compete', 'restrictive covenant', 'competitive activity', 'restraint'],
      bodyKeywords: ['compete', 'competitor', 'competitive business', 'similar role', 'industry'],
      structuralHints: ['shall not', 'agrees not to', 'prohibited from'],
      missingRisk:
        'No non-compete clause found. Confirm whether this is intentional or an oversight before signing.',
    },
    ip_assignment: {
      headingKeywords: ['intellectual property', 'ip assignment', 'ownership', 'work product', 'inventions'],
      bodyKeywords: ['assign', 'vest', 'belong to', 'work made for hire', 'intellectual property'],
      structuralHints: ['shall be the property of', 'hereby assigns', 'irrevocably assigns'],
      missingRisk: 'No IP assignment clause found. Ownership of work product may be ambiguous.',
    },
    confidentiality: {
      headingKeywords: ['confidential', 'confidentiality', 'non-disclosure', 'proprietary'],
      bodyKeywords: ['confidential information', 'trade secret', 'proprietary', 'not disclose'],
      structuralHints: ['shall keep confidential', 'shall not disclose'],
      missingRisk: 'No confidentiality clause found. Information handling obligations are undefined.',
    },
    dispute_resolution: {
      headingKeywords: ['dispute', 'arbitration', 'mediation', 'governing disputes'],
      bodyKeywords: ['arbitration', 'mediation', 'dispute resolution', 'exclusive jurisdiction'],
      structuralHints: ['shall be resolved', 'binding arbitration'],
      missingRisk: 'No dispute resolution clause found. Forum and process for conflicts are unclear.',
    },
    governing_law: {
      headingKeywords: ['governing law', 'applicable law', 'jurisdiction'],
      bodyKeywords: ['governed by', 'laws of', 'courts of', 'jurisdiction'],
      structuralHints: ['shall be governed', 'exclusive jurisdiction'],
      missingRisk: 'No governing law clause found. Which legal regime applies is ambiguous.',
    },
  },
};
