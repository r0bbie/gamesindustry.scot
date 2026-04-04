export const SITE_URL = "https://gamesindustry.scot";
export const SITE_TITLE = "Scottish Games Industry";

/** Escape XML special characters */
export function xmlEscape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Escape iCal text values (newlines → \n, commas/semicolons escaped) */
export function icsEscape(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** Fold long iCal lines at 75 octets */
export function icsFold(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  chunks.push(line.slice(0, 75));
  let i = 75;
  while (i < line.length) {
    chunks.push(" " + line.slice(i, i + 74));
    i += 74;
  }
  return chunks.join("\r\n");
}

/** Format a YYYY-MM-DD date as an iCal DATE value (all-day) */
export function icsDate(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

/** Format an RFC-822 date (for RSS pubDate) */
export function rssDate(dateStr: string): string {
  try {
    return new Date(dateStr).toUTCString();
  } catch {
    return new Date().toUTCString();
  }
}

/** Generate a UID for iCal events */
export function icsUid(id: string, type: string): string {
  return `${type}-${id}@gamesindustry.scot`;
}

export function buildRssFeed(opts: {
  title: string;
  description: string;
  link: string;
  feedUrl: string;
  items: Array<{
    title: string;
    link: string;
    description: string;
    pubDate: string;
    guid: string;
  }>;
}): string {
  const items = opts.items
    .map(
      (item) => `
  <item>
    <title>${xmlEscape(item.title)}</title>
    <link>${xmlEscape(item.link)}</link>
    <description>${xmlEscape(item.description)}</description>
    <pubDate>${rssDate(item.pubDate)}</pubDate>
    <guid isPermaLink="true">${xmlEscape(item.guid)}</guid>
  </item>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(opts.title)}</title>
    <link>${xmlEscape(opts.link)}</link>
    <description>${xmlEscape(opts.description)}</description>
    <language>en-gb</language>
    <atom:link href="${xmlEscape(opts.feedUrl)}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`;
}
