#!/usr/bin/env node
/**
 * Uploads cover art for a game to Cloudflare R2, optimises it to WebP, and
 * updates the game's JSON file with the resulting public URL.
 *
 * Usage:
 *   node scripts/upload-cover-art.mjs <game-slug> <path-to-image>
 *
 * Example:
 *   node scripts/upload-cover-art.mjs red-dead-redemption-2 ~/Downloads/rdr2.jpg
 *
 * Required environment variables (add to .env):
 *   R2_ACCOUNT_ID       — Cloudflare account ID
 *   R2_BUCKET_NAME      — R2 bucket name
 *   R2_ACCESS_KEY_ID    — R2 API token access key
 *   R2_SECRET_ACCESS_KEY — R2 API token secret key
 *
 * Optional (cache purge when replacing an existing cover on R2):
 *   CLOUDFLARE_ZONE_ID   — Zone ID for media.gamesindustry.scot (dash → site → Overview)
 *   CLOUDFLARE_API_TOKEN — API token with Zone → Cache Purge → Purge permission
 *
 * Output:
 *   Uploads to:  games/{slug}/cover.webp
 *   Public URL:  https://media.gamesindustry.scot/games/{slug}/cover.webp
 *   Updates:     data/games/{first-letter}/{slug}.json → cover_image field
 */

import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const GAMES_DIR = join(ROOT, "data/games");
const PUBLIC_BASE_URL = "https://media.gamesindustry.scot";

// Image processing settings
const MAX_WIDTH = 600;
const MAX_HEIGHT = 900;
const WEBP_QUALITY = 85;

async function loadEnv() {
  try {
    const envFile = await readFile(join(ROOT, ".env"), "utf-8");
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
    // No .env file — env vars may be set directly in the shell
  }
}

function findGameFile(slug) {
  const letter = slug.charAt(0).toLowerCase();
  const path = join(GAMES_DIR, letter, `${slug}.json`);
  return existsSync(path) ? path : null;
}

async function optimiseImage(inputPath) {
  console.log(`  Processing image: ${inputPath}`);
  const buffer = await sharp(inputPath)
    .resize(MAX_WIDTH, MAX_HEIGHT, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const { width, height } = await sharp(buffer).metadata();
  console.log(`  Output: ${width}×${height}px WebP (${(buffer.length / 1024).toFixed(1)} KB)`);
  return buffer;
}

function createR2Client(accountId, accessKeyId, secretAccessKey) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

async function r2ObjectExists(client, bucketName, key) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
    return true;
  } catch (err) {
    const code = err.name || err.Code;
    const status = err.$metadata?.httpStatusCode;
    if (code === "NotFound" || code === "NoSuchKey" || status === 404) {
      return false;
    }
    throw err;
  }
}

async function uploadToR2(client, buffer, key, bucketName) {
  console.log(`  Uploading to R2: ${bucketName}/${key}`);
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

/**
 * Purge Cloudflare edge cache for specific URLs (needed after replacing immutable cached objects).
 * https://developers.cloudflare.com/api/operations/zones-purge_cache
 */
async function purgeCloudflareCacheUrls(zoneId, apiToken, urls) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ files: urls }),
  });
  const data = await res.json();
  if (!data.success) {
    const msg = data.errors?.map((e) => e.message).join("; ") || res.statusText || "Unknown error";
    throw new Error(`Cloudflare cache purge failed: ${msg}`);
  }
}

async function updateGameJson(filePath, publicUrl) {
  const game = JSON.parse(await readFile(filePath, "utf-8"));
  const previous = game.cover_image || "(none)";
  game.cover_image = publicUrl;
  await writeFile(filePath, JSON.stringify(game, null, 2) + "\n");
  console.log(`  Updated cover_image: ${previous} → ${publicUrl}`);
}

async function main() {
  const [, , slug, imagePath] = process.argv;

  if (!slug || !imagePath) {
    console.error("Usage: node scripts/upload-cover-art.mjs <game-slug> <path-to-image>");
    console.error("Example: node scripts/upload-cover-art.mjs red-dead-redemption-2 ~/Downloads/rdr2.jpg");
    process.exit(1);
  }

  await loadEnv();

  const { R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;

  if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.error("Missing required environment variables. Ensure these are set in .env:");
    console.error("  R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
    process.exit(1);
  }

  // Expand ~ in path
  const resolvedImagePath = resolve(imagePath.replace(/^~/, process.env.HOME || "~"));

  if (!existsSync(resolvedImagePath)) {
    console.error(`Image file not found: ${resolvedImagePath}`);
    process.exit(1);
  }

  const gameFile = findGameFile(slug);
  if (!gameFile) {
    console.error(`Game not found: ${slug}`);
    console.error(`Expected file at: data/games/${slug.charAt(0)}/${slug}.json`);
    process.exit(1);
  }

  const r2Key = `games/${slug}/cover.webp`;
  const publicUrl = `${PUBLIC_BASE_URL}/${r2Key}`;

  console.log(`\nUploading cover art for: ${slug}`);

  const r2Client = createR2Client(R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY);
  const hadExisting = await r2ObjectExists(r2Client, R2_BUCKET_NAME, r2Key);
  if (hadExisting) {
    console.log("  Existing cover found on R2 — upload will replace it.");
  }

  const imageBuffer = await optimiseImage(resolvedImagePath);
  await uploadToR2(r2Client, imageBuffer, r2Key, R2_BUCKET_NAME);
  await updateGameJson(gameFile, publicUrl);

  if (hadExisting) {
    const zoneId = process.env.CLOUDFLARE_ZONE_ID;
    const cfToken = process.env.CLOUDFLARE_API_TOKEN;
    if (zoneId && cfToken) {
      try {
        console.log("  Purging Cloudflare cache for cover URL…");
        await purgeCloudflareCacheUrls(zoneId, cfToken, [publicUrl]);
        console.log("  Cache cleared.");
      } catch (e) {
        console.error(`  Warning: could not purge Cloudflare cache: ${e.message}`);
      }
    } else {
      console.log(
        "  Tip: set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN in .env to purge CDN cache when replacing covers."
      );
    }
  }

  console.log(`\nDone! Cover art live at:\n  ${publicUrl}\n`);
}

main().catch((err) => {
  console.error("\nError:", err.message);
  process.exit(1);
});
