import { useState, useMemo, useEffect } from "react";
import { DISCIPLINES, getDisciplineName } from "@/lib/constants";
import { FilterDropdown, FilterChip, ResultCount } from "@/components/ui/FilterToolbar";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 25;

/** Normalise a raw degree_type string into a short qualification label for filtering. */
function normalizeQual(degreeType: string): string {
  // Collapse research degree variants into one bucket
  if (/MPhil|PhD/i.test(degreeType)) return "MSc / MPhil / PhD";
  // Strip "(Hons)" and similar parenthetical suffixes
  let q = degreeType.replace(/\s*\([^)]*\)\s*/g, "").trim();
  // Collapse "BSc / BSc" style duplicates (same token either side of /)
  q = q.replace(/^(\S+)\s*\/\s*\1$/i, "$1").trim();
  // Normalise "NPA bundle" → "NPA"
  if (/^npa\b/i.test(q)) return "NPA";
  return q;
}

export interface CourseItem {
  name: string;
  schoolId: string;
  schoolName: string;
  schoolSlug: string;
  institutionType?: string;
  level?: string;
  degree_type?: string;
  scqf_level?: number | null;
  campus?: string | null;
  study_mode?: string | null;
  duration?: string | null;
  ucas_code?: string | null;
  discipline?: string;
  url?: string;
  short_description?: string;
}

interface Props {
  courses: CourseItem[];
}

const STUDY_LEVELS = [
  { id: "undergraduate", name: "Undergraduate" },
  { id: "postgraduate", name: "Postgraduate" },
  { id: "further_education", name: "Further Education" },
];

const INSTITUTION_TYPES = [
  { id: "university", name: "University" },
  { id: "college", name: "College" },
];

const LEVEL_LABEL: Record<string, string> = {
  undergraduate: "Undergraduate",
  postgraduate: "Postgraduate",
  further_education: "Further Education",
};

const LEVEL_COLOUR: Record<string, string> = {
  undergraduate: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  postgraduate: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  further_education: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

function usedDisciplines(courses: CourseItem[]) {
  const ids = new Set(courses.map((c) => c.discipline).filter(Boolean) as string[]);
  return DISCIPLINES.filter((d) => ids.has(d.id));
}

function usedScqfLevels(courses: CourseItem[]) {
  const levels = [...new Set(courses.map((c) => c.scqf_level).filter((v): v is number => v != null))];
  return levels.sort((a, b) => a - b).map((n) => ({ id: String(n), name: `SCQF ${n}` }));
}

function usedQualifications(courses: CourseItem[]) {
  const seen = new Map<string, string>(); // normalised → display label
  for (const c of courses) {
    if (!c.degree_type) continue;
    const norm = normalizeQual(c.degree_type);
    if (!seen.has(norm)) seen.set(norm, norm);
  }
  return [...seen.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, name]) => ({ id, name }));
}

function toggle(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  next.has(id) ? next.delete(id) : next.add(id);
  return next;
}

