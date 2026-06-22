import { writeFile, mkdir, unlink } from "fs/promises";
import { execFile } from "child_process";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const THUMBNAIL_DIR = path.join(process.cwd(), "public", "uploads", "thumbnails");

const VALID_VIDEO_EXTENSIONS = ["mp4", "webm"];
const VALID_VIDEO_MIMES = ["video/mp4", "video/webm"];
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export const FFMPEG_TIMEOUT_MS = 30_000;
export const METADATA_CONCURRENCY = 4;
export const SAVE_CONCURRENCY = 2;

async function getFfprobePath(): Promise<string> {
  const mod = await import("@ffprobe-installer/ffprobe");
  return mod.default.path;
}

async function getFfmpegPath(): Promise<string> {
  const mod = await import("@ffmpeg-installer/ffmpeg");
  return mod.default.path;
}

function execFileWithTimeout(
  file: string,
  args: string[],
  timeoutMs: number = FFMPEG_TIMEOUT_MS
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`ffmpeg/ffprobe timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    execFile(
      file,
      args,
      { signal: controller.signal, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        clearTimeout(timer);
        if (error) {
          reject(error);
          return;
        }
        resolve({
          stdout: stdout.toString(),
          stderr: stderr.toString(),
        });
      }
    );
  });
}

export async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
  await mkdir(THUMBNAIL_DIR, { recursive: true });
}

export function isValidVideoFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return VALID_VIDEO_EXTENSIONS.includes(ext || "");
}

export function isValidVideoMime(mimeType: string): boolean {
  return VALID_VIDEO_MIMES.includes(mimeType);
}

export function getVideoFormat(fileName: string): string {
  return (fileName.split(".").pop()?.toLowerCase() || "").toUpperCase();
}

export function getMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return ext === "webm" ? "video/webm" : "video/mp4";
}

export type VideoMetadata = {
  width: number;
  height: number;
  duration: number;
};

async function getVideoMetadataFromPath(filePath: string): Promise<VideoMetadata> {
  const ffprobePath = await getFfprobePath();
  const { stdout } = await execFileWithTimeout(ffprobePath, [
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    filePath,
  ]);
  const data = JSON.parse(stdout);
  const videoStream = data.streams?.find(
    (s: { codec_type?: string }) => s.codec_type === "video"
  );
  return {
    width: videoStream?.width || 0,
    height: videoStream?.height || 0,
    duration: parseFloat(data.format?.duration || "0"),
  };
}

async function generateThumbnail(videoPath: string, thumbnailFileName: string): Promise<string | null> {
  const thumbnailPath = path.join(THUMBNAIL_DIR, thumbnailFileName);
  try {
    const ffmpegPath = await getFfmpegPath();
    await execFileWithTimeout(ffmpegPath, [
      "-i",
      videoPath,
      "-ss",
      "00:00:01",
      "-vframes",
      "1",
      "-q:v",
      "2",
      "-y",
      thumbnailPath,
    ]);
    return `/uploads/thumbnails/${thumbnailFileName}`;
  } catch {
    return null;
  }
}

export async function saveUploadedVideo(
  file: File,
  customName?: string
): Promise<{
  url: string;
  fileName: string;
  fileSize: number;
  format: string;
  width: number;
  height: number;
  duration: number;
  mimeType: string;
  thumbnailUrl: string | null;
}> {
  await ensureUploadDir();

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!isValidVideoFile(file.name)) {
    throw new Error("Invalid video format. Only MP4 and WebM are supported.");
  }
  if (file.type && !isValidVideoMime(file.type) && file.type !== "application/octet-stream") {
    throw new Error("Invalid video MIME type. Only MP4 and WebM are supported.");
  }
  if (file.size > MAX_VIDEO_SIZE) {
    throw new Error("Video file exceeds 100MB limit.");
  }

  const fileName = customName || `${uuidv4()}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const metadata = await getVideoMetadataFromPath(filePath);
  const thumbnailFileName = `${path.parse(fileName).name}.jpg`;
  const generatedThumbnail = await generateThumbnail(filePath, thumbnailFileName);

  const appUrl = (process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const url = `${appUrl}/uploads/${fileName}`;
  const thumbnailUrl = generatedThumbnail ? `${appUrl}/uploads/thumbnails/${thumbnailFileName}` : null;

  return {
    url,
    fileName,
    fileSize: buffer.length,
    format: getVideoFormat(fileName),
    width: metadata.width,
    height: metadata.height,
    duration: metadata.duration,
    mimeType: getMimeType(fileName),
    thumbnailUrl,
  };
}

export async function getVideoMetadataFromBuffer(buffer: Buffer, fileName: string): Promise<{
  width: number;
  height: number;
  duration: number;
  format: string;
  fileSize: number;
  mimeType: string;
}> {
  await ensureUploadDir();
  const tempName = `temp_${uuidv4()}_${path.basename(fileName)}`;
  const tempPath = path.join(UPLOAD_DIR, tempName);
  await writeFile(tempPath, buffer);

  try {
    const metadata = await getVideoMetadataFromPath(tempPath);
    return {
      width: metadata.width,
      height: metadata.height,
      duration: metadata.duration,
      format: getVideoFormat(fileName),
      fileSize: buffer.length,
      mimeType: getMimeType(fileName),
    };
  } finally {
    try {
      await unlink(tempPath);
    } catch {
      // ignore cleanup errors
    }
  }
}

export type SaveVideoOptions = {
  generateThumbnail?: boolean;
};

export async function saveVideoFromBuffer(
  buffer: Buffer,
  originalPath: string,
  options: SaveVideoOptions = {}
) {
  const { generateThumbnail: shouldGenerateThumbnail = true } = options;
  const baseName = originalPath.split(/[/\\]/).pop() || originalPath;
  if (!isValidVideoFile(baseName)) {
    throw new Error("Invalid video format");
  }
  await ensureUploadDir();
  const ext = baseName.split(".").pop()?.toLowerCase() || "mp4";
  const fileName = `${uuidv4()}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  await writeFile(filePath, buffer);

  const metadata = await getVideoMetadataFromPath(filePath);
  let thumbnailUrl: string | null = null;
  const appUrl = (process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  if (shouldGenerateThumbnail) {
    const thumbnailFileName = `${path.parse(fileName).name}.jpg`;
    const generatedThumbnail = await generateThumbnail(filePath, thumbnailFileName);
    if (generatedThumbnail) {
      thumbnailUrl = `${appUrl}/uploads/thumbnails/${thumbnailFileName}`;
    }
  }
  return {
    url: `${appUrl}/uploads/${fileName}`,
    fileName,
    fileSize: buffer.length,
    format: getVideoFormat(baseName),
    width: metadata.width,
    height: metadata.height,
    duration: metadata.duration,
    mimeType: getMimeType(baseName),
    thumbnailUrl,
  };
}

export const saveUploadedFile = saveUploadedVideo;
export const isValidImageFile = isValidVideoFile;
export const getImageMetadataFromBuffer = getVideoMetadataFromBuffer;
