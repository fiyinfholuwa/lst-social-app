import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AppIcon from './AppIcon';
import { resolveMediaUri } from '../utils/mediaUrl';

/**
 * Displays a profile photo when one is available, otherwise a consistent
 * default person avatar. It also falls back when a saved image URL fails.
 */
export default function Avatar({ uri, size = 44, style, accessibilityLabel }) {
  const { theme } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const resolvedUri = useMemo(() => resolveMediaUri(uri), [uri]);
  const hasImage = Boolean(resolvedUri) && !imageFailed;

  useEffect(() => setImageFailed(false), [resolvedUri]);
  const avatarStyle = [
    styles.avatar,
    { width: size, height: size, borderRadius: size / 2 },
    style,
  ];

  if (!hasImage) {
    return (
      <View
        style={[avatarStyle, { backgroundColor: theme.primarySoft }]}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel || 'Default profile avatar'}
      >
        <AppIcon name="person-outline" size={Math.round(size * 0.56)} color={theme.primary} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: resolvedUri }}
      style={avatarStyle}
      onError={() => setImageFailed(true)}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
