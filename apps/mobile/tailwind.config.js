/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.tsx",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2ECC71",
          dark: "#1A9B50",
          light: "#58D68D",
          50: "#EAFAF1",
          100: "#D5F5E3",
        },
        sport: {
          tennis: "#2ECC71",
          padel: "#3498DB",
          squash: "#E67E22",
        },
        "sport-bg": {
          tennis: "#D5F5E3",
          padel: "#D6EAF8",
          squash: "#FDEBD0",
        },
        "sport-text": {
          tennis: "#1A9B50",
          padel: "#1B4F72",
          squash: "#935116",
        },
        level: {
          beginner: "#27AE60",
          intermediate: "#2E86C1",
          advanced: "#F39C12",
          expert: "#E74C3C",
        },
        "level-bg": {
          beginner: "#A9DFBF",
          intermediate: "#85C1E9",
          advanced: "#F5B041",
          expert: "#EC7063",
        },
        "level-text": {
          beginner: "#1E8449",
          intermediate: "#1A5276",
          advanced: "#7E5109",
          expert: "#922B21",
        },
        success: "#27AE60",
        warning: "#F39C12",
        danger: "#E74C3C",
        info: "#3498DB",
        neutral: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          500: "#6B7280",
          700: "#374151",
          900: "#1A1A2E",
        },
      },
      fontFamily: {
        sans: ["Inter_400Regular", "system-ui", "sans-serif"],
        "sans-medium": ["Inter_500Medium"],
        "sans-semibold": ["Inter_600SemiBold"],
        "sans-bold": ["Inter_700Bold"],
        mono: ["JetBrainsMono_500Medium", "monospace"],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
      },
      borderRadius: {
        card: "16px",
        button: "12px",
        badge: "8px",
      },
      height: {
        "btn-primary": "52px",
        "btn-secondary": "44px",
        "btn-tertiary": "40px",
        "tab-bar": "60px",
        "touch-target": "48px",
      },
    },
  },
  plugins: [],
};
