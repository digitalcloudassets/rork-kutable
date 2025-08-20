import { BRAND } from '@/config/brand';

export const themeTokens = {
  background: BRAND.BG_DARK,
  surface: BRAND.SURFACE_DARK,
  textPrimary: BRAND.TEXT_PRIMARY,
  textSecondary: BRAND.TEXT_SECONDARY,
  accent: BRAND.ACCENT,
  
  // Additional semantic tokens
  border: '#202633',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Typography
  typography: {
    fontWeight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
  },
  
  // Border radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
};

export type ThemeTokens = typeof themeTokens;