import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://comae.dev',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [tailwind(), sitemap({
    // Same form as the pages' canonical URLs: no trailing slash except on the home page
    serialize: (item) => ({ ...item, url: item.url.replace(/(?<=\/[^/]+)\/$/, ''), lastmod: new Date().toISOString(), changefreq: 'weekly' }),
  })],
});
