#!/usr/bin/env node
/*
 * For every company in data/companies/*.json that has a `location` but no
 * `coordinates`, fill in `coordinates` using the centroid of that town/city.
 *
 * The map view clusters/spiderfies markers, so multiple studios that share a
 * city centroid don't lose individual identity — they just cluster.
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DIR = path.resolve("data/companies");

/**
 * Centroid lookup per `location` value used in company JSON.
 * "Scotland" is intentionally omitted — too vague to put on a single point.
 */
const LOCATION_COORDS = {
  Aberdeen: { lat: 57.1497, lng: -2.0943 },
  Alloa: { lat: 56.1167, lng: -3.7886 },
  Auchterarder: { lat: 56.294, lng: -3.709 },
  Dundee: { lat: 56.462, lng: -2.9707 },
  Dunfermline: { lat: 56.0719, lng: -3.4523 },
  "East Kilbride": { lat: 55.7644, lng: -4.1769 },
  "East Lothian": { lat: 55.9595, lng: -2.7741 },
  Edinburgh: { lat: 55.9533, lng: -3.1883 },
  Elgin: { lat: 57.6498, lng: -3.3187 },
  Fortrose: { lat: 57.5826, lng: -4.133 },
  Glasgow: { lat: 55.8642, lng: -4.2518 },
  Greenock: { lat: 55.9483, lng: -4.7611 },
  Inverness: { lat: 57.4778, lng: -4.2247 },
  Linlithgow: { lat: 55.9762, lng: -3.6029 },
  Livingston: { lat: 55.9013, lng: -3.5232 },
  Lossiemouth: { lat: 57.7167, lng: -3.2833 },
  Paisley: { lat: 55.8467, lng: -4.4239 },
  Stirling: { lat: 56.1165, lng: -3.9369 },
  "West Dunbartonshire": { lat: 55.9434, lng: -4.5664 },
  "West Lothian": { lat: 55.9054, lng: -3.552 },
};

/**
 * Insert `coordinates` into the object after `region` (or after `location`
 * if no region) so the schema-friendly fields stay grouped together.
 */
function withCoordinates(obj, coords) {
  const entries = Object.entries(obj);
  const out = {};
  let inserted = false;
  let preferredAfter = "region";
  if (!entries.some(([k]) => k === "region")) preferredAfter = "location";
  for (const [k, v] of entries) {
    out[k] = v;
    if (!inserted && k === preferredAfter) {
      out.coordinates = coords;
      inserted = true;
    }
  }
  if (!inserted) out.coordinates = coords;
  return out;
}

const files = (await readdir(DIR)).filter((f) => f.endsWith(".json")).sort();

let updated = 0;
let skippedHasCoords = 0;
let skippedNoLocation = 0;
const skippedUnknown = [];

for (const file of files) {
  const fullPath = path.join(DIR, file);
  const raw = await readFile(fullPath, "utf8");
  const data = JSON.parse(raw);
  if (data.coordinates && typeof data.coordinates.lat === "number") {
    skippedHasCoords++;
    continue;
  }
  if (!data.location) {
    skippedNoLocation++;
    continue;
  }
  const coords = LOCATION_COORDS[data.location];
  if (!coords) {
    skippedUnknown.push({ file, location: data.location, name: data.name });
    continue;
  }
  const next = withCoordinates(data, coords);
  await writeFile(fullPath, JSON.stringify(next, null, 2) + "\n");
  updated++;
}

console.log(
  `\nUpdated: ${updated}\n  skipped (already has coords): ${skippedHasCoords}\n  skipped (no location): ${skippedNoLocation}\n  skipped (unknown location): ${skippedUnknown.length}`,
);
if (skippedUnknown.length > 0) {
  console.log("\nUnknown locations (review LOCATION_COORDS):");
  for (const s of skippedUnknown) {
    console.log(`  - ${s.name} (${s.file}) → location: \"${s.location}\"`);
  }
}
