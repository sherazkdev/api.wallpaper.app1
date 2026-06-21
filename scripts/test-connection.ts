/**
 * Quick MongoDB connection test (uses SRV fallback when Node DNS fails).
 * Run: npx tsx scripts/test-connection.ts
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/mongodb";

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is required in .env");
    process.exit(1);
  }

  await connectDB();
  const dbName = mongoose.connection.db?.databaseName;
  const collections = await mongoose.connection.db?.listCollections().toArray();
  console.log(`Database: ${dbName}`);
  console.log(`Collections: ${collections?.map((c) => c.name).join(", ") || "(none)"}`);
  console.log("Connection test passed.");
}

main()
  .catch((err) => {
    console.error("Connection test failed:", err.message || err);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
