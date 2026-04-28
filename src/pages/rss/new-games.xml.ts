import type { APIRoute } from "astro";
import { getPublicGames, safeGetCompany } from "@/lib/data";
import {
  getFirstReleaseSortTimestamp,
  formatReleaseDatePart,
} from "@/lib/gameRelease";
import { SITE_URL, SITE_TITLE, buildRssFeed } from "@/lib/feeds";

export const GET: APIRoute = async () => {
  const games = await getPublicGames();

  const released = games
    .filter((g) => g.status === "released" && g.release_date)
    .sort(
      (a, b) =>
        getFirstReleaseSortTimestamp(b) - getFirstReleaseSortTimestamp(a),
    )
    .slice(0, 50);

  const items = await Promise.all(
    released.map(async (g) => {
      const devId = g.companies.developer[0];
      const dev = devId ? await safeGetCompany(devId, `rss:${g.slug}`) : null;
      const devName = dev?.name ?? "Unknown Developer";

      const releaseDate = formatReleaseDatePart(
        g.release_date!,
        g.status,
      );

      const desc = [
        g.short_description ?? g.description ?? "",
        `Developer: ${devName}`,
        `Release date: ${releaseDate}`,
        g.platforms?.length ? `Platforms: ${g.platforms.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      return {
        title: `${g.title} — ${devName}`,
        link: `${SITE_URL}/games/${g.slug}`,
        description: desc,
        pubDate: g.release_date!,
        guid: `${SITE_URL}/games/${g.slug}`,
      };
    })
  );

  const xml = buildRssFeed({
    title: `${SITE_TITLE} — New Releases`,
    description: "The latest game releases from Scottish developers.",
    link: `${SITE_URL}/games`,
    feedUrl: `${SITE_URL}/rss/new-games.xml`,
    items,
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
