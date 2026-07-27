import { Platform } from 'react-native';

/**
 * Native, zero-download typography stack.
 * Avenir Next gives iOS a mature editorial-social feel, while Android uses its
 * highly legible native sans-serif with full weight support.
 */
export const FONT_FAMILY = Platform.select({
  ios: 'Avenir Next',
  android: 'sans-serif',
  web: 'system-ui',
  default: 'System',
});

export const typography = {
  family: FONT_FAMILY,
  sizes: {
    caption: 11,
    bodySmall: 13,
    body: 15,
    title: 20,
    pageTitle: 24,
  },
  lineHeights: {
    caption: 16,
    bodySmall: 19,
    body: 23,
    title: 26,
    pageTitle: 30,
  },
};
