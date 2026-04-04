import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const coordinatesSchema = z
  .object({
    lat: z.number(),
    lng: z.number(),
  })
  .nullable()
  .optional();

const awardSchema = z.object({
  name: z.string(),
  year: z.number(),
  status: z.enum(["won", "nominated"]),
});

const newsSchema = z.object({
  title: z.string(),
  publication: z.string(),
  date: z.string(),
  url: z.string(),
  publication_icon: z.string().optional(),
});

const keyPersonSchema = z.object({
  name: z.string(),
  title: z.string(),
  photo: z.string().optional(),
  email: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
  bluesky: z.string().optional(),
  mastodon: z.string().optional(),
});

const linksSchema = z
  .record(z.string(), z.string())
  .optional()
  .default({});

const companies = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./data/companies" }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    category: z.enum([
      "developer",
      "solo_developer",
      "tooling",
      "service_provider",
      "publisher",
      "supporting_org",
      "games_media",
    ]),
    status: z.enum(["active", "defunct"]).default("active"),
    founded: z.number().optional().nullable(),
    previously_known_as: z.array(z.string()).optional().default([]),
    location: z.string().optional().nullable(),
    region: z.string().optional().nullable(),
    coordinates: coordinatesSchema,
    short_description: z.string().optional().nullable(),
    about: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    logo: z.string().optional().nullable(),
    logo_bg: z.enum(["light", "dark"]).optional().nullable(),
    hero_image: z.string().optional().nullable(),
    highlighted: z.boolean().default(false),
    parent_entity: z
      .object({
        name: z.string(),
        company_id: z.string().optional(),
        url: z.string().optional(),
        text_only: z.boolean().optional(),
      })
      .optional()
      .nullable(),
    company_size: z.string().optional().nullable(),
    employee_count: z.number().optional().nullable(),
    links: linksSchema,
    contact_email: z.string().optional().nullable(),
    legal_entities: z
      .array(
        z.object({
          uk_registered_name: z.string(),
          companies_house_number: z.string().optional(),
        })
      )
      .optional()
      .default([]),
    use_tooling: z.array(z.string()).optional().default([]),
    employee_stats: z
      .object({
        full_time: z.number().optional(),
        gender_split: z
          .object({
            male: z.number().optional(),
            female: z.number().optional(),
            other: z.number().optional(),
          })
          .optional(),
      })
      .optional(),
    key_people: z.array(keyPersonSchema).optional().default([]),
    awards: z.array(awardSchema).optional().default([]),
    news: z.array(newsSchema).optional().default([]),
  }),
});

const games = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./data/games" }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    short_description: z.string().optional(),
    description: z.string().optional(),
    release_date: z.string().optional(),
    status: z.enum(["in_development", "released", "cancelled"]).default("in_development"),
    companies: z
      .object({
        developer: z.array(z.string()).default([]),
        publishers: z.array(z.string()).default([]),
        service_companies: z.array(z.string()).default([]),
        used_tooling: z.array(z.string()).default([]),
        supported_by: z.array(z.string()).default([]),
      })
      .default({}),
    genres: z.array(z.string()).optional().default([]),
    platforms: z.array(z.string()).optional().default([]),
    cover_image: z.string().optional(),
    screenshots: z.array(z.string()).optional().default([]),
    video: z
      .object({
        type: z.enum(["youtube", "peertube"]),
        id: z.string(),
      })
      .optional(),
    stores: z.record(z.string(), z.string()).optional().default({}),
    play_now: z.record(z.string(), z.string()).optional().default({}),
    physical_stores: z.record(z.string(), z.string()).optional().default({}),
    critic_ratings: z
      .record(z.string(), z.union([z.number(), z.string()]))
      .optional()
      .default({}),
    database_links: z.record(z.string(), z.string()).optional().default({}),
    awards: z.array(awardSchema).optional().default([]),
    news: z.array(newsSchema).optional().default([]),
    is_student_game: z.boolean().optional().default(false),
  }),
});

