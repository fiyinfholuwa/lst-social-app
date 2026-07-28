import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Loader from '../../components/Loader';
import QuickMaritalReadingGate from '../../components/QuickMaritalReadingGate';
import { useCommunityApplications } from '../../context/CommunityApplicationsContext';
import { useTheme } from '../../context/ThemeContext';
import { getCommunityRequirement } from '../../data/communityRequirements';

export default function CommunityApplicationScreen({ route, navigation }) {
  const { communityId } = route.params;
  const { theme } = useTheme();
  const { submitApplication } = useCommunityApplications();
  const [community, setCommunity] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const [abstinenceBand, setAbstinenceBand] = useState(null);
  const [supportArea, setSupportArea] = useState(null);
  const [struggleDuration, setStruggleDuration] = useState(null);
  const [supportType, setSupportType] = useState(null);
  const [readingComplete, setReadingComplete] = useState(false);
  const [motivation, setMotivation] = useState('');
  const [agreements, setAgreements] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const requirement = getCommunityRequirement(communityId);

  useEffect(() => {
    apiService.getCommunity(communityId).then(setCommunity);
  }, [communityId]);

  if (!community || !requirement) return <Loader />;

  if (communityId === 'comm4' && !readingComplete) {
    return <QuickMaritalReadingGate theme={theme} onComplete={() => setReadingComplete(true)} />;
  }

  const toggleAgreement = index => {
    setAgreements(current => current.includes(index)
      ? current.filter(item => item !== index)
      : [...current, index]);
  };

  const submit = async () => {
    if (communityId === 'comm4' && !readingComplete) {
      Alert.alert('Complete the required reading', 'Pass all three article quizzes before submitting your application.');
      return;
    }
    if (requirement.paths && !selectedPath) {
      Alert.alert('Choose the option that describes you', 'This helps the reviewers assess the correct prerequisite.');
      return;
    }
    if (selectedPath === 'puritan' && !abstinenceBand) {
      Alert.alert('Select an abstinence period', 'Choose the range that most accurately reflects your current journey.');
      return;
    }
    if (requirement.supportAreas && !supportArea) {
      Alert.alert('Select an area', 'Choose the option that best describes your situation.');
      return;
    }
    if (requirement.struggleDurations && !struggleDuration) {
      Alert.alert('Select a duration', 'Choose the option that best describes your journey.');
      return;
    }
    if (requirement.supportTypes && !supportType) {
      Alert.alert('Select support', 'Choose the type of support you need.');
      return;
    }
    const motivationMinimum = requirement.motivationMinimum || 20;
    if (motivation.trim().length < motivationMinimum) {
      Alert.alert('Tell us a little more', `Please write at least ${motivationMinimum} characters.`);
      return;
    }
    if (agreements.length !== requirement.commitments.length) {
      Alert.alert('Confirm every commitment', 'All community commitments must be accepted before applying.');
      return;
    }

    setSubmitting(true);
    await submitApplication(communityId, {
      applicantPath: selectedPath,
      abstinenceBand: selectedPath === 'puritan' ? abstinenceBand : null,
      supportArea,
      struggleDuration,
      supportType,
      motivation: motivation.trim(),
      commitmentsAccepted: true,
    });
    setSubmitting(false);
    Alert.alert('Application submitted', `${community.admin} and the review team will assess your application.`, [
      { text: 'Done', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={[styles.eyebrow, { color: theme.primary }]}>MEMBERSHIP APPLICATION</Text>
      <Text style={[styles.title, { color: theme.text }]}>{requirement.title}</Text>
      <Text style={[styles.intro, { color: theme.secondaryText }]}>
        {requirement.intro || `${community.name} is a moderated community. Membership is reviewed to keep the space focused and safe.`}
      </Text>

      <View style={[styles.reviewNote, { backgroundColor: theme.primarySoft }]}>
        <AppIcon name="clock" size={15} color={theme.primary} />
        <Text style={[styles.reviewText, { color: theme.primary }]}>{requirement.reviewTime}</Text>
      </View>

      {requirement.paths ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Which description fits your journey?</Text>
          <Text style={[styles.helper, { color: theme.secondaryText }]}>Choose the most honest answer. This is used only during review.</Text>
          {requirement.paths.map(path => {
            const selected = selectedPath === path.id;
            return (
              <TouchableOpacity
                key={path.id}
                style={[styles.option, { backgroundColor: theme.card, borderColor: selected ? theme.primary : theme.border }]}
                onPress={() => {
                  setSelectedPath(path.id);
                  if (path.id !== 'puritan') setAbstinenceBand(null);
                }}
              >
                <View style={[styles.radio, { borderColor: selected ? theme.primary : theme.border }]}>
                  {selected ? <View style={[styles.radioInner, { backgroundColor: theme.primary }]} /> : null}
                </View>
                <View style={styles.optionCopy}>
                  <Text style={[styles.optionTitle, { color: theme.text }]}>{path.label}</Text>
                  <Text style={[styles.optionText, { color: theme.secondaryText }]}>{path.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {selectedPath === 'puritan' ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>How long have you deliberately abstained?</Text>
          <Text style={[styles.helper, { color: theme.secondaryText }]}>Select your current continuous period of abstinence.</Text>
          <View style={styles.bands}>
            {requirement.abstinenceBands.map(band => {
              const selected = band === abstinenceBand;
              return (
                <TouchableOpacity
                  key={band}
                  onPress={() => setAbstinenceBand(band)}
                  style={[styles.band, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primarySoft : theme.card }]}
                >
                  <Text style={[styles.bandText, { color: selected ? theme.primary : theme.secondaryText }]}>{band}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {abstinenceBand === '0–2 years' ? (
            <Text style={[styles.eligibilityNote, { color: theme.secondaryText }]}>
              This category may require further conversation because established Sexual Puritan status generally reflects at least two years of deliberate abstinence.
            </Text>
          ) : null}
        </View>
      ) : null}

      {requirement.supportAreas ? (
        <SelectionChips
          title={requirement.supportAreasLabel || 'What do you need support with?'}
          options={requirement.supportAreas}
          selected={supportArea}
          onSelect={setSupportArea}
          theme={theme}
          styles={styles}
        />
      ) : null}

      {requirement.struggleDurations ? (
        <SelectionChips
          title={requirement.struggleDurationsLabel || 'How long have you struggled?'}
          options={requirement.struggleDurations}
          selected={struggleDuration}
          onSelect={setStruggleDuration}
          theme={theme}
          styles={styles}
        />
      ) : null}

      {requirement.supportTypes ? (
        <SelectionChips
          title={requirement.supportTypesLabel || 'What support do you need?'}
          options={requirement.supportTypes}
          selected={supportType}
          onSelect={setSupportType}
          theme={theme}
          styles={styles}
        />
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {requirement.motivationLabel || 'Why would you like to join?'}
        </Text>
        <TextInput
          value={motivation}
          onChangeText={setMotivation}
          multiline
          maxLength={600}
          placeholder={requirement.motivationPlaceholder || 'Share your reason and what you hope to grow in...'}
          placeholderTextColor={theme.secondaryText}
          style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
        />
        <Text style={[styles.characterCount, { color: theme.secondaryText }]}>{motivation.length}/600</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Community commitments</Text>
        {requirement.commitments.map((commitment, index) => {
          const checked = agreements.includes(index);
          return (
            <TouchableOpacity key={commitment} style={styles.commitment} onPress={() => toggleAgreement(index)}>
              <View style={[styles.checkbox, { borderColor: checked ? theme.primary : theme.border, backgroundColor: checked ? theme.primary : theme.card }]}>
                {checked ? <AppIcon name="check" size={10} color="#FFFFFF" /> : null}
              </View>
              <Text style={[styles.commitmentText, { color: theme.text }]}>{commitment}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {requirement.sharedCommunityNote ? (
        <View style={[styles.sharedNote, { borderColor: theme.border }]}>
          <AppIcon name="users" size={16} color={theme.primary} />
          <Text style={[styles.sharedText, { color: theme.secondaryText }]}>{requirement.sharedCommunityNote}</Text>
        </View>
      ) : null}

      <View style={styles.privacy}>
        <AppIcon name="lock" size={13} color={theme.secondaryText} />
        <Text style={[styles.privacyText, { color: theme.secondaryText }]}>
          {requirement.privacyNote || 'Your answers are private and visible only to authorised community reviewers.'}
        </Text>
      </View>

      <TouchableOpacity style={[styles.submit, { backgroundColor: theme.primary }]} onPress={submit} disabled={submitting}>
        <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit for review'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SelectionChips({ title, options, selected, onSelect, theme, styles }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <View style={[styles.bands, styles.selectionOptions]}>
        {options.map(option => {
          const isSelected = selected === option;
          return (
            <TouchableOpacity
              key={option}
              onPress={() => onSelect(option)}
              style={[
                styles.band,
                {
                  borderColor: isSelected ? theme.primary : theme.border,
                  backgroundColor: isSelected ? theme.primarySoft : theme.card,
                },
              ]}
            >
              <Text style={[styles.bandText, { color: isSelected ? theme.primary : theme.secondaryText }]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', marginTop: 8 },
  intro: { fontSize: 13, lineHeight: 20, marginTop: 8 },
  reviewNote: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 13, marginTop: 16 },
  reviewText: { flex: 1, fontSize: 11, fontWeight: '700' },
  section: { marginTop: 25 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  helper: { fontSize: 11, lineHeight: 17, marginTop: 4, marginBottom: 10 },
  option: { flexDirection: 'row', alignItems: 'flex-start', padding: 13, borderWidth: 1, borderRadius: 15, marginTop: 9 },
  radio: { width: 19, height: 19, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 1, marginRight: 11 },
  radioInner: { width: 9, height: 9, borderRadius: 5 },
  optionCopy: { flex: 1 },
  optionTitle: { fontSize: 13, fontWeight: '700' },
  optionText: { fontSize: 11, lineHeight: 17, marginTop: 4 },
  bands: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectionOptions: { marginTop: 10 },
  band: { paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderRadius: 999 },
  bandText: { fontSize: 11, fontWeight: '700' },
  eligibilityNote: { fontSize: 11, lineHeight: 17, marginTop: 10 },
  input: { minHeight: 120, borderWidth: 1, borderRadius: 15, padding: 13, fontSize: 13, lineHeight: 20, textAlignVertical: 'top', marginTop: 10 },
  characterCount: { fontSize: 11, textAlign: 'right', marginTop: 5 },
  commitment: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 13 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  commitmentText: { flex: 1, fontSize: 12, lineHeight: 18 },
  sharedNote: { flexDirection: 'row', gap: 10, padding: 14, borderWidth: 1, borderRadius: 14, marginTop: 24 },
  sharedText: { flex: 1, fontSize: 11, lineHeight: 17 },
  privacy: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 18, paddingHorizontal: 4 },
  privacyText: { flex: 1, fontSize: 11, lineHeight: 17 },
  submit: { height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
