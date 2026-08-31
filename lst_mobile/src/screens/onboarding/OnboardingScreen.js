import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../../components/AppIcon';
import BrandLogo from '../../components/BrandLogo';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const slides = [
  {
    eyebrow: 'FAITH & FAMILY',
    title: 'A family that\ngrows together.',
    body: 'Build meaningful relationships, strengthen your home, and walk with people who genuinely care.',
    icon: 'heart-outline',
    video: require('../../../assets/onboarding-love.mp4'),
  },
  {
    eyebrow: 'SPIRITUAL GROWTH',
    title: 'Go deeper in\nyour walk with God.',
    body: 'Find prayer, discipleship, honest encouragement, and practical support for every season of faith.',
    icon: 'leaf-outline',
    video: require('../../../assets/onboarding-growth-ng.m4v'),
  },
  {
    eyebrow: 'LOVE & CONNECTION',
    title: 'Love people.\nLive with purpose.',
    body: 'Share life, celebrate progress, offer support, and form safe connections rooted in genuine love.',
    icon: 'heart',
    video: require('../../../assets/onboarding-love-ng.m4v'),
  },
];

function BackgroundVideo({ source, active }) {
  const player = useVideoPlayer(source, instance => {
    instance.loop = true;
    instance.muted = true;
  });

  useEffect(() => {
    if (active) player.play();
    else player.pause();
  }, [active, player]);

  return <VideoView player={player} style={baseStyles.slideVideo} contentFit="cover" nativeControls={false} />;
}

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);
  const { completeOnboarding } = useOnboarding();
  const { theme } = useTheme();
  const styles = getStyles(theme);

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
        <BrandLogo width={132} style={styles.brandLogo} />
        <TouchableOpacity style={styles.skipButton} onPress={completeOnboarding} hitSlop={12}>
          <Text style={styles.skip}>Skip</Text>
          <Icon name="arrow-right" size={11} color={theme.text} />
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
            <BackgroundVideo source={item.video} active={slideIndex === index} />
            <LinearGradient
              colors={['rgba(0,0,0,0.04)', `${theme.background}99`, theme.background]}
              locations={[0, 0.55, 0.88]}
              style={styles.slideOverlay}
            />
            <View style={styles.slideContent}>
              <View style={styles.iconWrap}><Icon name={item.icon} size={24} color={theme.primary} /></View>
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
          <Icon name="arrow-forward" size={19} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.promise}>A safer space for faith, family & fellowship.</Text>
      </View>
    </View>
  );
}

const baseStyles = StyleSheet.create({
  slideVideo: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
});

const getStyles = theme => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  brandRow: { position: 'absolute', top: 58, left: 24, right: 24, zIndex: 10, elevation: 10, flexDirection: 'row', alignItems: 'center' },
  brandLogo: { marginRight: 'auto' },
  skipButton: { minHeight: 38, paddingHorizontal: 13, borderRadius: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  skip: { color: theme.text, fontSize: 13, fontWeight: '700' },
  slide: { width, flex: 1, backgroundColor: theme.background },
  slideOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  slideContent: { flex: 1, zIndex: 2, paddingHorizontal: 28, justifyContent: 'flex-end', paddingBottom: 225 },
  iconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.primarySoft, borderWidth: 1, borderColor: theme.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  eyebrow: { color: theme.primary, fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 12 },
  title: { color: theme.text, fontSize: 43, lineHeight: 48, fontWeight: '700', letterSpacing: -1.5 },
  body: { color: theme.secondaryText, fontSize: 17, lineHeight: 26, marginTop: 17, maxWidth: 345 },
  footer: { position: 'absolute', left: 24, right: 24, bottom: 28 },
  dots: { flexDirection: 'row', marginBottom: 20 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.border, marginRight: 8 },
  dotActive: { width: 26, backgroundColor: theme.primary },
  nextButton: { height: 58, borderRadius: 18, backgroundColor: theme.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  nextText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  promise: { color: theme.secondaryText, fontSize: 12, textAlign: 'center', marginTop: 14 },
});
