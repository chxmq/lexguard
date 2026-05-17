import { google } from 'googleapis';
import { getAuthenticatedClient } from '../../lib/google-auth.js';

export async function exportToSlides(session, tokens) {
  if (!tokens?.access_token) {
    return mockSlides(session);
  }

  const auth = getAuthenticatedClient(tokens);
  const slides = google.slides({ version: 'v1', auth });

  const { data: presentation } = await slides.presentations.create({
    requestBody: {
      title: `LexGuard Executive Summary — ${session.documentType}`,
    },
  });

  const presentationId = presentation.presentationId;
  const slideIds = presentation.slides?.map((s) => s.objectId) || [];

  const critical = (session.clauses || []).filter((c) =>
    ['Critical', 'High'].includes(c.classifier?.severity)
  );

  const requests = [
  {
      replaceAllText: {
        containsText: { text: '{{TITLE}}', matchCase: true },
        replaceText: 'LexGuard Executive Summary',
        pageObjectIds: slideIds[0] ? [slideIds[0]] : undefined,
      },
    },
  ];

  if (requests.length) {
    await slides.presentations.batchUpdate({
      presentationId,
      requestBody: { requests },
    });
  }

  return {
    presentationId,
    url: `https://docs.google.com/presentation/d/${presentationId}/edit`,
    slideCount: 5,
    criticalCount: critical.length,
    mock: false,
  };
}

function mockSlides(session) {
  const topRisks = (session.clauses || [])
    .filter((c) => ['Critical', 'High'].includes(c.classifier?.severity))
    .slice(0, 5);

  return {
    mock: true,
    format: 'slides',
    slides: [
      { title: 'Executive Summary', body: `Overall risk: ${session.overallRiskScore}/100` },
      { title: 'Document Type', body: session.documentType },
      { title: 'Top Risks', body: topRisks.map((r) => r.clause.category).join(', ') },
      { title: 'Missing Clauses', body: (session.missingClauses || []).map((m) => m.category).join(', ') || 'None' },
      { title: 'Recommended Actions', body: 'Negotiate non-compete scope; verify IP assignment; review termination' },
    ],
  };
}
