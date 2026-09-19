import React from 'react';
import { Image, StyleSheet } from 'react-native';

const markLogo = require('../../assets/lst-mark.png');

export default function BrandLogo({ width = 164, style, accessibilityLabel = 'Love Straight Talks' }) {
  return (
    <Image
      source={markLogo}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[styles.logo, { width, height: width, borderRadius: width * 0.22 }, style]}
    />
  );
}

const styles = StyleSheet.create({
  logo: { flexShrink: 0, overflow: 'hidden' },
});
