import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import AppIcon from '../../components/AppIcon';
import ScreenHeader from '../../components/ScreenHeader';
import { useTheme } from '../../context/ThemeContext';

const resources = [
  { title: 'Sermons', description: 'Watch and listen to messages that meet you where you are.', icon: 'play-circle-outline', available: true },
  { title: 'Audio', description: 'Short teachings, conversations, and faith-filled encouragement.', icon: 'headset-outline' },
  { title: 'Live sessions', description: 'Join live gatherings, prayer, and community conversations.', icon: 'radio-outline' },
  { title: 'Learnings', description: 'Grow at your own pace with practical guided lessons.', icon: 'school-outline' },
];

export default function ResourcesScreen({ navigation }) {
  const { theme } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScreenHeader eyebrow="WATCH, LISTEN AND GROW" title="Resources" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.intro, { backgroundColor: theme.primarySoft }]}>
          <View style={[styles.introIcon, { backgroundColor: theme.primary }]}><AppIcon name="sparkles-outline" size={20} color="#FFFFFF" /></View>
          <View style={styles.introCopy}><Text style={[styles.introTitle, { color: theme.text }]}>Find what helps you grow</Text><Text style={[styles.introText, { color: theme.secondaryText }]}>Messages and learning experiences for every stage of your journey.</Text></View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>EXPLORE</Text>
        {resources.map(resource => (
          <TouchableOpacity
            key={resource.title}
            activeOpacity={resource.available ? 0.76 : 1}
            disabled={!resource.available}
            onPress={() => navigation.navigate('SermonLibrary')}
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, !resource.available && styles.comingSoonCard]}
            accessibilityLabel={resource.available ? 'Browse sermons' : `${resource.title} coming soon`}
          >
            <View style={[styles.cardIcon, { backgroundColor: resource.available ? theme.primarySoft : theme.background }]}><AppIcon name={resource.icon} size={22} color={resource.available ? theme.primary : theme.secondaryText} /></View>
            <View style={styles.cardCopy}><View style={styles.cardTitleRow}><Text style={[styles.cardTitle, { color: theme.text }]}>{resource.title}</Text>{!resource.available ? <View style={[styles.comingSoon, { backgroundColor: theme.primarySoft }]}><Text style={[styles.comingSoonText, { color: theme.primary }]}>COMING SOON</Text></View> : null}</View><Text style={[styles.cardText, { color: theme.secondaryText }]}>{resource.description}</Text></View>
            {resource.available ? <View style={[styles.arrow, { backgroundColor: theme.primarySoft }]}><AppIcon name="chevron-right" size={15} color={theme.primary} /></View> : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { paddingHorizontal: 14, paddingTop: 4 }, intro: { borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }, introIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, introCopy: { flex: 1 }, introTitle: { fontSize: 15, fontWeight: '900' }, introText: { fontSize: 11.5, lineHeight: 17, marginTop: 3 }, sectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 9 }, card: { minHeight: 91, borderRadius: 19, borderWidth: 1, padding: 13, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }, comingSoonCard: { opacity: 0.76 }, cardIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, cardCopy: { flex: 1, minWidth: 0 }, cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, cardTitle: { fontSize: 14.5, fontWeight: '900' }, cardText: { fontSize: 11, lineHeight: 16, marginTop: 4 }, comingSoon: { borderRadius: 9, paddingHorizontal: 6, paddingVertical: 3 }, comingSoonText: { fontSize: 7.5, fontWeight: '900', letterSpacing: 0.5 }, arrow: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
