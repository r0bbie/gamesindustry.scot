#!/usr/bin/env node
/*
 * Generate public/og-default.png — the 1200×630 social share image used by
 * any page that doesn't override `image` on BaseLayout (homepage, list pages,
 * and any detail page without its own image).
 *
 * Re-run via `npm run prebuild` so it's regenerated on every production build
 * (cheap, deterministic, and keeps the image in sync if branding changes).
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const W = 1200;
const H = 630;
const OUT = path.resolve("public/og-default.png");

const TITLE = "Scottish Games Industry";
const TAGLINE = "The open directory of the Scottish games industry";
const SUBTAG = "Studios · Games · Freelancers · Events · Education";
const URL = "gamesindustry.scot";

const logoSvg = await readFile("public/logo.svg", "utf8");
const logoB64 = Buffer.from(logoSvg).toString("base64");

// 1200×630 OG card. Dark navy gradient, brand blue accents matching --primary.
// Logo at left, title + tagline + url stacked on right. Subtle radial glow for depth.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#0a1228"/>
      <stop offset="100%" stop-color="#050810"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.2" cy="0.5" r="0.7">
      <stop offset="0%" stop-color="#0b5594" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#0b5594" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- Brand line top + bottom -->
  <rect x="0" y="0" width="${W}" height="6" fill="#0b5594"/>
  <rect x="0" y="${H - 6}" width="${W}" height="6" fill="#0b5594"/>

  <!-- Logo, left -->
  <image href="data:image/svg+xml;base64,${logoB64}" x="80" y="195" width="240" height="240"/>

  <!-- Right column text -->
  <text x="380" y="280" fill="#ffffff" font-family="Inter, 'Helvetica Neue', Arial, sans-serif"
        font-size="64" font-weight="800" letter-spacing="-1.5">${TITLE}</text>

  <text x="380" y="345" fill="#9fb3dd" font-family="Inter, 'Helvetica Neue', Arial, sans-serif"
        font-size="28" font-weight="500">${TAGLINE}</text>

  <text x="380" y="395" fill="#6f86b4" font-family="Inter, 'Helvetica Neue', Arial, sans-serif"
        font-size="22" font-weight="400">${SUBTAG}</text>

  <!-- URL pill bottom right -->
  <rect x="${W - 320}" y="${H - 90}" width="240" height="46" rx="23" fill="#0b5594"/>
  <text x="${W - 200}" y="${H - 58}" text-anchor="middle" fill="#ffffff"
        font-family="Inter, 'Helvetica Neue', Arial, sans-serif" font-size="22" font-weight="600">${URL}</text>
</svg>
`;

const buf = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
await writeFile(OUT, buf);
console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${W}×${H}, ${buf.length} bytes)`);
