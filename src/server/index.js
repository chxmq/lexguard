import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import analyzeRoutes from './routes/analyze.js';
import exportRoutes from './routes/export.js';
import chatRoutes from './routes/chat.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3050;
const isProduction = process.env.NODE_ENV === 'production';

const corsOrigins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean);
app.use(
  cors(
    corsOrigins?.length
      ? { origin: corsOrigins, credentials: true }
      : isProduction
        ? false
        : undefined
  )
);
app.use(express.json({ limit: '25mb' }));

app.get('/api/health', async (_req, res) => {
  const { getVectorSearchStatus } = await import('./modules/rag/vertex-vector-search.js');
  res.json({
    status: 'ok',
    demoMode: process.env.LEXGUARD_DEMO_MODE === 'true',
    environment: process.env.NODE_ENV || 'development',
    vertex: {
      project: process.env.GOOGLE_CLOUD_PROJECT || null,
      location: process.env.VERTEX_AI_LOCATION || null,
    },
    vectorSearch: getVectorSearchStatus(),
    documentAi: Boolean(process.env.DOCUMENT_AI_PROCESSOR_ID),
    imageOcr: process.env.LEXGUARD_IMAGE_OCR || 'gemini-vision',
    urlReaderFallback: process.env.URL_READER_FALLBACK !== 'false',
  });
});

app.use('/api', authRoutes);
app.use('/api', analyzeRoutes);
app.use('/api', exportRoutes);
app.use('/api', chatRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

if (isProduction) {
  const distPath = path.join(__dirname, '../../dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`LexGuard API listening on port ${PORT} (${isProduction ? 'production' : 'development'})`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already in use. Stop the other process or set PORT in .env.`
    );
    process.exit(1);
  }
  throw err;
});
