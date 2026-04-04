import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { DISCIPLINES, getDisciplineName } from "@/lib/constants";
import { FilterDropdown, FilterChip, ResultCount } from "@/components/ui/FilterToolbar";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 24;

interface Freelancer {
  id: string;
  name: string;
  slug: string;
  discipline: string;
  short_bio?: string | null;
  photo?: string | null;
  location?: string | null;
}

interface Props {
  freelancers: Freelancer[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

function toggle(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  next.has(id) ? next.delete(id) : next.add(id);
  return next;
}

export default function FreelancerListView({ freelancers }: Props) {
  const [search, setSearch] = useState("");
  const [selectedDisciplines, setSelectedDisciplines] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Shuffle once on mount for fair random ordering
  const shuffled = useMemo(() => shuffle(freelancers), [freelancers]);

  const activeDisciplines = useMemo(() => {
    const ids = new Set(freelancers.map((f) => f.discipline));
    return DISCIPLINES.filter((d) => ids.has(d.id));
  }, [freelancers]);

  const filtered = useMemo(() => {
    return shuffled.filter((f) => {
      if (selectedDisciplines.size > 0 && !selectedDisciplines.has(f.discipline)) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = [f.name, f.short_bio ?? "", getDisciplineName(f.discipline)].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [shuffled, search, selectedDisciplines]);

  useEffect(() => { setCurrentPage(1); }, [search, selectedDisciplines]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasAnyFilter = selectedDisciplines.size > 0 || !!search;

  function clearAll() {
    setSearch("");
    setSelectedDisciplines(new Set());
    setCurrentPage(1);
  }

  const activeChips = [
    ...[...selectedDisciplines].map((id) => ({
      key: `disc:${id}`,
      label: getDisciplineName(id),
      onRemove: () => setSelectedDisciplines((p) => toggle(p, id)),
    })),
  ];

  return (
    <div>
      {/* Filter toolbar */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-48">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Search freelancers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {activeDisciplines.length > 0 && (
          <FilterDropdown
            label="Discipline"
            options={activeDisciplines}
            selected={selectedDisciplines}
            onToggle={(id) => setSelectedDisciplines((p) => toggle(p, id))}
          />
        )}
      </div>

      {/* Count row */}
      <div className="mb-4">
        <ResultCount count={filtered.length} total={freelancers.length} noun="freelancer" />
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
      {paginated.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-lg font-medium">No freelancers found</p>
          <p className="mt-1 text-sm">Try adjusting your search or filters.</p>
          {hasAnyFilter && (
            <button type="button" onClick={clearAll} className="mt-3 text-sm font-medium text-primary hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((f) => (
            <a
              key={f.id}
              href={`/freelancers/${f.slug}`}
              className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/50"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
                  {f.photo ? (
                    <img src={f.photo} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">{getInitials(f.name)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold group-hover:text-primary">{f.name}</h3>
                  {f.location && (
                    <p className="truncate text-xs text-muted-foreground">{f.location}</p>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="mb-2 text-[10px]">
                {getDisciplineName(f.discipline)}
              </Badge>
              {f.short_bio && (
                <p className="line-clamp-2 text-sm text-muted-foreground">{f.short_bio}</p>
              )}
            </a>
          ))}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </div>
  );
}
