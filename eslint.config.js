import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-console': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  { files: ['scripts/**/*.ts', 'tests/**/*.ts'], rules: { 'no-console': 'off' } },
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'drizzle/**'] }
);
