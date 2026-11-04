import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: ['legacy/**', '.next/**', 'node_modules/**', 'next-env.d.ts', 'drizzle/**', 'playwright-report/**', 'test-results/**', 'scripts/*.cjs'] },
  {
    rules: {
      'react/no-unknown-property': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Lecture de window / localStorage après hydratation : setState dans un effet est volontaire.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Scènes Three.js : les objets 3D sont mutés image par image (modèle impératif de React Three Fiber).
    files: ['src/components/three/**'],
    rules: { 'react-hooks/immutability': 'off', 'react-hooks/refs': 'off', 'react-hooks/use-memo': 'off' },
  },
];
export default config;
