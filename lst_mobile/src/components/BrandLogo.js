import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const logo = require('../../assets/brand-logo.png');
const transparentLogo = require('../../assets/brand-logo-transparent.png');

export default function BrandLogo({ width = 164, style, accessibilityLabel = 'Love Straight Talks' }) {
  const { isDark } = useTheme();
  return (
    <Image
      source={isDark ? transparentLogo : logo}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[styles.logo, { width, height: width / (isDark ? 2 : 2.13) }, style]}
    />
  );
}

const styles = StyleSheet.create({
  logo: { flexShrink: 0 },
});
