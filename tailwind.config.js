/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefcf3",
          100: "#d6f7e1",
          200: "#aeecc4",
          300: "#7ddca0",
          400: "#46c178",
          500: "#22a25a",
          600: "#168048",
          700: "#13663c",
          800: "#125033",
          900: "#0f422c",
        },
      },
    },
  },
  plugins: [],
};
