import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DEFAULT_BASE_URL = "https://api.runalphaloops.com";

export function resolveConfig(
  apiKey?: string,
  baseUrl?: string
): { apiKey: string | undefined; baseUrl: string } {
  let resolvedKey = apiKey;
  let resolvedUrl = baseUrl;

  // Layer 2: env vars
  if (!resolvedKey) {
    resolvedKey = process.env.ALPHALOOPS_API_KEY;
  }
  if (!resolvedUrl) {
    resolvedUrl = process.env.ALPHALOOPS_BASE_URL;
  }

  // Layer 3: config file
  if (!resolvedKey || !resolvedUrl) {
    const fileConfig = readConfigFile();
    if (!resolvedKey) resolvedKey = fileConfig.api_key;
    if (!resolvedUrl) resolvedUrl = fileConfig.base_url;
  }

  return { apiKey: resolvedKey, baseUrl: resolvedUrl ?? DEFAULT_BASE_URL };
}

function readConfigFile(): Record<string, string> {
  const path = join(homedir(), ".alphaloops");
  let text: string;
  try {
    text = readFileSync(path, "utf-8").trim();
  } catch {
    return {};
  }

  if (!text) return {};

  // Try JSON first
  if (text.startsWith("{")) {
    try {
      return JSON.parse(text);
    } catch {
      // fall through to key=value
    }
  }

  // key=value format
  const config: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eqIdx = trimmed.indexOf("=");
    const key = trimmed.slice(0, eqIdx).trim().toLowerCase();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key === "api_key" || key === "alphaloops_api_key") {
      config.api_key = value;
    } else if (key === "base_url" || key === "alphaloops_base_url") {
      config.base_url = value;
    }
  }
  return config;
}
