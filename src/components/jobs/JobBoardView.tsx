import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { DISCIPLINES, getDisciplineName } from "@/lib/constants";
import { FilterDropdown, FilterChip, ResultCount } from "@/components/ui/FilterToolbar";

interface Job {
  id: string;
  title: string;
  slug: string;
  company_id: string;
  discipline: string;
  type: string;
  work_mode?: string;
  location?: string;
  date_posted: string;
  closing_date?: string;
  url: string;
  description?: string;
  active: boolean;
}

interface CompanyInfo {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  short_description?: string;
}

interface Props {
  jobs: Job[];
  companies: CompanyInfo[];
}

const TYPE_LABELS: Record<string, string> = {
  fulltime: "Full-time",
  parttime: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

const MODE_LABELS: Record<string, string> = {
  onsite: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

export default function JobBoardView({ jobs, companies }: Props) {
  const [search, setSearch] = useState("");
  const [selectedDisciplines, setSelectedDisciplines] = useState<Set<string>>(
    new Set()
  );

  const companyMap = useMemo(() => {
    const map = new Map<string, CompanyInfo>();
    for (const c of companies) map.set(c.id, c);
    return map;
  }, [companies]);

  const disciplinesWithJobs = useMemo(() => {
    const ids = new Set(jobs.map((j) => j.discipline));
    return DISCIPLINES.filter((d) => ids.has(d.id));
  }, [jobs]);

  function toggle(set: Set<string>, id: string): Set<string> {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  }

  function clearAll() {
    setSearch("");
    setSelectedDisciplines(new Set());
  }

  const activeChips = [
    ...[...selectedDisciplines].map((id) => ({
      key: `disc:${id}`,
      label: getDisciplineName(id),
      onRemove: () => setSelectedDisciplines((p) => toggle(p, id)),
    })),
  ];

  const grouped = useMemo(() => {
    let filtered = jobs.filter((j) => {
      if (
        selectedDisciplines.size > 0 &&
        !selectedDisciplines.has(j.discipline)
      )
        return false;
      if (search) {
        const q = search.toLowerCase();
        const company = companyMap.get(j.company_id);
        const haystack = [
          j.title,
          getDisciplineName(j.discipline),
          j.location ?? "",
          company?.name ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    filtered.sort(
      (a, b) =>
        new Date(b.date_posted).getTime() - new Date(a.date_posted).getTime()
    );

    const groups = new Map<string, Job[]>();
    for (const job of filtered) {
      const existing = groups.get(job.company_id);
      if (existing) existing.push(job);
      else groups.set(job.company_id, [job]);
    }

    return Array.from(groups.entries()).map(([companyId, jobs]) => ({
      company: companyMap.get(companyId) ?? null,
      companyId,
      jobs,
    }));
  }, [jobs, search, selectedDisciplines, companyMap]);

  const totalJobs = grouped.reduce((sum, g) => sum + g.jobs.length, 0);

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
            placeholder="Search jobs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {disciplinesWithJobs.length > 0 && (
          <FilterDropdown
            label="Discipline"
            options={disciplinesWithJobs}
            selected={selectedDisciplines}
            onToggle={(id) => setSelectedDisciplines((p) => toggle(p, id))}
          />
        )}
      </div>

      {/* Count row */}
      <div className="mb-4">
        <ResultCount count={totalJobs} total={jobs.length} noun="job" />
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

      {totalJobs === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-lg font-medium">No jobs found</p>
          <p className="mt-1 text-sm">
            Try adjusting your filters or search term.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ company, companyId, jobs }) => (
            <div key={companyId}>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {company?.logo ? (
                    <img
                      src={company.logo}
                      alt=""
                      className="h-7 w-7 object-contain"
                    />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">
                      {(company?.name ?? companyId).charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  {company ? (
                    <a
                      href={`/companies/${company.slug}`}
                      className="font-semibold hover:text-primary"
                    >
                      {company.name}
                    </a>
                  ) : (
                    <span className="font-semibold">{companyId}</span>
                  )}
                  {company?.short_description && (
                    <p className="truncate text-xs text-muted-foreground">
                      {company.short_description}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3 pl-0 sm:pl-[52px]">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="font-medium">{job.title}</h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {getDisciplineName(job.discipline)}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {TYPE_LABELS[job.type] ?? job.type}
                        </Badge>
                        {job.work_mode && (
                          <Badge variant="outline" className="text-[10px]">
                            {MODE_LABELS[job.work_mode] ?? job.work_mode}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        {job.location && <span>{job.location}</span>}
                        {job.location && <span>&middot;</span>}
                        <span>Posted: {job.date_posted}</span>
                        {job.closing_date && (
                          <>
                            <span>&middot;</span>
                            <span>Closes: {job.closing_date}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                    >
                      Apply
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
