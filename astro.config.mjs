import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://chromaart.lol',
  output: 'static',
  build: { format: 'directory' },
  vite: { build: { sourcemap: false } },
});
