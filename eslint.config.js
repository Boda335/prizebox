import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: process.cwd(),
  recommended: true,
});

export default [
  ...compat.extends('eslint:recommended'),
  {
    files: ['src/**/*.ts'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error'],
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'warn',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single']
    },
  },
];
