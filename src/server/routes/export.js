import { Router } from 'express';
import { getSession } from '../lib/storage.js';
import { exportToDocs } from '../modules/export/docs.js';
import { exportToSlides } from '../modules/export/slides.js';
import { exportToPdf } from '../modules/export/pdf.js';

const router = Router();

router.post('/export', async (req, res) => {
  const { sessionId, format, tokens } = req.body;

  if (!sessionId || !format) {
    return res.status(400).json({ error: 'sessionId and format required' });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  try {
    let result;
    switch (format) {
      case 'docs':
        result = await exportToDocs(session, tokens);
        break;
      case 'slides':
        result = await exportToSlides(session, tokens);
        break;
      case 'pdf':
        result = await exportToPdf(session);
        break;
      default:
        return res.status(400).json({ error: 'Invalid format. Use docs, slides, or pdf' });
    }
    res.json(result);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
