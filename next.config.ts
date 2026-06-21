import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@ffmpeg-installer/ffmpeg",
    "@ffprobe-installer/ffprobe",
    "@ffmpeg-installer/win32-x64",
    "@ffprobe-installer/win32-x64",
  ],
};

export default nextConfig;
