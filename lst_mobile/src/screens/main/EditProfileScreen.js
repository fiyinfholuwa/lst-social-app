import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import KeyboardSafeView from '../../components/KeyboardSafeView';
import AppToggle from '../../components/AppToggle';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const maritalOptions = [
  ['single', 'Single'], ['married', 'Married'], ['divorced', 'Divorced'], ['widowed', 'Widowed'], ['separated', 'Separated'], ['prefer_not_to_say', 'Prefer not to say'],
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const birthdayParts = value => {
  const match = String(value || '').match(/^\d{4}-(\d{2})-(\d{2})$/);
  return { month: match?.[1] || '', day: match?.[2] || '' };
};

function ProfileField({ label, value, onChangeText, onFocus, placeholder, multiline = false, keyboardType, maxLength, theme }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.secondaryText }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.secondaryText}
        multiline={multiline}
        keyboardType={keyboardType}
        maxLength={maxLength}
        onFocus={onFocus}
        returnKeyType={multiline ? 'default' : 'next'}
        style={[styles.input, multiline && styles.multiline, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
      />
    </View>
  );
}

export default function EditProfileScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();
  const nameParts = (user.name || '').trim().split(/\s+/);
  const [form, setForm] = useState({ first_name: user.firstName || nameParts[0] || '', last_name: user.lastName || nameParts.slice(1).join(' ') || '', phone_number: user.phoneNumber || '', bio: user.bio || '', hobbies: user.hobbies || '', marital_status: user.maritalStatus || '', date_of_birth: user.dateOfBirth || '', workplace: user.workplace || '', occupation: user.occupation || '', is_profile_private: Boolean(user.isProfilePrivate) });
  const initialBirthday = birthdayParts(user.dateOfBirth);
  const [birthDay, setBirthDay] = useState(initialBirthday.day);
  const [birthMonth, setBirthMonth] = useState(initialBirthday.month);
  const [avatar, setAvatar] = useState(null);
  const [saving, setSaving] = useState(false);
  const [birthdayPicker, setBirthdayPicker] = useState(null);
  const scrollViewRef = useRef(null);
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const daysInSelectedMonth = new Date(2000, Number(birthMonth || 1), 0).getDate();

  const chooseMonth = month => {
    const value = String(month).padStart(2, '0');
    setBirthMonth(value);
    const maximumDay = new Date(2000, month, 0).getDate();
    if (Number(birthDay) > maximumDay) setBirthDay('');
    setBirthdayPicker(null);
  };

  const chooseDay = day => {
    setBirthDay(String(day).padStart(2, '0'));
    setBirthdayPicker(null);
  };

  const keepFieldAboveKeyboard = event => {
    const inputHandle = event.nativeEvent.target;
    setTimeout(() => {
      scrollViewRef.current?.scrollResponderScrollNativeHandleToKeyboard(
        inputHandle,
        120,
        true,
      );
    }, Platform.OS === 'android' ? 300 : 100);
  };

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Photo access needed', 'Allow photo access to select a profile picture.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (result.canceled) return;

    try {
      const selected = result.assets[0];
      const processed = await ImageManipulator.manipulateAsync(
        selected.uri,
        [{ resize: { width: 1000, height: 1000 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
      );
      setAvatar({ ...selected, ...processed, fileName: 'profile.jpg', mimeType: 'image/jpeg' });
    } catch (error) {
      Alert.alert('Photo could not be prepared', 'Please choose another photo and try again.');
    }
  };

  const save = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) return Alert.alert('Name required', 'Enter both your first and last name.');
    let dateOfBirth = '';
    if (birthDay || birthMonth) {
      const day = Number(birthDay);
      const month = Number(birthMonth);
      const validDate = Number.isInteger(day) && Number.isInteger(month)
        && month >= 1 && month <= 12
        && day >= 1 && day <= new Date(2000, month, 0).getDate();
      if (!validDate) return Alert.alert('Check birthday', 'Enter a valid day and month. The year is not required.');
      dateOfBirth = `2000-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    setSaving(true);
    try {
      await apiService.updateUserProfileForm({ ...form, date_of_birth: dateOfBirth, first_name: form.first_name.trim(), last_name: form.last_name.trim(), is_profile_private: form.is_profile_private ? 1 : 0 }, avatar);
      await refreshUser();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Profile not saved', error.message || 'Please check your details.');
    } finally { setSaving(false); }
  };

  const field = (label, key, props = {}) => (
    <ProfileField label={label} value={form[key]} onChangeText={value => update(key, value)} onFocus={keepFieldAboveKeyboard} theme={theme} {...props} />
  );

  return <KeyboardSafeView style={{ backgroundColor: theme.background }}>
  <ScrollView
    ref={scrollViewRef}
    style={styles.scrollView}
    contentContainerStyle={styles.content}
    keyboardShouldPersistTaps="handled"
    keyboardDismissMode="on-drag"
    automaticallyAdjustKeyboardInsets
  >
    <TouchableOpacity style={styles.avatarButton} onPress={pickAvatar} accessibilityLabel="Choose a profile photo">
      <View>
        <Avatar uri={avatar?.uri || user.avatar} size={112} style={[styles.avatar, { backgroundColor: theme.border }]} accessibilityLabel="Profile photo preview" />
        <View style={[styles.cameraBadge, { backgroundColor: theme.primary, borderColor: theme.background }]}><AppIcon name="camera-outline" size={17} color="#FFFFFF" /></View>
      </View>
      <Text style={[styles.changePhoto, { color: theme.primary }]}>{avatar ? 'Photo selected — tap to change' : user.avatar ? 'Change profile photo' : 'Add a profile photo'}</Text>
      <Text style={[styles.photoHelp, { color: theme.secondaryText }]}>Tap here, choose a clear photo, then position it inside the square crop. JPG, PNG or WebP up to 4 MB.</Text>
    </TouchableOpacity>
    <View style={styles.nameFields}><View style={styles.nameField}>{field('First name', 'first_name', { placeholder: 'First name' })}</View><View style={styles.nameField}>{field('Last name', 'last_name', { placeholder: 'Last name' })}</View></View>
    {field('Phone number', 'phone_number', { placeholder: 'e.g. +234 801 234 5678', keyboardType: 'phone-pad' })}
    {field('Full bio', 'bio', { placeholder: 'Tell people about yourself', multiline: true })}
    {field('Hobbies and interests', 'hobbies', { placeholder: 'Reading, music, travelling…', multiline: true })}
    <Text style={[styles.label, { color: theme.secondaryText }]}>Marital status</Text>
    <View style={styles.options}>{maritalOptions.map(([value, label]) => <TouchableOpacity key={value} onPress={() => update('marital_status', value)} style={[styles.option, { borderColor: form.marital_status === value ? theme.primary : theme.border, backgroundColor: form.marital_status === value ? theme.primarySoft : theme.card }]}><Text style={{ color: form.marital_status === value ? theme.primary : theme.text, fontSize: 12, fontWeight: '700' }}>{label}</Text></TouchableOpacity>)}</View>
    <View style={styles.birthdaySection}>
      <Text style={[styles.label, { color: theme.secondaryText }]}>Birthday</Text>
      <Text style={[styles.birthdayHelp, { color: theme.secondaryText }]}>Only the day and month are needed.</Text>
      <View style={styles.nameFields}>
        <View style={styles.nameField}>
          <Text style={[styles.label, { color: theme.secondaryText }]}>Month</Text>
          <TouchableOpacity style={[styles.pickerButton, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setBirthdayPicker('month')} accessibilityLabel="Choose birth month"><Text style={[styles.pickerButtonText, { color: birthMonth ? theme.text : theme.secondaryText }]}>{birthMonth ? MONTHS[Number(birthMonth) - 1] : 'Choose month'}</Text><AppIcon name="chevron-down" size={16} color={theme.primary} /></TouchableOpacity>
        </View>
        <View style={styles.nameField}>
          <Text style={[styles.label, { color: theme.secondaryText }]}>Day</Text>
          <TouchableOpacity style={[styles.pickerButton, { backgroundColor: theme.card, borderColor: theme.border, opacity: birthMonth ? 1 : 0.55 }]} onPress={() => birthMonth && setBirthdayPicker('day')} disabled={!birthMonth} accessibilityLabel="Choose birth day"><Text style={[styles.pickerButtonText, { color: birthDay ? theme.text : theme.secondaryText }]}>{birthDay || 'Choose day'}</Text><AppIcon name="chevron-down" size={16} color={theme.primary} /></TouchableOpacity>
        </View>
      </View>
    </View>
    {field('Occupation', 'occupation', { placeholder: 'What do you do?' })}
    {field('Place of work', 'workplace', { placeholder: 'Where do you work?' })}
    <View style={[styles.privacy, { backgroundColor: theme.card, borderColor: theme.border }]}><View style={styles.privacyCopy}><Text style={[styles.privacyTitle, { color: theme.text }]}>Private profile</Text><Text style={[styles.privacyText, { color: theme.secondaryText }]}>Hide your bio, hobbies, relationship status, birth date and work information from visitors.</Text></View><AppToggle value={form.is_profile_private} onChange={value => update('is_profile_private', value)} theme={theme} accessibilityLabel="Private profile" offIcon="people-outline" onIcon="lock" /></View>
    <TouchableOpacity style={[styles.save, { backgroundColor: theme.primary }]} onPress={save} disabled={saving}>{saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Save profile</Text>}</TouchableOpacity>
  </ScrollView>
  <Modal visible={Boolean(birthdayPicker)} transparent animationType="fade" onRequestClose={() => setBirthdayPicker(null)}>
    <Pressable style={styles.pickerBackdrop} onPress={() => setBirthdayPicker(null)}>
      <Pressable style={[styles.pickerSheet, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => {}}>
        <View style={[styles.pickerHandle, { backgroundColor: theme.border }]} />
        <Text style={[styles.pickerTitle, { color: theme.text }]}>{birthdayPicker === 'month' ? 'Choose month' : 'Choose day'}</Text>
        <ScrollView contentContainerStyle={styles.pickerOptions} showsVerticalScrollIndicator={false}>
          {(birthdayPicker === 'month' ? MONTHS : Array.from({ length: daysInSelectedMonth }, (_, index) => String(index + 1))).map((label, index) => {
            const value = birthdayPicker === 'month' ? index + 1 : index + 1;
            const selected = birthdayPicker === 'month' ? Number(birthMonth) === value : Number(birthDay) === value;
            return <TouchableOpacity key={label} style={[styles.pickerOption, { backgroundColor: selected ? theme.primarySoft : theme.background, borderColor: selected ? theme.primary : theme.border }]} onPress={() => birthdayPicker === 'month' ? chooseMonth(value) : chooseDay(value)}><Text style={[styles.pickerOptionText, { color: selected ? theme.primary : theme.text }]}>{label}</Text>{selected ? <AppIcon name="check" size={14} color={theme.primary} /> : null}</TouchableOpacity>;
          })}
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>
  </KeyboardSafeView>;
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 }, content: { padding: 18, paddingBottom: 160 }, avatarButton: { alignItems: 'center', marginBottom: 22 }, avatar: { width: 112, height: 112, borderRadius: 56 }, cameraBadge: { position: 'absolute', right: -2, bottom: 1, width: 35, height: 35, borderRadius: 18, borderWidth: 3, alignItems: 'center', justifyContent: 'center' }, changePhoto: { fontSize: 13, fontWeight: '800', marginTop: 10 }, photoHelp: { maxWidth: 320, textAlign: 'center', fontSize: 11, lineHeight: 17, marginTop: 6 }, nameFields: { flexDirection: 'row', gap: 10 }, nameField: { flex: 1 }, field: { marginBottom: 15 }, label: { fontSize: 11, fontWeight: '800', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 }, input: { minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, fontSize: 14 }, multiline: { minHeight: 100, paddingTop: 13, textAlignVertical: 'top' }, birthdaySection: { marginBottom: 1 }, birthdayHelp: { fontSize: 11, marginTop: -3, marginBottom: 10 }, pickerButton: { minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }, pickerButtonText: { flex: 1, fontSize: 13 }, pickerBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(28,17,24,0.56)' }, pickerSheet: { maxHeight: '72%', padding: 18, paddingBottom: 30, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1 }, pickerHandle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 }, pickerTitle: { fontSize: 19, fontWeight: '800', marginBottom: 14 }, pickerOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 }, pickerOption: { width: '31%', minHeight: 45, paddingHorizontal: 10, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }, pickerOptionText: { fontSize: 12, fontWeight: '700' }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 16 }, option: { paddingHorizontal: 11, paddingVertical: 9, borderWidth: 1, borderRadius: 999 }, privacy: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderWidth: 1, borderRadius: 16, marginTop: 4 }, privacyCopy: { flex: 1 }, privacyTitle: { fontSize: 14, fontWeight: '800' }, privacyText: { fontSize: 11, lineHeight: 17, marginTop: 4 }, save: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 20 }, saveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
