import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import analyzeRoutes from './routes/analyze.js';
import exportRoutes from './routes/export.js';
import chatRoutes from './routes/chat.js';
import authRoutes from './routes/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @param {{ production?: boolean }} opts
 * @returns {import('express').Express}
 */
export function createApp(opts = {}) {
  const isProduction = opts.production ?? process.env.NODE_ENV === 'production';
  const app = express();

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
    const { getVertexQueueStatus } = await import('./lib/vertex-queue.js');
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
      pdfOcr: process.env.LEXGUARD_PDF_OCR || 'gemini-vision',
      crossClauseAi: process.env.LEXGUARD_CROSS_CLAUSE_AI !== 'false',
      ragMode: process.env.LEXGUARD_RAG_MODE || 'category-first',
      runtimeEmbeddings: process.env.LEXGUARD_RUNTIME_EMBEDDINGS || 'vertex',
      vertexQueue: getVertexQueueStatus(),
      oauthConfigured: Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ),
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

  return app;
}
