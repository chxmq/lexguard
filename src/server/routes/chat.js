import { Router } from 'express';
import { getSession } from '../lib/storage.js';
import { generateText, isDemoMode } from '../lib/gemini.js';
import { retrieveBenchmarks } from '../modules/rag/retriever.js';
import { normalizeClauseItems } from '../../shared/clause-utils.js';
import { inferClauseCategory } from '../lib/infer-clause-category.js';

const router = Router();

function buildChatContext(session, question, selectedCategory) {
  const header = session.rawTextPreview || '';
  const clauses = normalizeClauseItems(session.clauses)
    .slice(0, 10)
    .map((c) => `[${c.clause.category}]\n${c.clause.text?.slice(0, 500) || ''}`)
    .join('\n\n');

  const focus = selectedCategory
    ? normalizeClauseItems(session.clauses).find((c) => c.clause?.category === selectedCategory)
    : null;

  const focusBlock = focus
    ? `\nFocused clause (${selectedCategory}):\n${focus.clause.text?.slice(0, 800) || ''}\nSeverity: ${focus.classifier?.severity}\n`
    : '';

  return `Contract header:\n${header}\n\nKey clauses:\n${clauses}${focusBlock}\nUser question: ${question}`;
}

export async function chatRouterHandler(req, res) {
  const { sessionId, question, selectedCategory } = req.body;
  if (!sessionId || !question) {
    return res.status(400).json({ error: 'sessionId and question required' });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (isDemoMode()) {
    return res.status(503).json({ error: 'Chat requires Vertex AI (LEXGUARD_DEMO_MODE must be false)' });
  }

  const clauseItems = normalizeClauseItems(session.clauses);
  const benchmarkCategory = inferClauseCategory(question, clauseItems, selectedCategory);
  const relevant = await retrieveBenchmarks(question, session.documentType, benchmarkCategory);
  const context = buildChatContext(session, question, selectedCategory);

  const prompt = `You are LexGuard contract counsel. Answer based on the contract context. Be specific. Reference Indian jurisdiction where relevant.

${context}

Relevant benchmarks:
${relevant.map((r) => r.text).join('\n')}

Question: ${question}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  try {
    const answer = await generateText(prompt, { modelTier: 'pro', maxOutputTokens: 4096 });

    const chunkSize = 40;
    for (let i = 0; i < answer.length; i += chunkSize) {
      res.write(`data: ${JSON.stringify({ text: answer.slice(i, i + chunkSize) })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}

router.post('/chat', chatRouterHandler);

export default router;
