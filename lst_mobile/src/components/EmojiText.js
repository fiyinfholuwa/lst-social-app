import React from 'react';
import { Text } from 'react-native';

// Older posts stored picker aliases such as :sunny-outline:. Convert those
// aliases at render time while all new content is stored as real Unicode.
const fromCodepoints = value => value.split('-').map(codepoint => String.fromCodePoint(parseInt(codepoint, 16))).join('');
const LEGACY_EMOJIS = new Map([
  ['happy-outline', '1F600'], ['happy', '1F604'], ['heart', '2764-FE0F'], ['heart-outline', '1F496'], ['thumbs-up', '1F44D'], ['thumbs-down', '1F44E'], ['hand-left-outline', '1F44B'], ['star-outline', '2728'], ['star', '2B50'], ['sunny-outline', '2600-FE0F'], ['moon-outline', '1F319'], ['rainy-outline', '1F327-FE0F'], ['flower-outline', '1F338'], ['leaf-outline', '1F33F'], ['flame-outline', '1F525'], ['water-outline', '1F4A7'], ['chatbubble-outline', '1F4AC'], ['mail-outline', '2709-FE0F'], ['gift-outline', '1F381'], ['color-palette-outline', '1F388'], ['musical-notes-outline', '1F3B5'], ['camera-outline', '1F4F7'], ['images-outline', '1F5BC-FE0F'], ['book-outline', '1F4DA'], ['rocket-outline', '1F680'], ['airplane-outline', '2708-FE0F'], ['car-outline', '1F697'], ['home-outline', '1F3E0'], ['people-outline', '1F465'], ['person-outline', '1F642'], ['paw-outline', '1F43E'], ['restaurant-outline', '1F37D-FE0F'], ['cafe-outline', '2615'], ['wine-outline', '1F942'], ['football-outline', '26BD'], ['game-controller-outline', '1F3AE'], ['bulb-outline', '1F4A1'], ['checkmark-circle-outline', '2705'], ['alert-circle-outline', '2757'], ['help-circle-outline', '2753'],
].map(([alias, codepoints]) => [alias, fromCodepoints(codepoints)]));

const renderLegacyEmoji = value => value.replace(/:([a-z0-9-]+):/gi, (match, alias) => LEGACY_EMOJIS.get(alias) || match);

export default function EmojiText({ children, ...props }) {
  return <Text {...props}>{renderLegacyEmoji(String(children ?? ''))}</Text>;
}
