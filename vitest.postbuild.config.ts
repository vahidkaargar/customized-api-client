import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['test/postbuild/**/*.test.ts'],
    pool: 'forks',
  },
});
