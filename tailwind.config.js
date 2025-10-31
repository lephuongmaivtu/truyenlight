module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
    safelist: [
      "bg-black/70",
      "bg-black/60",
      "bg-black/80",
      "bg-black/50",
    
      // ✅ giữ lại các class hover màu và ring
      "hover:bg-primary/10",
      "dark:hover:bg-primary/30",
      "hover:ring-1",
      "hover:ring-primary/20",
    
      // ✅ giữ lại các class spacing mới
      "py-1.5",
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
  plugins: [
    require('tailwind-scrollbar'), 
  ],
};
