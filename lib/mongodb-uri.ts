import { execFileSync } from "child_process";
import dns from "dns";
import { promisify } from "util";

const resolveSrv = promisify(dns.resolveSrv);
const resolveTxt = promisify(dns.resolveTxt);

export interface SrvRecord {
  name: string;
  port: number;
}

function redactUri(uri: string): string {
  return uri.replace(/\/\/([^:@/]+):([^@/]+)@/, "//$1:***@");
}

function isSrvUri(uri: string): boolean {
  return uri.startsWith("mongodb+srv://");
}

function parseMongoUri(uri: string): URL {
  return new URL(uri);
}

/** Resolve SRV via Windows/Linux nslookup when Node dns.resolveSrv is blocked. */
export function resolveSrvViaNslookup(srvHost: string): SrvRecord[] {
  const query = `_mongodb._tcp.${srvHost}`;
  const output = execFileSync("nslookup", ["-type=SRV", query], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  const records: SrvRecord[] = [];
  let pendingPort = 27017;

  for (const line of output.split(/\r?\n/)) {
    const portMatch = line.match(/port\s*=\s*(\d+)/i);
    if (portMatch) {
      pendingPort = Number(portMatch[1]);
      continue;
    }

    const hostMatch = line.match(/svr hostname\s*=\s*(\S+)/i);
    if (hostMatch) {
      records.push({ name: hostMatch[1], port: pendingPort });
    }
  }

  if (records.length === 0) {
    throw new Error(`nslookup returned no SRV records for ${query}`);
  }

  return records;
}

/** Resolve Atlas TXT record (replicaSet, authSource) via nslookup. */
export function resolveTxtViaNslookup(host: string): Record<string, string> {
  const output = execFileSync("nslookup", ["-type=TXT", host], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  const params: Record<string, string> = {};
  const txtMatch = output.match(/text\s*=\s*\r?\n\s*"([^"]+)"/i);
  if (!txtMatch) return params;

  for (const part of txtMatch[1].split("&")) {
    const [key, value] = part.split("=");
    if (key && value) params[key] = value;
  }

  return params;
}

export function buildStandardUri(
  srvUri: string,
  hosts: SrvRecord[],
  txtParams: Record<string, string>
): string {
  const parsed = parseMongoUri(srvUri);
  const creds =
    parsed.username || parsed.password
      ? `${encodeURIComponent(parsed.username)}:${encodeURIComponent(parsed.password)}@`
      : "";

  const dbName = parsed.pathname.replace(/^\//, "") || "admin";
  const hostList = hosts
    .map((h) => `${h.name}:${h.port}`)
    .sort()
    .join(",");

  const params = new URLSearchParams(parsed.searchParams);
  if (txtParams.replicaSet) params.set("replicaSet", txtParams.replicaSet);
  if (txtParams.authSource) params.set("authSource", txtParams.authSource);
  params.set("ssl", "true");

  const query = params.toString();
  return `mongodb://${creds}${hostList}/${dbName}${query ? `?${query}` : ""}`;
}

async function tryNodeDnsSrv(host: string): Promise<SrvRecord[] | null> {
  try {
    const records = await resolveSrv(`_mongodb._tcp.${host}`);
    return records.map((r) => ({ name: r.name, port: r.port }));
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "ETIMEOUT") {
      return null;
    }
    throw err;
  }
}

async function tryNodeDnsTxt(host: string): Promise<Record<string, string>> {
  try {
    const records = await resolveTxt(host);
    const params: Record<string, string> = {};
    for (const chunks of records) {
      for (const part of chunks.join("").split("&")) {
        const [key, value] = part.split("=");
        if (key && value) params[key] = value;
      }
    }
    return params;
  } catch {
    return resolveTxtViaNslookup(host);
  }
}

/**
 * Resolve the best MongoDB URI for this environment.
 * Prefers mongodb+srv when Node DNS works; otherwise converts to mongodb://
 * or uses MONGODB_URI_STANDARD when set.
 */
export async function resolveMongoConnectionUri(): Promise<{
  uri: string;
  mode: "srv" | "standard-env" | "standard-converted";
}> {
  const srvUri = process.env.MONGODB_URI?.trim();
  if (!srvUri) {
    throw new Error("Please define MONGODB_URI in .env");
  }

  if (!isSrvUri(srvUri)) {
    return { uri: srvUri, mode: "standard-env" };
  }

  const parsed = parseMongoUri(srvUri);
  const clusterHost = parsed.hostname;

  const nodeSrv = await tryNodeDnsSrv(clusterHost);
  if (nodeSrv) {
    return { uri: srvUri, mode: "srv" };
  }

  const standardEnv = process.env.MONGODB_URI_STANDARD?.trim();
  if (standardEnv) {
    console.warn(
      `[mongodb] Node.js SRV lookup failed for ${clusterHost}; using MONGODB_URI_STANDARD (${redactUri(standardEnv)})`
    );
    return { uri: standardEnv, mode: "standard-env" };
  }

  console.warn(
    `[mongodb] Node.js SRV lookup failed for ${clusterHost}; converting via nslookup`
  );

  const srvRecords = resolveSrvViaNslookup(clusterHost);
  const txtParams = resolveTxtViaNslookup(clusterHost);
  const standardUri = buildStandardUri(srvUri, srvRecords, txtParams);

  console.warn(
    `[mongodb] Converted SRV URI to standard replica-set URI (${srvRecords.length} hosts)`
  );

  return { uri: standardUri, mode: "standard-converted" };
}

export { redactUri, isSrvUri };
