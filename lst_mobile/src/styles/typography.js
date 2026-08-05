import { Platform } from 'react-native';

/**
 * Native system typography keeps letterforms crisp and familiar on every
 * platform while avoiding unsupported synthetic font weights.
 */
export const FONT_FAMILY = Platform.select({
  ios: 'System',
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
