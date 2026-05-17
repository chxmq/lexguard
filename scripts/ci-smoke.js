#!/usr/bin/env node
/**
 * CI production smoke: start server, poll /api/health, validate JSON, exit.
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

// Avoid 8080 — often occupied on shared CI runners.
const PORT = Number(process.env.PORT) || 19080;
const HOST = '127.0.0.1';
const MAX_ATTEMPTS = 30;
const POLL_MS = 500;

const child = spawn(process.execPath, ['src/server/index.js'], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    LEXGUARD_DEMO_MODE: 'true',
    LEXGUARD_MEMORY_STORE: 'true',
    PORT: String(PORT),
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

child.stdout?.on('data', (chunk) => process.stdout.write(chunk));
child.stderr?.on('data', (chunk) => process.stderr.write(chunk));

function stopServer() {
  if (!child.killed) {
    child.kill('SIGTERM');
  }
}

process.on('SIGINT', () => {
  stopServer();
  process.exit(130);
});
process.on('SIGTERM', () => {
  stopServer();
  process.exit(143);
});

let failed = false;

try {
  let health = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`http://${HOST}:${PORT}/api/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        health = await res.json();
        break;
      }
    } catch {
      // server still starting
    }
    await sleep(POLL_MS);
  }

  if (!health) {
    console.error(`[ci-smoke] /api/health did not respond on port ${PORT} within ${(MAX_ATTEMPTS * POLL_MS) / 1000}s`);
    failed = true;
  } else if (health.status !== 'ok') {
    console.error('[ci-smoke] expected status "ok", got', health.status);
    failed = true;
  } else if (health.demoMode !== true) {
    console.error('[ci-smoke] expected demoMode true, got', health.demoMode);
    failed = true;
  } else {
    console.log('[ci-smoke] OK', JSON.stringify({ status: health.status, demoMode: health.demoMode, environment: health.environment }));
  }
} finally {
  stopServer();
  await new Promise((resolve) => {
    child.on('exit', resolve);
    setTimeout(resolve, 5000);
  });
}

process.exit(failed ? 1 : 0);
