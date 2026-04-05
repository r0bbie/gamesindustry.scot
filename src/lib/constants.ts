export const SITE_TITLE = "Scottish Games Industry";
export const SITE_DESCRIPTION = "The comprehensive directory of the Scottish games industry. Discover game development studios, publishers, games, freelancers, jobs, events, and education.";
export const SITE_URL = "https://gamesindustry.scot";
export const GITHUB_REPO = "r0bbie/gamesindustry.scot";
export const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;

export const REGIONS = [
  { id: "glasgow-strathclyde", name: "Glasgow & Strathclyde" },
  { id: "edinburgh-lothian", name: "Edinburgh & Lothian" },
  { id: "dundee-tayside", name: "Dundee & Tayside" },
  { id: "stirling-central", name: "Stirling & Central" },
  { id: "fife", name: "Fife" },
  { id: "highlands-islands", name: "Highlands & Islands" },
  { id: "aberdeen-grampian", name: "Aberdeen & Grampian" },
  { id: "dumfries-galloway", name: "Dumfries & Galloway" },
  { id: "borders", name: "Borders" },
] as const;

export const COMPANY_CATEGORIES = [
  { id: "developer", name: "Development Studios" },
  { id: "solo_developer", name: "Solo Developers" },
  { id: "tooling", name: "Tech & Tooling" },
  { id: "service_provider", name: "Service Providers" },
  { id: "publisher", name: "Publishers" },
  { id: "supporting_org", name: "Supporting Organisations" },
  { id: "games_media", name: "Games Media" },
] as const;

export const DISCIPLINES = [
  { id: "programmer", name: "Programming" },
  { id: "designer", name: "Design" },
  { id: "artist", name: "Art" },
  { id: "audio", name: "Audio" },
  { id: "voice_actor", name: "Voice Acting" },
  { id: "writer", name: "Writing" },
  { id: "qa", name: "QA" },
  { id: "production", name: "Production" },
  { id: "marketing_community", name: "Marketing & Community" },
] as const;

export const EVENT_TAGS = [
  { id: "game_jam", name: "Game Jam" },
  { id: "social", name: "Social" },
  { id: "showcase", name: "Showcase" },
  { id: "international", name: "International" },
  { id: "workshop", name: "Workshop" },
  { id: "talk", name: "Talk" },
  { id: "conference", name: "Conference" },
  { id: "deadline", name: "Deadline" },
  { id: "competition", name: "Competition" },
  { id: "awards", name: "Awards" },
  { id: "expo", name: "Expo" },
  { id: "concert", name: "Concert" },
  { id: "live", name: "Live Event" },
] as const;

export type RegionId = (typeof REGIONS)[number]["id"];
export type CompanyCategoryId = (typeof COMPANY_CATEGORIES)[number]["id"];
export type DisciplineId = (typeof DISCIPLINES)[number]["id"];
export type EventTagId = (typeof EVENT_TAGS)[number]["id"];

export function getRegionName(id: string): string {
  return REGIONS.find((r) => r.id === id)?.name ?? id;
}

export function getCategoryName(id: string): string {
  return COMPANY_CATEGORIES.find((c) => c.id === id)?.name ?? id;
}

export function getDisciplineName(id: string): string {
  return DISCIPLINES.find((d) => d.id === id)?.name ?? id;
}

export function buildStoreUrl(store: string, id: string): string {
  const urls: Record<string, (id: string) => string> = {
    steam: (id) => `https://store.steampowered.com/app/${id}`,
    epic: (id) => `https://store.epicgames.com/p/${id}`,
    gog: (id) => `https://www.gog.com/game/${id}`,
    humble: (id) => `https://www.humblebundle.com/store/${id}`,
    psn: (id) => `https://store.playstation.com/en-gb/product/${id}`,
    xbox: (id) => `https://www.xbox.com/en-GB/games/store/${id}`,
    nintendo_eshop: (id) => `https://www.nintendo.com/store/products/${id}`,
    itch: (id) => `https://${id}.itch.io`,
    green_man_gaming: (id) => `https://www.greenmangaming.com/games/${id}`,
    app_store: (id) => `https://apps.apple.com/app/${id}`,
    play_store: (id) => `https://play.google.com/store/apps/details?id=${id}`,
    amazon_appstore: (id) => `https://www.amazon.com/dp/${id}`,
    samsung_galaxy: (id) => `https://galaxystore.samsung.com/detail/${id}`,
    indiegala: (id) => `https://www.indiegala.com/store/product/${id}`,
    game_jolt: (id) => `https://gamejolt.com/games/${id}`,
    gameclub: (id) => `https://gameclub.io/games/${id}`,
    website: (id) => id,
  };
  return urls[store]?.(id) ?? `#unknown-store-${store}`;
}

