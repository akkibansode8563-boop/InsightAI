/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        surface: {
          0:   '#ffffff',
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
        },
        accent: {
          chat:       '#f97316',
          sales:      '#8b5cf6',
          dealer:     '#059669',
          enterprise: '#0ea5e9',
          solution:   '#f59e0b',
          news:       '#ef4444',
          learning:   '#6366f1',
          market:     '#10b981',
        },
        feedback: {
          success: '#059669',
          warning: '#d97706',
          error:   '#dc2626',
          info:    '#0ea5e9',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      spacing: {
        18:  '4.5rem',
        88:  '22rem',
        128: '32rem',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow':    '0 0 20px rgba(249, 115, 22, 0.15)',
        'glow-lg': '0 0 40px rgba(249, 115, 22, 0.25)',
        'inner-sm':'inset 0 1px 2px rgba(0,0,0,0.05)',
      },
      animation: {
        'fade-up':   'fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in':   'fadeIn 0.2s ease-out',
        'slide-up':  'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in':  'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-out': 'slideOut 0.2s ease-in',
        'pulse-soft':'pulseSoft 2s ease-in-out infinite',
        'shimmer':   'shimmer 1.5s linear infinite',
        'bounce-sm': 'bounceSm 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spin-slow': 'spin 3s linear infinite',
        'ping-once': 'ping 0.7s cubic-bezier(0,0,0.2,1) 1',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        slideOut: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(100%)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition: '200% 0' },
        },
        bounceSm: {
          '0%':   { transform: 'scale(1)' },
          '50%':  { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce':   'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      screens: {
        xs: '375px',
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};
