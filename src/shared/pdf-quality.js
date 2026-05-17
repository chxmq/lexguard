/** Minimum average characters per page before treating a PDF as text-sparse (scanned). */
const MIN_CHARS_PER_PAGE = 80;

export function isPdfTextSparse(text, pageCount = 1) {
  const trimmed = (text || '').trim();
  const pages = Math.max(1, pageCount || 1);
  if (!trimmed) return true;
  return trimmed.length / pages < MIN_CHARS_PER_PAGE;
}
