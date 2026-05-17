import pdfParse from 'pdf-parse';
import { isPdfTextSparse } from '../../../shared/pdf-quality.js';
import { runOcr } from './ocr.js';

export async function parsePdf(buffer) {
  const data = await pdfParse(buffer);
  let text = data.text || '';
  let pageCount = data.numpages || 1;
  let ocrEngine = null;

  if (isPdfTextSparse(text, pageCount)) {
    try {
      const ocr = await runOcr(buffer, 'application/pdf');
      const ocrText = ocr.text?.trim() || '';
      if (ocrText && ocrText.length > text.trim().length) {
        text = ocrText;
        ocrEngine = ocr.ocrEngine || 'ocr-fallback';
      }
    } catch (err) {
      console.warn('[PDF] Scanned-document OCR fallback failed:', err.message);
    }
  }

  const lines = text.split('\n').filter((l) => l.trim());

  return {
    text,
    pageCount,
    ocrEngine,
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
