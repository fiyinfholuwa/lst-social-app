import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiService from '../../api/apiService';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';
import Icon from '../../components/AppIcon';
import EmojiInput from '../../components/EmojiInput';
import EmojiPicker from '../../components/EmojiPicker';
import { resolveMediaUri } from '../../utils/mediaUrl';

const extraStyles = StyleSheet.create({ sheetHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:14},wordCount:{fontSize:11,fontWeight:'700'},statusInputContainer:{minHeight:120},statusInputOverlay:{padding:12},statusInputOverlayText:{fontSize:14,lineHeight:20},selectedImageWrap:{height:150,marginTop:12,borderRadius:15,overflow:'hidden'},selectedImage:{width:'100%',height:'100%'},removeImage:{position:'absolute',top:8,right:8,width:30,height:30,borderRadius:15,backgroundColor:'rgba(0,0,0,.65)',alignItems:'center',justifyContent:'center'},composerActions:{flexDirection:'row',gap:8,marginTop:12},actionButton:{minHeight:40,borderRadius:12,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:6},actionText:{fontSize:12,fontWeight:'800'},imageStatus:{flex:1,position:'relative'},imageCaption:{position:'absolute',left:16,right:16,bottom:18,borderRadius:14,paddingHorizontal:14,paddingVertical:10,backgroundColor:'rgba(0,0,0,.55)'} });

const timeLeft = expiresAt => {
  const hours = Math.max(0, Math.ceil((new Date(expiresAt) - Date.now()) / 3600000));
  return hours <= 1 ? 'Expires in less than 1 hour' : `Expires in ${hours} hours`;
};

