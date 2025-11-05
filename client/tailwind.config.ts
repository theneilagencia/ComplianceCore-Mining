import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // QIVO Brand Colors
        primary: {
          DEFAULT: '#2f2c79',
          dark: '#1f1c4f',
          light: '#3f3c89',
          50: '#f5f5ff',
          100: '#ebebff',
          200: '#d6d6ff',
          300: '#b8b8ff',
          400: '#9999ff',
          500: '#7a7aff',
          600: '#5c5cff',
          700: '#3f3c89',
          800: '#2f2c79',
          900: '#1f1c4f',
        },
        secondary: {
          DEFAULT: '#b96e48',
          dark: '#8d4925',
          light: '#c98e68',
          50: '#fef6f3',
          100: '#fdeee7',
          200: '#fbd5c3',
          300: '#f9bc9f',
          400: '#f7a37b',
          500: '#f58a57',
          600: '#c98e68',
          700: '#b96e48',
          800: '#8d4925',
          900: '#613218',
        },
        background: {
          dark: '#000020',
          medium: '#171a4a',
          light: '#0f1135',
        },
        // Shadcn/ui colors (mantém compatibilidade)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        foreground: 'hsl(var(--foreground))',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        // Tamanho mínimo: 14px (text-sm)
        xs: ['0.875rem', { lineHeight: '1.25rem' }], // 14px (renomeado de 12px)
        sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
        lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
        '5xl': ['3rem', { lineHeight: '1' }],         // 48px
        '6xl': ['3.75rem', { lineHeight: '1' }],      // 60px
        '7xl': ['4.5rem', { lineHeight: '1' }],       // 72px
        '8xl': ['6rem', { lineHeight: '1' }],         // 96px
        '9xl': ['8rem', { lineHeight: '1' }],         // 128px
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
