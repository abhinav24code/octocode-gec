/**
 * PlanSafe India — MongoDB Connection Pooling Singleton
 *
 * Provides a resilient MongoClient connection pool cached across Next.js
 * App Router hot reloads (global._mongoClientPromise).
 * If the connection string is absent or MongoDB Atlas is unreachable,
 * it provides a seamless in-memory fallback so demos never fail with 500 errors.
 */

import { MongoClient, ServerApiVersion, Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "plansafe_india";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | null = null;
let isConnectedToLiveDb = false;

if (uri) {
  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable to preserve connection pool across module reloads
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        connectTimeoutMS: 5000,
        socketTimeoutMS: 10000,
      });
      global._mongoClientPromise = client.connect().then((c) => {
        isConnectedToLiveDb = true;
        console.log("[PlanSafe DB] Connected to MongoDB Atlas cluster successfully.");
        return c;
      });
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    clientPromise = client.connect().then((c) => {
      isConnectedToLiveDb = true;
      return c;
    });
  }
} else {
  console.warn(
    "[PlanSafe DB] MONGODB_URI not provided. Operating in Resilient In-Memory Mode."
  );
}

/**
 * Returns the active MongoDB database instance, or null if running in fallback in-memory mode.
 */
export async function getDatabase(): Promise<Db | null> {
  if (!clientPromise) {
    return null;
  }

  try {
    const client = await clientPromise;
    return client.db(dbName);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown DB connection error";
    console.warn(
      `[PlanSafe DB] MongoDB connection error (${message}). Falling back to resilient in-memory store.`
    );
    return null;
  }
}

/**
 * Checks whether the application is currently connected to a live MongoDB instance.
 */
export function isLiveDatabaseConnected(): boolean {
  return isConnectedToLiveDb;
}
