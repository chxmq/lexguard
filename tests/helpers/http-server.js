import { createServer } from 'node:http';
import { createApp } from '../../src/server/app.js';

/**
 * Start Express on a random port for integration tests.
 * @returns {Promise<{ server: import('node:http').Server, baseUrl: string, close: () => Promise<void> }>}
 */
export function startTestServer() {
  process.env.LEXGUARD_DEMO_MODE = 'true';
  process.env.LEXGUARD_MEMORY_STORE = 'true';
  process.env.LEXGUARD_LLM_EXTRACT = 'false';
  const app = createApp({ production: false });
  const server = createServer(app);

  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${port}`,
        close: () =>
          new Promise((res, rej) => {
            server.close((err) => (err ? rej(err) : res()));
          }),
      });
    });
    server.on('error', reject);
  });
}

export async function waitForJobComplete(baseUrl, sessionId, { timeoutMs = 60_000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${baseUrl}/api/analyze/${sessionId}/status`);
    const data = await res.json();
    if (data.status === 'complete') return data;
    if (data.status === 'error') {
      throw new Error(data.error || 'Analysis failed');
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error('Timed out waiting for analysis');
}
