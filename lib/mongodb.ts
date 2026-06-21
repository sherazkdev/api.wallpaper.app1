import dns from "dns";
import mongoose from "mongoose";
import { redactUri, resolveMongoConnectionUri } from "./mongodb-uri";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  uri: string | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
  uri: null,
};
if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const CONNECT_OPTIONS = {
  bufferCommands: false,
  family: 4 as const,
};

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      const { uri, mode } = await resolveMongoConnectionUri();
      cached.uri = uri;

      console.log(`[mongodb] Connecting (${mode}): ${redactUri(uri)}`);

      try {
        const conn = await mongoose.connect(uri, CONNECT_OPTIONS);
        console.log("[mongodb] Connected successfully");
        return conn;
      } catch (err) {
        console.error(
          "[mongodb] Connection failed:",
          err instanceof Error ? err.message : err
        );
        throw err;
      }
    })().catch((err) => {
      cached.promise = null;
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
