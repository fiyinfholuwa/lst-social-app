import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import EmojiText from '../../components/EmojiText';
import EmojiPicker from '../../components/EmojiPicker';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useChatUnread } from '../../context/ChatUnreadContext';

const formatDuration = milliseconds => {
  const totalSeconds = Math.max(0, Math.floor((milliseconds || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

function VoiceNote({ message, mine, theme, activeVoiceId, onActivate }) {
  const player = useAudioPlayer(message.audioUri ? { uri: message.audioUri } : null, {
    updateInterval: 250,
    downloadFirst: true,
    keepAudioSessionActive: true,
  });
  const status = useAudioPlayerStatus(player);
  const playing = Boolean(status.playing);
  const position = (status.currentTime || 0) * 1000;
  const duration = status.duration > 0 ? status.duration * 1000 : Number(message.duration || 0);

  useEffect(() => {
    if (playing && String(activeVoiceId) !== String(message.id)) {
      player.pause();
    }
  }, [activeVoiceId, message.id, player, playing]);

  useEffect(() => {
    if (status.didJustFinish && String(activeVoiceId) === String(message.id)) {
      onActivate(null);
    }
  }, [activeVoiceId, message.id, onActivate, status.didJustFinish]);

  const togglePlayback = async () => {
    if (!message.audioUri) {
      Alert.alert('Voice note unavailable', 'This voice note does not have a playable audio file.');
      return;
    }
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (playing) {
        player.pause();
        onActivate(null);
        return;
      }
      if (!status.isLoaded) {
        Alert.alert('Loading voice note', 'The audio is still downloading. Please tap play again in a moment.');
        return;
      }
      if (status.didJustFinish || (duration > 0 && position >= duration - 300)) await player.seekTo(0);
      onActivate(message.id);
      player.play();
    } catch (error) {
      console.error('Unable to play voice note:', error);
      Alert.alert('Couldn’t play voice note', error.message || 'Please check your connection and try again.');
    }
  };

  const progress = Math.min(1, position / Math.max(duration || 1, 1));

  return (
    <View style={styles.voiceNote}>
      <TouchableOpacity
        style={[styles.playButton, { backgroundColor: mine ? 'rgba(255,255,255,0.18)' : theme.primarySoft }]}
        onPress={togglePlayback}
        accessibilityLabel={playing ? 'Pause voice note' : 'Play voice note'}
      >
        <AppIcon name={status.isBuffering || !status.isLoaded ? 'hourglass' : playing ? 'pause' : 'play'} size={13} color={mine ? '#FFFFFF' : theme.primary} />
      </TouchableOpacity>
      <View style={styles.voiceProgressArea}>
        <View style={[styles.voiceTrack, { backgroundColor: mine ? 'rgba(255,255,255,0.28)' : theme.border }]}>
          <View style={[styles.voiceProgress, { width: `${progress * 100}%`, backgroundColor: mine ? '#FFFFFF' : theme.primary }]} />
        </View>
        <View style={styles.voiceMeta}>
          <Text style={[styles.voiceDuration, { color: mine ? 'rgba(255,255,255,0.76)' : theme.secondaryText }]}>
            {formatDuration(playing ? position : duration)}
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
  const [activeVoiceId, setActiveVoiceId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder, 250);
  const recording = recorderState.isRecording;
  const recordingDuration = recorderState.durationMillis || 0;
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { refreshUnreadChats } = useChatUnread();

  useEffect(() => {
    loadMessages();
    apiService.getChat(chatId)
      .then(setChat)
      .catch(error => Alert.alert('Couldn’t load chat', error.message || 'Please try again.'));
    const refreshTimer = setInterval(loadMessages, 5000);
    return () => clearInterval(refreshTimer);
  }, [chatId]);

  const loadMessages = async () => {
    try {
      const data = await apiService.getMessages(chatId);
      setMessages([...data].reverse());
      refreshUnreadChats();
    } catch (error) {
      console.error('Unable to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;
    setSending(true);
    try {
      await apiService.sendMessage(chatId, inputText.trim());
      setInputText('');
      setSelection({ start: 0, end: 0 });
      await loadMessages();
    } catch (error) {
      Alert.alert('Message not sent', error.message || 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  const insertEmoji = emoji => {
    const start = selection.start ?? inputText.length;
    const end = selection.end ?? start;
    setInputText(`${inputText.slice(0, start)}${emoji}${inputText.slice(end)}`);
    const cursor = start + emoji.length;
    setSelection({ start: cursor, end: cursor });
    setShowEmojiPicker(false);
    setTimeout(() => inputRef.current?.focus(), 250);
  };

  const startRecording = async () => {
    try {
      setActiveVoiceId(null);
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone permission required', 'Allow microphone access to record and send voice notes.');
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (error) {
      Alert.alert('Could not record', 'Please check your microphone permission and try again.');
    }
  };

  const finishRecording = async shouldSend => {
    if (!recording) return;
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (shouldSend) {
        if (!uri) throw new Error('The recording file was not created.');
        if (recordingDuration < 500) throw new Error('The voice note is too short. Record for at least one second.');
        await apiService.sendVoiceMessage(chatId, uri, recordingDuration);
        await loadMessages();
      }
    } catch (error) {
      console.error('Unable to send voice note:', error);
      if (shouldSend) Alert.alert('Voice note failed', error.message || 'The recording could not be sent. Please try again.');
    } finally {
      try {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      } catch (error) {
        console.warn('Unable to restore audio mode:', error);
      }
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
          <Avatar uri={chat.withUser.avatar} size={42} style={styles.profileAvatar} accessibilityLabel={`${chat.withUser.name}'s profile avatar`} />
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
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<View style={styles.emptyConversation}><View style={[styles.emptyConversationIcon, { backgroundColor: theme.primarySoft }]}><AppIcon name="chatbubbles-outline" size={24} color={theme.primary} /></View><Text style={[styles.emptyConversationTitle, { color: theme.text }]}>Start the conversation</Text><Text style={[styles.emptyConversationText, { color: theme.secondaryText }]}>Send a kind message, an emoji, or a voice note.</Text></View>}
        renderItem={({ item }) => {
          const mine = item.senderId === user.id;
          return (
            <View style={[styles.messageRow, mine ? styles.myMessage : styles.otherMessage]}>
              <View style={[styles.bubble, item.type === 'voice' && styles.voiceBubble, { backgroundColor: mine ? theme.primary : theme.card }]}>
                {item.type === 'voice' ? (
                  <VoiceNote
                    message={item}
                    mine={mine}
                    theme={theme}
                    activeVoiceId={activeVoiceId}
                    onActivate={setActiveVoiceId}
                  />
                ) : (
                  <EmojiText style={[styles.messageText, { color: mine ? '#FFFFFF' : theme.text }]}>{item.text}</EmojiText>
                )}
                <View style={styles.messageMeta}>
                  <Text style={[styles.messageTime, { color: mine ? 'rgba(255,255,255,0.7)' : theme.secondaryText }]}>{item.timestamp}</Text>
                  {mine ? <AppIcon name={item.read ? 'checkmark-done' : 'check'} size={14} color={item.read ? '#22A06B' : 'rgba(255,255,255,0.72)'} /> : null}
                </View>
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
            <View style={[styles.inputPill, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <TouchableOpacity
                style={styles.emojiButton}
                onPress={() => { Keyboard.dismiss(); setShowEmojiPicker(true); }}
                accessibilityLabel="Add emoji"
              >
                <AppIcon name="happy" size={20} color={theme.primary} />
              </TouchableOpacity>
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: theme.text }]}
                placeholder="Message..."
                placeholderTextColor={theme.secondaryText}
                value={inputText}
                onChangeText={setInputText}
                onSelectionChange={({ nativeEvent }) => setSelection(nativeEvent.selection)}
                multiline
              />
            </View>
            {inputText.trim() ? (
              <TouchableOpacity
                style={[styles.roundAction, { backgroundColor: theme.primary }]}
                onPress={sendMessage}
                disabled={sending}
                accessibilityLabel="Send text message"
              >
                <AppIcon name="paper-plane" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.roundAction, { backgroundColor: theme.primary }]}
                onPress={startRecording}
                accessibilityLabel="Record voice note"
              >
                <AppIcon name="microphone" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      {showEmojiPicker ? <EmojiPicker theme={theme} onSelect={insertEmoji} onClose={() => setShowEmojiPicker(false)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 12 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, marginHorizontal: -12, paddingHorizontal: 16, paddingVertical: 11 },
  profileAvatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10 },
  profileCopy: { flex: 1 },
  profileName: { fontSize: 14, fontWeight: '700' },
  profileHint: { fontSize: 11, marginTop: 2 },
  messages: { flexGrow: 1, paddingVertical: 14 },
  messageRow: { marginVertical: 4, flexDirection: 'row' },
  myMessage: { justifyContent: 'flex-end' },
  otherMessage: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 17 },
  voiceBubble: { width: 225 },
  messageText: { fontSize: 13, lineHeight: 19 },
  messageMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 5 },
  messageTime: { fontSize: 10 },
  composerArea: { borderTopWidth: StyleSheet.hairlineWidth, marginHorizontal: -12, paddingHorizontal: 12, paddingTop: 9 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  inputPill: { flex: 1, minHeight: 46, maxHeight: 108, borderWidth: StyleSheet.hairlineWidth, borderRadius: 23, flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 3 },
  input: { flex: 1, minHeight: 45, maxHeight: 107, paddingRight: 14, paddingTop: 12, paddingBottom: 11, fontSize: 14 },
  emojiButton: { width: 40, height: 45, alignItems: 'center', justifyContent: 'center' },
  roundAction: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  emptyConversation: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyConversationIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  emptyConversationTitle: { fontSize: 16, fontWeight: '800', marginTop: 12 },
  emptyConversationText: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 5 },
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
