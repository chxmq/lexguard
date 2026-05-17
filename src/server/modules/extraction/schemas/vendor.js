export const vendorSchema = {
  documentType: 'vendor',

  requiredCategories: [
    'scope_services',
    'sla',
    'payment',
    'indemnification',
    'limitation_liability',
    'ip',
    'termination',
    'governing_law',
  ],

  riskCategories: ['sla', 'indemnification', 'limitation_liability', 'ip'],

  extractionSignals: {
    scope_services: {
      headingKeywords: ['services', 'scope', 'deliverables'],
      bodyKeywords: ['vendor shall', 'provide services', 'deliverables', 'specifications'],
      structuralHints: ['agrees to provide'],
      missingRisk: 'No scope of services defined.',
    },
    sla: {
      headingKeywords: ['sla', 'service level', 'uptime', 'performance'],
      bodyKeywords: ['uptime', 'availability', 'response time', 'service credits'],
      structuralHints: ['shall maintain', 'service level agreement'],
      missingRisk: 'No SLA found. Performance guarantees and remedies are undefined.',
    },
    payment: {
      headingKeywords: ['payment', 'fees', 'invoicing'],
      bodyKeywords: ['invoice', 'payment terms', 'fees', 'expenses'],
      structuralHints: ['shall pay', 'within days'],
      missingRisk: 'No payment terms found.',
    },
    indemnification: {
      headingKeywords: ['indemnif', 'hold harmless'],
      bodyKeywords: ['indemnify', 'defend', 'hold harmless', 'third-party claims'],
      structuralHints: ['shall indemnify'],
      missingRisk: 'No indemnification clause found.',
    },
    limitation_liability: {
      headingKeywords: ['limitation of liability', 'liability cap'],
      bodyKeywords: ['not liable', 'maximum liability', 'consequential', 'cap'],
      structuralHints: ['limited to', 'in no event'],
      missingRisk: 'No liability limitation found.',
    },
    ip: {
      headingKeywords: ['intellectual property', 'ip', 'license'],
      bodyKeywords: ['license grant', 'ownership', 'pre-existing ip', 'background ip'],
      structuralHints: ['retains ownership', 'grants license'],
      missingRisk: 'No IP terms found.',
    },
    termination: {
      headingKeywords: ['termination', 'expiration'],
      bodyKeywords: ['terminate', 'breach', 'convenience'],
      structuralHints: ['may terminate'],
      missingRisk: 'No termination clause found.',
    },
    governing_law: {
      headingKeywords: ['governing law', 'jurisdiction'],
      bodyKeywords: ['governed by', 'courts of'],
      structuralHints: ['shall be governed'],
      missingRisk: 'No governing law clause found.',
    },
  },
};
