import { useState, useMemo, useEffect, useRef } from "react";
import Pagination from "@/components/ui/Pagination";
import { FilterDropdown, FilterChip, FilterToggle, SortDropdown, ResultCount } from "@/components/ui/FilterToolbar";
import {
  formatGameReleaseLineDisplay,
  getLatestReleaseSortTimestamp,
} from "@/lib/gameRelease";

const PAGE_SIZE = 30;

export interface GameWithDeveloper {
  id: string;
  title: string;
  slug: string;
  short_description?: string;
  release_date?: string;
  release_period?: { start: string; end?: string | null };
  status: "in_development" | "released" | "cancelled";
  genres: string[];
  platforms: string[];
  cover_image?: string;
  developerName: string;
  critic_ratings: Record<string, number | string>;
  awards: Array<{ name: string; year: number; status: string }>;
}

type SortOption = "release_date" | "name" | "rating";
type StatusFilter = "all" | "released" | "in_development" | "cancelled";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "release_date", label: "Release Date" },
  { value: "name", label: "Name A–Z" },
  { value: "rating", label: "Critic Rating" },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "released", label: "Released" },
  { value: "in_development", label: "Upcoming" },
  { value: "cancelled", label: "Cancelled" },
];

function getCoverGradient(title: string): string {
  const hue = [...title].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 360;
  return `linear-gradient(135deg, hsl(${hue}, 55%, 38%), hsl(${(hue + 45) % 360}, 45%, 28%))`;
}

// Source label + favicon URL for known review sites
const RATING_SOURCES: Record<string, { label: string; favicon: string }> = {
  metacritic: {
    label: "MC",
    favicon: "https://www.metacritic.com/favicon.ico",
  },
  opencritic: {
    label: "OC",
    favicon: "https://opencritic.com/favicon.ico",
  },
  criticdb: {
    label: "CDB",
    favicon: "https://criticdb.com/favicon.ico",
  },
};

function getTopRatingEntry(ratings: Record<string, number | string>): { source: string; score: number } | null {
  let top: { source: string; score: number } | null = null;
  for (const [source, val] of Object.entries(ratings)) {
    if (typeof val !== "number") continue;
    if (!top || val > top.score) top = { source, score: val };
  }
  return top;
}

function getMaxRating(ratings: Record<string, number | string>): number {
  return getTopRatingEntry(ratings)?.score ?? 0;
}

