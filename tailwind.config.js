module.exports = {
  content: [
    "./*.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F5FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          500: '#2E48A0',
          600: '#1E3A8A',
          700: '#1e293b',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Zen Kaku Gothic New', 'sans-serif'],
      }
    }
  },
  plugins: [],
}