export const freelanceSchema = {
  documentType: 'freelance',

  requiredCategories: [
    'scope_of_work',
    'payment_terms',
    'ip_assignment',
    'termination',
    'confidentiality',
    'indemnification',
    'governing_law',
  ],

  riskCategories: ['ip_assignment', 'payment_terms', 'indemnification'],

  extractionSignals: {
    scope_of_work: {
      headingKeywords: ['scope', 'services', 'deliverables', 'statement of work'],
      bodyKeywords: ['services', 'deliverables', 'scope of work', 'perform', 'milestones'],
      structuralHints: ['shall provide', 'contractor agrees to'],
      missingRisk: 'No scope of work defined. Deliverables and acceptance criteria are unclear.',
    },
    payment_terms: {
      headingKeywords: ['payment', 'fees', 'compensation', 'invoicing'],
      bodyKeywords: ['invoice', 'payment due', 'fees', 'rate', 'net 30', 'milestone payment'],
      structuralHints: ['shall pay', 'within days of invoice'],
      missingRisk: 'No payment terms found. When and how you get paid is undefined.',
    },
    ip_assignment: {
      headingKeywords: ['intellectual property', 'ip', 'work product', 'ownership', 'inventions'],
      bodyKeywords: ['assign', 'work made for hire', 'ownership', 'intellectual property'],
      structuralHints: ['hereby assigns', 'shall own', 'work product'],
      missingRisk: 'No IP assignment clause found. You may retain rights the client expects to own.',
    },
    termination: {
      headingKeywords: ['termination', 'cancellation'],
      bodyKeywords: ['terminate', 'cancel', 'end of agreement'],
      structuralHints: ['may terminate', 'upon written notice'],
      missingRisk: 'No termination terms found. How either party can exit is unclear.',
    },
    confidentiality: {
      headingKeywords: ['confidential', 'confidentiality', 'nda'],
      bodyKeywords: ['confidential information', 'not disclose', 'proprietary'],
      structuralHints: ['shall not disclose', 'keep confidential'],
      missingRisk: 'No confidentiality clause found.',
    },
    indemnification: {
      headingKeywords: ['indemnif', 'hold harmless', 'liability'],
      bodyKeywords: ['indemnify', 'hold harmless', 'defend', 'claims arising'],
      structuralHints: ['shall indemnify', 'hold harmless'],
      missingRisk: 'No indemnification clause found. Liability allocation may default to unfavorable norms.',
    },
    governing_law: {
      headingKeywords: ['governing law', 'jurisdiction', 'applicable law'],
      bodyKeywords: ['governed by', 'laws of', 'courts'],
      structuralHints: ['shall be governed'],
      missingRisk: 'No governing law clause found.',
    },
  },
};
