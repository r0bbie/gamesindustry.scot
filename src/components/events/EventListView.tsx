import { useState, useMemo } from "react";
import type { EventData, GameRelease } from "./EventCalendar";
import { FilterDropdown, FilterChip, FilterToggle, SortDropdown, ResultCount } from "@/components/ui/FilterToolbar";

const EVENT_TAGS = [
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
] as const;

type LocationFilter = "all" | "online" | "in_person";

function getTagName(id: string): string {
  return EVENT_TAGS.find((t) => t.id === id)?.name ?? id;
}

function formatDateRange(start: string, end?: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  const s = new Date(start).toLocaleDateString("en-GB", opts);
  if (!end || end === start) return s;
  const startD = new Date(start);
  const endD = new Date(end);
  if (startD.getMonth() === endD.getMonth() && startD.getFullYear() === endD.getFullYear()) {
    return `${startD.getDate()}–${endD.toLocaleDateString("en-GB", opts)}`;
  }
  return `${s} – ${new Date(end).toLocaleDateString("en-GB", opts)}`;
}

function monthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

interface MergedItem {
  type: "event" | "game";
  sortDate: string;
  event?: EventData;
  game?: GameRelease;
}

export default function EventListView({ events, gameReleases }: { events: EventData[]; gameReleases: GameRelease[] }) {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [showGames, setShowGames] = useState(false);
  const [showInternational, setShowInternational] = useState(true);
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("all");

  const filtered = useMemo(() => {
    const items: MergedItem[] = [];

    let evts = events;
    const q = search.toLowerCase();

    if (q) {
      evts = evts.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q) ||
          e.tags.some((t) => getTagName(t).toLowerCase().includes(q)),
      );
    }

    if (selectedTags.size > 0) {
      evts = evts.filter((e) => e.tags.some((t) => selectedTags.has(t)));
    }

    if (!showInternational) {
      evts = evts.filter((e) => e.is_scottish);
    }

    if (locationFilter === "online") {
      evts = evts.filter((e) => e.is_online);
    } else if (locationFilter === "in_person") {
      evts = evts.filter((e) => !e.is_online);
    }

    for (const e of evts) {
      items.push({ type: "event", sortDate: e.date_start, event: e });
    }

    if (showGames) {
      let games = gameReleases.filter((g) => g.release_date);
      if (q) {
        games = games.filter((g) => g.title.toLowerCase().includes(q));
      }
      for (const g of games) {
        items.push({ type: "game", sortDate: g.release_date!, game: g });
      }
    }

    items.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
    return items;
  }, [events, gameReleases, search, selectedTags, showGames, showInternational, locationFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, MergedItem[]>();
    for (const item of filtered) {
      const key = monthKey(item.sortDate);
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const LOCATION_OPTIONS = [
    { value: "all", label: "All locations" },
    { value: "in_person", label: "In-person" },
    { value: "online", label: "Online" },
  ];

  function toggleTag(tag: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  }

  function clearAll() {
    setSearch("");
    setSelectedTags(new Set());
    setShowGames(false);
    setShowInternational(true);
    setLocationFilter("all");
  }

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...[...selectedTags].map((id) => ({
      key: `tag:${id}`,
      label: EVENT_TAGS.find((t) => t.id === id)?.name ?? id,
      onRemove: () => toggleTag(id),
    })),
    ...(locationFilter !== "all" ? [{
      key: "location",
      label: locationFilter === "online" ? "Online" : "In-person",
      onRemove: () => setLocationFilter("all"),
    }] : []),
    ...(showGames ? [{ key: "games", label: "Game releases", onRemove: () => setShowGames(false) }] : []),
    ...(!showInternational ? [{ key: "scottish", label: "Scottish only", onRemove: () => setShowInternational(true) }] : []),
  ];

  const totalEventCount = events.length + (showGames ? gameReleases.filter((g) => g.release_date).length : 0);

  return (
    <div className="space-y-4">
      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-48">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Search events…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <FilterDropdown
          label="Tags"
          options={[...EVENT_TAGS]}
          selected={selectedTags}
          onToggle={toggleTag}
        />
        <SortDropdown
          label="Location"
          options={LOCATION_OPTIONS}
          value={locationFilter}
          onChange={(v) => setLocationFilter(v as LocationFilter)}
          isActive={locationFilter !== "all"}
        />
        <FilterToggle
          label="Game releases"
          active={showGames}
          onToggle={() => setShowGames((v) => !v)}
        />
        <FilterToggle
          label="Scottish only"
          active={!showInternational}
          onToggle={() => setShowInternational((v) => !v)}
        />
      </div>

      {/* Count row */}
      <ResultCount count={filtered.length} total={totalEventCount} noun="result" />

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeChips.map((chip) => (
            <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="ml-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Grouped list */}
      {grouped.length > 0 ? (
        <div className="space-y-8">
          {grouped.map(([key, items]) => (
            <section key={key}>
              <h3 className="mb-3 text-lg font-semibold">{monthLabel(key)}</h3>
              <div className="space-y-2">
                {items.map((item) =>
                  item.type === "event" && item.event ? (
                    <EventRow key={item.event.id} event={item.event} />
                  ) : item.type === "game" && item.game ? (
                    <GameRow key={item.game.id} game={item.game} />
                  ) : null,
                )}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card py-12 text-center">
          <p className="text-muted-foreground">No events match your filters.</p>
          <button type="button" onClick={clearAll} className="mt-2 text-sm font-medium text-primary hover:underline">
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

function EventRow({ event }: { event: EventData }) {
  const location = event.is_online ? "Online" : (event.location ?? "TBC");

  return (
    <a
      href={`/events/${event.slug}`}
      className="flex items-start gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30 hover:bg-accent/50"
    >
      <div className="hidden w-20 shrink-0 pt-0.5 text-right sm:block">
        <span className="text-sm font-medium tabular-nums text-muted-foreground">
          {new Date(event.date_start).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h4 className="font-medium leading-tight">{event.name}</h4>
          {event.is_scottish && (
            <span className="shrink-0 text-sm" title="Scottish event">🏴󠁧󠁢󠁳󠁣󠁴󠁿</span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{formatDateRange(event.date_start, event.date_end)}</span>
          <span className="flex items-center gap-1">
            {event.is_online ? (
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            ) : (
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            )}
            {location}
          </span>
        </div>
        {event.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md border border-transparent bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground"
              >
                {getTagName(tag)}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}

function GameRow({ game }: { game: GameRelease }) {
  const dateStr = game.release_date
    ? new Date(game.release_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "TBA";

  return (
    <a
      href={`/games/${game.slug}`}
      className="flex items-start gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-highlight/30 hover:bg-highlight/5"
    >
      <div className="hidden w-20 shrink-0 pt-0.5 text-right sm:block">
        <span className="text-sm font-medium tabular-nums text-muted-foreground">
          {game.release_date
            ? new Date(game.release_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
            : "TBA"}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm" title="Game release">🎮</span>
          <h4 className="font-medium leading-tight text-highlight">{game.title}</h4>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Game release &middot; {dateStr}
        </p>
      </div>
    </a>
  );
}
