import { parsePdf } from './pdf-parser.js';
import { parseDocx } from './docx-parser.js';
import { runOcr } from './ocr.js';
import { fetchFromUrl } from './url-fetcher.js';

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/tiff'];
const PDF_TYPES = ['application/pdf'];
const DOCX_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

export function detectFileType(mimetype, filename = '') {
  const lower = filename.toLowerCase();
  if (PDF_TYPES.includes(mimetype) || lower.endsWith('.pdf')) return 'pdf';
  if (DOCX_TYPES.includes(mimetype) || lower.endsWith('.docx')) return 'docx';
  if (IMAGE_TYPES.includes(mimetype) || /\.(png|jpe?g|webp|tiff?)$/i.test(lower)) return 'image';
  if (mimetype === 'text/plain' || lower.endsWith('.txt')) return 'text';
  return 'unknown';
}

export async function ingestFile({ buffer, mimetype, filename }) {
  const fileType = detectFileType(mimetype, filename);

  switch (fileType) {
    case 'pdf':
      return parsePdf(buffer);
    case 'docx':
      return parseDocx(buffer);
    case 'image':
      return runOcr(buffer, mimetype);
    case 'text':
      return { text: buffer.toString('utf-8'), structure: [] };
    default:
      throw new Error(`Unsupported file type: ${mimetype || filename}`);
  }
}

export async function ingestUrl(url) {
  return fetchFromUrl(url);
}
