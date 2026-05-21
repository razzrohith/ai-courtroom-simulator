/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        courtroom: {
          bg: '#0f1419',
          card: '#1a2332',
          accent: '#c9a227',
          text: '#e8eaed',
          muted: '#8b949e',
          success: '#2ea043',
          danger: '#da3633',
          warning: '#d29922',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
