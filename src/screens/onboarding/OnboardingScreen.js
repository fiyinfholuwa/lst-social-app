import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../../components/AppIcon';
import { useOnboarding } from '../../context/OnboardingContext';
import { COLORS } from '../../styles/colors';

const { width } = Dimensions.get('window');
const VIDEO_URI = 'https://cdn.coverr.co/videos/coverr-a-field-of-wheat-at-sunset-1575/1080p.mp4';

const slides = [
  {
    eyebrow: 'WELCOME TO LST',
    title: 'Faith grows\nin community.',
    body: 'A calm, trusted space to share your walk, find encouragement, and become whole.',
    icon: 'heart-outline',
  },
  {
    eyebrow: 'FIND YOUR PEOPLE',
    title: 'Belong beyond\nthe Sunday service.',
    body: 'Join purposeful circles for singles, couples, recovery, discipleship, and prayer.',
    icon: 'people-outline',
  },
  {
    eyebrow: 'WALK TOGETHER',
    title: 'Real support.\nMeaningful growth.',
    body: 'Share testimonies, ask for prayer, celebrate progress, and stay connected privately.',
    icon: 'sparkles-outline',
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);
  const { completeOnboarding } = useOnboarding();

  const next = () => {
    if (index === slides.length - 1) {
      completeOnboarding();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1 });
  };

  return (
    <View style={styles.container}>
      <Video
        source={{ uri: VIDEO_URI }}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />
      <LinearGradient
        colors={[COLORS.lightOverlay20, COLORS.lightOverlay76, COLORS.offWhite]}
        locations={[0, 0.48, 0.83]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.brandRow}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>L</Text></View>
        <Text style={styles.brand}>LST SOCIAL</Text>
        <TouchableOpacity onPress={completeOnboarding} hitSlop={12}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        horizontal
        pagingEnabled
        data={slides}
        keyExtractor={item => item.title}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={event => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.iconWrap}><Icon name={item.icon} size={24} color={COLORS.navy} /></View>
            <Text style={styles.eyebrow}>{item.eyebrow}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, dotIndex) => (
            <View key={dotIndex} style={[styles.dot, dotIndex === index && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity style={styles.nextButton} onPress={next} activeOpacity={0.85}>
          <Text style={styles.nextText}>{index === slides.length - 1 ? 'Get started' : 'Continue'}</Text>
          <Icon name="arrow-forward" size={19} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.promise}>A safer space for faith, family & fellowship.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  brandRow: { position: 'absolute', top: 58, left: 24, right: 24, zIndex: 2, flexDirection: 'row', alignItems: 'center' },
  brandMark: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  brandMarkText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
  brand: { color: COLORS.navy, letterSpacing: 1.7, fontSize: 13, fontWeight: '800', flex: 1 },
  skip: { color: COLORS.slate, fontSize: 14, fontWeight: '600' },
  slide: { width, paddingHorizontal: 28, justifyContent: 'flex-end', paddingBottom: 225 },
  iconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.white76, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  eyebrow: { color: COLORS.red, fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  title: { color: COLORS.navy, fontSize: 43, lineHeight: 48, fontWeight: '800', letterSpacing: -1.5 },
  body: { color: COLORS.slate, fontSize: 17, lineHeight: 26, marginTop: 17, maxWidth: 345 },
  footer: { position: 'absolute', left: 24, right: 24, bottom: 28 },
  dots: { flexDirection: 'row', marginBottom: 20 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.border, marginRight: 8 },
  dotActive: { width: 26, backgroundColor: COLORS.red },
  nextButton: { height: 58, borderRadius: 18, backgroundColor: COLORS.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  nextText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  promise: { color: COLORS.slate, fontSize: 12, textAlign: 'center', marginTop: 14 },
});
