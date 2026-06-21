/**
 * End-to-end test: Mongoose + real MongoDB + ZIP upload + order + API
 * Requires: MONGODB_URI in .env, dev server on :3000
 * Run: npm run test:flow
 */
import "dotenv/config";
import mongoose from "mongoose";
import JSZip from "jszip";
import { execFileSync } from "child_process";
import { mkdirSync, readFileSync, rmSync, existsSync } from "fs";
import path from "path";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { connectDB } from "../src/lib/mongodb";
import { Sound, Category } from "../src/lib/models";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const API_KEY = process.env.API_SECRET_KEY || "wk_live_your_api_secret_key_here";

const TMP = path.join(process.cwd(), "scripts", ".tmp-test");

function makeTinyMp4(name: string): Buffer {
  mkdirSync(TMP, { recursive: true });
  const out = path.join(TMP, name);
  execFileSync(
    ffmpegInstaller.path,
    ["-y", "-f", "lavfi", "-i", "color=c=blue:s=320x240:d=1", "-c:v", "libx264", "-pix_fmt", "yuv420p", out],
    { stdio: "pipe" }
  );
  return readFileSync(out);
}

async function buildZip(): Promise<Buffer> {
  const zip = new JSZip();
  zip.file("nature/forest-loop.mp4", makeTinyMp4("forest.mp4"));
  zip.file("city/skyline-loop.mp4", makeTinyMp4("skyline.mp4"));
  zip.file("readme.txt", "not a video");
  return zip.generateAsync({ type: "nodebuffer" });
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");

  console.log("=== Connect MongoDB ===");
  await connectDB();

  console.log("=== Clean MongoDB records ===");
  await Sound.deleteMany({});
  await Category.deleteMany({});

  console.log("=== Build test ZIP ===");
  const zipBuffer = await buildZip();

  console.log("=== ZIP preview ===");
  const previewForm = new FormData();
  previewForm.append("file", new Blob([new Uint8Array(zipBuffer)], { type: "application/zip" }), "test-wallpapers.zip");
  previewForm.append("preview", "true");

  const previewRes = await fetch(`${BASE}/api/v1/wallpapers/zip-upload`, {
    method: "POST",
    headers: { "x-api-key": API_KEY },
    body: previewForm,
  });
  const previewJson = await previewRes.json();
  if (!previewJson.success) throw new Error(`Preview failed: ${previewJson.message}`);
  console.log("Preview summary:", previewJson.data.summary);
  if (previewJson.data.summary.valid !== 2) throw new Error(`Expected 2 valid videos, got ${previewJson.data.summary.valid}`);

  console.log("=== ZIP save ===");
  const saveForm = new FormData();
  saveForm.append("file", new Blob([new Uint8Array(zipBuffer)], { type: "application/zip" }), "test-wallpapers.zip");
  saveForm.append("status", "Published");

  const saveRes = await fetch(`${BASE}/api/v1/wallpapers/zip-upload`, {
    method: "POST",
    headers: { "x-api-key": API_KEY },
    body: saveForm,
  });
  const saveJson = await saveRes.json();
  if (!saveJson.success) throw new Error(`Save failed: ${saveJson.message}`);
  console.log("Saved count:", saveJson.data.count);

  const categoryCount = await Category.countDocuments();
  if (categoryCount !== 2) throw new Error(`Expected 2 categories, got ${categoryCount}`);

  console.log("=== API list order ===");
  const listRes = await fetch(`${BASE}/api/v1/wallpapers`, {
    headers: { "x-api-key": API_KEY },
  });
  const listJson = await listRes.json();
  if (!listJson.success) throw new Error("List failed");
  const wallpapers = listJson.data.wallpapers;
  console.log("Orders:", wallpapers.map((w: { order: number; name: string; category: string }) => `${w.order}:${w.name} [${w.category}]`));
  if (wallpapers.length !== 2) throw new Error(`Expected 2 wallpapers, got ${wallpapers.length}`);
  if (wallpapers[0].order !== 1 || wallpapers[1].order !== 2) throw new Error("Order not sequential from API");

  console.log("=== Admin login + reorder ===");
  const loginRes = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    }),
  });
  const loginJson = await loginRes.json();
  if (!loginJson.success) throw new Error("Admin login failed");
  const cookie = loginRes.headers.get("set-cookie")?.split(";")[0] || "";

  const reversed = [wallpapers[1].id, wallpapers[0].id];
  const reorderRes = await fetch(`${BASE}/api/admin/wallpapers/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ orderedIds: reversed }),
  });
  const reorderJson = await reorderRes.json();
  if (!reorderJson.success) throw new Error(`Reorder failed: ${reorderJson.message}`);

  const afterReorder = await Sound.find().sort({ order: 1 }).lean();
  if (String(afterReorder[0]._id) !== wallpapers[1].id) throw new Error("Reorder did not swap first item");

  console.log("=== Delete + recompact ===");
  const deleteId = String(afterReorder[0]._id);
  const delRes = await fetch(`${BASE}/api/admin/wallpapers/${deleteId}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  const delJson = await delRes.json();
  if (!delJson.success) throw new Error("Delete failed");

  const afterDel = await Sound.find().sort({ order: 1 }).lean();
  console.log("After delete count:", afterDel.length, "order:", afterDel[0]?.order);
  if (afterDel.length !== 1 || afterDel[0].order !== 1) throw new Error("Recompact after delete failed");

  console.log("\n✅ All tests passed");
}

main()
  .catch((e) => {
    console.error("\n❌ Test failed:", e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    if (existsSync(TMP)) rmSync(TMP, { recursive: true, force: true });
    await mongoose.disconnect();
  });
