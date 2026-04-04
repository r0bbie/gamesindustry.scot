import type { APIRoute } from "astro";
import { getAllEvents, getAllGames, safeGetCompany } from "@/lib/data";
import { SITE_URL, icsEscape, icsFold, icsDate, icsUid } from "@/lib/feeds";

/** Format YYYY-MM-DD + optional HH:MM to iCal DTSTART/DTEND */
function icsDateTime(dateStr: string, timeStr?: string): string {
  if (!timeStr) {
    // All-day event — use DATE form
    return `DATE:${icsDate(dateStr)}`;
  }
  // Event with time — use DATE-TIME in UTC (approximate: treat as Europe/London)
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(`${dateStr}T${timeStr}:00`);
  // Format as basic ISO without dashes/colons + Z suffix
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getUTCFullYear();
  const mo = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hr = pad(d.getUTCHours());
  const mn = pad(d.getUTCMinutes());
  return `DATE-TIME:${year}${mo}${day}T${hr}${mn}00Z`;
}

/** Add one day to YYYY-MM-DD for all-day DTEND (iCal all-day is exclusive end) */
function nextDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split("T")[0];
}

export const GET: APIRoute = async () => {
  const [events, games] = await Promise.all([getAllEvents(), getAllGames()]);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//Scottish Games Industry//Events//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Scottish Games Industry Events`,
    `X-WR-CALDESC:Events and game release dates from the Scottish games industry`,
    `X-WR-TIMEZONE:Europe/London`,
  ];

  // Add events
  for (const e of events) {
    const startType = icsDateTime(e.date_start, e.time || undefined);
    const endDate = e.date_end && e.date_end !== e.date_start
      ? e.date_end
      : nextDay(e.date_start);
    const endType = icsDateTime(endDate);
    const location = e.is_online ? "Online" : (e.location ?? "");
    const desc = icsEscape(
      [e.short_description ?? e.description ?? "", e.website ? `More info: ${e.website}` : ""]
        .filter(Boolean)
        .join("\\n\\n")
    );

    lines.push("BEGIN:VEVENT");
    lines.push(icsFold(`UID:${icsUid(e.id, "event")}`));
    lines.push(icsFold(`SUMMARY:${icsEscape(e.name)}`));
    lines.push(icsFold(`DTSTART;${startType}`));
    lines.push(icsFold(`DTEND;${endType}`));
    if (location) lines.push(icsFold(`LOCATION:${icsEscape(location)}`));
    if (desc) lines.push(icsFold(`DESCRIPTION:${desc}`));
    lines.push(icsFold(`URL:${SITE_URL}/events/${e.slug}`));
    const categories = e.tags?.join(",") ?? "";
    if (categories) lines.push(icsFold(`CATEGORIES:${icsEscape(categories)}`));
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`);
    lines.push("END:VEVENT");
  }

  // Add game releases as all-day events
  const gamesWithDates = games.filter((g) => g.release_date);
  for (const g of gamesWithDates) {
    const devId = g.companies.developer[0];
    const dev = devId ? await safeGetCompany(devId, `ics:${g.slug}`) : null;
    const devName = dev?.name ?? "";
    const summary = devName ? `🎮 ${g.title} (${devName})` : `🎮 ${g.title}`;
    const endDate = nextDay(g.release_date!);

    lines.push("BEGIN:VEVENT");
    lines.push(icsFold(`UID:${icsUid(g.id, "game")}`));
    lines.push(icsFold(`SUMMARY:${icsEscape(summary)}`));
    lines.push(icsFold(`DTSTART;DATE:${icsDate(g.release_date!)}`));
    lines.push(icsFold(`DTEND;DATE:${icsDate(endDate)}`));
    if (g.short_description) lines.push(icsFold(`DESCRIPTION:${icsEscape(g.short_description)}`));
    lines.push(icsFold(`URL:${SITE_URL}/games/${g.slug}`));
    lines.push(`CATEGORIES:Game Release`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  const ics = lines.join("\r\n") + "\r\n";

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="scottish-games-industry.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
};
