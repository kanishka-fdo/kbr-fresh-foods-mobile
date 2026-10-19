import React from 'react';
import { Image, ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useIsFocused } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Button, Loading, colors, font } from '../components/ui';
import { editorial } from '../components/Brand';
import { useAuth } from '../context/AuthContext';
import { siteImage } from '../lib/site-assets';
import WelcomePhotos from '../components/WelcomePhotos';

const local = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.forest },
  content: { flexGrow: 1, width: '100%', maxWidth: 560, alignSelf: 'center', justifyContent: 'space-between', gap: 120, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.cream },
  wordmark: { ...editorial, color: colors.white, fontSize: 27, lineHeight: 31 },
  location: { color: '#a9e3be', fontFamily: font.semibold, fontSize: 11, lineHeight: 16, letterSpacing: 2 },
  intro: { gap: 16 },
  title: { fontFamily: font.bold, color: colors.white, fontSize: 34, lineHeight: 40, letterSpacing: -0.8 },
  accent: { color: '#a9e3be' },
  description: { fontFamily: font.regular, color: '#edf8f1', fontSize: 15, lineHeight: 23, maxWidth: 400 },
  accentLine: { width: 32, height: 4, borderRadius: 2, backgroundColor: colors.green },
  actions: { gap: 12, paddingTop: 8 },
  button: { minHeight: 54, borderRadius: 999, paddingVertical: 14 },
});

export default function WelcomeScreen() {
  const auth = useAuth();
  const focused = useIsFocused();
  if (auth.loading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}><Loading label="Loading your account…" /></SafeAreaView>;
  if (auth.user) return <Redirect href="/" />;

  return <ImageBackground source={siteImage('/cat_vegetable.png')} style={local.screen} resizeMode="cover">
    <WelcomePhotos />
    {focused && <StatusBar style="light" animated />}
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none" accessible={false}>
      <Defs>
        <LinearGradient id="welcome-shade" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.forest} stopOpacity={0.45} />
          <Stop offset="35%" stopColor={colors.forest} stopOpacity={0.2} />
          <Stop offset="62%" stopColor={colors.forest} stopOpacity={0.82} />
          <Stop offset="100%" stopColor={colors.forest} stopOpacity={0.98} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#welcome-shade)" />
    </Svg>
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={local.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={local.brand}>
          <Image source={siteImage('/kbr-logo.png')} accessibilityLabel="KBR Fresh Foods logo" style={local.logo} />
          <View style={{ flex: 1, gap: 2 }}><Text style={local.wordmark}>KBR Fresh Foods</Text><Text style={local.location}>NEGOMBO · SRI LANKA</Text></View>
        </View>
        <View style={local.intro}>
          <Text accessibilityRole="header" style={local.title}><Text style={local.accent}>Fresh food.</Text>{'\n'}A fresh start.</Text>
          <Text style={local.description}>Farm-fresh produce from local growers, delivered to your door. Sign up or log in to find your everyday favourites.</Text>
          <View style={local.accentLine} />
          <View style={local.actions}>
            <Button title="Sign up" style={[local.button, { backgroundColor: colors.green }]} onPress={() => router.push('/register')} />
            <Button secondary title="Log in" style={[local.button, { backgroundColor: colors.white }]} onPress={() => router.push('/login')} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  </ImageBackground>;
}
