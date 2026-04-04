import type { APIRoute } from "astro";
import { getAllGames, safeGetCompany } from "@/lib/data";
import { SITE_URL, SITE_TITLE, buildRssFeed } from "@/lib/feeds";

export const GET: APIRoute = async () => {
  const games = await getAllGames();
  const today = new Date().toISOString().split("T")[0];

  const upcoming = games
    .filter((g) => g.status === "in_development")
    .sort((a, b) => {
      // Known dates first (soonest), then TBA at the end
      if (a.release_date && b.release_date)
        return a.release_date.localeCompare(b.release_date);
      if (a.release_date) return -1;
      if (b.release_date) return 1;
      return 0;
    })
    .slice(0, 50);

  const items = await Promise.all(
    upcoming.map(async (g) => {
      const devId = g.companies.developer[0];
      const dev = devId ? await safeGetCompany(devId, `rss:${g.slug}`) : null;
      const devName = dev?.name ?? "Unknown Developer";

      const releaseDateStr = g.release_date
        ? new Date(g.release_date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "TBA";

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
