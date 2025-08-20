import { DarkTheme, Theme } from '@react-navigation/native';
import { BRAND } from '../config/brand';

export const NavTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: BRAND.ACCENT,
    background: BRAND.BG_DARK,
    card: BRAND.SURFACE_DARK,  // headers & tab bar
    text: BRAND.TEXT_PRIMARY,
    border: BRAND.BORDER,
    notification: BRAND.ACCENT,
  },
};

export const Tokens = {
  bg: BRAND.BG_DARK,
  surface: BRAND.SURFACE_DARK,
  text: BRAND.TEXT_PRIMARY,
  textMuted: BRAND.TEXT_SECONDARY,
  border: BRAND.BORDER,
  accent: BRAND.ACCENT,
  
  // Additional semantic tokens
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

export type ThemeTokens = typeof Tokens;

// Legacy export for backward compatibility
export const themeTokens = Tokens;