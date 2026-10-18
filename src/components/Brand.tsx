import React from 'react';
import { Image, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import { CormorantGaramond_400Regular, CormorantGaramond_400Regular_Italic } from '@expo-google-fonts/cormorant-garamond';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { ErrorBox, Loading, Screen, colors } from './ui';
import { siteImage } from '../lib/site-assets';
export const editorial = { fontFamily: 'CormorantGaramond_400Regular', fontWeight: '400' as const };
export const editorialItalic = { fontFamily: 'CormorantGaramond_400Regular_Italic', fontWeight: '400' as const };
export function AppFonts({ children }: React.PropsWithChildren) {
  const [loaded, error] = useFonts({ CormorantGaramond_400Regular, CormorantGaramond_400Regular_Italic, Inter_400Regular, Inter_600SemiBold, Inter_700Bold });
  if (error) return <Screen title="Unable to load fonts"><ErrorBox message={error.message} /></Screen>;
  if (!loaded) return <Screen><Loading /></Screen>;
  return children;
}
export function BrandHeader() {
  return <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}><Image source={siteImage('/kbr-logo.png')} style={{ width: 42, height: 42 }} accessibilityLabel="KBR Fresh Foods logo" /><View><Text style={{ fontFamily: 'Inter_700Bold', color: colors.ink, fontSize: 17 }}>KBR Fresh Foods</Text><Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.green, fontSize: 9, letterSpacing: 2 }}>NEGOMBO</Text></View></View>;
}
