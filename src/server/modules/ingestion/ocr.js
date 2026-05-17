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

export async function runOcr(buffer, mimetype) {
  if (isImageMime(mimetype) && process.env.LEXGUARD_IMAGE_OCR !== 'documentai') {
    try {
      const text = await geminiOcr(buffer, mimetype);
      if (text?.trim()) {
        return { text: text.trim(), structure: [], ocrEngine: 'gemini-vision' };
      }
    } catch (err) {
      console.warn('[OCR] Gemini vision failed:', err.message);
      if (!processorName) throw err;
    }
  }

  if (!processorName || !process.env.GOOGLE_CLOUD_PROJECT) {
    if (isImageMime(mimetype)) {
      throw new Error(
        'Image OCR failed. Set GOOGLE_CLOUD_PROJECT for Gemini vision, or DOCUMENT_AI_PROCESSOR_ID for Document AI.'
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
