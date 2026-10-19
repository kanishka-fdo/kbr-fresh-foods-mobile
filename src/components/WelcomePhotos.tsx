import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Image, StyleSheet, View } from 'react-native';
import { useIsFocused } from 'expo-router/react-navigation';
import { siteImage } from '../lib/site-assets';

const photos = ['/cat_vegetable.png', '/images/fruits.png', '/images/farm.png'];

/** Decorative photos only: keep the welcome actions still while the background crossfades. */
export default function WelcomePhotos() {
  const focused = useIsFocused();
  const [opacity] = useState(() => photos.map((_, index) => new Animated.Value(index === 0 ? 1 : 0)));
  const current = useRef(0);

  useEffect(() => {
    if (!focused) return;
    let disposed = false;
    let active = AppState.currentState === 'active';
    let reduceMotion = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    let transition: Animated.CompositeAnimation | undefined;
    const stop = () => {
      clearInterval(timer);
      transition?.stop();
      opacity.forEach((value, index) => value.setValue(index === current.current ? 1 : 0));
    };
    const sync = () => {
      stop();
      if (disposed || !active || reduceMotion) return;
      timer = setInterval(() => {
        current.current = (current.current + 1) % photos.length;
        transition = Animated.parallel(opacity.map((value, index) => Animated.timing(value, {
          toValue: index === current.current ? 1 : 0, duration: 700, useNativeDriver: true,
        })));
        transition.start();
      }, 5000);
    };
    const appSubscription = AppState.addEventListener('change', state => { active = state === 'active'; sync(); });
    const motionSubscription = AccessibilityInfo.addEventListener('reduceMotionChanged', value => { reduceMotion = value; sync(); });
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (!disposed) { reduceMotion = value; sync(); } }).catch(() => {});
    return () => { disposed = true; stop(); appSubscription.remove(); motionSubscription.remove(); };
  }, [focused, opacity]);

  return <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {photos.map((photo, index) => <Animated.View key={photo} style={[StyleSheet.absoluteFill, { opacity: opacity[index] }]}>
      <Image source={siteImage(photo)} style={{ width: '100%', height: '100%' }} resizeMode="cover" accessible={false} fadeDuration={0} />
    </Animated.View>)}
  </View>;
}
