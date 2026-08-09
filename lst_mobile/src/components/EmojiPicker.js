import React, { useMemo, useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { EMOJIS } from './emojiCatalog';

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
              <Image source={item.image} style={styles.emoji} />
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
  emoji: { width: 32, height: 32 },
});
