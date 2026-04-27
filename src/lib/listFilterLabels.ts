/**
 * Human-readable labels for games list filters (platform + genre), matching
 * data/platforms names where available.
 */

const PLATFORM_NAMES: Record<string, string> = {
  "3ds": "Nintendo 3DS",
  amiga: "Amiga",
  android: "Android",
  "atari-st": "Atari ST",
  browser: "Browser",
  "commodore-64": "Commodore 64",
  ds: "Nintendo DS",
  dsi: "Nintendo DSi",
  evercade: "Evercade",
  "game-boy-advance": "Game Boy Advance",
  "game-boy": "Game Boy",
  "game-gear": "Game Gear",
  gamecube: "GameCube",
  "htc-vive": "HTC Vive",
  ios: "iOS",
  "java-me": "Mobile (J2ME)",
  linux: "Linux",
  macos: "macOS",
  "meta-quest": "Meta Quest",
  "n-gage": "N-Gage",
  n64: "Nintendo 64",
  nes: "NES",
  pc: "PC",
  pico: "Pico",
  playdate: "Playdate",
  "ps-vita": "PlayStation Vita",
  ps1: "PlayStation",
  ps2: "PlayStation 2",
  ps3: "PlayStation 3",
  ps4: "PlayStation 4",
  ps5: "PlayStation 5",
  psp: "PlayStation Portable",
  roku: "Roku",
  "sega-dreamcast": "Sega Dreamcast",
  "sega-genesis": "Sega Genesis",
  "sega-saturn": "Sega Saturn",
  "sky-tv": "Sky TV",
  snes: "SNES",
  "switch-2": "Nintendo Switch 2",
  switch: "Nintendo Switch",
  "tilt-five": "Tilt Five",
  vr: "VR",
  "wii-u": "Wii U",
  wii: "Wii",
  "xbox-360": "Xbox 360",
  "xbox-one": "Xbox One",
  "xbox-series-xs": "Xbox Series X|S",
  xbox: "Xbox",
};

const GENRE_KNOWN: Record<string, string> = {
  rpg: "RPG",
  fps: "FPS",
  mmo: "MMO",
  mmorpg: "MMORPG",
  mmos: "MMOs",
  rts: "RTS",
  tbs: "TBS",
  tps: "TPS",
  ar: "AR",
  br: "BR",
  roguelike: "Roguelike",
  roguelite: "Roguelite",
  "co-op": "Co-op",
  co_op: "Co-op",
  "4x": "4X",
  "2d": "2D",
  "3d": "3D",
  vr: "VR",
  moba: "MOBA",
  jrpg: "JRPG",
};

function titleCaseSegment(word: string): string {
  const lower = word.toLowerCase();
  if (GENRE_KNOWN[lower] !== undefined) return GENRE_KNOWN[lower];
  if (/^\d/.test(word)) {
    if (/^3d$/i.test(word)) return "3D";
    if (/^2d$/i.test(word)) return "2D";
  }
  if (word.length <= 1) return word.toUpperCase();
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** Formats a platform id (matches data/platforms) for filter UI. */
export function formatPlatformLabel(id: string): string {
  if (PLATFORM_NAMES[id]) return PLATFORM_NAMES[id];
  return id
    .split(/[-_]+/g)
    .filter(Boolean)
    .map(titleCaseSegment)
    .join(" ");
}

/** Formats freeform genre tags for filter UI (chips, dropdowns). */
export function formatGenreLabel(genre: string): string {
  const k = genre.toLowerCase();
  if (GENRE_KNOWN[k]) return GENRE_KNOWN[k];
  return genre
    .split(/[-_\s]+/g)
    .filter(Boolean)
    .map(titleCaseSegment)
    .join(" ");
}
