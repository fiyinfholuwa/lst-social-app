import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Keyboard, Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
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
import KeyboardSafeView from '../../components/KeyboardSafeView';
import EmojiText from '../../components/EmojiText';
import EmojiPicker from '../../components/EmojiPicker';
import Avatar from '../../components/Avatar';
import ReportModal from '../../components/ReportModal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useChatUnread } from '../../context/ChatUnreadContext';

const formatDuration = milliseconds => {
  const totalSeconds = Math.max(0, Math.floor((milliseconds || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const MESSAGE_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

const canModifyMessage = message => {
  if (!message) return false;
  const createdAt = new Date(message.createdAt).getTime();
  if (Number.isFinite(createdAt)) return Date.now() - createdAt < 15 * 60 * 1000;

  const relativeTime = String(message.timestamp || '').toLowerCase();
  if (relativeTime.includes('just now') || relativeTime.includes('second ago') || relativeTime.includes('seconds ago')) return true;
  const minutes = relativeTime.match(/^(\d+)\s+minutes?\s+ago$/);
  return minutes ? Number(minutes[1]) < 15 : false;
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
  const [messagesPage, setMessagesPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [chat, setChat] = useState(null);
  const [activeVoiceId, setActiveVoiceId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [sending, setSending] = useState(false);
  const [reportingMessage, setReportingMessage] = useState(null);
  const [keyboardOverlap, setKeyboardOverlap] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [messageActionPending, setMessageActionPending] = useState(false);
  const [showLatestButton, setShowLatestButton] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder, 250);
  const recording = recorderState.isRecording;
  const recordingDuration = recorderState.durationMillis || 0;
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { refreshUnreadChats } = useChatUnread();

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', event => {
      if (Platform.OS === 'android') {
        const windowHeight = Dimensions.get('window').height;
        const keyboardTop = event.endCoordinates?.screenY ?? windowHeight;
        setKeyboardOverlap(Math.max(0, windowHeight - keyboardTop));
      }
      requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardOverlap(0));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;
    let timer;
    let failureCount = 0;
    const poll = async () => {
      const succeeded = await loadMessages();
      if (!active) return;
      failureCount = succeeded ? 0 : failureCount + 1;
      const delay = succeeded ? 5000 : Math.min(60000, 5000 * (2 ** failureCount));
      timer = setTimeout(poll, delay);
    };
    poll();
    apiService.getChat(chatId)
      .then(setChat)
      .catch(error => Alert.alert('Couldn’t load chat', error.message || 'Please try again.'));
    return () => { active = false; clearTimeout(timer); };
  }, [chatId]);

  const loadMessages = async (requestedPage = 1) => {
    if (requestedPage > 1) setLoadingMoreMessages(true);
    try {
      const response = await apiService.getMessages(chatId, requestedPage);
      setMessages(current => {
        if (requestedPage > 1) return [...current, ...response.data];
        const incomingIds = new Set(response.data.map(message => String(message.id)));
        return [...response.data, ...current.filter(message => !incomingIds.has(String(message.id)))];
      });
      setMessagesPage(response.currentPage);
      setHasMoreMessages(Boolean(response.hasMorePages));
      refreshUnreadChats();
      return true;
    } catch (error) {
      console.error('Unable to load messages:', error);
      return false;
    } finally {
      if (requestedPage > 1) setLoadingMoreMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;
    const text = inputText.trim();
    const temporaryId = `pending-${Date.now()}`;
    const optimisticMessage = { id: temporaryId, senderId: user.id, text, type: 'text', timestamp: 'Sending…', reactions: [], pending: true };
    setSending(true);
    setMessages(current => [optimisticMessage, ...current]);
    setInputText('');
    setSelection({ start: 0, end: 0 });
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    try {
      const sentMessage = await apiService.sendMessage(chatId, text);
      setMessages(current => current.map(message => message.id === temporaryId ? sentMessage : message));
    } catch (error) {
      setMessages(current => current.filter(message => message.id !== temporaryId));
      setInputText(current => current || text);
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

  const replaceMessage = updated => setMessages(current => current.map(message => String(message.id) === String(updated.id) ? updated : message));

  const reactToMessage = async emoji => {
    if (!selectedMessage || messageActionPending) return;
    const currentReaction = selectedMessage.reactions?.find(reaction => reaction.reactedByCurrentUser)?.emoji;
    setMessageActionPending(true);
    try {
      const updated = await apiService.reactToMessage(chatId, selectedMessage.id, currentReaction === emoji ? null : emoji);
      replaceMessage(updated);
      setSelectedMessage(updated);
    } catch (error) {
      Alert.alert('Reaction not saved', error.message || 'Please try again.');
    } finally { setMessageActionPending(false); }
  };

  const copyMessage = async () => {
    if (!selectedMessage?.text) return;
    await Clipboard.setStringAsync(selectedMessage.text);
    setSelectedMessage(null);
  };

  const beginEditMessage = () => {
    setEditText(selectedMessage?.text || '');
    setEditingMessage(selectedMessage);
    setSelectedMessage(null);
  };

  const saveEditedMessage = async () => {
    if (!editingMessage || !editText.trim() || messageActionPending) return;
    setMessageActionPending(true);
    try {
      const updated = await apiService.editMessage(chatId, editingMessage.id, editText.trim());
      replaceMessage(updated);
      setEditingMessage(null);
      setEditText('');
    } catch (error) {
      Alert.alert('Message not edited', error.message || 'Please try again.');
    } finally { setMessageActionPending(false); }
  };

  const deleteSelectedMessage = async (message, scope) => {
    try {
      await apiService.deleteMessage(chatId, message.id, scope);
      setMessages(current => current.filter(item => String(item.id) !== String(message.id)));
    } catch (error) {
      Alert.alert('Message not deleted', error.message || 'Please try again.');
    }
  };

  const requestDeleteMessage = () => {
    const message = selectedMessage;
    setSelectedMessage(null);
    const mine = String(message?.senderId) === String(user.id);
    Alert.alert('Delete message?', mine ? 'Choose who this message should be deleted for.' : 'This message will only be removed from your chat.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete for me', onPress: () => deleteSelectedMessage(message, 'me') },
      ...(mine ? [{ text: 'Delete for everyone', style: 'destructive', onPress: () => deleteSelectedMessage(message, 'everyone') }] : []),
    ]);
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
    <KeyboardSafeView
      style={{ backgroundColor: theme.background }}
      keyboardVerticalOffset={0}
      androidBehavior="none"
    >
      <View style={[styles.conversationHeader, { backgroundColor: theme.card, borderColor: theme.border, paddingTop: insets.top + 7 }]}>
        <TouchableOpacity style={[styles.headerButton, { backgroundColor: theme.background }]} onPress={navigation.goBack} accessibilityLabel="Back to messages">
          <AppIcon name="chevron-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.profileHeader}
          onPress={() => chat?.withUser && navigation.navigate('UserProfile', { userId: chat.withUser.id })}
          activeOpacity={0.75}
          disabled={!chat?.withUser}
        >
          <Avatar uri={chat?.withUser?.avatar} size={42} style={styles.profileAvatar} accessibilityLabel={`${chat?.withUser?.name || route.params?.userName || 'Friend'}'s profile avatar`} />
          <View style={styles.profileCopy}>
            <Text style={[styles.profileName, { color: theme.text }]} numberOfLines={1}>{chat?.withUser?.name || route.params?.userName || 'Conversation'}</Text>
            <View style={styles.privateRow}>
              <AppIcon name="lock-closed" size={9} color={theme.secondaryText} />
              <Text style={[styles.profileHint, { color: theme.secondaryText }]}>Private conversation</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.headerButton, { backgroundColor: theme.primarySoft }]} onPress={() => chat?.withUser && navigation.navigate('UserProfile', { userId: chat.withUser.id })} accessibilityLabel="View profile" disabled={!chat?.withUser}>
          <AppIcon name="person-outline" size={18} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => String(item.id)}
        inverted
        onScroll={({ nativeEvent }) => setShowLatestButton(nativeEvent.contentOffset.y > 220)}
        scrollEventThrottle={100}
        onEndReached={() => hasMoreMessages && !loadingMoreMessages && loadMessages(messagesPage + 1)}
        onEndReachedThreshold={0.35}
        ListFooterComponent={loadingMoreMessages ? <ActivityIndicator style={styles.messagesFooter} color={theme.primary} /> : null}
        contentContainerStyle={styles.messages}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<View style={styles.emptyConversation}><View style={[styles.emptyConversationIcon, { backgroundColor: theme.primarySoft }]}><AppIcon name="chatbubbles-outline" size={24} color={theme.primary} /></View><Text style={[styles.emptyConversationTitle, { color: theme.text }]}>Start the conversation</Text><Text style={[styles.emptyConversationText, { color: theme.secondaryText }]}>Send a kind message, an emoji, or a voice note.</Text></View>}
        renderItem={({ item, index }) => {
          const mine = String(item.senderId) === String(user.id);
          const newerMessage = messages[index - 1];
          const olderMessage = messages[index + 1];
          const sameAsNewer = newerMessage && String(newerMessage.senderId) === String(item.senderId);
          const sameAsOlder = olderMessage && String(olderMessage.senderId) === String(item.senderId);
          const showAvatar = !mine && !sameAsNewer;
          const showMeta = !sameAsNewer;
          return (
            <View style={[styles.messageRow, sameAsNewer ? styles.groupedRow : styles.groupEndRow, mine ? styles.myMessage : styles.otherMessage]}>
              {!mine ? (showAvatar ? <Avatar uri={chat?.withUser?.avatar} size={28} style={styles.messageAvatar} accessibilityLabel={`${chat?.withUser?.name || 'Friend'}'s avatar`} /> : <View style={styles.avatarSpacer} />) : null}
              <TouchableOpacity
                activeOpacity={0.82}
                onLongPress={() => !item.pending && setSelectedMessage(item)}
                delayLongPress={260}
                accessibilityHint="Long press for message options"
                style={[
                  styles.bubble,
                  mine ? styles.mineBubble : styles.otherBubble,
                  sameAsOlder && (mine ? styles.mineJoinedTop : styles.otherJoinedTop),
                  sameAsNewer && (mine ? styles.mineJoinedBottom : styles.otherJoinedBottom),
                  item.type === 'voice' && styles.voiceBubble,
                  { backgroundColor: mine ? theme.primary : theme.card, borderColor: mine ? theme.primary : theme.border },
                ]}
              >
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
                {item.reactions?.length ? <View style={styles.reactionSummary}>{item.reactions.map(reaction => <View key={reaction.emoji} style={[styles.reactionBadge, { backgroundColor: mine ? 'rgba(255,255,255,0.18)' : theme.primarySoft }]}><Text style={styles.reactionEmoji}>{reaction.emoji}</Text>{reaction.count > 1 ? <Text style={[styles.reactionCount, { color: mine ? '#FFFFFF' : theme.primary }]}>{reaction.count}</Text> : null}</View>)}</View> : null}
                {showMeta ? <View style={styles.messageMeta}>
                  {item.edited ? <Text style={[styles.messageTime, { color: mine ? 'rgba(255,255,255,0.7)' : theme.secondaryText }]}>edited</Text> : null}
                  <Text style={[styles.messageTime, { color: mine ? 'rgba(255,255,255,0.7)' : theme.secondaryText }]}>{item.timestamp}</Text>
                  {mine ? <AppIcon name={item.pending ? 'time-outline' : item.read ? 'checkmark-done' : 'check'} size={13} color={item.read ? '#22A06B' : 'rgba(255,255,255,0.72)'} /> : null}
                </View> : null}
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {showLatestButton ? <TouchableOpacity style={[styles.latestButton, { backgroundColor: theme.card, borderColor: theme.border, bottom: Math.max(insets.bottom, 10) + 72 + keyboardOverlap }]} onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })} accessibilityLabel="Jump to latest message"><AppIcon name="chevron-down" size={18} color={theme.primary} /></TouchableOpacity> : null}

      {recording ? (
        <View
          style={[styles.composerArea, { borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom + 4, 14), marginBottom: keyboardOverlap }]}
        >
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
        <View
          style={[styles.composerArea, { borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom + 4, 14), marginBottom: keyboardOverlap }]}
        >
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
                maxLength={5000}
              />
            </View>
            {inputText.trim() ? (
              <TouchableOpacity
                style={[styles.roundAction, { backgroundColor: theme.primary, opacity: sending ? 0.72 : 1 }]}
                onPress={sendMessage}
                disabled={sending}
                accessibilityLabel="Send text message"
              >
                {sending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <AppIcon name="paper-plane" size={16} color="#FFFFFF" />}
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
      <ReportModal visible={Boolean(reportingMessage)} targetType="message" targetId={reportingMessage?.id} targetName="message" onClose={result => { setReportingMessage(null); if (result?.submitted) Alert.alert('Report received', 'Thank you. The moderation team will review this message.'); }} />

      <Modal visible={Boolean(selectedMessage)} transparent animationType="fade" onRequestClose={() => setSelectedMessage(null)}>
        <Pressable style={styles.actionBackdrop} onPress={() => setSelectedMessage(null)}>
          <Pressable style={[styles.actionSheet, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => {}}>
            <View style={[styles.actionHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.actionTitle, { color: theme.text }]}>Message options</Text>
            <View style={styles.reactionPicker}>{MESSAGE_REACTIONS.map(emoji => <TouchableOpacity key={emoji} style={[styles.reactionChoice, selectedMessage?.reactions?.some(reaction => reaction.emoji === emoji && reaction.reactedByCurrentUser) && { backgroundColor: theme.primarySoft, borderColor: theme.primary }]} onPress={() => reactToMessage(emoji)} disabled={messageActionPending}><Text style={styles.reactionChoiceText}>{emoji}</Text></TouchableOpacity>)}</View>
            {selectedMessage?.text ? <TouchableOpacity style={styles.actionRow} onPress={copyMessage}><AppIcon name="copy-outline" size={19} color={theme.primary} /><Text style={[styles.actionText, { color: theme.text }]}>Copy message</Text></TouchableOpacity> : null}
            {selectedMessage && String(selectedMessage.senderId) === String(user.id) && selectedMessage.type === 'text' && canModifyMessage(selectedMessage) ? <TouchableOpacity style={styles.actionRow} onPress={beginEditMessage}><AppIcon name="create-outline" size={19} color={theme.primary} /><Text style={[styles.actionText, { color: theme.text }]}>Edit message</Text></TouchableOpacity> : null}
            {selectedMessage ? <TouchableOpacity style={styles.actionRow} onPress={requestDeleteMessage}><AppIcon name="trash" size={19} color={theme.danger} /><Text style={[styles.actionText, { color: theme.danger }]}>Delete message</Text></TouchableOpacity> : null}
            {selectedMessage && String(selectedMessage.senderId) !== String(user.id) ? <TouchableOpacity style={styles.actionRow} onPress={() => { setReportingMessage(selectedMessage); setSelectedMessage(null); }}><AppIcon name="flag" size={19} color={theme.danger} /><Text style={[styles.actionText, { color: theme.danger }]}>Report message</Text></TouchableOpacity> : null}
            <TouchableOpacity style={[styles.actionCancel, { borderColor: theme.border }]} onPress={() => setSelectedMessage(null)}><Text style={[styles.actionCancelText, { color: theme.text }]}>Cancel</Text></TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={Boolean(editingMessage)} transparent animationType="fade" onRequestClose={() => !messageActionPending && setEditingMessage(null)}>
        <Pressable style={styles.editBackdrop} onPress={() => !messageActionPending && setEditingMessage(null)}>
          <Pressable style={[styles.editDialog, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => {}}>
            <Text style={[styles.editTitle, { color: theme.text }]}>Edit message</Text>
            <TextInput autoFocus multiline value={editText} onChangeText={setEditText} maxLength={5000} style={[styles.editInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]} />
            <Text style={[styles.editHint, { color: theme.secondaryText }]}>Messages can be edited for 15 minutes after sending.</Text>
            <View style={styles.editActions}><TouchableOpacity style={[styles.editCancel, { borderColor: theme.border }]} onPress={() => setEditingMessage(null)} disabled={messageActionPending}><Text style={[styles.editCancelText, { color: theme.text }]}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[styles.editSave, { backgroundColor: theme.primary }]} onPress={saveEditedMessage} disabled={!editText.trim() || messageActionPending}>{messageActionPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.editSaveText}>Save</Text>}</TouchableOpacity></View>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardSafeView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 14 },
  conversationHeader: { marginHorizontal: -14, paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  profileHeader: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  profileAvatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10 },
  profileCopy: { flex: 1 },
  profileName: { fontSize: 15, fontWeight: '800' },
  privateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  profileHint: { fontSize: 10.5 },
  messages: { flexGrow: 1, paddingVertical: 16 },
  messagesFooter: { paddingVertical: 14 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end' },
  groupedRow: { marginTop: 1 },
  groupEndRow: { marginTop: 7 },
  myMessage: { justifyContent: 'flex-end' },
  otherMessage: { justifyContent: 'flex-start' },
  messageAvatar: { marginRight: 7, marginBottom: 2 },
  avatarSpacer: { width: 35 },
  bubble: { maxWidth: '80%', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth },
  mineBubble: { borderBottomRightRadius: 6 },
  otherBubble: { borderBottomLeftRadius: 6 },
  mineJoinedTop: { borderTopRightRadius: 7 },
  mineJoinedBottom: { borderBottomRightRadius: 7 },
  otherJoinedTop: { borderTopLeftRadius: 7 },
  otherJoinedBottom: { borderBottomLeftRadius: 7 },
  voiceBubble: { width: 225 },
  messageText: { fontSize: 14, lineHeight: 20 },
  messageMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 5 },
  messageTime: { fontSize: 10 },
  latestButton: { position: 'absolute', right: 15, zIndex: 5, width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4 },
  composerArea: { borderTopWidth: StyleSheet.hairlineWidth, marginHorizontal: -14, paddingHorizontal: 12, paddingTop: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  inputPill: { flex: 1, minHeight: 48, maxHeight: 108, borderWidth: 1, borderRadius: 24, flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 3 },
  input: { flex: 1, minHeight: 45, maxHeight: 107, paddingRight: 14, paddingTop: 12, paddingBottom: 11, fontSize: 14 },
  emojiButton: { width: 40, height: 45, alignItems: 'center', justifyContent: 'center' },
  roundAction: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
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
  reactionSummary: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 7 },
  reactionBadge: { minHeight: 24, borderRadius: 12, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 3 },
  reactionEmoji: { fontSize: 13 },
  reactionCount: { fontSize: 10, fontWeight: '800' },
  actionBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(28,17,24,0.56)' },
  actionSheet: { padding: 20, paddingBottom: 30, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1 },
  actionHandle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 15 },
  actionTitle: { fontSize: 19, fontWeight: '800', marginBottom: 14 },
  reactionPicker: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  reactionChoice: { width: 43, height: 43, borderRadius: 14, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  reactionChoiceText: { fontSize: 23 },
  actionRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 5 },
  actionText: { fontSize: 14, fontWeight: '700' },
  actionCancel: { height: 49, borderWidth: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  actionCancelText: { fontSize: 13, fontWeight: '800' },
  editBackdrop: { flex: 1, backgroundColor: 'rgba(28,17,24,0.56)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  editDialog: { width: '100%', maxWidth: 380, borderWidth: 1, borderRadius: 24, padding: 20 },
  editTitle: { fontSize: 19, fontWeight: '800', marginBottom: 14 },
  editInput: { minHeight: 110, maxHeight: 220, borderWidth: 1, borderRadius: 15, padding: 13, fontSize: 14, textAlignVertical: 'top' },
  editHint: { fontSize: 11, lineHeight: 16, marginTop: 8 },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  editCancel: { flex: 1, height: 49, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  editCancelText: { fontSize: 13, fontWeight: '800' },
  editSave: { flex: 1, height: 49, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  editSaveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
