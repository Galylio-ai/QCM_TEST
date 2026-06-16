import fs from 'fs';
import path from 'path';

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

export type DB = {
  sessions: Record<string, Session>;
};

const DATA_DIR = path.join(process.cwd(), 'data');
export const REC_DIR = path.join(DATA_DIR, 'recordings');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(REC_DIR)) fs.mkdirSync(REC_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ sessions: {} }, null, 2));
}

export function loadDB(): DB {
  ensureDirs();
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

export function saveDB(db: DB) {
  ensureDirs();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}
