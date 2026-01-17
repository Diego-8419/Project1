import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          light: '#14B8A6', // Türkis
          DEFAULT: '#0D9488',
          dark: '#0F766E',
        },
        secondary: {
          light: '#3B82F6',
          DEFAULT: '#1E40AF', // Dunkelblau
          dark: '#1E3A8A',
        },
      },
      boxShadow: {
        '3d': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 -2px 0 0 rgba(0, 0, 0, 0.1)',
        '3d-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 -3px 0 0 rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
};
export default config;
