import pdfParse from 'pdf-parse';

export async function parsePdf(buffer) {
  const data = await pdfParse(buffer);
  const lines = data.text.split('\n').filter((l) => l.trim());

  return {
    text: data.text,
    pageCount: data.numpages,
    structure: lines.map((line, i) => ({
      type: inferLineType(line),
      text: line,
      lineIndex: i,
    })),
  };
}

function inferLineType(line) {
  if (/^\d+(\.\d+)*\s/.test(line)) return 'numbered';
  if (line.length < 80 && line === line.toUpperCase() && /[A-Z]/.test(line)) return 'heading';
  if (/^(ARTICLE|SECTION|Schedule)\s/i.test(line)) return 'heading';
  return 'body';
}
