import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const formatDuration = milliseconds => {
  const totalSeconds = Math.max(0, Math.floor((milliseconds || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

function VoiceNote({ message, mine, theme }) {
  const [sound, setSound] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);

  useEffect(() => () => {
    if (sound) sound.unloadAsync();
  }, [sound]);

  const togglePlayback = async () => {
    if (!message.audioUri) return;
    if (sound) {
      if (playing) await sound.pauseAsync();
      else if (position >= (message.duration || 0) - 300) await sound.replayAsync();
      else await sound.playAsync();
      return;
    }

    const { sound: createdSound } = await Audio.Sound.createAsync(
      { uri: message.audioUri },
      { shouldPlay: true },
      status => {
        if (!status.isLoaded) return;
        setPlaying(status.isPlaying);
        setPosition(status.positionMillis || 0);
      },
    );
    setSound(createdSound);
  };

  const progress = Math.min(1, position / Math.max(message.duration || 1, 1));

  return (
    <View style={styles.voiceNote}>
      <TouchableOpacity
        style={[styles.playButton, { backgroundColor: mine ? 'rgba(255,255,255,0.18)' : theme.primarySoft }]}
        onPress={togglePlayback}
        accessibilityLabel={playing ? 'Pause voice note' : 'Play voice note'}
      >
        <AppIcon name={playing ? 'pause' : 'play'} size={13} color={mine ? '#FFFFFF' : theme.primary} />
      </TouchableOpacity>
      <View style={styles.voiceProgressArea}>
        <View style={[styles.voiceTrack, { backgroundColor: mine ? 'rgba(255,255,255,0.28)' : theme.border }]}>
          <View style={[styles.voiceProgress, { width: `${progress * 100}%`, backgroundColor: mine ? '#FFFFFF' : theme.primary }]} />
        </View>
        <View style={styles.voiceMeta}>
          <Text style={[styles.voiceDuration, { color: mine ? 'rgba(255,255,255,0.76)' : theme.secondaryText }]}>
            {formatDuration(playing ? position : message.duration)}
          </Text>
          <AppIcon name="microphone" size={9} color={mine ? 'rgba(255,255,255,0.76)' : theme.secondaryText} />
        </View>
      </View>
    </View>
  );
}

export default function ChatDetailScreen({ route, navigation }) {
  const { chatId } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [chat, setChat] = useState(null);
  const [recording, setRecording] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimer = useRef(null);
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadMessages();
    apiService.getChat(chatId).then(setChat);
    return () => {
      if (recordingTimer.current) clearInterval(recordingTimer.current);
    };
  }, [chatId]);

  const loadMessages = async () => {
    const data = await apiService.getMessages(chatId);
    setMessages([...data].reverse());
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    await apiService.sendMessage(chatId, inputText.trim());
    setInputText('');
    loadMessages();
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone permission required', 'Allow microphone access to record and send voice notes.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const result = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(result.recording);
      setRecordingDuration(0);
      recordingTimer.current = setInterval(async () => {
        const status = await result.recording.getStatusAsync();
        setRecordingDuration(status.durationMillis || 0);
      }, 250);
    } catch (error) {
      Alert.alert('Could not record', 'Please check your microphone permission and try again.');
    }
  };

  const finishRecording = async shouldSend => {
    if (!recording) return;
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    recordingTimer.current = null;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      if (shouldSend && uri && recordingDuration >= 500) {
        await apiService.sendVoiceMessage(chatId, uri, recordingDuration);
        await loadMessages();
      }
    } catch (error) {
      if (shouldSend) Alert.alert('Voice note failed', 'The recording could not be sent. Please try again.');
    } finally {
      setRecording(null);
      setRecordingDuration(0);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {chat?.withUser ? (
        <TouchableOpacity
          style={[styles.profileHeader, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('UserProfile', { userId: chat.withUser.id })}
          activeOpacity={0.8}
        >
          <Image source={{ uri: chat.withUser.avatar }} style={styles.profileAvatar} />
          <View style={styles.profileCopy}>
            <Text style={[styles.profileName, { color: theme.text }]}>{chat.withUser.name}</Text>
            <Text style={[styles.profileHint, { color: theme.secondaryText }]}>Tap to view profile</Text>
          </View>
          <AppIcon name="chevron-right" size={14} color={theme.secondaryText} />
        </TouchableOpacity>
      ) : null}

      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        inverted
        contentContainerStyle={styles.messages}
        renderItem={({ item }) => {
          const mine = item.senderId === user.id;
          return (
            <View style={[styles.messageRow, mine ? styles.myMessage : styles.otherMessage]}>
              <View style={[styles.bubble, item.type === 'voice' && styles.voiceBubble, { backgroundColor: mine ? theme.primary : theme.card }]}>
                {item.type === 'voice' ? (
                  <VoiceNote message={item} mine={mine} theme={theme} />
                ) : (
                  <Text style={[styles.messageText, { color: mine ? '#FFFFFF' : theme.text }]}>{item.text}</Text>
                )}
                <Text style={[styles.messageTime, { color: mine ? 'rgba(255,255,255,0.7)' : theme.secondaryText }]}>
                  {item.timestamp}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {recording ? (
        <View style={[styles.composerArea, { borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom, 10) }]}>
          <View style={[styles.recordingBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity style={styles.recordingAction} onPress={() => finishRecording(false)} accessibilityLabel="Cancel voice note">
              <AppIcon name="trash" size={16} color={theme.danger} />
            </TouchableOpacity>
            <View style={[styles.recordingDot, { backgroundColor: theme.accent }]} />
            <Text style={[styles.recordingLabel, { color: theme.text }]}>Recording</Text>
            <Text style={[styles.recordingTime, { color: theme.secondaryText }]}>{formatDuration(recordingDuration)}</Text>
            <TouchableOpacity style={[styles.sendRecording, { backgroundColor: theme.primary }]} onPress={() => finishRecording(true)} accessibilityLabel="Send voice note">
              <AppIcon name="paper-plane" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[styles.composerArea, { borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom, 10) }]}>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              placeholder="Type a message..."
              placeholderTextColor={theme.secondaryText}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              style={[styles.voiceButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={startRecording}
              accessibilityLabel="Record voice note"
            >
              <AppIcon name="microphone" size={15} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: inputText.trim() ? theme.primary : theme.border }]}
              onPress={sendMessage}
              disabled={!inputText.trim()}
              accessibilityLabel="Send text message"
            >
              <AppIcon name="paper-plane" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 12 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, marginHorizontal: -12, paddingHorizontal: 16, paddingVertical: 11 },
  profileAvatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10 },
  profileCopy: { flex: 1 },
  profileName: { fontSize: 14, fontWeight: '800' },
  profileHint: { fontSize: 11, marginTop: 2 },
  messages: { paddingVertical: 10 },
  messageRow: { marginVertical: 4, flexDirection: 'row' },
  myMessage: { justifyContent: 'flex-end' },
  otherMessage: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 15 },
  voiceBubble: { width: 225 },
  messageText: { fontSize: 13, lineHeight: 19 },
  messageTime: { fontSize: 10, marginTop: 5, alignSelf: 'flex-end' },
  composerArea: { borderTopWidth: 1, marginHorizontal: -12, paddingHorizontal: 12, paddingTop: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 7 },
  input: { flex: 1, minHeight: 43, maxHeight: 100, borderWidth: 1, borderRadius: 16, paddingHorizontal: 13, paddingTop: 11, paddingBottom: 10, fontSize: 13 },
  sendButton: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  voiceButton: { width: 43, height: 43, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  recordingBar: { height: 54, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 17, paddingHorizontal: 8, gap: 9 },
  recordingAction: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  recordingDot: { width: 8, height: 8, borderRadius: 4 },
  recordingLabel: { fontSize: 12, fontWeight: '700' },
  recordingTime: { flex: 1, fontSize: 12, fontVariant: ['tabular-nums'] },
  sendRecording: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  voiceNote: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  playButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  voiceProgressArea: { flex: 1 },
  voiceTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
  voiceProgress: { height: 3, borderRadius: 2 },
  voiceMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  voiceDuration: { fontSize: 10, fontVariant: ['tabular-nums'] },
});
