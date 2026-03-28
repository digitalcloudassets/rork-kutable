export const BRAND = {
  APP_NAME: "Kutable",
  ACCENT: "#FF6A00",
  BG_DARK: "#0E1117",
  SURFACE_DARK: "#151A21",
  TEXT_PRIMARY: "#F7F8FA",
  TEXT_SECONDARY: "#A6AEBC",
  BORDER: "#202633",
} as const;

// Legacy colors for backward compatibility
export const brandColors = {
  primary: BRAND.ACCENT,
  primaryLight: "#E5DCFF",
  secondary: "#004E89",
  accent: BRAND.ACCENT,
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  text: BRAND.TEXT_PRIMARY,
  textLight: BRAND.TEXT_SECONDARY,
  background: BRAND.BG_DARK,
  white: "#ffffff",
};

export const brandConfig = {
  name: BRAND.APP_NAME,
  tagline: "Book Your Perfect Cut",
  logo: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/4jo70wqigtgig4k3qgayd",
};