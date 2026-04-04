# Scottish Games Industry - Directory

The comprehensive open-source directory of the Scottish games industry. Discover game development studios, publishers, games, freelancers, jobs, events, and education.

**Website**: [gamesindustry.scot](https://gamesindustry.scot)

## About

This is the source repository for the Scottish Games Industry directory website. It contains both the website code and all directory data.

## Data

All directory data is stored as JSON files in the `/data` directory:

- `/data/companies/` — Game studios, publishers, tooling companies, etc.
- `/data/games/` — Games organised by first letter
- `/data/freelancers/` — Freelancer profiles
- `/data/jobs/` — Job listings
- `/data/events/` — Industry events organised by year/month
- `/data/education/` — Schools, student teams, and student games
- `/data/platforms/` — Platform definitions

## Contributing

We welcome contributions! You can:

- **Add a new entry**: Submit a PR if you're comfortable doing so. Otherwise - use the [issue templates](https://github.com/r0bbie/gamesindustry.scot/issues/new/choose) to submit new companies, games, jobs, etc.
- **Edit existing data**: Browse the [data files](https://github.com/r0bbie/gamesindustry.scot/tree/main/data) and submit a pull request. Or open an issue.
- **Report issues**: [Open an issue](https://github.com/r0bbie/gamesindustry.scot/issues) for bugs or suggestions.

## Development

### Prerequisites

- [Bun](https://bun.sh) (package manager and runtime)

### Setup

```bash
bun install
bun run dev
```

### Build

```bash
bun run build
```

This builds the static site to `dist/` and runs Pagefind to generate the search index.

## Licensing

- **Code**: Licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPLv3)
- **Data**: Licensed under [Creative Commons Attribution-NonCommercial-ShareAlike 4.0](LICENSE-DATA) (CC BY-NC-SA 4.0)

## Built and supported by

[Buildstash](https://buildstash.com) — Store, share, and manage all your playable builds.
