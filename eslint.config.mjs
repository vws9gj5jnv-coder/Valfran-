import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: ['legacy/**', '.next/**', 'node_modules/**', 'next-env.d.ts', 'drizzle/**', 'playwright-report/**', 'test-results/**'] },
  { rules: { 'react/no-unknown-property': 'off' } },
];
export default config;
