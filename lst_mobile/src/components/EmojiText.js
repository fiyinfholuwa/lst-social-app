import React from 'react';
import { Text } from 'react-native';

// Older posts stored picker aliases such as :sunny-outline:. Convert those
// aliases at render time while all new content is stored as real Unicode.
const LEGACY_EMOJIS = new Map([
  ['happy-outline', '😀'], ['happy', '😄'], ['heart', '❤️'], ['heart-outline', '💖'], ['thumbs-up', '👍'], ['thumbs-down', '👎'], ['hand-left-outline', '👋'], ['star-outline', '✨'], ['star', '⭐'], ['sunny-outline', '☀️'], ['moon-outline', '🌙'], ['rainy-outline', '🌧️'], ['flower-outline', '🌸'], ['leaf-outline', '🌿'], ['flame-outline', '🔥'], ['water-outline', '💧'], ['chatbubble-outline', '💬'], ['mail-outline', '✉️'], ['gift-outline', '🎁'], ['color-palette-outline', '🎈'], ['musical-notes-outline', '🎵'], ['camera-outline', '📷'], ['images-outline', '🖼️'], ['book-outline', '📚'], ['rocket-outline', '🚀'], ['airplane-outline', '✈️'], ['car-outline', '🚗'], ['home-outline', '🏠'], ['people-outline', '👥'], ['person-outline', '🙂'], ['paw-outline', '🐾'], ['restaurant-outline', '🍽️'], ['cafe-outline', '☕'], ['wine-outline', '🥂'], ['football-outline', '⚽'], ['game-controller-outline', '🎮'], ['bulb-outline', '💡'], ['checkmark-circle-outline', '✅'], ['alert-circle-outline', '❗'], ['help-circle-outline', '❓'],
]);

const renderLegacyEmoji = value => value.replace(/:([a-z0-9-]+):/gi, (match, alias) => LEGACY_EMOJIS.get(alias) || match);

export default function EmojiText({ children, ...props }) {
  return <Text {...props}>{renderLegacyEmoji(String(children ?? ''))}</Text>;
}
