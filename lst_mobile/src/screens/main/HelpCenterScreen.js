import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../components/AppIcon';
import { useTheme } from '../../context/ThemeContext';

const faqs = [
  ['How do community applications work?', 'Submit the required answers from a community page. You will become a member after an administrator approves your application.'],
  ['Who can see a private profile?', 'Visitors can see only basic account information. Your bio, communities, birth date, relationship status, hobbies and work details remain hidden.'],
  ['Why is my community post pending?', 'Community posts are reviewed before becoming visible to other members. You can still see your own pending post.'],
  ['How do friend requests work?', 'Open a member profile or community directory and tap Add. Messaging becomes available after the request is accepted.'],
];

export default function HelpCenterScreen({ navigation }) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(null);
  const Row = ({ icon, label, onPress }) => <TouchableOpacity style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={onPress}><AppIcon name={icon} size={18} color={theme.primary} /><Text style={[styles.rowText, { color: theme.text }]}>{label}</Text><AppIcon name="chevron-right" size={14} color={theme.secondaryText} /></TouchableOpacity>;
  return <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
    <Text style={[styles.heading, { color: theme.text }]}>Frequently asked questions</Text>
    {faqs.map(([question, answer], index) => <TouchableOpacity key={question} style={[styles.faq, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setOpen(open === index ? null : index)}><View style={styles.faqHead}><Text style={[styles.question, { color: theme.text }]}>{question}</Text><AppIcon name={open === index ? 'chevron-up' : 'chevron-down'} size={15} color={theme.secondaryText} /></View>{open === index ? <Text style={[styles.answer, { color: theme.secondaryText }]}>{answer}</Text> : null}</TouchableOpacity>)}
    <Text style={[styles.heading, styles.secondHeading, { color: theme.text }]}>Help and legal</Text>
    <Row icon="chatbubble-outline" label="Contact customer support" onPress={() => Linking.openURL('mailto:support@lovestraighttalks.com?subject=LST%20Social%20Support')} />
    <Row icon="alert-circle-outline" label="Report an issue" onPress={() => navigation.navigate('Feedback', { type: 'issue' })} />
    <Row icon="chatbubbles-outline" label="Send feedback" onPress={() => navigation.navigate('Feedback', { type: 'feedback' })} />
    <Row icon="shield-alt" label="Privacy policy" onPress={() => navigation.navigate('Legal', { document: 'privacy' })} />
    <Row icon="file-alt" label="Terms and conditions" onPress={() => navigation.navigate('Legal', { document: 'terms' })} />
  </ScrollView>;
}
const styles = StyleSheet.create({ content: { padding: 16, paddingBottom: 40 }, heading: { fontSize: 19, fontWeight: '800', marginBottom: 12 }, secondHeading: { marginTop: 24 }, faq: { borderWidth: 1, borderRadius: 15, padding: 14, marginBottom: 9 }, faqHead: { flexDirection: 'row', alignItems: 'center', gap: 10 }, question: { flex: 1, fontSize: 13, fontWeight: '700' }, answer: { fontSize: 12, lineHeight: 19, marginTop: 10 }, row: { minHeight: 54, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 11 }, rowText: { flex: 1, fontSize: 13, fontWeight: '700' } });
