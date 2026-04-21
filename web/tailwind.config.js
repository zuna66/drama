/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        rose: {
          DEFAULT: '#ff2d55',
          50: '#fff1f3',
          100: '#ffe4e9',
          200: '#fecdd6',
          300: '#fda4b4',
          400: '#fb7185',
          500: '#ff2d55',
          600: '#e11048',
          700: '#be0a3e',
          800: '#9f0c3a',
          900: '#860d36',
        },
        bg: {
          DEFAULT: '#0a0a0c',
          card: '#131318',
          elev: '#1a1a21',
          line: '#23232c',
        },
        ink: {
          50: '#ffffff',
          100: '#f5f5f7',
          200: '#cfcfd6',
          300: '#9a9aa6',
          400: '#6b6b78',
          500: '#4a4a55',
          600: '#2f2f38',
        },
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      boxShadow: {
        card: '0 8px 30px rgba(0,0,0,0.45)',
        glow: '0 0 40px rgba(255,45,85,0.35)',
      },
      animation: {
        'fade-up': 'fadeUp .6s cubic-bezier(.21,.6,.35,1) both',
        'shimmer': 'shimmer 1.6s linear infinite',
        'marquee': 'marquee 30s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
