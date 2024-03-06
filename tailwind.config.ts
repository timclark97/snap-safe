import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // indigo-600
        primary: "#4f46e5",
        // stone-700
        secondary: "#44403c"
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
} satisfies Config;
