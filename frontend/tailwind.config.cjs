module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'bright-green': '#377352',
        'dark-green': '#22473C',
        'ash-white': '#EBEEF1',
        'soft-white': '#E9ECEF',
        'hover-green': '#416153'
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif']
      }
    }
  },
  plugins: []
};
