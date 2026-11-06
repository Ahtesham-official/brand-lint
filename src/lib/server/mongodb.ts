import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.MONGODB_URL || '';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function isMongoConfigured(): boolean {
  return typeof uri === 'string' && uri.trim().length > 0;
}

export function getMongoClientPromise(): Promise<MongoClient> {
  if (!uri) {
    return Promise.reject(new Error('MONGODB_URI is not configured in environment variables.'));
  }

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 6000,
      });
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  } else {
    if (!clientPromise) {
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 6000,
      });
      clientPromise = client.connect();
    }
    return clientPromise;
  }
}

export async function getMongoDb(): Promise<Db> {
  const c = await getMongoClientPromise();
  return c.db('brandlint');
}

