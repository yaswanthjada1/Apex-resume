/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#E11D48', // rose-600 custom red accent
          hover: '#BE123C',
          light: '#FFE4E6',
        },
        neutral: {
          surface: '#f8fafc',
        },
      }
    },
  },
  plugins: [],
}