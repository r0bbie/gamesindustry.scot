import type { APIRoute } from "astro";
import { getPublicGames, safeGetCompany } from "@/lib/data";
import { SITE_URL, SITE_TITLE, buildRssFeed } from "@/lib/feeds";
import { compareUpcoming, formatReleaseDatePart } from "@/lib/gameRelease";

export const GET: APIRoute = async () => {
  const games = await getPublicGames();
  const today = new Date().toISOString().split("T")[0];

  const upcoming = games
    .filter((g) => g.status === "in_development")
    .sort(compareUpcoming)
    .slice(0, 50);

  const items = await Promise.all(
    upcoming.map(async (g) => {
      const devId = g.companies.developer[0];
      const dev = devId ? await safeGetCompany(devId, `rss:${g.slug}`) : null;
      const devName = dev?.name ?? "Unknown Developer";

      const releaseDateStr = formatReleaseDatePart(g.release_date, g.status);

      const desc = [
        g.short_description ?? g.description ?? "",
        `Developer: ${devName}`,
        `Expected: ${releaseDateStr}`,
        g.platforms?.length ? `Platforms: ${g.platforms.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      return {
        title: `${g.title} — ${devName}`,
        link: `${SITE_URL}/games/${g.slug}`,
        description: desc,
        pubDate: g.release_date ?? today,
        guid: `${SITE_URL}/games/${g.slug}`,
      };
    })
  );

  const xml = buildRssFeed({
    title: `${SITE_TITLE} — Upcoming Games`,
    description: "Games currently in development from Scottish developers.",
    link: `${SITE_URL}/games`,
    feedUrl: `${SITE_URL}/rss/upcoming-games.xml`,
    items,
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
