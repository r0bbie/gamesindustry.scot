import type { APIRoute } from "astro";
import { getAllEvents } from "@/lib/data";
import { SITE_URL, SITE_TITLE, buildRssFeed, xmlEscape } from "@/lib/feeds";

export const GET: APIRoute = async () => {
  const events = await getAllEvents();
  const today = new Date().toISOString().split("T")[0];

  const upcoming = events
    .filter((e) => e.date_start >= today)
    .sort((a, b) => a.date_start.localeCompare(b.date_start))
    .slice(0, 50);

  const xml = buildRssFeed({
    title: `${SITE_TITLE} — Events`,
    description: "Upcoming games industry events, conferences, game jams, and meetups in Scotland.",
    link: `${SITE_URL}/events`,
    feedUrl: `${SITE_URL}/rss/events.xml`,
    items: upcoming.map((e) => {
      const dateStr = new Date(e.date_start).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const location = e.is_online ? "Online" : (e.location ?? "TBC");
      const desc = [
        e.short_description ?? e.description ?? "",
        `Date: ${dateStr}`,
        `Location: ${location}`,
        e.website ? `More info: ${e.website}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      return {
        title: e.name,
        link: `${SITE_URL}/events/${e.slug}`,
        description: desc,
        pubDate: e.date_start,
        guid: `${SITE_URL}/events/${e.slug}`,
      };
    }),
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
