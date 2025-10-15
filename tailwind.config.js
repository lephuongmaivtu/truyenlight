/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  safelist: [
  {
    pattern: /(bg-gradient-to-t|from-black\/90|via-black\/50|to-transparent)/,
  },
],

  plugins: [],
};
