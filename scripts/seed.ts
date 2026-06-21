import "dotenv/config";
import { connectDB } from "../src/lib/mongodb";
import { AppSettings } from "../src/lib/models";

async function main() {
  const apiKey = process.env.API_SECRET_KEY;
  if (!apiKey) {
    console.error("API_SECRET_KEY is required in .env");
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is required in .env");
    process.exit(1);
  }

  await connectDB();

  const existing = await AppSettings.findById("default").lean();
  if (!existing) {
    await AppSettings.create({
      _id: "default",
      apiKey,
      totalRequests: 0,
      rateLimitPerHour: 1000,
    });
    console.log("AppSettings initialized.");
  } else {
    console.log("AppSettings already exists.");
  }

  console.log("No sample/demo wallpaper data inserted.");
}

main()
  .catch(console.error)
  .finally(async () => {
    process.exit(0);
  });
