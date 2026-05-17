import { getSession, saveSession } from './storage.js';
import { logger } from './logger.js';

const jobs = new Map();

function serializeJob(job) {
  return {
    status: job.status,
    events: job.events.slice(-80),
    error: job.error?.message ?? null,
    hasReport: !!job.report,
  };
}

async function persistJob(sessionId, job) {
  if (!job) return;
  try {
    await saveSession(sessionId, {
      sessionId,
      jobStatus: job.status,
      jobEvents: job.events.slice(-80),
      jobError: job.error?.message ?? null,
    });
  } catch (err) {
    logger.warn('JobStore', 'Failed to persist job', err.message);
  }
}

export function createJob(sessionId) {
  const job = {
    sessionId,
    events: [],
    listeners: [],
    status: 'pending',
    report: null,
    error: null,
  };
  jobs.set(sessionId, job);
  persistJob(sessionId, job).catch(() => {});
  return job;
}

export function getJob(sessionId) {
  return jobs.get(sessionId);
}

export async function getJobOrHydrate(sessionId) {
  const existing = jobs.get(sessionId);
  if (existing) return existing;

  const session = await getSession(sessionId);
  if (!session) return null;

  if (session.completedAt && session.clauses) {
    const job = {
      sessionId,
      events: session.jobEvents || [{ stage: 'complete', report: session }],
      listeners: [],
      status: 'complete',
      report: session,
      error: null,
    };
    jobs.set(sessionId, job);
    return job;
  }

  if (session.jobEvents?.length) {
    const job = {
      sessionId,
      events: session.jobEvents,
      listeners: [],
      status: session.jobStatus || 'pending',
      report: session.jobStatus === 'complete' ? session : null,
      error: session.jobError ? new Error(session.jobError) : null,
    };
    jobs.set(sessionId, job);
    return job;
  }

  return null;
}

export function emitProgress(sessionId, data) {
  const job = jobs.get(sessionId);
  if (!job) return;
  job.events.push(data);
  if (data.stage === 'complete') {
    job.status = 'complete';
    job.report = data.report ?? job.report;
  }
  if (data.stage === 'error') {
    job.status = 'error';
    job.error = new Error(data.error || 'Analysis failed');
  } else if (job.status === 'pending') {
    job.status = 'running';
  }
  for (const listener of job.listeners) {
    listener(data);
  }
  persistJob(sessionId, job).catch(() => {});
}

export function completeJob(sessionId, report) {
  const job = jobs.get(sessionId);
  if (!job) return;
  job.status = 'complete';
  job.report = report;
  emitProgress(sessionId, { stage: 'complete', report });
}

export function failJob(sessionId, error) {
  const job = jobs.get(sessionId);
  if (!job) return;
  const message =
    error instanceof Error
      ? error.message
      : String(error?.message ?? error ?? 'Analysis failed');
  job.status = 'error';
  job.error = error instanceof Error ? error : new Error(message);
  emitProgress(sessionId, { stage: 'error', error: message });
}

export function subscribe(sessionId, listener) {
  const job = jobs.get(sessionId);
  if (!job) return () => {};
  job.listeners.push(listener);
  return () => {
    job.listeners = job.listeners.filter((l) => l !== listener);
  };
}
