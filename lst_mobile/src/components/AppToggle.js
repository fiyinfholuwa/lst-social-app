import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import AppIcon from './AppIcon';

export default function AppToggle({
  value,
  onChange,
  theme,
  accessibilityLabel,
  offIcon = 'sunny-outline',
  onIcon = 'moon-outline',
}) {
  const position = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(position, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 90,
    }).start();
  }, [position, value]);

  const translateX = position.interpolate({ inputRange: [0, 1], outputRange: [2, 32] });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => onChange(!value)}
      style={[styles.track, { backgroundColor: value ? theme.primary : theme.border }]}
    >
      <View style={styles.symbols}>
        <AppIcon name={offIcon} size={13} color={value ? 'rgba(255,255,255,.55)' : theme.secondaryText} />
        <AppIcon name={onIcon} size={13} color={value ? '#FFFFFF' : theme.secondaryText} />
      </View>
      <Animated.View style={[styles.thumb, { transform: [{ translateX }], backgroundColor: '#FFFFFF' }]}>
        <AppIcon name={value ? onIcon : offIcon} size={14} color={value ? theme.primary : theme.secondaryText} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: 64, height: 36, borderRadius: 18, justifyContent: 'center', position: 'relative' },
  symbols: { position: 'absolute', left: 8, right: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  thumb: { position: 'absolute', left: 0, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 3, elevation: 4 },
});
