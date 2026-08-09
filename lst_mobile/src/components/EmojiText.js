import React from 'react';
import { Image, Text } from 'react-native';
import { EMOJI_BY_ALIAS, EMOJI_BY_UNICODE, EMOJIS } from './emojiCatalog';

const knownUnicode = [...EMOJIS].sort((a, b) => b.unicode.length - a.unicode.length);

const replaceLegacyAliases = value => value.replace(/:([a-z0-9-]+):/gi, (match, alias) => EMOJI_BY_ALIAS.get(alias)?.unicode || match);

export default function EmojiText({ children, style, ...props }) {
  const value = replaceLegacyAliases(String(children ?? ''));
  const parts = [];
  let text = '';

  for (let index = 0; index < value.length;) {
    const emoji = knownUnicode.find(candidate => value.startsWith(candidate.unicode, index));
    if (!emoji) {
      text += value[index];
      index += 1;
      continue;
    }

    if (text) parts.push(text);
    text = '';
    const source = EMOJI_BY_UNICODE.get(emoji.unicode)?.image;
    parts.push(<Image key={`${index}-${emoji.id}`} source={source} style={{ width: 18, height: 18 }} />);
    index += emoji.unicode.length;
  }

  if (text) parts.push(text);
  return <Text {...props} style={style}>{parts}</Text>;
}
