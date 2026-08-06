/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0710',
          900: '#120c1c',
          850: '#181022',
          800: '#1f1629',
          700: '#2b1d38',
          600: '#3d2850',
        },
        blood: {
          400: '#e05a6b',
          500: '#c8324a',
          600: '#a4213a',
          700: '#7d1830',
        },
        gilt: {
          300: '#e8cf9f',
          400: '#d4b876',
          500: '#b8974f',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        ui: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 30px rgba(200,50,74,0.15)',
      }
    },
  },
  plugins: [],
}
