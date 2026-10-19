import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { colors, font } from './ui';
export default function Avatar({ name, uri, size = 56 }: { name: string; uri?: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'K';
  if (uri && !failed) return <Image source={{ uri }} onError={() => setFailed(true)} accessibilityLabel={name} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.lime }} />;
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.white, fontFamily: font.bold, fontSize: size * 0.36 }}>{initials}</Text></View>;
}
