/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wood: {
          dark: '#2c1810',
          med: '#5c3a21',
          light: '#8b5a2b',
          accent: '#d4a373'
        }
      }
    },
  },
  plugins: [],
}
