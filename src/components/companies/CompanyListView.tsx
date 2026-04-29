import { useState, useEffect, useMemo, useRef } from "react";
import { COMPANY_CATEGORIES, REGIONS, getRegionName, isCompanyNonActiveStatus, getCompanyStatusDisplayLabel } from "@/lib/constants";
import { FilterDropdown, FilterChip, FilterToggle, SortDropdown, ResultCount } from "@/components/ui/FilterToolbar";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 30;

interface Company {
  id: string;
  name: string;
  slug: string;
  categories: string[];
  status: string;
  founded?: number | null;
  location?: string;
  region?: string;
  short_description?: string;
  logo?: string;
  logo_bg?: string | null;
  employee_count?: number | null;
}

interface Props {
  companies: Company[];
  gameCountMap?: Record<string, number>;
}

const SORT_OPTIONS = [
  { value: "name", label: "Name A–Z" },
  { value: "random", label: "Random" },
  { value: "employees", label: "Employees" },
  { value: "games", label: "Most Games" },
  { value: "founded", label: "Founded" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

function getCategoryName(id: string): string {
  return COMPANY_CATEGORIES.find((c) => c.id === id)?.name ?? id;
}

function toggle(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  next.has(id) ? next.delete(id) : next.add(id);
  return next;
}

/** Categories filter uses OR semantics: company counts if any of its tags overlaps the selection.
 * Selecting "developer" also includes companies tagged solely as solo_developer (solo dev studios). */
function companyMatchesCategoryFilters(companyCategories: string[], selected: Set<string>): boolean {
  if (selected.size === 0) return true;
  return companyCategories.some((cat) => {
    if (selected.has(cat)) return true;
    if (selected.has("developer") && cat === "solo_developer") return true;
    return false;
  });
}

function readUrlParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

function initSort(): SortValue {
  const v = readUrlParams().get("sort");
  if (v && SORT_OPTIONS.some((o) => o.value === v)) return v as SortValue;
  return "name";
}

function initPage(): number {
  const v = parseInt(readUrlParams().get("page") ?? "1", 10);
  return isNaN(v) || v < 1 ? 1 : v;
}

export default function CompanyListView({ companies, gameCountMap = {} }: Props) {
  const [search, setSearch] = useState(() => readUrlParams().get("q") ?? "");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(() => {
    const v = readUrlParams().get("category");
    return v ? new Set(v.split(",")) : new Set();
  });
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(() => {
    const v = readUrlParams().get("region");
    return v ? new Set(v.split(",")) : new Set();
  });
  const [includeDefunct, setIncludeDefunct] = useState(() => readUrlParams().get("status") === "defunct");
  const [sort, setSort] = useState<SortValue>(initSort);
  const [currentPage, setCurrentPage] = useState(initPage);
  const searchRef = useRef<HTMLInputElement>(null);
  const isFirstRender = useRef(true);

  const totalVisible = useMemo(
    () =>
      companies.filter((c) => includeDefunct || !isCompanyNonActiveStatus(c.status)).length,
    [companies, includeDefunct]
  );

  const filtered = useMemo(() => {
    let result = companies.filter((c) => {
      if (!includeDefunct && isCompanyNonActiveStatus(c.status)) return false;
      if (selectedCategories.size > 0 && !companyMatchesCategoryFilters(c.categories, selectedCategories)) return false;
      if (selectedRegions.size > 0 && (!c.region || !selectedRegions.has(c.region))) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !(c.short_description ?? "").toLowerCase().includes(q))
          return false;
      }
      return true;
    });

    switch (sort) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "employees":
        result.sort((a, b) => (b.employee_count ?? 0) - (a.employee_count ?? 0));
        break;
      case "games":
        result.sort((a, b) => (gameCountMap[b.id] ?? 0) - (gameCountMap[a.id] ?? 0));
        break;
      case "founded":
        result.sort((a, b) => (a.founded ?? 9999) - (b.founded ?? 9999));
        break;
      case "random":
        for (let i = result.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [result[i], result[j]] = [result[j], result[i]];
        }
        break;
    }

    return result;
  }, [companies, search, selectedCategories, selectedRegions, includeDefunct, sort, gameCountMap]);

  // Reset to page 1 when filters change, but not on the initial render
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setCurrentPage(1);
  }, [search, selectedCategories, selectedRegions, includeDefunct, sort]);

  // Keep URL in sync so back-navigation restores the exact page + filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (includeDefunct) params.set("status", "defunct");
    if (selectedCategories.size > 0) params.set("category", [...selectedCategories].join(","));
    if (selectedRegions.size > 0) params.set("region", [...selectedRegions].join(","));
    if (sort !== "name") params.set("sort", sort);
    if (currentPage > 1) params.set("page", String(currentPage));
    const qs = params.toString();
    history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
  }, [search, includeDefunct, selectedCategories, selectedRegions, sort, currentPage]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handlePageChange(page: number) {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearAll() {
    setSearch("");
    setSelectedCategories(new Set());
    setSelectedRegions(new Set());
    setIncludeDefunct(false);
    setCurrentPage(1);
    searchRef.current?.focus();
  }

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...[...selectedCategories].map((id) => ({
      key: `cat:${id}`,
      label: getCategoryName(id),
      onRemove: () => setSelectedCategories((p) => toggle(p, id)),
    })),
    ...[...selectedRegions].map((id) => ({
      key: `region:${id}`,
      label: getRegionName(id),
      onRemove: () => setSelectedRegions((p) => toggle(p, id)),
    })),
    ...(includeDefunct ? [{ key: "defunct", label: "Including defunct", onRemove: () => setIncludeDefunct(false) }] : []),
    ...(search ? [{ key: "search", label: `"${search}"`, onRemove: () => setSearch("") }] : []),
  ];

  const hasAnyFilter = activeChips.length > 0;

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">All Companies</h1>
      </div>

      {/* Filter toolbar */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-0 flex-1 basis-48">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={searchRef}
            type="search"
            placeholder="Search companies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <FilterDropdown
          label="Category"
          options={[...COMPANY_CATEGORIES]}
          selected={selectedCategories}
          onToggle={(id) => setSelectedCategories((p) => toggle(p, id))}
        />
        <FilterDropdown
          label="Region"
          options={[...REGIONS]}
          selected={selectedRegions}
          onToggle={(id) => setSelectedRegions((p) => toggle(p, id))}
        />
        <FilterToggle
          label="Include defunct"
          active={includeDefunct}
          onToggle={() => setIncludeDefunct((v) => !v)}
        />

        <div className="ml-auto">
          <SortDropdown
            options={[...SORT_OPTIONS]}
            value={sort}
            onChange={(v) => setSort(v as SortValue)}
            align="right"
          />
        </div>
      </div>

      {/* Count row */}
      <div className="mb-4">
        <ResultCount count={filtered.length} total={totalVisible} noun="company" />
      </div>

      {/* Active filter chips */}
      {hasAnyFilter && (
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

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <svg className="mb-4 h-10 w-10 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <p className="font-medium text-muted-foreground">No companies found</p>
          <button type="button" onClick={clearAll} className="mt-3 text-sm text-primary hover:underline">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginated.map((company) => (
            <a
              key={company.id}
              href={`/companies/${company.slug}`}
              className="group flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${company.logo_bg === "light" ? "bg-white" : company.logo_bg === "dark" ? "bg-zinc-900" : "bg-muted"}`}>
                  {(company.icon ?? company.logo) ? (
                    <img src={company.icon ?? company.logo!} alt="" className={company.logo_bg ? "h-full w-full rounded-lg object-contain" : "h-7 w-7 object-contain"} />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">
                      {company.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {isCompanyNonActiveStatus(company.status) && (
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {getCompanyStatusDisplayLabel(company.status)}
                    </span>
                  )}
                </div>
              </div>

              <h3 className="font-semibold leading-tight transition-colors group-hover:text-primary">
                {company.name}
              </h3>

              {company.location && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {company.location}
                </p>
              )}

              {company.short_description && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {company.short_description}
                </p>
              )}

              <div className="mt-auto pt-3">
                <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {company.categories.map((cat) => getCategoryName(cat)).join(" · ")}
                </span>
              </div>
            </a>
          ))}
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
