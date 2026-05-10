import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ['class'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        card: '#1e293b',
        border: '#334155',
        'border-light': '#475569',
        primary: '#3b82f6',
        'primary-hover': '#2563eb',
        muted: '#64748b',
        'muted-foreground': '#94a3b8',
        accent: '#0ea5e9',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        foreground: '#f1f5f9',
        'foreground-muted': '#cbd5e1',
      },
    },
  },
  plugins: [],
};
export default config;
