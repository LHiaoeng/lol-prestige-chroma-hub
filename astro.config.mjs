import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://chromaart.lol',
  output: 'static',
  build: { format: 'directory' },
  i18n: {
    locales: ['en', 'zh-cn'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
  vite: { build: { sourcemap: false } },
});
