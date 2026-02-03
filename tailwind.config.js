/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'editor-bg': '#1e1e1e',
        'editor-sidebar': '#252526',
        'editor-tab': '#2d2d2d',
        'editor-tab-active': '#1e1e1e',
        'editor-border': '#3c3c3c',
        'editor-text': '#cccccc',
        'editor-text-muted': '#858585',
        'editor-accent': '#007acc',
        'editor-hover': '#2a2d2e',
      },
    },
  },
  plugins: [],
}
