import { getCollection, type CollectionEntry } from "astro:content";

export type NewsArticle = CollectionEntry<"newsArticles">["data"];
import fs from "node:fs";
import path from "node:path";

export type Company = CollectionEntry<"companies">["data"];
export type Game = CollectionEntry<"games">["data"];
export type Freelancer = CollectionEntry<"freelancers">["data"];
export type Job = CollectionEntry<"jobs">["data"];
export type Event = CollectionEntry<"events">["data"];
export type School = CollectionEntry<"schools">["data"];
export type Team = CollectionEntry<"teams">["data"];
export type StudentGame = CollectionEntry<"studentGames">["data"];
export type Platform = CollectionEntry<"platforms">["data"];

const publicDir = path.resolve(process.cwd(), "public");

function publicFileExists(filePath: string | undefined | null): boolean {
  if (!filePath) return false;
  try {
    return fs.existsSync(path.join(publicDir, filePath));
  } catch {
    return false;
  }
}

function validateLogo<T extends { logo?: string | null; icon?: string | null }>(item: T): T {
  let next = { ...item };
  if (next.logo && !publicFileExists(next.logo)) next = { ...next, logo: null };
  if (next.icon && !publicFileExists(next.icon)) next = { ...next, icon: null };
  return next;
}

let _companiesCache: Company[] | null = null;
let _gamesCache: Game[] | null = null;

export async function getAllCompanies(): Promise<Company[]> {
  if (_companiesCache) return _companiesCache;
  const entries = await getCollection("companies");
  _companiesCache = entries.map((e) => validateLogo(e.data));
  return _companiesCache;
}

export async function getAllGames(): Promise<Game[]> {
  if (_gamesCache) return _gamesCache;
  const entries = await getCollection("games");
  _gamesCache = entries.map((e) => e.data);
  return _gamesCache;
}

export async function getAllFreelancers(): Promise<Freelancer[]> {
  const entries = await getCollection("freelancers");
  return entries.map((e) => e.data);
}

export async function getAllJobs(): Promise<Job[]> {
  const entries = await getCollection("jobs");
  return entries.map((e) => e.data);
}

// --- Recurrence helpers ---

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function nthWeekdayOfMonth(year: number, month: number, dayName: string, n: number): Date {
  const dow = DAY_NAMES.indexOf(dayName.toLowerCase());
  const firstDow = new Date(year, month, 1).getDay();
  const diff = (dow - firstDow + 7) % 7;
  const date = 1 + diff + (n - 1) * 7;
  return new Date(year, month, date);
}

function parseDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function biweeklyOccurrencesForMonth(
  startDate: string,
  dayName: string,
  year: number,
  month: number
): Date[] {
  const dow = DAY_NAMES.indexOf(dayName.toLowerCase());
  if (dow === -1) return [];
  const ref = parseDate(startDate);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const results: Date[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (date.getDay() === dow) {
      const diffDays = Math.round((date.getTime() - ref.getTime()) / 86_400_000);
      if (diffDays >= 0 && diffDays % 14 === 0) results.push(date);
    }
  }
  return results;
}

export function computeNextOccurrence(
  recurrence: NonNullable<Event["recurrence"]>,
  from: Date = new Date()
): Date {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  if (recurrence.frequency === "biweekly" && recurrence.start_date && recurrence.day) {
    const ref = parseDate(recurrence.start_date);
    if (ref >= today) return ref;
    // Walk forward in 14-day steps from ref until we find a date >= today
    const diffDays = Math.ceil((today.getTime() - ref.getTime()) / 86_400_000);
    const steps = Math.ceil(diffDays / 14);
    const next = new Date(ref.getTime() + steps * 14 * 86_400_000);
    return next;
  }

  if (recurrence.frequency === "monthly" && recurrence.week != null && recurrence.day) {
    let candidate = nthWeekdayOfMonth(today.getFullYear(), today.getMonth(), recurrence.day, recurrence.week);
    if (candidate >= today) return candidate;
    let m = today.getMonth() + 1;
    let y = today.getFullYear();
    if (m > 11) { m = 0; y++; }
    return nthWeekdayOfMonth(y, m, recurrence.day, recurrence.week);
  }

  return today;
}

export { biweeklyOccurrencesForMonth };

export function computeOccurrenceForMonth(
  recurrence: NonNullable<Event["recurrence"]>,
  year: number,
  month: number
): Date | null {
  if (recurrence.frequency === "biweekly" && recurrence.start_date && recurrence.day) {
    const occurrences = biweeklyOccurrencesForMonth(recurrence.start_date, recurrence.day, year, month);
    return occurrences[0] ?? null;
  }
  if (recurrence.frequency === "monthly" && recurrence.week != null && recurrence.day) {
    return nthWeekdayOfMonth(year, month, recurrence.day, recurrence.week);
  }
  return null;
}

function dateToString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getAllEvents(): Promise<Event[]> {
  const entries = await getCollection("events");
  return entries.map((e) => {
    const data = e.data;
    if (data.recurring && data.recurrence && !data.date_start) {
      const next = computeNextOccurrence(data.recurrence);
      return { ...data, date_start: dateToString(next) };
    }
    return data;
  });
}

export async function getAllSchools(): Promise<School[]> {
  const entries = await getCollection("schools");
  return entries.map((e) => e.data);
}