export default function StatusesScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [composer, setComposer] = useState(false);
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const inputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [viewer, setViewer] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(0);

  const load = useCallback(async () => {
    try { setGroups(await apiService.getStatuses()); } catch (error) { Alert.alert('Couldn’t load statuses', error.message || 'Please try again.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const insertEmoji = emoji => {
    const start = Math.min(selection.start ?? text.length, text.length);
    const end = Math.min(Math.max(selection.end ?? start, start), text.length);
    const nextText = `${text.slice(0, start)}${emoji}${text.slice(end)}`;
    setText(nextText);
    const cursor = start + emoji.length;
    setSelection({ start: cursor, end: cursor });
    setShowEmojiPicker(false);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setNativeProps({ selection: { start: cursor, end: cursor } });
    }, 250);
  };

  const resetComposer = () => {
    setText('');
    setSelectedImage(null);
    setShowEmojiPicker(false);
    setComposer(false);
  };

  const publishStatus = async () => {
    if ((!text.trim() && !selectedImage) || saving) return;
    setSaving(true);
    try {
      let imageUri = selectedImage?.uri || null;
      if (imageUri) {
        const largestSide = Math.max(selectedImage.width || 0, selectedImage.height || 0);
        const resize = largestSide > 1400
          ? selectedImage.width >= selectedImage.height ? { width: 1400 } : { height: 1400 }
          : null;
        const optimized = await ImageManipulator.manipulateAsync(imageUri, resize ? [{ resize }] : [], { compress: 0.78, format: ImageManipulator.SaveFormat.JPEG });
        imageUri = optimized.uri;
      }
      await apiService.createStatus(text, imageUri, `status-${Date.now()}.jpg`);
      resetComposer();
      await load();
    }
    catch (error) { Alert.alert('Status not posted', error.message || 'Please try again.'); }
    finally { setSaving(false); }
  };
  const publishImage = async () => {
    if (saving) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Photo access needed', 'Allow photo access to share an image status.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;
    setSelectedImage(result.assets[0]);
  };
  const openGroup = async group => {
    setViewer(group); setViewerIndex(0);
    if (!group.isMine) await Promise.all(group.statuses.map(status => apiService.markStatusViewed(status.id).catch(() => {})));
    setGroups(current => current.map(item => item.user.id === group.user.id ? { ...item, hasUnseen: false } : item));
  };
  const status = viewer?.statuses[viewerIndex];

  return <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + 8 }]}>
    <View style={styles.header}><TouchableOpacity onPress={navigation.goBack} style={[styles.back, { backgroundColor: theme.card }]}><Icon name="chevron-left" size={22} color={theme.text} /></TouchableOpacity><View><Text style={[styles.title, { color: theme.text }]}>Status</Text><Text style={[styles.subtitle, { color: theme.secondaryText }]}>Updates disappear after 24 hours</Text></View></View>
    <FlatList data={groups} keyExtractor={item => String(item.user.id)} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.primary} />}
      contentContainerStyle={[styles.list, { paddingBottom: 92 + insets.bottom }]}
      ListHeaderComponent={<TouchableOpacity style={[styles.create, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setComposer(true)}><View style={[styles.createAvatar, { backgroundColor: theme.primarySoft }]}><Avatar uri={user?.avatar} size={48} /><View style={[styles.plus, { backgroundColor: theme.primary }]}><Icon name="add" size={14} color="#fff" /></View></View><View style={styles.createCopy}><Text style={[styles.createTitle, { color: theme.text }]}>My status</Text><Text style={[styles.createText, { color: theme.secondaryText }]}>Share a text or photo for 24 hours</Text></View><Icon name="chevron-right" size={19} color={theme.primary} /></TouchableOpacity>}
      ListEmptyComponent={!loading ? <Text style={[styles.empty, { color: theme.secondaryText }]}>No friend statuses right now.</Text> : <ActivityIndicator color={theme.primary} />}
      renderItem={({ item }) => <TouchableOpacity style={[styles.friend, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => openGroup(item)}><View style={[styles.ring, { borderColor: item.hasUnseen ? theme.accent : theme.border }]}><Avatar uri={item.user.avatar} size={48} /></View><View style={styles.friendCopy}><Text style={[styles.friendName, { color: theme.text }]}>{item.isMine ? 'My status' : item.user.name}</Text><Text style={[styles.friendMeta, { color: item.hasUnseen ? theme.accent : theme.secondaryText }]}>{item.hasUnseen ? 'New update' : 'Seen'} · {item.statuses.length} update{item.statuses.length === 1 ? '' : 's'}</Text></View><Icon name="chevron-right" size={18} color={theme.secondaryText} /></TouchableOpacity>}
    />
    <TouchableOpacity
      style={[{ position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 }, { backgroundColor: theme.primary, bottom: insets.bottom + 22 }]}
      onPress={() => setComposer(true)}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel="Add status"
    >
      <Icon name="add" size={25} color="#FFFFFF" />
    </TouchableOpacity>
    <Modal visible={composer} transparent animationType="slide" onRequestClose={() => setComposer(false)}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.sheet, { backgroundColor: theme.card }]}>
          <View style={extraStyles.sheetHeader}><Text style={[styles.sheetTitle, { color: theme.text }]}>{saving ? 'Uploading status…' : 'Add to your status'}</Text><Text style={[extraStyles.wordCount, { color: wordCount > 250 ? theme.danger : theme.secondaryText }]}>{wordCount} words · {text.length}/2000</Text></View>
          <EmojiInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            onSelectionChange={({ nativeEvent }) => setSelection(nativeEvent.selection)}
            multiline
            maxLength={2000}
            placeholder="Write a short update…"
            placeholderTextColor={theme.secondaryText}
            textColor={theme.text}
            inputStyle={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
            containerStyle={extraStyles.statusInputContainer}
            overlayStyle={extraStyles.statusInputOverlay}
            overlayTextStyle={extraStyles.statusInputOverlayText}
            editable={!saving}
          />
          {selectedImage ? <View style={extraStyles.selectedImageWrap}><Image source={{ uri: selectedImage.uri }} style={extraStyles.selectedImage} /><TouchableOpacity style={extraStyles.removeImage} onPress={() => setSelectedImage(null)} disabled={saving}><Icon name="close" size={15} color="#FFFFFF" /></TouchableOpacity></View> : null}
          {showEmojiPicker ? <EmojiPicker theme={theme} onSelect={insertEmoji} onClose={() => setShowEmojiPicker(false)} /> : null}
          <View style={extraStyles.composerActions}><TouchableOpacity style={[extraStyles.actionButton, { backgroundColor: theme.primarySoft }]} onPress={() => setShowEmojiPicker(value => !value)} disabled={saving}><Icon name="happy" size={18} color={theme.primary} /><Text style={[extraStyles.actionText, { color: theme.primary }]}>Add emoji</Text></TouchableOpacity><TouchableOpacity style={[extraStyles.actionButton, { backgroundColor: theme.primarySoft }]} onPress={publishImage} disabled={saving}><Icon name="image-outline" size={18} color={theme.primary} /><Text style={[extraStyles.actionText, { color: theme.primary }]}>{selectedImage ? 'Change image' : 'Add image'}</Text></TouchableOpacity></View>
          <TouchableOpacity style={[styles.publish, { backgroundColor: theme.primary, opacity: text.trim() || selectedImage ? 1 : 0.5 }]} onPress={publishStatus} disabled={(!text.trim() && !selectedImage) || saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.publishText}>Post status</Text>}</TouchableOpacity>
          <TouchableOpacity onPress={resetComposer} style={styles.cancel} disabled={saving}><Text style={{ color: theme.secondaryText }}>Cancel</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    <Modal visible={Boolean(viewer)} animationType="fade" onRequestClose={() => setViewer(null)}><View style={[styles.viewer, { backgroundColor: '#161218', paddingTop: insets.top + 12 }]}>{status ? <><View style={styles.progress}>{viewer.statuses.map((item, index) => <View key={item.id} style={[styles.progressLine, { backgroundColor: index <= viewerIndex ? '#fff' : 'rgba(255,255,255,.35)' }]} />)}</View><View style={styles.viewerHead}><View style={styles.viewerPerson}><Avatar uri={viewer.user.avatar} size={38} /><View><Text style={styles.viewerName}>{viewer.isMine ? 'My status' : viewer.user.name}</Text><Text style={styles.viewerTime}>{timeLeft(status.expiresAt)}</Text></View></View><TouchableOpacity onPress={() => setViewer(null)}><Icon name="close" size={26} color="#fff" /></TouchableOpacity></View>{status.type === 'image' ? <View style={extraStyles.imageStatus}><Image source={{ uri: resolveMediaUri(status.image) }} resizeMode="contain" style={styles.statusImage} />{status.text ? <View style={extraStyles.imageCaption}><Text style={styles.statusText}>{status.text}</Text></View> : null}</View> : <View style={[styles.textStatus, { backgroundColor: theme.primary }]}><Text style={styles.statusText}>{status.text}</Text></View>}<View style={styles.viewerActions}><TouchableOpacity disabled={viewerIndex === 0} onPress={() => setViewerIndex(value => value - 1)}><Text style={[styles.viewerButton, { opacity: viewerIndex === 0 ? .3 : 1 }]}>Previous</Text></TouchableOpacity><TouchableOpacity onPress={() => viewerIndex + 1 < viewer.statuses.length ? setViewerIndex(value => value + 1) : setViewer(null)}><Text style={styles.viewerButton}>{viewerIndex + 1 < viewer.statuses.length ? 'Next' : 'Done'}</Text></TouchableOpacity></View></> : null}</View></Modal>
  </View>;
}

