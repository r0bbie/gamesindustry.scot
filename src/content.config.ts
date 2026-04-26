import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const coordinatesSchema = z
  .object({
    lat: z.number(),
    lng: z.number(),
  })
  .nullable()
  .optional();

// A company reference is either a DB slug string or an inline name object.
// The object form supports:
//   { name, url }        — external company, renders as a plain link
//   { name, company_id } — display a custom name but still link to an internal DB company page
const companyRefSchema = z.union([
  z.string(),
  z.object({
    name: z.string(),
    url: z.string().optional(),
    company_id: z.string().optional(),
  }),
]);

const awardSchema = z.object({
  name: z.string(),
  year: z.number(),
  status: z.enum(["won", "nominated", "selected", "shortlisted", "participated"]),
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
    categories: z.array(z.enum([
      "developer",
      "solo_developer",
      "tooling",
      "service_provider",
      "publisher",
      "supporting_org",
      "games_media",
    ])).min(1),
    status: z.enum(["active", "defunct"]).default("active"),
    founded: z.number().optional().nullable(),
    previously_known_as: z.array(z.string()).optional().default([]),
    location: z.string().optional().nullable(),
    region: z.string().optional().nullable(),
    additional_locations: z.array(z.string()).optional().default([]),
    coordinates: coordinatesSchema,
    short_description: z.string().optional().nullable(),
    about: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    logo: z.string().optional().nullable(),
    /** Square / avatar mark for lists and cards; when set with `logo`, `logo` is typically the wide wordmark. */
    icon: z.string().optional().nullable(),
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
    tech_stack: z.array(z.string()).optional().default([]),
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
    /**
     * Release window (e.g. first availability through end of support, or ongoing live title).
     * When set, takes priority over `release_date` for display and sorting.
     */
    release_period: z
      .object({
        start: z.string(),
        end: z.union([z.string(), z.literal("present")]).nullable().optional(),
      })
      .optional(),
    status: z.enum(["in_development", "released", "cancelled", "prototype"]).default("in_development"),
    companies: z
      .object({
        developer: z.array(companyRefSchema).default([]),
        publishers: z.array(companyRefSchema).default([]),
        service_companies: z.array(companyRefSchema).default([]),
        used_tooling: z.array(companyRefSchema).default([]),
        supported_by: z.array(companyRefSchema).default([]),
        /** Work-for-hire contributors who aren't a primary developer (e.g. co-dev, porting studio). */
        contributed_by: z.array(companyRefSchema).default([]),
      })
      .default({}),
    genres: z.array(z.string()).optional().default([]),
    platforms: z.array(z.string()).optional().default([]),
    cover_image: z.string().optional(),
    /** External press kit / asset page (shown on game page when set). */
    press_kit_url: z.string().url().optional(),
    screenshots: z.array(z.string()).optional().default([]),
    video: z
      .object({
        type: z.enum(["youtube", "peertube"]),
        id: z.string(),
      })
      .optional(),
    stores: z.record(z.string(), z.string()).optional().default({}),
    play_now: z.record(z.string(), z.string()).optional().default({}),
    physical_stores: z.record(
      z.string(),
      z.union([z.string(), z.record(z.string(), z.string())])
    ).optional().default({}),
    critic_ratings: z
      .record(z.string(), z.union([z.number(), z.string()]))
      .optional()
      .default({}),
    critic_ids: z.record(z.string(), z.string()).optional().default({}),
    database_links: z.record(z.string(), z.string()).optional().default({}),
    awards: z.array(awardSchema).optional().default([]),
    news: z.array(newsSchema).optional().default([]),
    is_student_game: z.boolean().optional().default(false),
    /** Force cover image to always fill/zoom regardless of aspect ratio. */
    cover_fill: z.boolean().optional().default(false),
    tech: z
      .object({
        game_engine: z.string().optional(),
        sound_engine: z.string().optional(),
        misc: z.array(z.string()).optional().default([]),
      })
      .optional(),
  }),
});

const freelancers = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./data/freelancers" }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    trading_name: z.string().optional(),
    slug: z.string(),
    discipline: z.string(),
    bio: z.string().optional(),
    short_bio: z.string().optional(),
    photo: z.string().optional(),
    website: z.string().optional(),
    email: z.string().optional(),
    location: z.string().optional(),
    region: z.string().optional(),
    links: linksSchema,
    testimonials: z
      .array(
        z.object({
          quote: z.string(),
          attribution: z.string(),
        })
      )
      .optional()
      .default([]),
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
    date_start: z.string().optional(),
    date_end: z.string().optional(),
    time: z.string().optional(),
    location: z.string().optional(),
    is_online: z.boolean().default(false),
    is_scottish: z.boolean().default(true),
    recurring: z.boolean().default(false),
    recurrence: z.object({
      frequency: z.enum(["weekly", "biweekly", "monthly"]),
      start_date: z.string().optional(),
      week: z.number().optional(),
      day: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]).optional(),
      description: z.string(),
    }).optional(),
    company_id: z.string().optional(),
    school_id: z.string().optional(),
    organiser_name: z.string().optional(),
    description: z.string().optional(),
    short_description: z.string().optional(),
    website: z.string().optional(),
    icon: z.string().optional(),
    image: z.string().optional(),
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
    links: linksSchema,
    members: z
      .array(z.object({ name: z.string(), role: z.string().optional() }))
      .optional()
      .default([]),
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
    competitions: z
      .array(
        z.object({
          name: z.string(),
          result: z.enum(["winner", "runner-up", "finalist", "participated"]),
        })
      )
      .optional()
      .default([]),
    news: z.array(newsSchema).optional().default([]),
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

const tools = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./data/tools" }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    company_id: z.string().optional(),
    status: z.enum(["active", "discontinued"]).default("active"),
    short_description: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    features: z.array(z.string()).optional().default([]),
    screenshots: z.array(z.string()).optional().default([]),
    video: z
      .object({
        type: z.enum(["youtube"]),
        id: z.string(),
      })
      .optional()
      .nullable(),
    integrations: z.array(z.string()).optional().default([]),
    website: z.string().optional().nullable(),
    logo: z.string().optional().nullable(),
  }),
});

export const collections = {
  companies,
  games,
  tools,
  freelancers,
  jobs,
  events,
  schools,
  teams,
  studentGames,
  platforms,
  newsArticles,
};
