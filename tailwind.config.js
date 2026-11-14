/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        space: {
          void: '#080B10',
          hull: '#0F141C',
          elevated: '#161D29',
          border: '#232D3F',
        },
        status: {
          nominal: '#10B981',
          warning: '#F59E0B',
          critical: '#EF4444',
        },
        accent: {
          cyan: '#06B6D4',
        },
        cockpit: {
          primary: '#F8FAFC',
          muted: '#64748B',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