const freelancers = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./data/freelancers" }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    discipline: z.string(),
    bio: z.string().optional(),
    short_bio: z.string().optional(),
    photo: z.string().optional(),
    website: z.string().optional(),
    location: z.string().optional(),
    region: z.string().optional(),
    links: linksSchema,
  }),
});

const jobs = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./data/jobs" }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    company_id: z.string(),
    discipline: z.string(),
    type: z.enum(["fulltime", "parttime", "contract", "internship"]).default("fulltime"),
    work_mode: z.enum(["onsite", "hybrid", "remote"]).optional(),
    location: z.string().optional(),
    date_posted: z.string(),
    closing_date: z.string().optional(),
    url: z.string(),
    description: z.string().optional(),
    active: z.boolean().default(true),
  }),
});

const events = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./data/events" }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    date_start: z.string(),
    date_end: z.string().optional(),
    time: z.string().optional(),
    location: z.string().optional(),
    is_online: z.boolean().default(false),
    is_scottish: z.boolean().default(true),
    company_id: z.string().optional(),
    description: z.string().optional(),
    short_description: z.string().optional(),
    website: z.string().optional(),
    icon: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    highlighted: z.boolean().default(false),
  }),
});

const schools = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./data/education/schools" }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    status: z.enum(["active", "defunct"]).default("active"),
    institution_type: z.enum(["university", "college"]).optional(),
    founded: z.number().optional(),
    hq: z.string().optional().nullable(),
    campuses: z.array(z.string()).optional().default([]),
    region: z.string().optional(),
    coordinates: coordinatesSchema,
    logo: z.string().optional().nullable(),
    icon: z.string().optional().nullable(),
    logo_bg: z.enum(["light", "dark"]).optional().nullable(),
    website: z.string().optional(),
    about: z.string().optional(),
    highlighted: z.boolean().default(false),
    links: linksSchema,
    disciplines: z.array(z.string()).optional().default([]),
    courses: z
      .array(
        z.object({
          name: z.string(),
          level: z.enum(["undergraduate", "postgraduate", "further_education"]).optional(),
          degree_type: z.string().optional(),
          scqf_level: z.number().optional().nullable(),
          campus: z.string().optional().nullable(),
          study_mode: z.string().optional().nullable(),
          duration: z.string().optional().nullable(),
          ucas_code: z.string().optional().nullable(),
          discipline: z.string().optional(),
          url: z.string().optional(),
          short_description: z.string().optional(),
        })
      )
      .optional()
      .default([]),
  }),
});

const teams = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./data/education/teams" }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    school_id: z.string(),
    logo: z.string().optional(),
    short_description: z.string().optional(),
    website: z.string().optional(),
    members: z.array(z.string()).optional().default([]),
  }),
});

const studentGames = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./data/education/games" }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    school_id: z.string(),
    team_id: z.string().optional(),
    description: z.string().optional(),
    platforms: z.array(z.string()).optional().default([]),
    screenshots: z.array(z.string()).optional().default([]),
    video: z
      .object({
        type: z.enum(["youtube", "peertube"]),
        id: z.string(),
      })
      .optional(),
    stores: z.record(z.string(), z.string()).optional().default({}),
    play_now: z.record(z.string(), z.string()).optional().default({}),
  }),
});

const platforms = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./data/platforms" }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string().optional(),
    description: z.string().optional(),
  }),
});

const newsArticles = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./data/news" }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    publication: z.string(),
    date: z.string(),
    url: z.string(),
    ecosystem: z.boolean().optional().default(false),
    company_ids: z.array(z.string()).optional().default([]),
    game_ids: z.array(z.string()).optional().default([]),
  }),
});

export const collections = {
  companies,
  games,
  freelancers,
  jobs,
  events,
  schools,
  teams,
  studentGames,
  platforms,
  newsArticles,
};
