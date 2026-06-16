import { MongoClient, GridFSBucket } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  // Reuse connection across hot-reloads in dev, create once per cold start in prod
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 20000,
      connectTimeoutMS: 10000,
    });
    global._mongoClientPromise = client.connect();
  }
  return global._mongoClientPromise;
}

export async function getDB() {
  const client = await getClientPromise();
  return client.db();
}

export async function getGridFSBucket(): Promise<GridFSBucket> {
  const db = await getDB();
  return new GridFSBucket(db, { bucketName: 'recordings' });
}
