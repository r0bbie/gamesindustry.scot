import { useState, useMemo, useEffect } from "react";
import { REGIONS, DISCIPLINES, getDisciplineName } from "@/lib/constants";
import { FilterDropdown, FilterChip, ResultCount } from "@/components/ui/FilterToolbar";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 24;

interface School {
  id: string;
  name: string;
  slug: string;
  institution_type?: string;
  hq?: string | null;
  region?: string;
  about?: string;
  logo?: string;
  icon?: string;
  logo_bg?: string | null;
  disciplines: string[];
  levels: string[];
}

interface Props {
  schools: School[];
}

const INSTITUTION_TYPES = [
  { id: "university", name: "University" },
  { id: "college", name: "College" },
];

const STUDY_LEVELS = [
  { id: "undergraduate", name: "Undergraduate" },
  { id: "postgraduate", name: "Postgraduate" },
  { id: "further_education", name: "Further Education" },
];

function usedRegions(schools: School[]) {
  const ids = new Set(schools.map((s) => s.region).filter(Boolean));
  return REGIONS.filter((r) => ids.has(r.id));
}

function usedDisciplines(schools: School[]) {
  const ids = new Set(schools.flatMap((s) => s.disciplines));
  return DISCIPLINES.filter((d) => ids.has(d.id));
}

function toggle(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  next.has(id) ? next.delete(id) : next.add(id);
  return next;
}

export default function SchoolListView({ schools }: Props) {
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedDisciplines, setSelectedDisciplines] = useState<Set<string>>(new Set());
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const activeRegions = useMemo(() => usedRegions(schools), [schools]);
  const activeDisciplines = useMemo(() => usedDisciplines(schools), [schools]);

  const filtered = useMemo(() => {
    return schools
      .filter((s) => {
        if (selectedTypes.size > 0 && !selectedTypes.has(s.institution_type ?? "")) return false;
        if (selectedRegions.size > 0 && (!s.region || !selectedRegions.has(s.region))) return false;
        if (selectedDisciplines.size > 0 && !s.disciplines.some((d) => selectedDisciplines.has(d))) return false;
        if (selectedLevels.size > 0 && !s.levels.some((l) => selectedLevels.has(l))) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!s.name.toLowerCase().includes(q) && !(s.about ?? "").toLowerCase().includes(q) && !(s.hq ?? "").toLowerCase().includes(q))
            return false;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [schools, search, selectedTypes, selectedDisciplines, selectedRegions, selectedLevels]);

  useEffect(() => { setCurrentPage(1); }, [search, selectedTypes, selectedDisciplines, selectedRegions, selectedLevels]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasAnyFilter =
    selectedTypes.size > 0 || selectedDisciplines.size > 0 ||
    selectedRegions.size > 0 || selectedLevels.size > 0 || !!search;

  function clearAll() {
    setSearch("");
    setSelectedTypes(new Set());
    setSelectedDisciplines(new Set());
    setSelectedRegions(new Set());
    setSelectedLevels(new Set());
    setCurrentPage(1);
  }

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...[...selectedTypes].map((id) => ({
      key: `type:${id}`,
      label: INSTITUTION_TYPES.find((t) => t.id === id)?.name ?? id,
      onRemove: () => setSelectedTypes((p) => toggle(p, id)),
    })),
    ...[...selectedRegions].map((id) => ({
      key: `region:${id}`,
      label: activeRegions.find((r) => r.id === id)?.name ?? id,
      onRemove: () => setSelectedRegions((p) => toggle(p, id)),
    })),
    ...[...selectedDisciplines].map((id) => ({
      key: `disc:${id}`,
      label: getDisciplineName(id),
      onRemove: () => setSelectedDisciplines((p) => toggle(p, id)),
    })),
    ...[...selectedLevels].map((id) => ({
      key: `level:${id}`,
      label: STUDY_LEVELS.find((l) => l.id === id)?.name ?? id,
      onRemove: () => setSelectedLevels((p) => toggle(p, id)),
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
            placeholder="Search schools…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <FilterDropdown
          label="Type"
          options={INSTITUTION_TYPES}
          selected={selectedTypes}
          onToggle={(id) => setSelectedTypes((p) => toggle(p, id))}
        />
        <FilterDropdown
          label="Region"
          options={activeRegions}
          selected={selectedRegions}
          onToggle={(id) => setSelectedRegions((p) => toggle(p, id))}
        />
        <FilterDropdown
          label="Discipline"
          options={activeDisciplines}
          selected={selectedDisciplines}
          onToggle={(id) => setSelectedDisciplines((p) => toggle(p, id))}
        />
        <FilterDropdown
          label="Level"
          options={STUDY_LEVELS}
          selected={selectedLevels}
          onToggle={(id) => setSelectedLevels((p) => toggle(p, id))}
        />
      </div>

      {/* Count row */}
      <div className="mb-4">
        <ResultCount count={filtered.length} total={schools.length} noun="school" />
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((school) => (
            <a
              key={school.id}
              href={`/education/schools/${school.slug}`}
              className="group rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-colors hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex flex-col p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${school.logo_bg === "light" ? "bg-white" : school.logo_bg === "dark" ? "bg-zinc-900" : "bg-muted"}`}>
                    {(school.icon ?? school.logo) ? (
                      <img src={school.icon ?? school.logo} alt={school.name} className="h-10 w-10 rounded-md object-contain" />
                    ) : (
                      <svg className="h-6 w-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2v-5" />
                      </svg>
                    )}
                  </div>
                  {school.institution_type && (
                    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                      {school.institution_type}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
                  {school.name}
                </h3>
                {school.hq && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {school.hq}
                  </p>
                )}
                {school.about && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{school.about}</p>
                )}
                {school.disciplines.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {school.disciplines.slice(0, 4).map((d) => (
                      <span key={d} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {getDisciplineName(d)}
                      </span>
                    ))}
                    {school.disciplines.length > 4 && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        +{school.disciplines.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <p className="text-muted-foreground">No schools match your filters.</p>
          {hasAnyFilter && (
            <button type="button" onClick={clearAll} className="mt-2 text-sm font-medium text-primary hover:underline">
              Clear filters
            </button>
          )}
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
