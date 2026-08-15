import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { FEATURES } from './src/lib/constants.ts';

export default defineConfig({
  site: 'https://gamesindustry.scot',
  output: 'static',
  redirects: {
    '/companies/no-code': '/companies/screen-burn',
    '/companies/team-terrible-games': '/companies/team-terrible',
  },
  integrations: [
    react(),
    sitemap({
      // Filter utility / non-public pages so they don't hit search engines.
      filter: (page) =>
        !page.includes('/search/') &&
        !page.includes('/links/') &&
        !page.includes('/companies/map/') &&
        (FEATURES.jobs || !page.includes('/jobs/')),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        external: ['/pagefind/pagefind-ui.js'],
      },
    },
  },
});