export async function getAllTeams(): Promise<Team[]> {
  const entries = await getCollection("teams");
  return entries.map((e) => e.data);
}

export async function getAllStudentGames(): Promise<StudentGame[]> {
  const entries = await getCollection("studentGames");
  return entries.map((e) => e.data);
}

export async function getAllPlatforms(): Promise<Platform[]> {
  const entries = await getCollection("platforms");
  return entries.map((e) => e.data);
}

export async function getAllNewsArticles(): Promise<NewsArticle[]> {
  const entries = await getCollection("newsArticles");
  return entries
    .map((e) => e.data)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getNewsForCompany(companyId: string): Promise<NewsArticle[]> {
  const all = await getAllNewsArticles();
  return all.filter((n) => n.company_ids.includes(companyId));
}

export async function getNewsForGame(gameId: string): Promise<NewsArticle[]> {
  const all = await getAllNewsArticles();
  return all.filter((n) => n.game_ids.includes(gameId));
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const companies = await getAllCompanies();
  return companies.find((c) => c.id === id) ?? null;
}

export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  const companies = await getAllCompanies();
  return companies.find((c) => c.slug === slug) ?? null;
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  const games = await getAllGames();
  return games.find((g) => g.slug === slug) ?? null;
}

export async function getGamesForCompany(companyId: string): Promise<Game[]> {
  const games = await getAllGames();
  return games.filter(
    (g) =>
      matchesCompanyRef(g.companies.developer, companyId) ||
      matchesCompanyRef(g.companies.publishers, companyId) ||
      matchesCompanyRef(g.companies.service_companies, companyId) ||
      matchesCompanyRef(g.companies.used_tooling, companyId) ||
      matchesCompanyRef(g.companies.supported_by, companyId) ||
      matchesCompanyRef(g.companies.contributed_by, companyId)
  );
}

export async function getJobsForCompany(companyId: string): Promise<Job[]> {
  const jobs = await getAllJobs();
  return jobs.filter((j) => j.company_id === companyId && j.active);
}

export async function getActiveJobs(): Promise<Job[]> {
  const jobs = await getAllJobs();
  return jobs.filter((j) => j.active);
}

/**
 * Safely resolve a company ID to a Company, returning null if not found.
 * Logs a warning at build time for broken references.
 */
export async function getSchoolById(id: string): Promise<School | null> {
  const schools = await getAllSchools();
  return schools.find((s) => s.id === id) ?? null;
}

export async function safeGetSchool(
  id: string,
  context?: string
): Promise<School | null> {
  const school = await getSchoolById(id);
  if (!school) {
    console.warn(
      `[DATA WARNING] School "${id}" not found${context ? ` (referenced from ${context})` : ""}`
    );
  }
  return school;
}

export async function safeGetCompany(
  id: string,
  context?: string
): Promise<Company | null> {
  const company = await getCompanyById(id);
  if (!company) {
    console.warn(
      `[DATA WARNING] Company "${id}" not found${context ? ` (referenced from ${context})` : ""}`
    );
  }
  return company;
}

/**
 * Resolve an array of company IDs, returning found companies and marking broken ones.
 */
export async function resolveCompanyIds(
  ids: string[],
  context?: string
): Promise<Array<{ id: string; company: Company | null }>> {
  return Promise.all(
    ids.map(async (id) => ({
      id,
      company: await safeGetCompany(id, context),
    }))
  );
}

type CompanyRef = string | { name: string; url?: string; company_id?: string };

/**
 * Resolve a mixed array of company DB slugs and inline name objects.
 * - String entries are looked up in the DB; if not found they show as a broken link.
 * - Object `{ name, url? }` — external company, no DB lookup, renders as link or plain text.
 * - Object `{ name, company_id }` — custom display name linked to an internal DB company page.
 */
export async function resolveCompanyRefs(
  refs: CompanyRef[],
  context?: string
): Promise<Array<{ id: string | null; name: string; url: string | null; company: Company | null }>> {
  return Promise.all(
    refs.map(async (ref) => {
      if (typeof ref === "object") {
        if (ref.company_id) {
          const company = await safeGetCompany(ref.company_id, context);
          return { id: ref.company_id, name: ref.name, url: null, company };
        }
        return { id: null, name: ref.name, url: ref.url ?? null, company: null };
      }
      const company = await safeGetCompany(ref, context);
      return { id: ref, name: company?.name ?? ref, url: null, company };
    })
  );
}

export function matchesCompanyRef(
  refs: CompanyRef[],
  companyId: string
): boolean {
  return refs.some((ref) =>
    typeof ref === "string" ? ref === companyId : ref.company_id === companyId
  );
}

export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function getStats(): Promise<{
  companies: number;
  games: number;
  freelancers: number;
  jobs: number;
  schools: number;
  upcomingEvents: number;
}> {
  const [companies, games, freelancers, jobs, schools, events] = await Promise.all([
    getAllCompanies(),
    getAllGames(),
    getAllFreelancers(),
    getAllJobs(),
    getAllSchools(),
    getAllEvents(),
  ]);

  const now = new Date();

  return {
    companies: companies.filter((c) => c.status !== "defunct").length,
    games: games.filter((g) => g.status !== "cancelled").length,
    freelancers: freelancers.length,
    jobs: jobs.filter((j) => j.active).length,
    schools: schools.length,
    upcomingEvents: events.filter((e) => new Date(e.date_start) >= now).length,
  };
}
