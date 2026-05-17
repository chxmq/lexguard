import dotenv from 'dotenv';
import { createApp } from './app.js';
import { logger } from './lib/logger.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 3050;
const isProduction = process.env.NODE_ENV === 'production';
const app = createApp({ production: isProduction });

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info('Server', `Listening on port ${PORT}`, isProduction ? 'production' : 'development');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error('Server', `Port ${PORT} in use — stop the other process or change PORT`);
    process.exit(1);
  }
  throw err;
});

function shutdown(signal) {
  logger.info('Server', `${signal} received — shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
