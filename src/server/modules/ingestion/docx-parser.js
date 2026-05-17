import mammoth from 'mammoth';

export async function parseDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value;
  const lines = text.split('\n').filter((l) => l.trim());

  return {
    text,
    structure: lines.map((line, i) => ({
      type: line.length < 60 && !line.endsWith('.') ? 'heading' : 'body',
      text: line,
      lineIndex: i,
    })),
  };
}
