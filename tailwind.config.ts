import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: "#090b10",
          panel: "#11151d",
          panelSoft: "#151b25",
          border: "#263142",
          muted: "#7d8796",
          text: "#e8edf5",
          green: "#22c55e",
          red: "#ef4444",
          yellow: "#facc15"
        }
      }
    }
  },
  plugins: []
};

export default config;
