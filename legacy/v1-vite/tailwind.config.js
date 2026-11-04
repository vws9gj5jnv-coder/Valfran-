/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#07080a', 900: '#0b0d10', 800: '#11141a', 700: '#181c24', 600: '#222833', 500: '#2e3542' },
        chrome: { 100: '#f2f4f7', 200: '#d9dde4', 300: '#b7bdc8', 400: '#8f97a6', 500: '#6b7383' },
        volt: { 400: '#6ea0ff', 500: '#4f8cff', 600: '#2f6fe8' },
        ember: { 400: '#ff9650', 500: '#ff7a29', 600: '#ec6412' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        plate: ['"Barlow Condensed"', 'Impact', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(79,140,255,.25), 0 10px 40px -10px rgba(79,140,255,.35)',
        ember: '0 10px 30px -8px rgba(255,122,41,.55)',
      },
    },
  },
  plugins: [],
};
