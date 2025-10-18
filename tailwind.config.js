module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    "bg-black/70",
    "bg-black/60",
    "bg-black/80",
    "bg-black/50"
  ],
  theme: {
    extend: {
      transitionProperty: {
        'transform': 'transform',
        'filter': 'filter',
      },
      scale: {
        110: '1.10',
      },
    },
  },
  plugins: [],
};
