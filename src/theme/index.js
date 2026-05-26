import { Platform } from 'react-native';

// iOS Human Interface Guidelines inspired palette.
export const colors = {
  background:    '#F2F2F7',  // iOS systemGroupedBackground
  groupedBackground: '#FFFFFF',
  card:          '#FFFFFF',
  cardElevated:  '#FFFFFF',
  separator:     'rgba(60, 60, 67, 0.12)',
  primary:       '#007AFF',  // iOS blue
  primaryDark:   '#0051D5',
  success:       '#34C759',  // iOS green
  danger:        '#FF3B30',  // iOS red
  warning:       '#FF9500',  // iOS orange
  purple:        '#AF52DE',
  pink:          '#FF2D55',
  teal:          '#5AC8FA',
  indigo:        '#5856D6',
  text:          '#1C1C1E',
  textSecondary: '#3C3C43',
  textMuted:     'rgba(60, 60, 67, 0.6)',
  textPlaceholder: 'rgba(60, 60, 67, 0.3)',
  inputBg:       '#F2F2F7',
  inputBorder:   'rgba(60, 60, 67, 0.08)',
  white:         '#FFFFFF',
  shadow:        'rgba(0,0,0,0.08)',
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const fonts = {
  // iOS uses San Francisco. Android falls back gracefully.
  regular: Platform.select({ ios: 'System', android: 'sans-serif' }),
  medium:  Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
  bold:    Platform.select({ ios: 'System', android: 'sans-serif' }),
};

export const typography = {
  largeTitle:  { fontSize: 34, fontWeight: '700', letterSpacing: 0.4 },
  title:       { fontSize: 28, fontWeight: '700', letterSpacing: 0.3 },
  title2:      { fontSize: 22, fontWeight: '700' },
  title3:      { fontSize: 20, fontWeight: '600' },
  headline:    { fontSize: 17, fontWeight: '600' },
  body:        { fontSize: 17, fontWeight: '400' },
  callout:     { fontSize: 16, fontWeight: '400' },
  subhead:     { fontSize: 15, fontWeight: '400' },
  footnote:    { fontSize: 13, fontWeight: '400' },
  caption:     { fontSize: 12, fontWeight: '400' },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  raised: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
};

// React Navigation theme so headers/backgrounds match.
export const navTheme = {
  dark: false,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.white,
    text: colors.text,
    border: colors.separator,
    notification: colors.danger,
  },
};

export const CATEGORY_META = {
  Income:     { icon: 'cash-outline',         color: '#34C759' },
  Bill:       { icon: 'receipt-outline',      color: '#FF9500' },
  Groceries:  { icon: 'basket-outline',       color: '#5AC8FA' },
  Investment: { icon: 'trending-up-outline',  color: '#5856D6' },
  Medical:    { icon: 'medkit-outline',       color: '#FF2D55' },
  Payment:    { icon: 'card-outline',         color: '#AF52DE' },
  Shopping:   { icon: 'bag-handle-outline',   color: '#FF3B30' },
  Travel:     { icon: 'airplane-outline',     color: '#007AFF' },
  Unplanned:  { icon: 'alert-circle-outline', color: '#8E8E93' },
};
