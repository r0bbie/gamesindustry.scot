/** Ongoing release window: end omitted, null, or the literal "present". */
export function isReleasePeriodOngoing(end: string | null | undefined): boolean {
  return end == null || end === "present";
}

/** End of calendar period for sorting (newer → higher timestamp). */
export function parseGameDateToEndTimestamp(dateStr: string): number {
  if (/^\d{4}$/.test(dateStr)) {
    return new Date(Number(dateStr), 11, 31, 23, 59, 59, 999).getTime();
  }
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    const [y, m] = dateStr.split("-").map(Number);
    return new Date(y, m, 0, 23, 59, 59, 999).getTime();
  }
  const t = new Date(dateStr).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export type GameReleaseSortFields = {
  release_date?: string;
  release_period?: { start: string; end?: string | null };
};

/**
 * When `release_period` is set it takes priority over `release_date` for ordering:
 * sort by end of period, or "now" if still ongoing.
 */
export function getLatestReleaseSortTimestamp(game: GameReleaseSortFields): number {
  const period = game.release_period;
  if (period) {
    const end = period.end;
    if (isReleasePeriodOngoing(end)) {
      return Date.now();
    }
    if (typeof end === "string") {
      return parseGameDateToEndTimestamp(end);
    }
    return parseGameDateToEndTimestamp(period.start);
  }
  return game.release_date ? parseGameDateToEndTimestamp(game.release_date) : 0;
}

/**
 * Sort timestamp for "New Releases" ordering.
 * Uses the START of a release_period (not the end) so that ongoing live titles
 * don't float to the top — we care about when a game first launched.
 */
export function getFirstReleaseSortTimestamp(game: GameReleaseSortFields): number {
  const period = game.release_period;
  if (period) {
    return parseGameDateToEndTimestamp(period.start);
  }
  return game.release_date ? parseGameDateToEndTimestamp(game.release_date) : 0;
}

/**
 * Sort key for upcoming games, encoding both precision and chronological value
 * so that games are ordered: exact date → year+month → year only → TBA.
 * Returns a [precision, value] tuple where lower precision = shows first.
 */
export function upcomingSortKey(dateStr?: string | null): [number, number] {
  if (!dateStr) return [3, 0]; // TBA — last
  if (/^\d{4}$/.test(dateStr)) return [2, Number(dateStr)]; // year only
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    const [y, m] = dateStr.split("-").map(Number);
    return [1, y * 100 + m]; // year+month
  }
  return [0, new Date(dateStr).getTime()]; // exact date
}

/** Compare two upcoming games by the precision-aware sort key. */
export function compareUpcoming(
  a: { release_date?: string },
  b: { release_date?: string },
): number {
  const [ap, av] = upcomingSortKey(a.release_date);
  const [bp, bv] = upcomingSortKey(b.release_date);
  if (ap !== bp) return ap - bp;
  return av - bv;
}

/** Same rules as the game detail page for formatting a single date. */
export function formatReleaseDatePart(
  dateStr?: string,
  status?: string,
): string {
  if (!dateStr) return status === "cancelled" ? "Unreleased" : "TBA";
  if (/^\d{4}$/.test(dateStr)) return dateStr;
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    const [year, month] = dateStr.split("-");
    return new Date(Number(year), Number(month) - 1).toLocaleDateString(
      "en-GB",
      { year: "numeric", month: "long" },
    );
  }
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatReleasePeriodRange(period: {
  start: string;
  end?: string | null;
}): string {
  const start = formatReleaseDatePart(period.start);
  const end = isReleasePeriodOngoing(period.end)
    ? "Present"
    : formatReleaseDatePart(period.end!);
  return `${start} – ${end}`;
}

/**
 * Card / hero line: uses `release_period` when set (priority over `release_date`),
 * otherwise the standalone release date.
 */
export function formatGameReleaseLineDisplay(game: {
  release_date?: string;
  status: string;
  release_period?: { start: string; end?: string | null };
}): string {
  if (game.release_period) {
    return formatReleasePeriodRange(game.release_period);
  }
  return formatReleaseDatePart(game.release_date, game.status);
}
