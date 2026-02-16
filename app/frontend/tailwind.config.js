/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gift: {
          DEFAULT: "#b45309",
          hover: "#92400e",
        },
        wish: {
          DEFAULT: "#d97706",
        },
      },
      boxShadow: {
        "gift": "0 4px 12px rgba(180, 83, 9, 0.12)",
        "gift-lg": "0 8px 24px rgba(180, 83, 9, 0.15)",
      },
    },
  },
  plugins: [],
};
