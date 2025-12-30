/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // INARA Logo Colors
        inara: {
          yellow: '#FFD700',
          magenta: '#FF1493',
          cyan: '#00BFFF',
          teal: '#40E0D0',
        },
        primary: {
          // Using blue as primary base
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Blue
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          yellow: '#FFD700',
          magenta: '#FF1493',
          cyan: '#00BFFF',
        },
      },
    },
  },
  plugins: [],
}

