import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const maritalOptions = [
  ['single', 'Single'], ['married', 'Married'], ['divorced', 'Divorced'], ['widowed', 'Widowed'], ['separated', 'Separated'], ['prefer_not_to_say', 'Prefer not to say'],
];

export default function EditProfileScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();
  const nameParts = (user.name || '').trim().split(/\s+/);
  const [form, setForm] = useState({ first_name: user.firstName || nameParts[0] || '', last_name: user.lastName || nameParts.slice(1).join(' ') || '', phone_number: user.phoneNumber || '', bio: user.bio || '', hobbies: user.hobbies || '', marital_status: user.maritalStatus || '', date_of_birth: user.dateOfBirth || '', workplace: user.workplace || '', occupation: user.occupation || '', is_profile_private: Boolean(user.isProfilePrivate) });
  const [avatar, setAvatar] = useState(null);
  const [saving, setSaving] = useState(false);
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Photo access needed', 'Allow photo access to select a profile picture.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled) setAvatar({ ...result.assets[0], fileName: 'profile.jpg', mimeType: result.assets[0].mimeType || 'image/jpeg' });
  };

  const save = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) return Alert.alert('Name required', 'Enter both your first and last name.');
    setSaving(true);
    try {
      await apiService.updateUserProfileForm({ ...form, first_name: form.first_name.trim(), last_name: form.last_name.trim(), is_profile_private: form.is_profile_private ? 1 : 0 }, avatar);
      await refreshUser();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Profile not saved', error.message || 'Please check your details.');
    } finally { setSaving(false); }
  };

  const Field = ({ label, field, placeholder, multiline = false, keyboardType }) => <View style={styles.field}><Text style={[styles.label, { color: theme.secondaryText }]}>{label}</Text><TextInput value={form[field]} onChangeText={value => update(field, value)} placeholder={placeholder} placeholderTextColor={theme.secondaryText} multiline={multiline} keyboardType={keyboardType} style={[styles.input, multiline && styles.multiline, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]} /></View>;

  return <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <TouchableOpacity style={styles.avatarButton} onPress={pickAvatar} accessibilityLabel="Choose a profile photo">
      <View>
        <Avatar uri={avatar?.uri || user.avatar} size={112} style={[styles.avatar, { backgroundColor: theme.border }]} accessibilityLabel="Profile photo preview" />
        <View style={[styles.cameraBadge, { backgroundColor: theme.primary, borderColor: theme.background }]}><AppIcon name="camera-outline" size={17} color="#FFFFFF" /></View>
      </View>
      <Text style={[styles.changePhoto, { color: theme.primary }]}>{avatar ? 'Photo selected — tap to change' : user.avatar ? 'Change profile photo' : 'Add a profile photo'}</Text>
      <Text style={[styles.photoHelp, { color: theme.secondaryText }]}>Tap here, choose a clear photo, then position it inside the square crop. JPG, PNG or WebP up to 4 MB.</Text>
    </TouchableOpacity>
    <View style={styles.nameFields}><View style={styles.nameField}><Field label="First name" field="first_name" placeholder="First name" /></View><View style={styles.nameField}><Field label="Last name" field="last_name" placeholder="Last name" /></View></View>
    <Field label="Phone number" field="phone_number" placeholder="e.g. +234 801 234 5678" keyboardType="phone-pad" />
    <Field label="Full bio" field="bio" placeholder="Tell people about yourself" multiline />
    <Field label="Hobbies and interests" field="hobbies" placeholder="Reading, music, travelling…" multiline />
    <Text style={[styles.label, { color: theme.secondaryText }]}>Marital status</Text>
    <View style={styles.options}>{maritalOptions.map(([value, label]) => <TouchableOpacity key={value} onPress={() => update('marital_status', value)} style={[styles.option, { borderColor: form.marital_status === value ? theme.primary : theme.border, backgroundColor: form.marital_status === value ? theme.primarySoft : theme.card }]}><Text style={{ color: form.marital_status === value ? theme.primary : theme.text, fontSize: 12, fontWeight: '700' }}>{label}</Text></TouchableOpacity>)}</View>
    <Field label="Date of birth" field="date_of_birth" placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
    <Field label="Occupation" field="occupation" placeholder="What do you do?" />
    <Field label="Place of work" field="workplace" placeholder="Where do you work?" />
    <View style={[styles.privacy, { backgroundColor: theme.card, borderColor: theme.border }]}><View style={styles.privacyCopy}><Text style={[styles.privacyTitle, { color: theme.text }]}>Private profile</Text><Text style={[styles.privacyText, { color: theme.secondaryText }]}>Hide your bio, hobbies, relationship status, birth date and work information from visitors.</Text></View><Switch value={form.is_profile_private} onValueChange={value => update('is_profile_private', value)} trackColor={{ true: theme.primary }} /></View>
    <TouchableOpacity style={[styles.save, { backgroundColor: theme.primary }]} onPress={save} disabled={saving}>{saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Save profile</Text>}</TouchableOpacity>
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 45 }, avatarButton: { alignItems: 'center', marginBottom: 22 }, avatar: { width: 112, height: 112, borderRadius: 56 }, cameraBadge: { position: 'absolute', right: -2, bottom: 1, width: 35, height: 35, borderRadius: 18, borderWidth: 3, alignItems: 'center', justifyContent: 'center' }, changePhoto: { fontSize: 13, fontWeight: '800', marginTop: 10 }, photoHelp: { maxWidth: 320, textAlign: 'center', fontSize: 11, lineHeight: 17, marginTop: 6 }, nameFields: { flexDirection: 'row', gap: 10 }, nameField: { flex: 1 }, field: { marginBottom: 15 }, label: { fontSize: 11, fontWeight: '800', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 }, input: { minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, fontSize: 14 }, multiline: { minHeight: 100, paddingTop: 13, textAlignVertical: 'top' }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 16 }, option: { paddingHorizontal: 11, paddingVertical: 9, borderWidth: 1, borderRadius: 999 }, privacy: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderWidth: 1, borderRadius: 16, marginTop: 4 }, privacyCopy: { flex: 1 }, privacyTitle: { fontSize: 14, fontWeight: '800' }, privacyText: { fontSize: 11, lineHeight: 17, marginTop: 4 }, save: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 20 }, saveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
