import { Storage } from '@google-cloud/storage';
import { Firestore } from '@google-cloud/firestore';
import dotenv from 'dotenv';

dotenv.config();

const inMemorySessions = new Map();

let storage = null;
let bucket = null;
let firestore = null;

function initGCS() {
  if (!process.env.GCS_BUCKET || !process.env.GOOGLE_CLOUD_PROJECT) return;
  storage = new Storage();
  bucket = storage.bucket(process.env.GCS_BUCKET);
}

function initFirestore() {
  if (!process.env.GOOGLE_CLOUD_PROJECT) return;
  firestore = new Firestore();
}

export async function uploadDocument(buffer, filename, sessionId) {
  initGCS();
  const path = `sessions/${sessionId}/${filename}`;

  if (bucket) {
    const file = bucket.file(path);
    await file.save(buffer, { metadata: { contentType: 'application/octet-stream' } });
    return `gs://${process.env.GCS_BUCKET}/${path}`;
  }

  return `memory://${path}`;
}

export async function saveSession(sessionId, data) {
  const payload = { ...data, updatedAt: new Date().toISOString() };

  initFirestore();
  if (firestore) {
    const collection = process.env.FIRESTORE_COLLECTION || 'sessions';
    await firestore.collection(collection).doc(sessionId).set(payload, { merge: true });
  } else {
    inMemorySessions.set(sessionId, payload);
  }

  return payload;
}

export async function getSession(sessionId) {
  initFirestore();
  if (firestore) {
    const collection = process.env.FIRESTORE_COLLECTION || 'sessions';
    const doc = await firestore.collection(collection).doc(sessionId).get();
    if (!doc.exists) return null;
    return doc.data();
  }
  return inMemorySessions.get(sessionId) ?? null;
}
