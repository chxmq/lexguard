export const privacyPolicySchema = {
  documentType: 'privacy_policy',

  requiredCategories: [
    'data_collected',
    'purposes',
    'retention',
    'third_party_sharing',
    'user_rights',
    'security',
    'contact',
  ],

  riskCategories: ['data_collected', 'third_party_sharing', 'user_rights'],

  extractionSignals: {
    data_collected: {
      headingKeywords: ['information we collect', 'data we collect', 'personal data'],
      bodyKeywords: ['collect', 'personal information', 'cookies', 'device information'],
      structuralHints: ['we collect', 'types of data'],
      missingRisk: 'No data collection disclosure found.',
    },
    purposes: {
      headingKeywords: ['how we use', 'purposes', 'use of information'],
      bodyKeywords: ['use your information', 'purposes include', 'process for'],
      structuralHints: ['we use', 'to provide'],
      missingRisk: 'No stated purposes for data processing.',
    },
    retention: {
      headingKeywords: ['retention', 'how long', 'storage period'],
      bodyKeywords: ['retain', 'store for', 'delete when', 'retention period'],
      structuralHints: ['we retain', 'for as long as'],
      missingRisk: 'No retention policy found. How long data is kept is unclear.',
    },
    third_party_sharing: {
      headingKeywords: ['sharing', 'third parties', 'disclosure'],
      bodyKeywords: ['share with', 'service providers', 'affiliates', 'advertising partners'],
      structuralHints: ['may disclose', 'third-party'],
      missingRisk: 'No third-party sharing disclosure found.',
    },
    user_rights: {
      headingKeywords: ['your rights', 'access', 'deletion', 'opt-out'],
      bodyKeywords: ['right to access', 'delete', 'portability', 'opt out', 'withdraw consent'],
      structuralHints: ['you may request', 'exercise your rights'],
      missingRisk: 'No user rights section found. Mechanisms to control your data may be absent.',
    },
    security: {
      headingKeywords: ['security', 'safeguards', 'protection'],
      bodyKeywords: ['encrypt', 'security measures', 'protect your data'],
      structuralHints: ['we implement', 'reasonable security'],
      missingRisk: 'No security measures described.',
    },
    contact: {
      headingKeywords: ['contact', 'dpo', 'privacy officer'],
      bodyKeywords: ['contact us', 'privacy@', 'data protection officer'],
      structuralHints: ['reach us at', 'email'],
      missingRisk: 'No contact information for privacy inquiries.',
    },
  },
};
