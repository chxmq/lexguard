import { parsePdf } from './pdf-parser.js';
import { parseDocx } from './docx-parser.js';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const DEFAULT_HEADERS = {
  'User-Agent': BROWSER_UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isBlockedResponse(status, bodyPreview = '') {
  if ([401, 403, 429, 503].includes(status)) return true;
  const lower = bodyPreview.toLowerCase();
  return (
    lower.includes('access denied') ||
    lower.includes('captcha') ||
    lower.includes('enable javascript') ||
    lower.includes('cloudflare') ||
    lower.includes('bot detection')
  );
}

async function fetchWithRetries(url, { attempts = 3 } = {}) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, {
        headers: DEFAULT_HEADERS,
        redirect: 'follow',
        signal: AbortSignal.timeout(Number(process.env.URL_FETCH_TIMEOUT_MS) || 30_000),
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      const preview = buffer.slice(0, 2048).toString('utf-8');

      if (!response.ok || isBlockedResponse(response.status, preview)) {
        throw new Error(`HTTP ${response.status}`);
      }

      return { response, buffer };
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) await sleep(800 * (i + 1));
    }
  }
  throw lastError || new Error('URL fetch failed');
}

async function fetchViaReader(url) {
  const readerBase = process.env.URL_READER_BASE || 'https://r.jina.ai/';
  const readerUrl = `${readerBase}${url}`;
  const response = await fetch(readerUrl, {
    headers: { Accept: 'text/plain', 'User-Agent': 'LexGuard/1.0' },
    signal: AbortSignal.timeout(Number(process.env.URL_FETCH_TIMEOUT_MS) || 45_000),
  });

  if (!response.ok) {
    throw new Error(`Reader fallback failed: ${response.status}`);
  }

  const text = (await response.text()).trim();
  if (!text || text.length < 80) {
    throw new Error('Reader returned insufficient text');
  }

  return { text, structure: [], sourceUrl: url, fetchMethod: 'jina-reader' };
}

function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchFromUrl(url) {
  let buffer;
  let contentType = '';
  let fetchMethod = 'direct';

  try {
    const result = await fetchWithRetries(url);
    contentType = result.response.headers.get('content-type') || '';
    buffer = result.buffer;
  } catch (directErr) {
    console.warn(`[URL] Direct fetch failed for ${url}: ${directErr.message}`);
    if (process.env.URL_READER_FALLBACK !== 'false') {
      return fetchViaReader(url);
    }
    throw new Error(
      `Could not fetch URL (${directErr.message}). Many sites block bots — try uploading a PDF or paste the text.`
    );
  }

  if (contentType.includes('pdf') || url.toLowerCase().endsWith('.pdf')) {
    return { ...(await parsePdf(buffer)), sourceUrl: url, fetchMethod };
  }
  if (contentType.includes('wordprocessingml') || url.toLowerCase().endsWith('.docx')) {
    return { ...(await parseDocx(buffer)), sourceUrl: url, fetchMethod };
  }

  const asText = buffer.toString('utf-8');
  if (contentType.includes('text/html') || asText.includes('<html')) {
    const text = stripHtml(asText);
    if (text.length < 120 && process.env.URL_READER_FALLBACK !== 'false') {
      return fetchViaReader(url);
    }
    return { text, structure: [], sourceUrl: url, fetchMethod };
  }

  return { text: asText, structure: [], sourceUrl: url, fetchMethod };
}
