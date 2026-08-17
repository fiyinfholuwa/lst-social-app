import React from 'react';
import { Image, StyleSheet } from 'react-native';

const transparentLogo = require('../../assets/brand-logo-transparent.png');

export default function BrandLogo({ width = 164, style, accessibilityLabel = 'Love Straight Talks' }) {
  return (
    <Image
      source={transparentLogo}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[styles.logo, { width, height: width / 2 }, style]}
    />
  );
}

const styles = StyleSheet.create({
  logo: { flexShrink: 0 },
});
