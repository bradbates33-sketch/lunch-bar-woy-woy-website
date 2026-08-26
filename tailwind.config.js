/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./styles/**/*.{css}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-dark": "#232B1D",
        "bg-panel": "#2C3524",
        "bg-panel-2": "#333D28",
        paper: "#F4EEDD",
        "paper-dim": "#E7DFC7",
        "paper-line": "#C9BF9F",
        chili: "#C43B24",
        "chili-dark": "#9C2E1B",
        mustard: "#E2A130",
        ink: "#20261C",
      },
      fontFamily: {
        mono: ['"Space Mono"', "monospace"],
        sans: ['"Libre Franklin"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
 
