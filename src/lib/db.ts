import { Readable } from 'stream';
import { getDB, getGridFSBucket } from './mongodb';

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
  gridfsId?: string;
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

async function col() {
  const db = await getDB();
  return db.collection<Session>('sessions');
}

export async function getSession(token: string): Promise<Session | null> {
  const c = await col();
  return c.findOne({ token }, { projection: { _id: 0 } });
}

export async function getSessionByEmail(email: string): Promise<Session | null> {
  if (!email) return null;
  const c = await col();
  return c.findOne({ candidateEmail: email.toLowerCase().trim() }, { projection: { _id: 0 } });
}

export async function saveSession(session: Session): Promise<void> {
  const c = await col();
  await c.replaceOne({ token: session.token }, session, { upsert: true });
}

export async function deleteSession(token: string): Promise<void> {
  const c = await col();
  await c.deleteOne({ token });
}

export async function listSessions(): Promise<Session[]> {
  const c = await col();
  return c.find({}, { projection: { _id: 0 } }).toArray();
}

// GridFS recordings
export async function saveRecording(filename: string, data: Buffer): Promise<string> {
  const bucket = await getGridFSBucket();
  return new Promise((resolve, reject) => {
    const readable = Readable.from(data);
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: { uploadedAt: new Date().toISOString() }
    });
    readable.pipe(uploadStream);
    uploadStream.on('finish', () => resolve(uploadStream.id.toString()));
    uploadStream.on('error', reject);
  });
}

export async function getRecordingStream(filename: string) {
  const bucket = await getGridFSBucket();
  // Find by filename, take the most recent
  const files = await bucket.find({ filename }).sort({ uploadDate: -1 }).limit(1).toArray();
  if (!files.length) return null;
  return { stream: bucket.openDownloadStream(files[0]._id), size: files[0].length };
}
