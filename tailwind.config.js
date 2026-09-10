/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./styles/**/*.css",
  ],
  theme: {
    extend: {
      colors: {
        // Brand: cream ground + green. "bg-dark" is the page background
        // (kept the name so existing classes still map correctly).
        "bg-dark": "#FFF0CB", // page background — cream
        "bg-panel": "#4C7031", // green feature bands (cream text sits on these)
        "bg-panel-2": "#3D5C27", // deeper green inset
        paper: "#FEFBF0", // raised card surface + cream text on green
        "paper-dim": "#F2E7C4",
        "paper-line": "#D8C795", // hairline / dashed rules on cards
        chili: "#4C7031", // primary action + accent — green
        "chili-dark": "#3A5626", // hover / price text
        mustard: "#C9992F", // warm gold — spare accent, not currently used in layout
        ink: "#273418", // primary dark text — near-black green
      },
      fontFamily: {
        mono: ['"Space Mono"', "monospace"],
        sans: ['"Libre Franklin"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
 