const styles = StyleSheet.create({ container:{flex:1},header:{flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:16,paddingBottom:12},back:{width:40,height:40,borderRadius:14,alignItems:'center',justifyContent:'center'},title:{fontSize:21,fontWeight:'800'},subtitle:{fontSize:11,marginTop:2},list:{padding:14,gap:9},create:{borderWidth:1,borderRadius:18,padding:13,flexDirection:'row',alignItems:'center',gap:12,marginBottom:10},createAvatar:{borderRadius:25},plus:{position:'absolute',right:-2,bottom:-2,width:19,height:19,borderRadius:10,alignItems:'center',justifyContent:'center'},createCopy:{flex:1},createTitle:{fontSize:15,fontWeight:'800'},createText:{fontSize:11,marginTop:3},friend:{borderWidth:1,borderRadius:17,padding:11,flexDirection:'row',alignItems:'center',gap:12},ring:{padding:2,borderWidth:2,borderRadius:28},friendCopy:{flex:1},friendName:{fontSize:14,fontWeight:'800'},friendMeta:{fontSize:11,marginTop:3,fontWeight:'700'},empty:{textAlign:'center',paddingTop:50},overlay:{flex:1,justifyContent:'flex-end',backgroundColor:'rgba(0,0,0,.45)'},sheet:{borderTopLeftRadius:28,borderTopRightRadius:28,padding:20},sheetTitle:{fontSize:19,fontWeight:'800',marginBottom:14},input:{minHeight:120,borderWidth:1,borderRadius:15,padding:12,textAlignVertical:'top'},publish:{height:48,borderRadius:14,alignItems:'center',justifyContent:'center',marginTop:12},publishText:{color:'#fff',fontWeight:'800'},photo:{height:48,borderWidth:1,borderRadius:14,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8,marginTop:9},photoText:{fontWeight:'800'},cancel:{alignItems:'center',paddingTop:18,paddingBottom:4},viewer:{flex:1,paddingHorizontal:14},progress:{flexDirection:'row',gap:4},progressLine:{flex:1,height:3,borderRadius:3},viewerHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:16},viewerPerson:{flexDirection:'row',alignItems:'center',gap:10},viewerName:{color:'#fff',fontWeight:'800'},viewerTime:{color:'rgba(255,255,255,.7)',fontSize:11,marginTop:2},statusImage:{flex:1,width:'100%'},textStatus:{flex:1,borderRadius:22,alignItems:'center',justifyContent:'center',padding:28},statusText:{color:'#fff',fontSize:26,lineHeight:35,fontWeight:'700',textAlign:'center'},viewerActions:{flexDirection:'row',justifyContent:'space-between',paddingVertical:18},viewerButton:{color:'#fff',fontWeight:'800',fontSize:15} });