export function buildPlayUrl(platform: string, id: string): string {
  const urls: Record<string, (id: string) => string> = {
    itch: (id) => `https://${id}`,
    poki: (id) => `https://poki.com/en/g/${id}`,
    crazygames: (id) => `https://www.crazygames.com/game/${id}`,
    addicting_games: (id) => `https://www.addictinggames.com/game/${id}`,
    newgrounds: (id) => `https://www.newgrounds.com/portal/view/${id}`,
    kongregate: (id) => `https://www.kongregate.com/games/${id}`,
    armor_games: (id) => `https://armorgames.com/play/${id}`,
    web: (id) => id,
    website: (id) => id,
  };
  return urls[platform]?.(id) ?? `#unknown-platform-${platform}`;
}

export function buildPhysicalStoreUrl(store: string, id: string): string {
  const urls: Record<string, (id: string) => string> = {
    amazon: (id) => `https://www.amazon.co.uk/dp/${id}`,
    amazon_uk: (id) => `https://www.amazon.co.uk/dp/${id}`,
    amazon_us: (id) => `https://www.amazon.com/dp/${id}`,
    game_uk: (id) => `https://www.game.co.uk/${id}`,
    shopto: (id) => `https://www.shopto.net/en/${id}/`,
  };
  return urls[store]?.(id) ?? `#unknown-store-${store}`;
}

export function buildCriticUrl(source: string, id: string): string {
  const urls: Record<string, (id: string) => string> = {
    metacritic: (id) => `https://www.metacritic.com/game/${id}`,
    opencritic: (id) => `https://opencritic.com/game/${id}`,
    criticdb: (id) => `https://criticdb.com/games/${id}`,
  };
  return urls[source]?.(id) ?? `#unknown-critic-${source}`;
}

export function buildDatabaseUrl(db: string, id: string): string {
  const urls: Record<string, (id: string) => string> = {
    igdb: (id) => `https://www.igdb.com/games/${id}`,
    mobygames: (id) => `https://www.mobygames.com/game/${id}`,
    backloggd: (id) => `https://backloggd.com/games/${id}`,
    rawg: (id) => `https://rawg.io/games/${id}`,
    glitchwave: (id) => `https://glitchwave.com/game/${id}`,
    gamefaqs: (id) => `https://gamefaqs.gamespot.com/${id}`,
    opencritic: (id) => `https://opencritic.com/game/${id}`,
    criticdb: (id) => `https://criticdb.com/games/${id}`,
  };
  return urls[db]?.(id) ?? `#unknown-db-${db}`;
}

export function buildSocialUrl(platform: string, handle: string): string {
  const urls: Record<string, (h: string) => string> = {
    bluesky: (h) => `https://bsky.app/profile/${h}`,
    twitter: (h) => `https://x.com/${h}`,
    mastodon: (h) => h.startsWith("http") ? h : `https://${h}`,
    linkedin: (h) => h.startsWith("http") ? h : `https://www.linkedin.com/company/${h}`,
    steam: (h) => `https://store.steampowered.com/publisher/${h}`,
    twitch: (h) => `https://www.twitch.tv/${h}`,
    crunchbase: (h) => `https://www.crunchbase.com/organization/${h}`,
    discord: (h) => h.startsWith("http") ? h : `https://discord.gg/${h}`,
    youtube: (h) => `https://www.youtube.com/${h}`,
    app_store: (h) => h.startsWith("http") ? h : `https://apps.apple.com/developer/${h}`,
    google_play: (h) => h.startsWith("http") ? h : `https://play.google.com/store/apps/developer?id=${h}`,
    github: (h) => `https://github.com/${h}`,
    threads: (h) => `https://www.threads.com/@${h.startsWith("@") ? h.slice(1) : h}`,
    behance: (h) => `https://www.behance.net/${h}`,
    dribbble: (h) => `https://dribbble.com/${h}`,
    artstation: (h) => `https://www.artstation.com/${h}`,
    gumroad: (h) => `https://gumroad.com/${h}`,
    fiverr: (h) => `https://www.fiverr.com/${h}`,
    contra: (h) => `https://contra.com/${h}`,
    deviantart: (h) => `https://www.deviantart.com/${h}`,
    sketchfab: (h) => `https://sketchfab.com/${h}`,
    soundcloud: (h) => `https://soundcloud.com/${h}`,
    bandcamp: (h) => `https://${h}.bandcamp.com`,
    instagram: (h) => `https://www.instagram.com/${h}`,
    itch: (h) => h.startsWith("http") ? h : `https://${h}.itch.io`,
  };
  return urls[platform]?.(handle) ?? `#unknown-${platform}`;
}

export const NAV_ITEMS = [
  { label: "Companies", href: "/companies" },
  { label: "Games", href: "/games" },
  { label: "Freelancers", href: "/freelancers" },
  { label: "Jobs", href: "/jobs" },
  { label: "Events", href: "/events" },
  { label: "Education", href: "/education" },
  { label: "Links", href: "/links" },
] as const;
