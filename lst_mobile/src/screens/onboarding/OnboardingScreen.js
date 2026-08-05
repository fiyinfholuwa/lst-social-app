import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../../components/AppIcon';
import { useOnboarding } from '../../context/OnboardingContext';
import { COLORS } from '../../styles/colors';

const { width } = Dimensions.get('window');
const slides = [
  {
    eyebrow: 'FAITH & FAMILY',
    title: 'A family that\ngrows together.',
    body: 'Build meaningful relationships, strengthen your home, and walk with people who genuinely care.',
    icon: 'heart-outline',
    video: require('../../../assets/onboarding-family.mp4'),
  },
  {
    eyebrow: 'SPIRITUAL GROWTH',
    title: 'Go deeper in\nyour walk with God.',
    body: 'Find prayer, discipleship, honest encouragement, and practical support for every season of faith.',
    icon: 'leaf-outline',
    video: require('../../../assets/onboarding-growth.mp4'),
  },
  {
    eyebrow: 'LOVE & CONNECTION',
    title: 'Love people.\nLive with purpose.',
    body: 'Share life, celebrate progress, offer support, and form safe connections rooted in genuine love.',
    icon: 'heart',
    video: require('../../../assets/onboarding-love.mp4'),
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);
  const { completeOnboarding } = useOnboarding();

  useEffect(() => {
    if (index >= slides.length - 1) return undefined;
    const timer = setTimeout(() => {
      const nextIndex = index + 1;
      setIndex(nextIndex);
      listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 6500);
    return () => clearTimeout(timer);
  }, [index]);

  const next = () => {
    if (index === slides.length - 1) {
      completeOnboarding();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1 });
  };

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>L</Text></View>
        <Text style={styles.brand}>LST SOCIAL</Text>
        <TouchableOpacity style={styles.skipButton} onPress={completeOnboarding} hitSlop={12}>
          <Text style={styles.skip}>Skip</Text>
          <Icon name="arrow-right" size={11} color={COLORS.navy} />
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
        renderItem={({ item, index: slideIndex }) => (
          <View style={styles.slide}>
            <Video
              source={item.video}
              style={styles.slideVideo}
              resizeMode={ResizeMode.COVER}
              shouldPlay={slideIndex === index}
              isLooping
              isMuted
              useNativeControls={false}
            />
            <LinearGradient
              colors={['rgba(247,248,251,0.04)', 'rgba(247,248,251,0.52)', COLORS.offWhite]}
              locations={[0, 0.55, 0.88]}
              style={styles.slideOverlay}
            />
            <View style={styles.slideContent}>
              <View style={styles.iconWrap}><Icon name={item.icon} size={24} color={COLORS.navy} /></View>
              <Text style={styles.eyebrow}>{item.eyebrow}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
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
  brandRow: { position: 'absolute', top: 58, left: 24, right: 24, zIndex: 10, elevation: 10, flexDirection: 'row', alignItems: 'center' },
  brandMark: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  brandMarkText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  brand: { color: COLORS.navy, letterSpacing: 1.7, fontSize: 13, fontWeight: '700', flex: 1 },
  skipButton: { minHeight: 38, paddingHorizontal: 13, borderRadius: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: COLORS.white90, borderWidth: 1, borderColor: COLORS.border },
  skip: { color: COLORS.navy, fontSize: 13, fontWeight: '700' },
  slide: { width, flex: 1, backgroundColor: COLORS.offWhite },
  slideVideo: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  slideOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  slideContent: { flex: 1, zIndex: 2, paddingHorizontal: 28, justifyContent: 'flex-end', paddingBottom: 225 },
  iconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.white76, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  eyebrow: { color: COLORS.red, fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 12 },
  title: { color: COLORS.navy, fontSize: 43, lineHeight: 48, fontWeight: '700', letterSpacing: -1.5 },
  body: { color: COLORS.slate, fontSize: 17, lineHeight: 26, marginTop: 17, maxWidth: 345 },
  footer: { position: 'absolute', left: 24, right: 24, bottom: 28 },
  dots: { flexDirection: 'row', marginBottom: 20 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.border, marginRight: 8 },
  dotActive: { width: 26, backgroundColor: COLORS.red },
  nextButton: { height: 58, borderRadius: 18, backgroundColor: COLORS.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  nextText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  promise: { color: COLORS.slate, fontSize: 12, textAlign: 'center', marginTop: 14 },
});