export default function CourseListView({ courses }: Props) {
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedDisciplines, setSelectedDisciplines] = useState<Set<string>>(new Set());
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(new Set());
  const [selectedScqf, setSelectedScqf] = useState<Set<string>>(new Set());
  const [selectedQuals, setSelectedQuals] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const activeDisciplines = useMemo(() => usedDisciplines(courses), [courses]);
  const activeScqfLevels = useMemo(() => usedScqfLevels(courses), [courses]);
  const activeQualifications = useMemo(() => usedQualifications(courses), [courses]);

  const filtered = useMemo(() => {
    return courses
      .filter((c) => {
        if (selectedTypes.size > 0 && !selectedTypes.has(c.institutionType ?? "")) return false;
        if (selectedLevels.size > 0 && (!c.level || !selectedLevels.has(c.level))) return false;
        if (selectedDisciplines.size > 0 && (!c.discipline || !selectedDisciplines.has(c.discipline))) return false;
        if (selectedScqf.size > 0 && (c.scqf_level == null || !selectedScqf.has(String(c.scqf_level)))) return false;
        if (selectedQuals.size > 0 && (!c.degree_type || !selectedQuals.has(normalizeQual(c.degree_type)))) return false;
        if (search) {
          const q = search.toLowerCase();
          if (
            !c.name.toLowerCase().includes(q) &&
            !c.schoolName.toLowerCase().includes(q) &&
            !(c.short_description ?? "").toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [courses, search, selectedTypes, selectedDisciplines, selectedLevels, selectedScqf, selectedQuals]);

  // Reset to page 1 whenever filters change
  useEffect(() => { setCurrentPage(1); }, [search, selectedTypes, selectedDisciplines, selectedLevels, selectedScqf, selectedQuals]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasAnyFilter =
    selectedTypes.size > 0 || selectedDisciplines.size > 0 || selectedLevels.size > 0 ||
    selectedScqf.size > 0 || selectedQuals.size > 0 || !!search;

  function clearAll() {
    setSearch("");
    setSelectedTypes(new Set());
    setSelectedDisciplines(new Set());
    setSelectedLevels(new Set());
    setSelectedScqf(new Set());
    setSelectedQuals(new Set());
    setCurrentPage(1);
  }

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...[...selectedTypes].map((id) => ({
      key: `type:${id}`,
      label: INSTITUTION_TYPES.find((t) => t.id === id)?.name ?? id,
      onRemove: () => setSelectedTypes((p) => toggle(p, id)),
    })),
    ...[...selectedLevels].map((id) => ({
      key: `level:${id}`,
      label: STUDY_LEVELS.find((l) => l.id === id)?.name ?? id,
      onRemove: () => setSelectedLevels((p) => toggle(p, id)),
    })),
    ...[...selectedDisciplines].map((id) => ({
      key: `disc:${id}`,
      label: getDisciplineName(id),
      onRemove: () => setSelectedDisciplines((p) => toggle(p, id)),
    })),
    ...[...selectedScqf].map((id) => ({
      key: `scqf:${id}`,
      label: `SCQF ${id}`,
      onRemove: () => setSelectedScqf((p) => toggle(p, id)),
    })),
    ...[...selectedQuals].map((id) => ({
      key: `qual:${id}`,
      label: id,
      onRemove: () => setSelectedQuals((p) => toggle(p, id)),
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
            placeholder="Search courses…"
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
          label="Level"
          options={STUDY_LEVELS}
          selected={selectedLevels}
          onToggle={(id) => setSelectedLevels((p) => toggle(p, id))}
        />
        <FilterDropdown
          label="Discipline"
          options={activeDisciplines}
          selected={selectedDisciplines}
          onToggle={(id) => setSelectedDisciplines((p) => toggle(p, id))}
        />
        <FilterDropdown
          label="Qualification"
          options={activeQualifications}
          selected={selectedQuals}
          onToggle={(id) => setSelectedQuals((p) => toggle(p, id))}
        />
        <FilterDropdown
          label="SCQF Level"
          options={activeScqfLevels}
          selected={selectedScqf}
          onToggle={(id) => setSelectedScqf((p) => toggle(p, id))}
        />
      </div>

      {/* Count row */}
      <div className="mb-4">
        <ResultCount count={filtered.length} total={courses.length} noun="course" />
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
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {paginated.map((course, i) => (
            <a
              key={`${course.schoolId}-${course.name}-${i}`}
              href={`/education/schools/${course.schoolSlug}`}
              className="group flex flex-col gap-1 px-5 py-4 transition-colors hover:bg-accent sm:flex-row sm:items-start sm:gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold leading-snug transition-colors group-hover:text-primary">
                    {course.name}
                  </span>
                  {course.degree_type && (
                    <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {course.degree_type}
                    </span>
                  )}
                  {course.level && (
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${LEVEL_COLOUR[course.level] ?? "bg-muted text-muted-foreground"}`}>
                      {LEVEL_LABEL[course.level] ?? course.level}
                    </span>
                  )}
                </div>

                <p className="mt-0.5 text-sm text-muted-foreground">{course.schoolName}</p>

                {course.short_description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                    {course.short_description}
                  </p>
                )}

                {(course.scqf_level || course.duration || course.study_mode || course.campus || course.ucas_code) && (
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {course.scqf_level && <span>SCQF {course.scqf_level}</span>}
                    {course.duration && <span>{course.duration}</span>}
                    {course.study_mode && <span>{course.study_mode}</span>}
                    {course.campus && <span>{course.campus}</span>}
                    {course.ucas_code && <span>UCAS {course.ucas_code}</span>}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                {course.institutionType && (
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                    {course.institutionType}
                  </span>
                )}
                {course.discipline && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {getDisciplineName(course.discipline)}
                  </span>
                )}
                <svg className="hidden h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <p className="text-muted-foreground">No courses match your filters.</p>
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
