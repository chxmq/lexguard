import PDFDocument from 'pdfkit';

function buildReportLines(session) {
  const lines = [];
  lines.push('LEXGUARD CONTRACT RISK REPORT');
  lines.push(`Document type: ${session.documentType}`);
  lines.push(`Signing party: ${session.signingParty}`);
  lines.push(`Overall risk score: ${session.overallRiskScore}/100`);
  lines.push(`Generated: ${session.completedAt || new Date().toISOString()}`);
  lines.push('');

  if (session.missingClauses?.length) {
    lines.push('MISSING CLAUSES');
    for (const m of session.missingClauses) {
      lines.push(`[${m.severity}] ${m.category}: ${m.riskMessage}`);
    }
    lines.push('');
  }

  for (const item of session.clauses || []) {
    if (!item.clause) continue;
    lines.push(`${item.clause.category.toUpperCase()} — ${item.classifier?.severity || 'Medium'}`);
    lines.push(item.implication?.plainExplanation || '');
    lines.push('');
    lines.push(`Worst case: ${item.implication?.worstCaseScenario || 'N/A'}`);
    lines.push(`Priority: ${item.orchestrator?.negotiationPriority || 'N/A'}`);
    lines.push(`Verdict: ${item.orchestrator?.finalVerdict || 'N/A'}`);
    if (item.orchestrator?.redlineSuggestion?.suggestedReplacement) {
      lines.push(`Redline: ${item.orchestrator.redlineSuggestion.suggestedReplacement}`);
    }
    lines.push('');
  }

  return lines;
}

export async function exportToPdf(session) {
  const lines = buildReportLines(session);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      resolve({
        format: 'pdf',
        mock: false,
        message: 'PDF report generated',
        filename: `lexguard-report-${session.sessionId?.slice(0, 8) || 'export'}.pdf`,
        contentBase64: buffer.toString('base64'),
        mimeType: 'application/pdf',
      });
    });
    doc.on('error', reject);

    doc.fontSize(18).text('LexGuard Contract Risk Report', { underline: true });
    doc.moveDown();
    doc.fontSize(10);

    for (const line of lines) {
      if (line === lines[0]) continue;
      if (line.match(/^[A-Z_]+ —/)) {
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#1a2b3c').text(line, { continued: false });
        doc.fontSize(10).fillColor('#000000');
      } else {
        doc.text(line || ' ', { lineGap: 2 });
      }
    }

    doc.end();
  });
}
