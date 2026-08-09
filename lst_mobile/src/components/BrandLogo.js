import React from 'react';
import { Image, StyleSheet } from 'react-native';

const logo = require('../../assets/brand-logo.png');

export default function BrandLogo({ width = 164, style, accessibilityLabel = 'Love Straight Talks' }) {
  return (
    <Image
      source={logo}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[styles.logo, { width, height: width / 2.13 }, style]}
    />
  );
}

const styles = StyleSheet.create({
  logo: { flexShrink: 0 },
});
