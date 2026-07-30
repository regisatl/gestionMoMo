/**
 * Design Tokens — GestionMoMo
 * Partagés entre mobile (React Native) et web-admin (React)
 */

export const colors = {
  // Couleur principale
  primary: '#0A66C2',
  primaryLight: '#3385D6',
  primaryDark: '#084E96',
  primaryAlpha: 'rgba(10, 102, 194, 0.12)',

  // Sémantiques
  success: '#16A34A',
  successLight: '#DCFCE7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  info: '#0284C7',
  infoLight: '#E0F2FE',

  // Neutres
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Transactions
  deposit: '#16A34A',
  withdrawal: '#DC2626',
  transfer: '#0A66C2',
  payment: '#7C3AED',
  refund: '#D97706',
};

export const lightTheme = {
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  backgroundCard: '#FFFFFF',
  surface: '#F3F4F6',
  border: '#E5E7EB',
  text: '#242424',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
  textInverse: '#FFFFFF',
  placeholder: '#9CA3AF',
  shadow: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.4)',
  tabBar: '#FFFFFF',
  header: '#FFFFFF',
  inputBackground: '#F9FAFB',
  inputBorder: '#D1D5DB',
  inputBorderFocused: '#0A66C2',
};

export const darkTheme = {
  background: '#1E1E1E',
  backgroundSecondary: '#2A2A2A',
  backgroundCard: '#2D2D2D',
  surface: '#333333',
  border: '#3D3D3D',
  text: '#F5F5F5',
  textSecondary: '#A0A0A0',
  textDisabled: '#666666',
  textInverse: '#1E1E1E',
  placeholder: '#666666',
  shadow: 'rgba(0, 0, 0, 0.4)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  tabBar: '#2A2A2A',
  header: '#2A2A2A',
  inputBackground: '#2D2D2D',
  inputBorder: '#3D3D3D',
  inputBorderFocused: '#3385D6',
};

export const typography = {
  fontFamily: {
    regular: 'Manrope-Regular',
    medium: 'Manrope-Medium',
    semiBold: 'Manrope-SemiBold',
    bold: 'Manrope-Bold',
    extraBold: 'Manrope-ExtraBold',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 34,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const animation = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
};
