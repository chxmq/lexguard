import { google } from 'googleapis';
import { getAuthenticatedClient } from '../../lib/google-auth.js';

const SEVERITY_COLORS = {
  Critical: { red: 0.9, green: 0.2, blue: 0.2 },
  High: { red: 0.95, green: 0.5, blue: 0.2 },
  Medium: { red: 0.95, green: 0.9, blue: 0.2 },
  Low: { red: 0.2, green: 0.4, blue: 0.9 },
  Informational: { red: 0.5, green: 0.5, blue: 0.5 },
};

export async function exportToDocs(session, tokens) {
  if (!tokens?.access_token) {
    return mockExport('docs', session);
  }

  const auth = getAuthenticatedClient(tokens);
  const docs = google.docs({ version: 'v1', auth });

  const title = `LexGuard Report — ${session.documentType} — ${new Date().toLocaleDateString()}`;
  const { data: doc } = await docs.documents.create({ requestBody: { title } });
  const documentId = doc.documentId;

  const requests = buildAnnotationRequests(session);

  if (requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests },
    });
  }

  return {
    documentId,
    url: `https://docs.google.com/document/d/${documentId}/edit`,
    mock: false,
  };
}

function buildAnnotationRequests(session) {
  const requests = [];
  let index = 1;

  const summary = `LexGuard Risk Report\nOverall risk score: ${session.overallRiskScore}/100\n\n`;
  requests.push({ insertText: { location: { index }, text: summary } });
  index += summary.length;

  for (const item of session.clauses || []) {
    const comment = [
      `Category: ${item.clause.category}`,
      `Severity: ${item.classifier?.severity}`,
      `Priority: ${item.orchestrator?.negotiationPriority}`,
      item.orchestrator?.finalVerdict,
    ].join('\n');

    const block = `\n--- ${item.clause.category.toUpperCase()} ---\n${item.clause.text.slice(0, 500)}\n[LexGuard: ${item.classifier?.severity}]\n\n`;
    requests.push({ insertText: { location: { index }, text: block } });
    index += block.length;
  }

  return requests;
}

function mockExport(format, session) {
  return {
    mock: true,
    format,
    message: `Demo export: ${(session.clauses || []).length} clauses annotated`,
    url: null,
    preview: (session.clauses || []).map((c) => ({
      category: c.clause.category,
      severity: c.classifier?.severity,
      priority: c.orchestrator?.negotiationPriority,
    })),
  };
}
