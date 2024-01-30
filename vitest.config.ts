import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['src'],
      thresholds: {
        statements: 100,
        functions: 100,
        branches: 100,
      },
    },
    globals: false,
    clearMocks: true,
  },
});
