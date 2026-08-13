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
          bg: '#070a10',
          card: '#0e1420',
          accent: '#c9a227',
          text: '#e8eaed',
          muted: '#8b949e',
          success: '#2ea043',
          danger: '#da3633',
          warning: '#d29922',
        },
        ink: {
          950: '#05070c',
          900: '#070a10',
          850: '#0a0e16',
          800: '#0e1420',
          700: '#141c2c',
          600: '#1c2638',
          500: '#273349',
        },
        brass: {
          100: '#f9ecc9',
          200: '#f5d47a',
          300: '#e9c05a',
          400: '#d9ae3e',
          500: '#c9a227',
          600: '#a8861f',
          700: '#8a6d1d',
          800: '#5e4a15',
          900: '#3a2e0e',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-brass': '0 0 24px rgba(201, 162, 39, 0.25)',
        'glow-brass-lg': '0 0 48px rgba(201, 162, 39, 0.35)',
        'panel': '0 8px 32px rgba(0, 0, 0, 0.45)',
        'inner-highlight': 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gavel-slam': {
          '0%': { transform: 'rotate(-50deg) translateY(-18px)', opacity: '0' },
          '55%': { transform: 'rotate(12deg) translateY(2px)', opacity: '1' },
          '70%': { transform: 'rotate(-6deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'ring-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(201, 162, 39, 0.45)' },
          '100%': { boxShadow: '0 0 0 14px rgba(201, 162, 39, 0)' },
        },
        'flash-red': {
          '0%, 100%': { opacity: '0' },
          '15%, 60%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        'shimmer': 'shimmer 2.4s linear infinite',
        'gavel-slam': 'gavel-slam 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'float-slow': 'float-slow 5s ease-in-out infinite',
        'ring-pulse': 'ring-pulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
