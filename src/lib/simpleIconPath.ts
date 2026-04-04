import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Reads a single SVG from simple-icons/icons/<slug>.svg and returns
 * the raw path `d` attribute value, or null if not found.
 * Runs only at build/SSR time — never shipped to the browser.
 */
export function simpleIconPath(slug: string): string | null {
  try {
    const file = resolve(`node_modules/simple-icons/icons/${slug}.svg`);
    const svg = readFileSync(file, "utf-8");
    const m = svg.match(/\sd="([^"]+)"/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}
