export const colors = {
  brand:        "#38A3C7",
  brandDark:    "#2B82A0",
  brandLight:   "#D6EFF7",
  brandSubtle:  "#F0F9FD",

  neutral: {
    0:   "#FFFFFF",
    50:  "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
  },

  success:      "#22C55E",
  successLight: "#DCFCE7",
  warning:      "#F59E0B",
  warningLight: "#FEF3C7",
  danger:       "#EF4444",
  dangerLight:  "#FEE2E2",
} as const

export const typography = {
  fontSans: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  fontMono: "var(--font-geist-mono), ui-monospace, monospace",
} as const

export const radii = {
  sm:   "0.375rem",
  md:   "0.5rem",
  lg:   "0.75rem",
  xl:   "1rem",
  "2xl":"1.5rem",
  full: "9999px",
  card: "0.75rem",
} as const

export const shadows = {
  xs:   "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  sm:   "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md:   "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)",
  soft: "0 2px 16px 0 rgb(0 0 0 / 0.06)",
  card: "0 2px 8px 0 rgb(56 163 199 / 0.08), 0 1px 3px 0 rgb(0 0 0 / 0.06)",
} as const
