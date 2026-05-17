import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import dotenv from 'dotenv';
import { extractTextFromImage as geminiOcr } from '../../lib/gemini.js';

dotenv.config();

const processorName = process.env.DOCUMENT_AI_PROCESSOR_ID;
const location = process.env.DOCUMENT_AI_LOCATION || 'us';
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/tiff']);

function isImageMime(mimetype) {
  return IMAGE_TYPES.has(mimetype) || /^image\//i.test(mimetype || '');
}

function isPdfMime(mimetype) {
  return mimetype === 'application/pdf';
}

async function tryGeminiOcr(buffer, mimetype) {
  const text = await geminiOcr(buffer, mimetype);
  if (text?.trim()) {
    return { text: text.trim(), structure: [], ocrEngine: 'gemini-vision' };
  }
  return null;
}

export async function runOcr(buffer, mimetype) {
  const preferDocumentAiForPdf = process.env.LEXGUARD_PDF_OCR === 'documentai';
  const preferDocumentAiForImage = process.env.LEXGUARD_IMAGE_OCR === 'documentai';

  if (isImageMime(mimetype) && !preferDocumentAiForImage) {
    try {
      const result = await tryGeminiOcr(buffer, mimetype);
      if (result) return result;
    } catch (err) {
      console.warn('[OCR] Gemini vision failed:', err.message);
      if (!processorName) throw err;
    }
  }

  if (isPdfMime(mimetype) && !preferDocumentAiForPdf) {
    try {
      const result = await tryGeminiOcr(buffer, 'application/pdf');
      if (result) return result;
    } catch (err) {
      console.warn('[OCR] Gemini PDF OCR failed:', err.message);
      if (!processorName) throw err;
    }
  }

  if (!processorName || !process.env.GOOGLE_CLOUD_PROJECT) {
    if (isImageMime(mimetype)) {
      throw new Error(
        'Image OCR failed. Set GOOGLE_CLOUD_PROJECT for Gemini vision, or DOCUMENT_AI_PROCESSOR_ID for Document AI.'
      );
    }
    if (isPdfMime(mimetype)) {
      throw new Error(
        'PDF OCR failed. Configure GOOGLE_CLOUD_PROJECT (Gemini) or DOCUMENT_AI_PROCESSOR_ID for scanned PDFs.'
      );
    }
    return {
      text: '[OCR unavailable — configure DOCUMENT_AI_PROCESSOR_ID or use PDF/DOCX upload]',
      structure: [],
      ocrSkipped: true,
    };
  }

  const client = new DocumentProcessorServiceClient({
    apiEndpoint: `${location}-documentai.googleapis.com`,
  });
  const name = `projects/${process.env.GOOGLE_CLOUD_PROJECT}/locations/${location}/processors/${processorName}`;

  const [result] = await client.processDocument({
    name,
    rawDocument: {
      content: buffer.toString('base64'),
      mimeType: mimetype,
    },
  });

  const document = result.document;
  const text = document?.text || '';

  return {
    text,
    structure: (document?.pages || []).flatMap((page, pi) =>
      (page.paragraphs || []).map((p, i) => ({
        type: 'body',
        text: extractTextFromLayout(text, p.layout),
        pageIndex: pi,
        blockIndex: i,
      }))
    ),
    ocrEngine: 'document-ai',
  };
}

function extractTextFromLayout(fullText, layout) {
  if (!layout?.textAnchor?.textSegments?.length) return '';
  return layout.textAnchor.textSegments
    .map((seg) => fullText.substring(seg.startIndex || 0, seg.endIndex || 0))
    .join('');
}
