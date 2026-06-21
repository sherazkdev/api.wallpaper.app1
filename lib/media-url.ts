const UPLOADS_PATH_RE = /\/uploads\/(.+)$/i;
const PUBLIC_UPLOADS_PATH_RE = /(?:^|\/)public\/uploads\/(.+)$/i;

function basenameWithoutExt(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() || fileName;
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(0, dot) : base;
}

function extractUploadsPath(value: string): string | null {
  const normalized = value.replace(/\\/g, "/").split("?")[0].split("#")[0];
  const match = normalized.match(UPLOADS_PATH_RE) || normalized.match(PUBLIC_UPLOADS_PATH_RE);
  if (!match) return null;
  return `/uploads/${match[1]}`;
}

export type MediaPathFallback = {
  fileName?: string;
  kind?: "video" | "thumbnail";
};

/** Normalize stored or legacy URLs to same-origin `/uploads/...` paths. */
export function toPublicMediaPath(
  url: string | null | undefined,
  fallback?: MediaPathFallback
): string | null {
  if (url?.trim()) {
    const trimmed = url.trim();
    if (trimmed.startsWith("/uploads/")) return trimmed;

    const extracted = extractUploadsPath(trimmed);
    if (extracted) return extracted;

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      try {
        const pathname = new URL(trimmed).pathname;
        if (pathname.startsWith("/uploads/")) return pathname;
        const fromPathname = extractUploadsPath(pathname);
        if (fromPathname) return fromPathname;
      } catch {
        // ignore invalid URLs
      }
    }
  }

  if (fallback?.fileName) {
    if (fallback.kind === "thumbnail") {
      return `/uploads/thumbnails/${basenameWithoutExt(fallback.fileName)}.jpg`;
    }
    return `/uploads/${fallback.fileName}`;
  }

  return null;
}

/** Client-safe resolver: returns a browser-usable same-origin media path. */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  return toPublicMediaPath(url);
}

export function thumbnailPathFromFileName(fileName: string): string {
  return `/uploads/thumbnails/${basenameWithoutExt(fileName)}.jpg`;
}

export function videoPathFromFileName(fileName: string): string {
  return `/uploads/${fileName}`;
}

/** Absolute URL for external API clients; relative path for same-origin admin UI. */
export function toAbsoluteMediaUrl(
  url: string | null | undefined,
  baseUrl: string,
  fallback?: MediaPathFallback
): string | null {
  const relative = toPublicMediaPath(url, fallback);
  if (!relative) return null;
  if (relative.startsWith("http://") || relative.startsWith("https://")) return relative;
  const base = baseUrl.replace(/\/$/, "");
  return `${base}${relative}`;
}
