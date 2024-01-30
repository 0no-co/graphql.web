import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    typecheck: {
      enabled: true,
      ignoreSourceErrors: true,
    },
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['src'],
      exclude: [
        '**/__tests__/**',
        '**/*.d.ts',
        'src/ast.ts',
        'src/index.ts',
        'src/schemaAst.ts',
        'src/types.ts',
        'src/values.ts',
      ],
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
