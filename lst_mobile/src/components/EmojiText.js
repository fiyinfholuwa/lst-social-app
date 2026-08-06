import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Picker selections are stored as readable shortcodes. The Unicode aliases
// also convert existing posts/comments that were saved before this fix.
const EMOJIS = [
  ['happy-outline', '😀'], ['happy', '😄'], ['heart', '❤️'], ['heart-outline', '💖'], ['thumbs-up', '👍'], ['thumbs-down', '👎'], ['hand-left-outline', '👋'], ['star-outline', '✨'], ['star', '⭐'], ['sunny-outline', '☀️'], ['moon-outline', '🌙'], ['rainy-outline', '🌧️'], ['flower-outline', '🌸'], ['leaf-outline', '🌿'], ['flame-outline', '🔥'], ['water-outline', '💧'], ['chatbubble-outline', '💬'], ['mail-outline', '✉️'], ['gift-outline', '🎁'], ['color-palette-outline', '🎈'], ['musical-notes-outline', '🎵'], ['camera-outline', '📷'], ['images-outline', '🖼️'], ['book-outline', '📚'], ['rocket-outline', '🚀'], ['airplane-outline', '✈️'], ['car-outline', '🚗'], ['home-outline', '🏠'], ['people-outline', '👥'], ['person-outline', '🙂'], ['paw-outline', '🐾'], ['restaurant-outline', '🍽️'], ['cafe-outline', '☕'], ['wine-outline', '🥂'], ['football-outline', '⚽'], ['game-controller-outline', '🎮'], ['bulb-outline', '💡'], ['checkmark-circle-outline', '✅'], ['alert-circle-outline', '❗'], ['help-circle-outline', '❓'],
];

const aliases = new Map(EMOJIS.flatMap(([icon, unicode]) => [[`:${icon}:`, icon], [unicode, icon]]));
const pattern = new RegExp([...aliases.keys()].sort((a, b) => b.length - a.length).map(value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');

export default function EmojiText({ children, style, numberOfLines }) {
  const value = String(children ?? '');
  const textStyle = StyleSheet.flatten(style) || {};
  const iconSize = textStyle.fontSize || 16;
  // Vector icon Text nodes cannot reliably nest in regular Text on the iOS
  // simulator. A wrapping View renders both kinds of content as real views.
  const displayedValue = numberOfLines ? value.slice(0, numberOfLines * 70) : value;
  const parts = displayedValue.split(pattern);

  return (
    <View style={[styles.container, { minHeight: textStyle.lineHeight || iconSize * 1.35 }]}>
      {parts.map((part, index) => {
        const icon = aliases.get(part);
        return icon
          ? <View key={`${part}-${index}`} style={styles.icon}><Ionicons name={icon} size={iconSize} color={textStyle.color || '#2D1B25'} /></View>
          : part ? <Text key={`${part}-${index}`} style={style}>{part}</Text> : null;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  icon: { justifyContent: 'center' },
});
