import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginSecurity from 'eslint-plugin-security';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  pluginSecurity.configs.recommended,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'security/detect-object-injection': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    // Security's syntactic object-injection checks are not type-aware. Preserve
    // the existing scope for test fixtures and typed map/DOM access; this PR
    // removes TypeScript escape hatches without expanding security-lint scope.
    files: [
      'src/tests/**/*.ts',
      'src/tests/**/*.tsx',
      'src/core/**/*.test.ts',
      'src/core/**/*.test.tsx',
      'e2e/**/*.ts',
    ],
    rules: {
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-fs-filename': 'off',
    },
  },
  {
    files: [
      'src/components/**/*.tsx',
      'src/routes/**/*.tsx',
      'src/core/executor/**/*.ts',
      'src/core/type-generator.ts',
      'src/lib/gamification.ts',
      'src/lib/stats.ts',
      'src/lib/validations.ts',
      'src/server/content.server.ts',
      'src/server/submissions.fn.ts',
      'src/server/tutorials.fn.ts',
      'src/db/audit-db.ts',
    ],
    rules: {
      'security/detect-object-injection': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.archive/**',
      '.output/**',
      'build/**',
      '.vinxi/**',
      'vite.config.ts',
      'eslint.config.js',
      'src/routeTree.gen.ts',
      'scripts/performance/load-test.js',
    ],
  },
);
