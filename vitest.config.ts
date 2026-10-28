import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      { test: { name: 'shared', root: './shared', environment: 'node' } },
      {
        extends: './client/vite.config.ts',
        test: { name: 'client', root: './client', environment: 'jsdom' },
      },
      { test: { name: 'server', root: './server', environment: 'node' } },
    ],
  },
});
