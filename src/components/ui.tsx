import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { readable } from '../lib/domain.mjs';

export const colors = { green: '#176f3c', ink: '#143123', muted: '#607469', cream: '#faf7f2', border: '#e5e7eb', red: '#aa3030', lime: '#edf8f1', gold: '#b8956a', forest: '#0d1f0d' };
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream }, content: { padding: 20, gap: 16, paddingBottom: 40, width: '100%', maxWidth: 780, alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.8 }, subtitle: { fontFamily: 'Inter_700Bold', fontSize: 17, fontWeight: '700', color: colors.ink },
  text: { fontFamily: 'Inter_400Regular', color: colors.ink, fontSize: 15, lineHeight: 23 }, muted: { fontFamily: 'Inter_400Regular', color: colors.muted, fontSize: 14, lineHeight: 21 },
  card: { padding: 18, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, gap: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: colors.ink, minHeight: 48, fontSize: 16 },
  button: { backgroundColor: colors.green, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: 'Inter_600SemiBold', color: '#fff', fontSize: 15, fontWeight: '700' }, error: { padding: 14, borderRadius: 12, backgroundColor: '#fff0ef', color: colors.red, lineHeight: 22 },
  chip: { borderRadius: 24, backgroundColor: '#edf2e8', paddingHorizontal: 15, paddingVertical: 11 }, badge: { color: colors.green, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  hero: { backgroundColor: colors.green, borderRadius: 24, padding: 24, gap: 12 }, divider: { height: 1, backgroundColor: colors.border },
});
export function Screen({ title, subtitle, children, refreshing = false, onRefresh }: React.PropsWithChildren<{ title?: string; subtitle?: string; refreshing?: boolean; onRefresh?: () => void }>) {
  return <SafeAreaView style={styles.screen} edges={['bottom']}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} /> : undefined}>
      {title && <Text accessibilityRole="header" style={styles.title}>{title}</Text>}{subtitle && <Text style={styles.muted}>{subtitle}</Text>}{children}
    </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
export function Card({ children }: React.PropsWithChildren) { return <View style={styles.card}>{children}</View>; }
export function Button({ title, onPress, busy = false, disabled = false, secondary = false, danger = false }: { title: string; onPress: () => void; busy?: boolean; disabled?: boolean; secondary?: boolean; danger?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || disabled }} disabled={busy || disabled} onPress={onPress} style={({ pressed }) => [styles.button, secondary && { backgroundColor: colors.lime }, danger && { backgroundColor: colors.red }, { opacity: busy || disabled ? 0.45 : pressed ? 0.75 : 1 }]}>
    {busy ? <ActivityIndicator color={secondary ? colors.green : '#fff'} /> : <Text style={[styles.buttonText, secondary && { color: colors.green }]}>{title}</Text>}
  </Pressable>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={{ gap: 6 }}><Text style={styles.muted}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor="#89968f" autoCapitalize="sentences" {...props} style={[styles.input, props.multiline && { minHeight: 100, textAlignVertical: 'top' }, props.style]} /></View>;
}
export function Choices({ values, value, onChange }: { values: { value: string; label: string }[]; value: string; onChange: (value: string) => void }) {
  return <View style={styles.row}>{values.map(option => <Pressable accessibilityRole="button" accessibilityState={{ selected: value === option.value }} key={option.value} onPress={() => onChange(option.value)} style={[styles.chip, value === option.value && { backgroundColor: colors.green }]}><Text style={{ color: value === option.value ? '#fff' : colors.ink }}>{option.label}</Text></Pressable>)}</View>;
}
export function ErrorBox({ message }: { message?: string }) { return message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null; }
export function Loading() { return <ActivityIndicator style={{ padding: 28 }} color={colors.green} size="large" />; }
export function Empty({ text }: { text: string }) { return <Card><Text style={styles.muted}>{text}</Text></Card>; }
export function Badge({ value }: { value: string }) { return <Text style={styles.badge}>{readable(value)}</Text>; }
export function useAction() {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const gate = useRef(false);
  async function run(action: () => Promise<unknown>, success?: string) {
    if (gate.current) return;
    gate.current = true; setBusy(true); setError('');
    try { await action(); if (success) Alert.alert('KBR Fresh Foods', success); }
    catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.'); }
    finally { gate.current = false; setBusy(false); }
  }
  return { busy, error, run };
}
export function confirm(title: string, action: () => void) { Alert.alert(title, 'Please confirm to continue.', [{ text: 'Keep', style: 'cancel' }, { text: 'Confirm', style: 'destructive', onPress: action }]); }
