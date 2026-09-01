import React from 'react';
import { Text } from 'react-native';
import { EMOJI_BY_ALIAS } from './emojiCatalog';

const replaceLegacyAliases = value => value.replace(/:([a-z0-9-]+):/gi, (match, alias) => EMOJI_BY_ALIAS.get(alias)?.unicode || match);

export default function EmojiText({ children, style, ...props }) {
  const value = replaceLegacyAliases(String(children ?? ''));
  return <Text {...props} style={style}>{value}</Text>;
}
