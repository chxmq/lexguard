export const rentalSchema = {
  documentType: 'rental',

  requiredCategories: [
    'rent_payment',
    'deposit',
    'maintenance',
    'early_termination',
    'use_restrictions',
    'governing_law',
  ],

  riskCategories: ['deposit', 'early_termination', 'maintenance'],

  extractionSignals: {
    rent_payment: {
      headingKeywords: ['rent', 'lease payment', 'monthly payment'],
      bodyKeywords: ['rent', 'per month', 'due on', 'late fee', 'escalation'],
      structuralHints: ['shall pay rent', 'monthly rent'],
      missingRisk: 'No rent payment terms found.',
    },
    deposit: {
      headingKeywords: ['deposit', 'security deposit', 'advance'],
      bodyKeywords: ['security deposit', 'refundable', 'forfeit', 'deductions'],
      structuralHints: ['deposit of', 'shall return'],
      missingRisk: 'No deposit terms found. Refund conditions are unclear.',
    },
    maintenance: {
      headingKeywords: ['maintenance', 'repairs', 'utilities'],
      bodyKeywords: ['maintain', 'repairs', 'landlord', 'tenant responsible', 'utilities'],
      structuralHints: ['shall be responsible', 'at tenant expense'],
      missingRisk: 'No maintenance obligations defined. Repair liability may be disputed.',
    },
    early_termination: {
      headingKeywords: ['early termination', 'break lease', 'notice'],
      bodyKeywords: ['terminate early', 'break lease', 'penalty', 'notice period'],
      structuralHints: ['may terminate', 'upon notice'],
      missingRisk: 'No early termination terms found. Exit penalties may be severe or undefined.',
    },
    use_restrictions: {
      headingKeywords: ['use', 'subletting', 'occupancy', 'restrictions'],
      bodyKeywords: ['residential use only', 'sublet', 'pets', 'alterations', 'occupants'],
      structuralHints: ['shall not', 'without consent'],
      missingRisk: 'No use restrictions specified.',
    },
    governing_law: {
      headingKeywords: ['governing law', 'jurisdiction'],
      bodyKeywords: ['governed by', 'laws of'],
      structuralHints: ['shall be governed'],
      missingRisk: 'No governing law clause found.',
    },
  },
};
