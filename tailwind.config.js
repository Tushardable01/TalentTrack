/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#059669',
          hover: '#047857',
          light: '#10b981',
          dark: '#065f46',
        },
        secondary: {
          DEFAULT: '#0d9488',
          hover: '#0f766e',
          light: '#14b8a6',
          dark: '#134e4a',
        },
        accent: {
          DEFAULT: '#f59e0b',
          hover: '#d97706',
          light: '#fbbf24',
          dark: '#92400e',
        },
        neutral: '#64748b',
      },
      spacing: {
        'section': '2rem',
      },
      borderRadius: {
        'container': '0.75rem',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
        'gradient-accent': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      },
    },
  },
  plugins: [],
}
