import React from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { EMOJI_BY_ALIAS, EMOJIS } from './emojiCatalog';

const replaceLegacyAliases = value => value.replace(/:([a-z0-9-]+):/gi, (match, alias) => EMOJI_BY_ALIAS.get(alias)?.unicode || match);
const normalizeEmoji = value => value.replace(/\uFE0F/g, '');

// Match the longest values first so variation-selector sequences are kept
// together when the text contains more than one emoji.
const emojiTokens = [...new Set(EMOJIS.flatMap(emoji => [emoji.unicode, normalizeEmoji(emoji.unicode)]))]
  .sort((first, second) => second.length - first.length)
  .map(emoji => emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const genericEmoji = '\\p{Extended_Pictographic}(?:\\uFE0F|\\u200D\\p{Extended_Pictographic}|[\\u{1F3FB}-\\u{1F3FF}])*';
const emojiPattern = new RegExp(`(${emojiTokens.join('|')}|${genericEmoji})`, 'gu');
const emojiByUnicode = new Map(EMOJIS.flatMap(emoji => [
  [emoji.unicode, emoji],
  [normalizeEmoji(emoji.unicode), emoji],
]));

const splitEmoji = value => {
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = emojiPattern.exec(value))) {
    if (match.index > lastIndex) parts.push({ text: value.slice(lastIndex, match.index) });
    parts.push({ text: match[0], emoji: emojiByUnicode.get(match[0]) || emojiByUnicode.get(normalizeEmoji(match[0])), isEmoji: true });
    lastIndex = match.index + match[0].length;
  }
  emojiPattern.lastIndex = 0;
  if (lastIndex < value.length) parts.push({ text: value.slice(lastIndex) });
  return parts.length ? parts : [{ text: value }];
};

const getFontSize = style => {
  const styles = Array.isArray(style) ? style : [style];
  const fontSize = styles.reduce((value, item) => item?.fontSize || value, 14);
  return Number(fontSize) || 14;
};

export default function EmojiText({ children, style, emojiScale = 1, noWrap = false, ...props }) {
  const value = replaceLegacyAliases(String(children ?? ''));
  const parts = splitEmoji(value);

  if (parts.length === 1 && !parts[0].emoji && !parts[0].isEmoji) {
    return <Text {...props} style={style}>{value}</Text>;
  }

  const fontSize = getFontSize(style);
  const emojiSize = Math.max(14, fontSize * emojiScale);
  return (
    <View {...props} style={[styles.container, noWrap && styles.noWrap, style]}>
      {parts.map((part, index) => part.emoji ? (
        <Image
          key={`emoji-${index}`}
          source={part.emoji.image}
          style={{ width: emojiSize, height: fontSize * 1.25 }}
          resizeMode="contain"
          accessibilityLabel={`${part.emoji.keywords} emoji`}
        />
      ) : part.isEmoji ? (
        <Text key={`emoji-text-${index}`} style={[styles.emojiFont, { fontSize, lineHeight: fontSize * 1.25 }]}>{part.text}</Text>
      ) : (
        <Text key={`text-${index}`} style={style}>{part.text}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', maxWidth: '100%' },
  noWrap: { flexWrap: 'nowrap', flexShrink: 0 },
  emojiFont: Platform.select({ ios: { fontFamily: 'AppleColorEmoji' }, default: {} }),
});
