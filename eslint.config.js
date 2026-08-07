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
      '@typescript-eslint/only-throw-error': 'off',
      'security/detect-object-injection': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    // Specific overrides for tests to allow looser typing for mocking
    files: [
      'src/tests/**/*.ts',
      'src/tests/**/*.tsx',
      'src/core/**/*.test.ts',
      'src/core/**/*.test.tsx',
      'e2e/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-fs-filename': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-implied-eval': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/await-thenable': 'warn',
      '@typescript-eslint/unbound-method': 'warn',
      'no-useless-catch': 'warn',
    },
  },
  {
    // These surfaces intentionally use dynamic keys for typed UI maps, localized
    // content, and DOM shims. The strict TypeScript checks provide the relevant
    // safety here while the security rule otherwise reports every map lookup.
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
    // Admin routes often have boilerplate or incomplete features in development
    files: ['src/routes/admin/**/*.tsx', 'src/routes/admin/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    // Override for the core playwright shim as it handles untyped iframe interactions
    files: [
      'src/core/executor/playwright-shim.ts',
      'src/core/executor/iframe-executor.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
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
