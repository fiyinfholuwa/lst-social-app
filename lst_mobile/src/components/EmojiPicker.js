import React, { useMemo, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// The iOS simulator used for this project does not expose its colour-emoji
// font to React Native Text, so Unicode emoji render as a boxed question mark.
// Ionicons is bundled with Expo, making it a dependable visual picker on every
// target. The selected value remains a standard Unicode emoji for posts.
const EMOJIS = [
  ['happy-outline', '😀', 'grinning happy smile'], ['happy', '😄', 'happy smile joy'], ['heart', '❤️', 'heart love'], ['heart-outline', '💖', 'heart love'],
  ['thumbs-up', '👍', 'thumbs up like yes'], ['thumbs-down', '👎', 'thumbs down dislike no'], ['hand-left-outline', '👋', 'wave hello'], ['star-outline', '✨', 'sparkles celebrate'],
  ['star', '⭐', 'star favourite favorite'], ['sunny-outline', '☀️', 'sun sunshine'], ['moon-outline', '🌙', 'moon night'], ['rainy-outline', '🌧️', 'rain weather'],
  ['flower-outline', '🌸', 'flower blossom'], ['leaf-outline', '🌿', 'leaf nature'], ['flame-outline', '🔥', 'fire hot'], ['water-outline', '💧', 'water drop'],
  ['chatbubble-outline', '💬', 'chat speech message'], ['mail-outline', '✉️', 'mail letter'], ['gift-outline', '🎁', 'gift present'], ['color-palette-outline', '🎈', 'balloon party'],
  ['musical-notes-outline', '🎵', 'music note song'], ['camera-outline', '📷', 'camera photo'], ['images-outline', '🖼️', 'image picture'], ['book-outline', '📚', 'book read'],
  ['rocket-outline', '🚀', 'rocket launch'], ['airplane-outline', '✈️', 'plane travel'], ['car-outline', '🚗', 'car drive'], ['home-outline', '🏠', 'home house'],
  ['people-outline', '👥', 'people friends community'], ['person-outline', '🙂', 'person face'], ['paw-outline', '🐾', 'paw animal'], ['restaurant-outline', '🍽️', 'food meal'],
  ['cafe-outline', '☕', 'coffee cafe'], ['wine-outline', '🥂', 'drink cheers'], ['football-outline', '⚽', 'football soccer sport'], ['game-controller-outline', '🎮', 'game play'],
  ['bulb-outline', '💡', 'idea light'], ['checkmark-circle-outline', '✅', 'check yes done'], ['alert-circle-outline', '❗', 'alert important'], ['help-circle-outline', '❓', 'question help'],
].map(([icon, unicode, keywords]) => ({ id: icon, icon, unicode, value: `:${icon}:`, keywords }));

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
              <Ionicons name={item.icon} size={26} color={theme.primary} />
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
});
