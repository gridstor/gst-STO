/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // GridStor Design System Colors
        'gs-white': '#FFFFFF',
        'gs-off-white': '#F9FAFB',
        'gs-near-black': '#2A2A2A',
        'gs-dark': '#2A2A2A',
        'gs-light': '#FFFFFF',
        // Gray scale
        'gs-gray': {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        // Accent colors
        'gs-blue': {
          50: '#EFF6FF',
          500: '#3B82F6',
          600: '#2563EB',
        },
        'gs-red': {
          500: '#EF4444',
          600: '#DC2626',
        },
        'gs-green': {
          50: '#ECFDF5',
          500: '#10B981',
          600: '#059669',
        },
        'gs-purple': {
          500: '#8B5CF6',
          600: '#7C3AED',
        },
        'gs-yellow': {
          50: '#FEF3C7',
        },
        'gs-amber': {
          500: '#F59E0B',
        },
        'gs-cyan': {
          500: '#06B6D4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },
      boxShadow: {
        'gs-sm': '0 1px 3px rgba(0,0,0,0.1)',
        'gs-md': '0 4px 6px rgba(0,0,0,0.1)',
        'gs-lg': '0 12px 30px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        'gs-sm': '4px',
        'gs-md': '6px',
        'gs-lg': '8px',
      },
      spacing: {
        'gs-1': '4px',
        'gs-2': '8px',
        'gs-3': '12px',
        'gs-4': '16px',
        'gs-6': '24px',
        'gs-8': '32px',
        'gs-12': '48px',
      },
      transitionDuration: {
        'gs-fast': '150ms',
        'gs-base': '200ms',
        'gs-slow': '300ms',
      },
    },
  },
  plugins: [],
} 