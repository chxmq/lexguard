export const genericSchema = {
  documentType: 'generic',

  requiredCategories: [
    'parties',
    'term',
    'termination',
    'liability',
    'governing_law',
    'dispute_resolution',
  ],

  riskCategories: ['termination', 'liability', 'dispute_resolution'],

  extractionSignals: {
    parties: {
      headingKeywords: ['parties', 'between', 'agreement'],
      bodyKeywords: ['between', 'party', 'hereinafter', 'employer', 'employee', 'company'],
      structuralHints: ['by and between'],
      missingRisk: 'Parties to the agreement are not clearly identified.',
    },
    term: {
      headingKeywords: ['term', 'duration', 'effective date'],
      bodyKeywords: ['effective', 'commence', 'expire', 'term of', 'period of'],
      structuralHints: ['shall continue', 'until'],
      missingRisk: 'Contract term or effective dates are unclear.',
    },
    termination: {
      headingKeywords: ['termination', 'cancellation', 'end'],
      bodyKeywords: ['terminate', 'termination', 'without cause', 'for cause'],
      structuralHints: ['may terminate', 'shall cease'],
      missingRisk: 'Termination rights and process are not defined.',
    },
    liability: {
      headingKeywords: ['liability', 'indemnity', 'damages', 'limitation'],
      bodyKeywords: ['liable', 'indemnif', 'damages', 'limitation of liability', 'hold harmless'],
      structuralHints: ['shall not be liable', 'maximum liability'],
      missingRisk: 'Liability and indemnity allocation are unclear.',
    },
    governing_law: {
      headingKeywords: ['governing law', 'applicable law', 'jurisdiction'],
      bodyKeywords: ['governed by', 'laws of', 'courts of', 'jurisdiction'],
      structuralHints: ['shall be governed'],
      missingRisk: 'Governing law and jurisdiction are not specified.',
    },
    dispute_resolution: {
      headingKeywords: ['dispute', 'arbitration', 'mediation'],
      bodyKeywords: ['arbitration', 'dispute resolution', 'mediation', 'exclusive jurisdiction'],
      structuralHints: ['shall be resolved', 'binding arbitration'],
      missingRisk: 'Dispute resolution mechanism is missing.',
    },
  },
};
