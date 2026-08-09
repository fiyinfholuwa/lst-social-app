import React, { useMemo, useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const EMOJI_DATA = require('emoji-datasource');
const APPLE_EMOJI_SHEET = require('emoji-datasource/img/apple/sheets/32.png');
const SHEET_CELL_SIZE = 34;
const SHEET_SIZE = 2108;

const codepointsToEmoji = value => value
  ?.split('-')
  .map(codepoint => String.fromCodePoint(parseInt(codepoint, 16)))
  .join('');

const emojiSheetPositions = new Map();
EMOJI_DATA.forEach(item => {
  const position = { x: item.sheet_x, y: item.sheet_y };
  emojiSheetPositions.set(codepointsToEmoji(item.unified), position);
  if (item.non_qualified) emojiSheetPositions.set(codepointsToEmoji(item.non_qualified), position);
});

const EMOJIS = [
  ['happy-outline', '1F600', 'grinning happy smile'], ['happy', '1F604', 'happy smile joy'], ['heart', '2764-FE0F', 'heart love'], ['heart-outline', '1F496', 'heart love'],
  ['thumbs-up', '1F44D', 'thumbs up like yes'], ['thumbs-down', '1F44E', 'thumbs down dislike no'], ['hand-left-outline', '1F44B', 'wave hello'], ['star-outline', '2728', 'sparkles celebrate'],
  ['star', '2B50', 'star favourite favorite'], ['sunny-outline', '2600-FE0F', 'sun sunshine'], ['moon-outline', '1F319', 'moon night'], ['rainy-outline', '1F327-FE0F', 'rain weather'],
  ['flower-outline', '1F338', 'flower blossom'], ['leaf-outline', '1F33F', 'leaf nature'], ['flame-outline', '1F525', 'fire hot'], ['water-outline', '1F4A7', 'water drop'],
  ['chatbubble-outline', '1F4AC', 'chat speech message'], ['mail-outline', '2709-FE0F', 'mail letter'], ['gift-outline', '1F381', 'gift present'], ['color-palette-outline', '1F388', 'balloon party'],
  ['musical-notes-outline', '1F3B5', 'music note song'], ['camera-outline', '1F4F7', 'camera photo'], ['images-outline', '1F5BC-FE0F', 'image picture'], ['book-outline', '1F4DA', 'book read'],
  ['rocket-outline', '1F680', 'rocket launch'], ['airplane-outline', '2708-FE0F', 'plane travel'], ['car-outline', '1F697', 'car drive'], ['home-outline', '1F3E0', 'home house'],
  ['people-outline', '1F465', 'people friends community'], ['person-outline', '1F642', 'person face'], ['paw-outline', '1F43E', 'paw animal'], ['restaurant-outline', '1F37D-FE0F', 'food meal'],
  ['cafe-outline', '2615', 'coffee cafe'], ['wine-outline', '1F942', 'drink cheers'], ['football-outline', '26BD', 'football soccer sport'], ['game-controller-outline', '1F3AE', 'game play'],
  ['bulb-outline', '1F4A1', 'idea light'], ['checkmark-circle-outline', '2705', 'check yes done'], ['alert-circle-outline', '2757', 'alert important'], ['help-circle-outline', '2753', 'question help'],
].map(([icon, codepoints, keywords]) => {
  const unicode = codepointsToEmoji(codepoints);
  return { id: icon, unicode, value: unicode, keywords };
});

function EmojiImage({ unicode }) {
  const position = emojiSheetPositions.get(unicode);

  if (!position) return <Text style={styles.emojiFallback}>{unicode}</Text>;

  return (
    <View style={styles.emojiCrop} pointerEvents="none">
      <Image
        source={APPLE_EMOJI_SHEET}
        resizeMode="stretch"
        style={[
          styles.emojiSheet,
          {
            left: -((position.x * SHEET_CELL_SIZE) + 1),
            top: -((position.y * SHEET_CELL_SIZE) + 1),
          },
        ]}
      />
    </View>
  );
}

export default function EmojiPicker({ onSelect, onClose, theme }) {
  const [query, setQuery] = useState('');
  const emojis = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? EMOJIS.filter(emoji => emoji.keywords.includes(search)) : EMOJIS;
  }, [query]);

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Emoji</Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close emoji picker">
            <Text style={[styles.done, { color: theme.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search emoji"
          placeholderTextColor={theme.secondaryText}
          style={[styles.search, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
          autoCorrect={false}
        />
        <FlatList
          data={emojis}
          keyExtractor={item => item.id}
          numColumns={7}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.emojiButton} onPress={() => onSelect(item.value)} accessibilityLabel={`Add ${item.keywords} emoji`}>
              <EmojiImage unicode={item.unicode} />
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { height: 58, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 17, fontWeight: '800' },
  done: { fontSize: 16, fontWeight: '700' },
  search: { height: 42, borderWidth: 1, borderRadius: 12, margin: 14, paddingHorizontal: 13, fontSize: 15 },
  grid: { paddingHorizontal: 10, paddingBottom: 24 },
  emojiButton: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  emojiCrop: { width: 32, height: 32, overflow: 'hidden' },
  emojiSheet: { position: 'absolute', width: SHEET_SIZE, height: SHEET_SIZE },
  emojiFallback: { fontSize: 27 },
});
