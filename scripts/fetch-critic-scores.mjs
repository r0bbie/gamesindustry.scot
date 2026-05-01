#!/usr/bin/env node
/**
 * Fetches live critic scores from external APIs and writes them to a cache file.
 * Run automatically as the `prebuild` npm script; failures are non-fatal so a
 * broken API / missing key never blocks a build — previous cached values are kept.
 *
 * Supported sources:
 *   - OpenCritic  (requires a free RapidAPI key — see README or .env.example)
 *
 * Metacritic and CriticDB have no public APIs, so their scores must be updated
 * manually in the game JSON files.
 *
 * Setup:
 *   1. Sign up at https://rapidapi.com/opencritic-opencritic-default/api/opencritic-api
 *   2. Copy your key and add it to .env:  RAPIDAPI_KEY=your_key_here
 *   3. Scores are fetched on every `npm run build` and cached in data/cache/critic-scores.json
 */

import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { loadDotEnv } from "./load-dotenv.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const GAMES_DIR = join(ROOT, "data/games");
const CACHE_DIR = join(ROOT, "data/cache");
const CACHE_FILE = join(CACHE_DIR, "critic-scores.json");

const OPENCRITIC_HOST = "opencritic-api.p.rapidapi.com";
const DELAY_MS = 300;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function walkDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkDir(full)));
    } else if (entry.name.endsWith(".json")) {
      files.push(full);
    }
  }
  return files;
}

async function fetchOpenCritic(opencriticId, apiKey) {
  // opencriticId stored as "3717/slug" — only the numeric part is needed
  const numericId = opencriticId.split("/")[0];
  const res = await fetch(
    `https://${OPENCRITIC_HOST}/game/${numericId}`,
    {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": OPENCRITIC_HOST,
      },
      signal: AbortSignal.timeout(10_000),
    }
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${body ? `: ${body.slice(0, 120)}` : ""}`);
  }
  const data = await res.json();
  const score = data.topCriticScore ?? data.score ?? null;
  if (score === null || score < 0) throw new Error("No valid score in response");
  return Math.round(score);
}

async function main() {
  await loadDotEnv(ROOT);

  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    console.log(
      "ℹ  RAPIDAPI_KEY not set — skipping critic score fetch.\n" +
        "   Sign up free at https://rapidapi.com/opencritic-opencritic-default/api/opencritic-api\n" +
        "   then add RAPIDAPI_KEY=your_key to your .env file."
    );
    return;
  }

  // Load existing cache — preserves values for games we can't currently reach
  let cache = {};
  try {
    cache = JSON.parse(await readFile(CACHE_FILE, "utf-8"));
    console.log("Loaded existing cache.");
  } catch {
    console.log("No existing cache — starting fresh.");
  }

  const gameFiles = await walkDir(GAMES_DIR);
  let fetched = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of gameFiles) {
    let game;
    try {
      game = JSON.parse(await readFile(file, "utf-8"));
    } catch {
      continue;
    }

    if (!game.critic_ids || Object.keys(game.critic_ids).length === 0) {
      continue;
    }

    const gameCache = { ...(cache[game.id] ?? {}) };
    let changed = false;

    if (game.critic_ids.opencritic) {
      try {
        const score = await fetchOpenCritic(game.critic_ids.opencritic, apiKey);
        gameCache.opencritic = score;
        changed = true;
        fetched++;
        console.log(`  ✓ ${game.id}  OpenCritic → ${score}`);
        await sleep(DELAY_MS);
      } catch (err) {
        failed++;
        const cached = gameCache.opencritic;
        console.warn(
          `  ✗ ${game.id}  OpenCritic fetch failed (${err.message})` +
            (cached !== undefined ? ` — keeping cached value ${cached}` : " — no cached value")
        );
      }
    } else {
      skipped++;
    }

    if (changed) {
      cache[game.id] = gameCache;
    }
  }

  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2) + "\n");

  console.log(`\nDone — fetched: ${fetched}, failed: ${failed}, skipped: ${skipped}`);
  console.log("Cache saved to data/cache/critic-scores.json");
}

main().catch((err) => {
  console.error("fetch-critic-scores failed:", err.message);
  // Exit 0 so a script failure never blocks the build
  process.exit(0);
});
