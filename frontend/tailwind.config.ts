import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        app: {
          canvas: "var(--canvas)",
          surface: "var(--surface)",
          sidebar: "var(--sidebar)",
          border: "var(--border)",
          text: "var(--text)",
          muted: "var(--muted)",
          primary: "var(--primary)",
          teal: "var(--teal)",
          purple: "var(--purple)",
          avatar: "var(--avatar)"
        }
      },
      boxShadow: {
        soft: "0 1px 2px rgba(28, 20, 31, 0.06)",
        focus: "0 0 0 6px rgba(202, 147, 222, 0.18)"
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};

export default config;
