import JSZip from "jszip";
import { loadZipEntries } from "../src/lib/zip-utils";

async function main() {
  const zip = new JSZip();
  zip.file("nature/loop.mp4", Buffer.from("fake-video"));
  zip.file("readme.txt", Buffer.from("not a video"));
  zip.file("__MACOSX/._loop.mp4", Buffer.from("junk"));

  const buf = await zip.generateAsync({ type: "nodebuffer" });
  const entries = await loadZipEntries(buf);

  if (entries.length !== 2) {
    throw new Error(`Expected 2 entries, got ${entries.length}`);
  }

  const paths = entries.map((e) => e.relativePath).sort();
  if (!paths.includes("nature/loop.mp4") || !paths.includes("readme.txt")) {
    throw new Error(`Unexpected paths: ${paths.join(", ")}`);
  }

  try {
    await loadZipEntries(Buffer.from("not a zip"));
    throw new Error("Expected corrupted ZIP to fail");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (!msg.includes("Invalid or corrupted")) {
      throw err;
    }
  }

  console.log("zip-utils test passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
