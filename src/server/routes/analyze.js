import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { ingestFile, ingestUrl } from '../modules/ingestion/ingest.js';
import { uploadDocument } from '../lib/storage.js';
import { runAnalysis } from '../modules/analysis/pipeline.js';
import {
  createJob,
  getJob,
  getJobOrHydrate,
  emitProgress,
  completeJob,
  failJob,
  subscribe,
} from '../lib/jobs.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

function safeJson(data) {
  try {
    return JSON.stringify(data);
  } catch {
    return JSON.stringify({ stage: 'error', error: 'Failed to serialize progress data' });
  }
}

async function startJob(sessionId, rawText) {
  try {
    const report = await runAnalysis({
      sessionId,
      rawText,
      onProgress: (progress) => emitProgress(sessionId, progress),
    });
    completeJob(sessionId, report);
    return report;
  } catch (err) {
    failJob(sessionId, err);
    throw err;
  }
}

async function handleAnalyze(req, res) {
  const sessionId = uuidv4();

  try {
    let rawText = req.body?.text;
    let filename = 'pasted.txt';

    if (req.file) {
      filename = req.file.originalname;
      await uploadDocument(req.file.buffer, filename, sessionId);
      const parsed = await ingestFile({
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        filename,
      });
      rawText = parsed.text;
    } else if (req.body?.url) {
      const parsed = await ingestUrl(req.body.url);
      rawText = parsed.text;
      filename = req.body.url;
    }

    if (!rawText?.trim()) {
      return res.status(400).json({ error: 'No document text provided' });
    }

    createJob(sessionId);
    startJob(sessionId, rawText).catch(console.error);

    res.json({ sessionId });
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: err.message });
  }
}

router.post('/analyze', (req, res) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    return handleAnalyze(req, res);
  }
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    handleAnalyze(req, res);
  });
});

router.get('/analyze/:sessionId/status', async (req, res) => {
  const job = (await getJobOrHydrate(req.params.sessionId)) || getJob(req.params.sessionId);
  if (!job) {
    return res.status(404).json({ error: 'Session not found', hint: 'Server may have restarted — upload again.' });
  }
  const last = job.events[job.events.length - 1];
  res.json({
    status: job.status,
    lastStage: last?.stage,
    message: last?.message,
    progress: last?.progress,
    error: job.error?.message,
  });
});

router.get('/analyze/:sessionId/stream', async (req, res) => {
  const { sessionId } = req.params;
  const job = (await getJobOrHydrate(sessionId)) || getJob(sessionId);

  if (!job) {
    return res.status(404).json({
      error: 'Session not found',
      hint: 'If the API restarted, wait a moment or open the report if analysis completed.',
    });
  }

  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const send = (event, data) => {
      res.write(`event: ${event}\ndata: ${safeJson(data)}\n\n`);
    };

    for (const evt of job.events) {
      send('progress', evt);
      if (evt.stage === 'complete') {
        send('done', { sessionId });
        return res.end();
      }
      if (evt.stage === 'error') {
        send('failed', { error: evt.error || 'Analysis failed' });
        return res.end();
      }
    }

    if (job.status === 'complete') {
      send('done', { sessionId });
      return res.end();
    }

    if (job.status === 'error') {
      send('failed', { error: job.error?.message || 'Analysis failed' });
      return res.end();
    }

    const unsub = subscribe(sessionId, (progress) => {
      try {
        send('progress', progress);
        if (progress.stage === 'complete') {
          send('done', { sessionId });
          unsub();
          res.end();
        }
        if (progress.stage === 'error') {
          send('failed', { error: progress.error || 'Analysis failed' });
          unsub();
          res.end();
        }
      } catch (err) {
        console.error('SSE send error:', err);
      }
    });

    req.on('close', () => unsub());
  } catch (err) {
    console.error('SSE stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

router.get('/session/:sessionId', async (req, res) => {
  const { getSession } = await import('../lib/storage.js');
  const session = await getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

export default router;