function RatingBadge({ ratings }: { ratings: Record<string, number | string> }) {
  const top = getTopRatingEntry(ratings);
  if (!top) return null;
  const { source, score } = top;
  const color =
    score >= 80
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : score >= 60
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
        : "bg-red-500/15 text-red-600 dark:text-red-400";
  const meta = RATING_SOURCES[source];
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${color}`}
      title={`${meta?.label ?? source}: ${score}`}
    >
      {meta ? (
        <img
          src={meta.favicon}
          alt={meta.label}
          width={10}
          height={10}
          className="h-2.5 w-2.5 shrink-0 rounded-[1px] opacity-90"
        />
      ) : (
        <span className="font-normal opacity-70">{source.slice(0, 2).toUpperCase()}</span>
      )}
      {score}
    </span>
  );
}

export default function GameListView({ games }: { games: GameWithDeveloper[] }) {
  const [search, setSearch] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [hasAwards, setHasAwards] = useState(false);
  const [sort, setSort] = useState<SortOption>("release_date");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const genre = params.get("genre");
    const platform = params.get("platform");
    const awards = params.get("awards");
    const sortParam = params.get("sort") as SortOption | null;
    const q = params.get("q");
    const status = params.get("status") as StatusFilter | null;

    if (genre) setSelectedGenres(new Set(genre.split(",")));
    if (platform) setSelectedPlatforms(new Set(platform.split(",")));
    if (awards === "true") setHasAwards(true);
    if (sortParam && SORT_OPTIONS.some((o) => o.value === sortParam)) setSort(sortParam);
    if (q) setSearch(q);
    if (status && STATUS_OPTIONS.some((o) => o.value === status)) setStatusFilter(status);
  }, []);

  const allGenres = useMemo(() => {
    const counts = new Map<string, number>();
    games.forEach((g) => g.genres.forEach((genre) => counts.set(genre, (counts.get(genre) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g);
  }, [games]);

  const allPlatforms = useMemo(() => {
    const counts = new Map<string, number>();
    games.forEach((g) => g.platforms.forEach((p) => counts.set(p, (counts.get(p) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => p);
  }, [games]);

  const filtered = useMemo(() => {
    let result = games;

    if (statusFilter !== "all") {
      result = result.filter((g) => g.status === statusFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.developerName.toLowerCase().includes(q) ||
          g.short_description?.toLowerCase().includes(q),
      );
    }

    if (selectedGenres.size > 0) {
      result = result.filter((g) => g.genres.some((genre) => selectedGenres.has(genre)));
    }

    if (selectedPlatforms.size > 0) {
      result = result.filter((g) => g.platforms.some((p) => selectedPlatforms.has(p)));
    }

    if (hasAwards) {
      result = result.filter((g) => g.awards.length > 0);
    }

    result = [...result].sort((a, b) => {
      if (sort === "name") return a.title.localeCompare(b.title);
      if (sort === "rating") return getMaxRating(b.critic_ratings) - getMaxRating(a.critic_ratings);
      const da = a.release_date ?? "";
      const db = b.release_date ?? "";
      return db.localeCompare(da);
    });

    return result;
  }, [games, search, selectedGenres, selectedPlatforms, hasAwards, sort, statusFilter]);

  // Reset to page 1 whenever filters change
  useEffect(() => { setCurrentPage(1); }, [search, selectedGenres, selectedPlatforms, hasAwards, sort, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handlePageChange(page: number) {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggle(set: Set<string>, id: string): Set<string> {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  }

  function clearAll() {
    setSearch("");
    setSelectedGenres(new Set());
    setSelectedPlatforms(new Set());
    setHasAwards(false);
    setStatusFilter("all");
    setSort("release_date");
    setCurrentPage(1);
    searchRef.current?.focus();
  }

  const genreOptions = allGenres.map((g) => ({ id: g, name: g.charAt(0).toUpperCase() + g.slice(1) }));
  const platformOptions = allPlatforms.map((p) => ({ id: p, name: p.charAt(0).toUpperCase() + p.slice(1) }));

  const hasAnyFilter = selectedGenres.size > 0 || selectedPlatforms.size > 0 || hasAwards || statusFilter !== "all" || !!search;

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...(statusFilter !== "all" ? [{
      key: "status",
      label: STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? statusFilter,
      onRemove: () => setStatusFilter("all"),
    }] : []),
    ...[...selectedGenres].map((g) => ({
      key: `genre:${g}`,
      label: g.charAt(0).toUpperCase() + g.slice(1),
      onRemove: () => setSelectedGenres((p) => toggle(p, g)),
    })),
    ...[...selectedPlatforms].map((p) => ({
      key: `platform:${p}`,
      label: p.charAt(0).toUpperCase() + p.slice(1),
      onRemove: () => setSelectedPlatforms((p2) => toggle(p2, p)),
    })),
    ...(hasAwards ? [{ key: "awards", label: "Award winners", onRemove: () => setHasAwards(false) }] : []),
  ];

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">All Games</h1>
      </div>

      {/* Filter toolbar */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-48">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={searchRef}
            type="search"
            placeholder="Search games…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <SortDropdown
          label="Status"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as StatusFilter)}
          isActive={statusFilter !== "all"}
        />
        <FilterDropdown
          label="Genre"
          options={genreOptions}
          selected={selectedGenres}
          onToggle={(id) => setSelectedGenres((p) => toggle(p, id))}
        />
        <FilterDropdown
          label="Platform"
          options={platformOptions}
          selected={selectedPlatforms}
          onToggle={(id) => setSelectedPlatforms((p) => toggle(p, id))}
        />
        <FilterToggle
          label="Award winners"
          active={hasAwards}
          onToggle={() => setHasAwards((v) => !v)}
        />

        <div className="ml-auto">
          <SortDropdown
            label="Sort"
            options={SORT_OPTIONS}
            value={sort}
            onChange={(v) => setSort(v as SortOption)}
            align="right"
          />
        </div>
      </div>

      {/* Count row */}
      <div className="mb-4">
        <ResultCount count={filtered.length} total={games.length} noun="game" />
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-1.5">
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

      {/* Results */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {paginated.map((game) => (
            <a
              key={game.id}
              href={`/games/${game.slug}`}
              className="group flex flex-col rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
            >
              {/* Cover */}
              <div
                className="relative flex aspect-[2/3] items-center justify-center overflow-hidden rounded-t-xl"
                style={
                  game.cover_image
                    ? { backgroundImage: `url(${game.cover_image})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : { background: getCoverGradient(game.title) }
                }
              >
                {!game.cover_image && (
                  <span className="text-5xl font-bold text-white/60 select-none">
                    {game.title.charAt(0)}
                  </span>
                )}
                {/* Status badge */}
                {game.status === "in_development" && (
                  <span className="absolute left-2 top-2 rounded-full bg-blue-500/90 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                    Upcoming
                  </span>
                )}
                {game.status === "cancelled" && (
                  <span className="absolute left-2 top-2 rounded-full bg-zinc-700/90 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                    Cancelled
                  </span>
                )}
                {/* Rating badge */}
                {getMaxRating(game.critic_ratings) > 0 && (
                  <span className="absolute right-2 top-2">
                    <RatingBadge ratings={game.critic_ratings} />
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-semibold leading-tight transition-colors group-hover:text-primary">
                  {game.title}
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{game.developerName}</p>
                <div className="mt-auto flex items-center justify-between pt-3 text-xs text-muted-foreground">
                  <span>{formatGameReleaseLineDisplay(game)}</span>
                  {game.awards.length > 0 && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      {game.awards.length}
                    </span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <svg className="mb-4 h-10 w-10 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <p className="font-medium text-muted-foreground">No games match your filters</p>
          <button type="button" onClick={clearAll} className="mt-3 text-sm text-primary hover:underline">
            Clear all filters
          </button>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
