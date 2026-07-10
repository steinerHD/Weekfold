/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1E2333',
        paper: '#EEF0F6',
        line: '#E2E4EE',
        indigo: {
          DEFAULT: '#4F46E5',
          soft: '#ECEBFC',
        },
        teal: {
          DEFAULT: '#14B8A6',
          soft: '#E1F7F4',
        },
        coral: {
          DEFAULT: '#F0653E',
          soft: '#FDE7E1',
        },
        amber: {
          DEFAULT: '#F0A34A',
          soft: '#FDF0DF',
        },
        green: {
          DEFAULT: '#22A35E',
          soft: '#E4F6EB',
        },
        violet: {
          DEFAULT: '#8B5CF6',
          soft: '#F1EBFE',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}