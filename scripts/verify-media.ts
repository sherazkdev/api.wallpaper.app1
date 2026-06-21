/**
 * Verify media files on disk match MongoDB records and test HTTP serving.
 * Run: npm run verify:media
 * Optional: BASE=http://localhost:3000 npm run verify:media
 */
import "dotenv/config";
import { connectDB } from "../src/lib/mongodb";
import { Sound } from "../src/lib/models";
import { toPublicMediaPath, thumbnailPathFromFileName } from "../src/lib/media-url";
import { uploadFileExists, UPLOAD_ROOT } from "../src/lib/serve-media";
import { existsSync } from "fs";
import path from "path";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function headOk(url: string): Promise<{ ok: boolean; status: number; acceptRanges?: string }> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return {
      ok: res.ok,
      status: res.status,
      acceptRanges: res.headers.get("accept-ranges") || undefined,
    };
  } catch {
    return { ok: false, status: 0 };
  }
}

async function main() {
  console.log(`Upload root: ${UPLOAD_ROOT}`);
  if (!existsSync(UPLOAD_ROOT)) {
    console.warn("⚠ uploads directory does not exist — create it by uploading a wallpaper");
  }

  await connectDB();
  const wallpapers = await Sound.find({}).select("name url fileName thumbnailUrl").lean();

  if (wallpapers.length === 0) {
    console.log("No wallpapers in database.");
    process.exit(0);
  }

  let missingVideo = 0;
  let missingThumb = 0;
  let badUrl = 0;
  let httpFail = 0;

  for (const wp of wallpapers) {
    const videoPath = toPublicMediaPath(wp.url, { fileName: wp.fileName, kind: "video" });
    const thumbPath =
      toPublicMediaPath(wp.thumbnailUrl, { fileName: wp.fileName, kind: "thumbnail" }) ||
      thumbnailPathFromFileName(wp.fileName);

    if (!videoPath?.startsWith("/uploads/")) {
      console.error(`✗ ${wp.name}: could not normalize url "${wp.url}"`);
      badUrl++;
      continue;
    }

    const videoRel = videoPath.replace(/^\/uploads\//, "");
    const thumbRel = thumbPath.replace(/^\/uploads\//, "");

    const videoOnDisk = uploadFileExists(videoRel);
    const thumbOnDisk = uploadFileExists(thumbRel);

    if (!videoOnDisk) {
      console.error(`✗ ${wp.name}: video missing on disk → ${path.join(UPLOAD_ROOT, videoRel)}`);
      missingVideo++;
    }

    if (!thumbOnDisk) {
      console.warn(`⚠ ${wp.name}: thumbnail missing → ${path.join(UPLOAD_ROOT, thumbRel)}`);
      missingThumb++;
    }

    const videoHead = await headOk(`${BASE}${videoPath}`);
    if (!videoHead.ok) {
      console.error(`✗ ${wp.name}: HTTP ${videoHead.status} for ${videoPath}`);
      httpFail++;
    } else if (videoHead.acceptRanges !== "bytes") {
      console.warn(`⚠ ${wp.name}: missing Accept-Ranges header on ${videoPath}`);
    } else {
      console.log(`✓ ${wp.name}: ${videoPath}`);
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Total: ${wallpapers.length}`);
  console.log(`Missing video files: ${missingVideo}`);
  console.log(`Missing thumbnails: ${missingThumb}`);
  console.log(`Bad URLs: ${badUrl}`);
  console.log(`HTTP failures: ${httpFail}`);

  if (missingVideo > 0 || badUrl > 0 || httpFail > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
