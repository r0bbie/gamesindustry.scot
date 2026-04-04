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

function validateLogo<T extends { logo?: string | null }>(item: T): T {
  if (item.logo && !publicFileExists(item.logo)) {
    return { ...item, logo: null };
  }
  return item;
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

export async function getAllEvents(): Promise<Event[]> {
  const entries = await getCollection("events");
  return entries.map((e) => e.data);
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
      g.companies.developer.includes(companyId) ||
      g.companies.publishers.includes(companyId) ||
      g.companies.service_companies.includes(companyId) ||
      g.companies.used_tooling.includes(companyId) ||
      g.companies.supported_by.includes(companyId)
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
