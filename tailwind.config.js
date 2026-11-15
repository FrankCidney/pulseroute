/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        space: {
          void: '#F3F6F7',
          hull: '#FFFFFF',
          elevated: '#EEF3F4',
          border: '#D7E0E2',
        },
        status: {
          nominal: '#16724F',
          warning: '#94600A',
          critical: '#B9383E',
        },
        accent: {
          cyan: '#26727A',
        },
        cockpit: {
          primary: '#24343A',
          muted: '#5D7078',
        },
      },
      fontFamily: {
        mono: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
