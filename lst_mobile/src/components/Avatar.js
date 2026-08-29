import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AppIcon from './AppIcon';
import { API_BASE_URL } from '../api/config';

const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '');

const resolveAvatarUri = uri => {
  if (typeof uri !== 'string' || !uri.trim()) return null;

  const value = uri.trim();
  if (value.startsWith('/')) return `${apiOrigin}${value}`;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?=\/|$)/i.test(value)) {
    return value.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, apiOrigin);
  }

  return value;
};

/**
 * Displays a profile photo when one is available, otherwise a consistent
 * default person avatar. It also falls back when a saved image URL fails.
 */
export default function Avatar({ uri, size = 44, style, accessibilityLabel }) {
  const { theme } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const resolvedUri = useMemo(() => resolveAvatarUri(uri), [uri]);
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
