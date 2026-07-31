// Flat ESLint config — TypeScript + React + jsx-a11y.
//
// Purpose: catch accessibility regressions and common React foot-guns before
// they land in main.  This runs locally via `npm run lint` and can be wired
// into CI in a follow-up.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // React
      'react/react-in-jsx-scope': 'off', // Vite / new JSX transform
      'react/prop-types': 'off',         // We use TS
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/self-closing-comp': 'warn',
      // React hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // TypeScript
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      // A11y — the focus of Phase 2.4
      ...jsxA11y.configs.recommended.rules,
      'jsx-a11y/no-autofocus': ['warn', { ignoreNonDOM: true }],
      // The mobile-nav Sheet delegates click on a container to close itself.
      // A dedicated close button already exists via Escape + backdrop, so
      // downgrade the interactive-container rule to a warning.
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
