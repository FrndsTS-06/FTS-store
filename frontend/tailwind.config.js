/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        fts: {
          space: '#020617',
          surface: '#0a0f1d',
          elevated: '#0f172a',
          blue: '#3b82f6',
          cyan: '#06b6d4',
          indigo: '#6366f1',
          violet: '#8b5cf6',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
        },
      },
      boxShadow: {
        'fts-glow-blue': '0 0 25px -2px rgba(59, 130, 246, 0.35)',
        'fts-glow-cyan': '0 0 25px -2px rgba(6, 182, 212, 0.35)',
        'fts-glass-card': '0 10px 30px -4px rgba(0, 0, 0, 0.45)',
        'fts-glass-panel': '0 20px 48px -8px rgba(0, 0, 0, 0.60)',
      },
      backdropBlur: {
        'fts-sm': '8px',
        'fts-md': '16px',
        'fts-lg': '24px',
        'fts-xl': '32px',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      animation: {
        'float': 'float 5s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-reverse': 'float-reverse 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'gradient-flow': 'gradient-flow 8s ease infinite',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'float-reverse': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(12px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.06)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gradient-flow': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}
