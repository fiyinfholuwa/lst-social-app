import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiService from '../../api/apiService';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';
import Icon from '../../components/AppIcon';
import { resolveMediaUri } from '../../utils/mediaUrl';

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
  const [saving, setSaving] = useState(false);
  const [viewer, setViewer] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(0);

  const load = useCallback(async () => {
    try { setGroups(await apiService.getStatuses()); } catch (error) { Alert.alert('Couldn’t load statuses', error.message || 'Please try again.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const publishText = async () => {
    if (!text.trim() || saving) return;
    setSaving(true);
    try { await apiService.createTextStatus(text.trim()); setText(''); setComposer(false); load(); }
    catch (error) { Alert.alert('Status not posted', error.message || 'Please try again.'); }
    finally { setSaving(false); }
  };
  const publishImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Photo access needed', 'Allow photo access to share an image status.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || saving) return;
    setSaving(true);
    try { const asset = result.assets[0]; await apiService.createImageStatus(asset.uri, asset.fileName || 'status.jpg'); setComposer(false); load(); }
    catch (error) { Alert.alert('Status not posted', error.message || 'Please try again.'); }
    finally { setSaving(false); }
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
      contentContainerStyle={styles.list}
      ListHeaderComponent={<TouchableOpacity style={[styles.create, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setComposer(true)}><View style={[styles.createAvatar, { backgroundColor: theme.primarySoft }]}><Avatar uri={user?.avatar} size={48} /><View style={[styles.plus, { backgroundColor: theme.primary }]}><Icon name="add" size={14} color="#fff" /></View></View><View style={styles.createCopy}><Text style={[styles.createTitle, { color: theme.text }]}>My status</Text><Text style={[styles.createText, { color: theme.secondaryText }]}>Share a text or photo for 24 hours</Text></View><Icon name="chevron-right" size={19} color={theme.primary} /></TouchableOpacity>}
      ListEmptyComponent={!loading ? <Text style={[styles.empty, { color: theme.secondaryText }]}>No friend statuses right now.</Text> : <ActivityIndicator color={theme.primary} />}
      renderItem={({ item }) => <TouchableOpacity style={[styles.friend, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => openGroup(item)}><View style={[styles.ring, { borderColor: item.hasUnseen ? theme.accent : theme.border }]}><Avatar uri={item.user.avatar} size={48} /></View><View style={styles.friendCopy}><Text style={[styles.friendName, { color: theme.text }]}>{item.isMine ? 'My status' : item.user.name}</Text><Text style={[styles.friendMeta, { color: item.hasUnseen ? theme.accent : theme.secondaryText }]}>{item.hasUnseen ? 'New update' : 'Seen'} · {item.statuses.length} update{item.statuses.length === 1 ? '' : 's'}</Text></View><Icon name="chevron-right" size={18} color={theme.secondaryText} /></TouchableOpacity>}
    />
    <Modal visible={composer} transparent animationType="slide" onRequestClose={() => setComposer(false)}><View style={styles.overlay}><View style={[styles.sheet, { backgroundColor: theme.card }]}><Text style={[styles.sheetTitle, { color: theme.text }]}>Add to your status</Text><TextInput value={text} onChangeText={setText} multiline maxLength={2000} placeholder="Write a short update…" placeholderTextColor={theme.secondaryText} style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]} /><TouchableOpacity style={[styles.publish, { backgroundColor: theme.primary }]} onPress={publishText} disabled={!text.trim() || saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.publishText}>Post text status</Text>}</TouchableOpacity><TouchableOpacity style={[styles.photo, { borderColor: theme.border }]} onPress={publishImage} disabled={saving}><Icon name="image-outline" size={19} color={theme.primary} /><Text style={[styles.photoText, { color: theme.text }]}>Choose photo</Text></TouchableOpacity><TouchableOpacity onPress={() => setComposer(false)} style={styles.cancel}><Text style={{ color: theme.secondaryText }}>Cancel</Text></TouchableOpacity></View></View></Modal>
    <Modal visible={Boolean(viewer)} animationType="fade" onRequestClose={() => setViewer(null)}><View style={[styles.viewer, { backgroundColor: '#161218', paddingTop: insets.top + 12 }]}>{status ? <><View style={styles.progress}>{viewer.statuses.map((item, index) => <View key={item.id} style={[styles.progressLine, { backgroundColor: index <= viewerIndex ? '#fff' : 'rgba(255,255,255,.35)' }]} />)}</View><View style={styles.viewerHead}><View style={styles.viewerPerson}><Avatar uri={viewer.user.avatar} size={38} /><View><Text style={styles.viewerName}>{viewer.isMine ? 'My status' : viewer.user.name}</Text><Text style={styles.viewerTime}>{timeLeft(status.expiresAt)}</Text></View></View><TouchableOpacity onPress={() => setViewer(null)}><Icon name="close" size={26} color="#fff" /></TouchableOpacity></View>{status.type === 'image' ? <Image source={{ uri: resolveMediaUri(status.image) }} resizeMode="contain" style={styles.statusImage} /> : <View style={[styles.textStatus, { backgroundColor: theme.primary }]}><Text style={styles.statusText}>{status.text}</Text></View>}<View style={styles.viewerActions}><TouchableOpacity disabled={viewerIndex === 0} onPress={() => setViewerIndex(value => value - 1)}><Text style={[styles.viewerButton, { opacity: viewerIndex === 0 ? .3 : 1 }]}>Previous</Text></TouchableOpacity><TouchableOpacity onPress={() => viewerIndex + 1 < viewer.statuses.length ? setViewerIndex(value => value + 1) : setViewer(null)}><Text style={styles.viewerButton}>{viewerIndex + 1 < viewer.statuses.length ? 'Next' : 'Done'}</Text></TouchableOpacity></View></> : null}</View></Modal>
  </View>;
}

