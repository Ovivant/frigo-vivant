import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: '#f3f7ef',
          100: '#e5eedc',
          200: '#c8ddb7',
          300: '#a7c78e',
          400: '#7aa874',
          500: '#5e8d58',
          600: '#476f43',
          700: '#395836',
        },
        oat: {
          50: '#fffaf0',
          100: '#f7efd8',
          200: '#eadbb6',
          300: '#d8bf8a',
        },
        clay: {
          100: '#ead2bf',
          300: '#b37a5c',
          500: '#7a513f',
        },
        plum: {
          100: '#eadfeb',
          400: '#8f6f91',
        },
      },
      boxShadow: {
        soft: '0 18px 55px rgba(80, 70, 49, 0.12)',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
