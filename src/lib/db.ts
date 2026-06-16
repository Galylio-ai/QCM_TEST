import { getStore } from '@netlify/blobs';

export type SessionEvent = {
  type: string;
  suspicious: boolean;
  details: unknown;
  at: string;
};

export type Recording = {
  filename: string;
  size: number;
  uploadedAt: string;
};

export type Session = {
  token: string;
  candidateName: string;
  candidateEmail: string;
  createdAt: string;
  status: 'pending' | 'in_progress' | 'submitted';
  startedAt: string | null;
  submittedAt: string | null;
  answers: Record<string, number | null>;
  events: SessionEvent[];
  score: number | null;
  antiFraudScore: string | null;
  recordings: Recording[];
};

function sessionsStore() {
  return getStore('qcm-sessions');
}

function recordingsStore() {
  return getStore('qcm-recordings');
}

export async function getSession(token: string): Promise<Session | null> {
  const store = sessionsStore();
  return store.get(token, { type: 'json' });
}

export async function saveSession(session: Session): Promise<void> {
  const store = sessionsStore();
  await store.set(session.token, JSON.stringify(session));
}

export async function deleteSession(token: string): Promise<void> {
  const store = sessionsStore();
  await store.delete(token);
}

export async function listSessions(): Promise<Session[]> {
  const store = sessionsStore();
  const { blobs } = await store.list();
  if (!blobs.length) return [];
  const sessions = await Promise.all(
    blobs.map(b => store.get(b.key, { type: 'json' }) as Promise<Session>)
  );
  return sessions.filter(Boolean);
}

export async function saveRecording(filename: string, data: Buffer): Promise<void> {
  const store = recordingsStore();
  await store.set(filename, data);
}

export async function getRecording(filename: string): Promise<ArrayBuffer | null> {
  const store = recordingsStore();
  return store.get(filename, { type: 'arrayBuffer' });
}