const styles = StyleSheet.create({ container:{flex:1},header:{flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:16,paddingBottom:12},back:{width:40,height:40,borderRadius:14,alignItems:'center',justifyContent:'center'},title:{fontSize:21,fontWeight:'800'},subtitle:{fontSize:11,marginTop:2},list:{padding:14,gap:9},create:{borderWidth:1,borderRadius:18,padding:13,flexDirection:'row',alignItems:'center',gap:12,marginBottom:10},createAvatar:{borderRadius:25},plus:{position:'absolute',right:-2,bottom:-2,width:19,height:19,borderRadius:10,alignItems:'center',justifyContent:'center'},createCopy:{flex:1},createTitle:{fontSize:15,fontWeight:'800'},createText:{fontSize:11,marginTop:3},friend:{borderWidth:1,borderRadius:17,padding:11,flexDirection:'row',alignItems:'center',gap:12},ring:{padding:2,borderWidth:2,borderRadius:28},friendCopy:{flex:1},friendName:{fontSize:14,fontWeight:'800'},friendMeta:{fontSize:11,marginTop:3,fontWeight:'700'},empty:{textAlign:'center',paddingTop:50},overlay:{flex:1,justifyContent:'flex-end',backgroundColor:'rgba(0,0,0,.45)'},sheet:{borderTopLeftRadius:28,borderTopRightRadius:28,padding:20},sheetTitle:{fontSize:19,fontWeight:'800',marginBottom:14},input:{minHeight:120,borderWidth:1,borderRadius:15,padding:12,textAlignVertical:'top'},publish:{height:48,borderRadius:14,alignItems:'center',justifyContent:'center',marginTop:12},publishText:{color:'#fff',fontWeight:'800'},photo:{height:48,borderWidth:1,borderRadius:14,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8,marginTop:9},photoText:{fontWeight:'800'},cancel:{alignItems:'center',paddingTop:18,paddingBottom:4},viewer:{flex:1,paddingHorizontal:14},progress:{flexDirection:'row',gap:4},progressLine:{flex:1,height:3,borderRadius:3},viewerHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:16},viewerPerson:{flexDirection:'row',alignItems:'center',gap:10},viewerName:{color:'#fff',fontWeight:'800'},viewerTime:{color:'rgba(255,255,255,.7)',fontSize:11,marginTop:2},statusImage:{flex:1,width:'100%'},textStatus:{flex:1,borderRadius:22,alignItems:'center',justifyContent:'center',padding:28},statusText:{color:'#fff',fontSize:26,lineHeight:35,fontWeight:'700',textAlign:'center'},viewerActions:{flexDirection:'row',justifyContent:'space-between',paddingVertical:18},viewerButton:{color:'#fff',fontWeight:'800',fontSize:15} });
