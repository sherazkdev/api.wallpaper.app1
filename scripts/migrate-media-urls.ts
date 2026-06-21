/**
 * Normalize legacy absolute URLs in MongoDB to relative /uploads/... paths.
 * Run: npm run db:migrate-urls
 * Dry run: npm run db:migrate-urls -- --dry-run
 */
import "dotenv/config";
import { connectDB } from "../src/lib/mongodb";
import { Sound } from "../src/lib/models";
import { toPublicMediaPath } from "../src/lib/media-url";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  await connectDB();
  const wallpapers = await Sound.find({}).select("url thumbnailUrl fileName").lean();

  let updated = 0;

  for (const wp of wallpapers) {
    const fileName = wp.fileName;
    const nextUrl = toPublicMediaPath(wp.url, { fileName, kind: "video" });
    const nextThumb = toPublicMediaPath(wp.thumbnailUrl, { fileName, kind: "thumbnail" });

    const patch: Record<string, string | null> = {};
    if (nextUrl && nextUrl !== wp.url) patch.url = nextUrl;
    if (nextThumb !== wp.thumbnailUrl) patch.thumbnailUrl = nextThumb;

    if (Object.keys(patch).length === 0) continue;

    updated++;
    console.log(`${dryRun ? "[dry-run] " : ""}Update ${fileName}:`, patch);

    if (!dryRun) {
      await Sound.updateOne({ _id: wp._id }, { $set: patch });
    }
  }

  console.log(`\n${dryRun ? "Would update" : "Updated"} ${updated} of ${wallpapers.length} records.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
