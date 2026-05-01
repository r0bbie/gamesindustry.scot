/**
 * Load key=value pairs from the repo root `.env` into process.env if not
 * already set. Does not overwrite existing env vars (CI / shell wins).
 *
 * No dependencies — matching behaviour in upload-cover-art and fetch-critic-scores.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * @param repoRoot Absolute path to the project root (parent of `/scripts`).
 */
export async function loadDotEnv(repoRoot) {
  try {
    const envPath = join(repoRoot, ".env");
    const envFile = await readFile(envPath, "utf-8");
    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // No .env file — vars may come from CI or the shell environment
  }
}
