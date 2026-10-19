import React, { useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderHeightContext } from 'expo-router/react-navigation';
import { readable } from '../lib/domain.mjs';
import Icon, { type IconName } from './Icon';

export const colors = { green: '#176f3c', greenDark: '#0f5530', ink: '#143123', muted: '#607469', faint: '#8a9a90', cream: '#faf7f2', border: '#e6e8e3', red: '#aa3030', redSoft: '#fdeeed', lime: '#edf8f1', gold: '#b8956a', forest: '#0d1f0d', white: '#fff', field: '#f6f7f4' };
export const font = { regular: 'Inter_400Regular', semibold: 'Inter_600SemiBold', bold: 'Inter_700Bold' };
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 16, gap: 14, paddingBottom: 40, width: '100%', maxWidth: 780, alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { fontFamily: font.bold, fontSize: 26, lineHeight: 32, color: colors.ink, letterSpacing: -0.6 },
  subtitle: { fontFamily: font.bold, fontSize: 16, lineHeight: 22, color: colors.ink },
  text: { fontFamily: font.regular, color: colors.ink, fontSize: 15, lineHeight: 22 },
  muted: { fontFamily: font.regular, color: colors.muted, fontSize: 13.5, lineHeight: 20 },
  label: { fontFamily: font.semibold, color: colors.muted, fontSize: 13, lineHeight: 18 },
  price: { fontFamily: font.bold, color: colors.green, fontSize: 16 },
  card: { padding: 16, borderRadius: 18, backgroundColor: colors.white, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: colors.border, gap: 12 },
  input: { fontFamily: font.regular, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 13 : 10, color: colors.ink, minHeight: 48, fontSize: 16 },
  button: { flexDirection: 'row', gap: 8, backgroundColor: colors.green, borderRadius: 12, paddingHorizontal: 16, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: font.semibold, color: colors.white, fontSize: 15, textAlign: 'center' },
  error: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 12, borderRadius: 12, backgroundColor: colors.redSoft },
  chip: { borderRadius: 999, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, minHeight: 38, justifyContent: 'center' },
  badge: { color: colors.green, fontFamily: font.semibold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});

/** "out_for_delivery" → "Out for delivery" for chips and labels. */
export const titled = (value: string) => readable(value).toLowerCase().replace(/^./, c => c.toUpperCase());

/** Alerts work natively; react-native-web's Alert.alert is a no-op, so fall back to the browser dialogs. */
export function notify(message: string, title = 'KBR Fresh Foods') {
  if (Platform.OS === 'web') window.alert(message); else Alert.alert(title, message);
}
export function confirm(title: string, action: () => void, { message = 'Please confirm to continue.', confirmText = 'Confirm', destructive = true } = {}) {
  if (Platform.OS === 'web') { if (window.confirm(title + '\n\n' + message)) action(); return; }
  Alert.alert(title, message, [{ text: 'Cancel', style: 'cancel' }, { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: action }]);
}

export function Screen({ title, subtitle, children, refreshing = false, onRefresh, footer, contentStyle }: React.PropsWithChildren<{ title?: string; subtitle?: string; refreshing?: boolean; onRefresh?: () => void; footer?: React.ReactNode; contentStyle?: StyleProp<ViewStyle> }>) {
  const headerHeight = useContext(HeaderHeightContext) ?? 0;
  return <SafeAreaView style={styles.screen} edges={['bottom']}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={headerHeight}>
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[styles.content, contentStyle]} refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} colors={[colors.green]} /> : undefined}>
      {(!!title || !!subtitle) && <View style={{ gap: 4 }}>{!!title && <Text accessibilityRole="header" style={styles.title}>{title}</Text>}{!!subtitle && <Text style={styles.muted}>{subtitle}</Text>}</View>}
      {children}
    </ScrollView>
    {!!footer && <View style={{ backgroundColor: colors.white, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 }}><View style={{ width: '100%', maxWidth: 780, alignSelf: 'center', gap: 10 }}>{footer}</View></View>}
  </KeyboardAvoidingView></SafeAreaView>;
}
export function Card({ children, style }: React.PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) { return <View style={[styles.card, style]}>{children}</View>; }
export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return <View style={[styles.between, { marginTop: 6 }]}><Text accessibilityRole="header" style={[styles.subtitle, { fontSize: 17 }]}>{title}</Text>{action}</View>;
}

type ButtonProps = { title: string; onPress: () => void; busy?: boolean; disabled?: boolean; secondary?: boolean; danger?: boolean; outline?: boolean; small?: boolean; icon?: IconName; style?: StyleProp<ViewStyle>; accessibilityLabel?: string };
export function Button({ title, onPress, busy = false, disabled = false, secondary = false, danger = false, outline = false, small = false, icon, style, accessibilityLabel }: ButtonProps) {
  const tint = secondary || outline ? (danger ? colors.red : colors.green) : colors.white;
  const background = outline ? 'transparent' : secondary ? (danger ? colors.redSoft : colors.lime) : danger ? colors.red : colors.green;
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel || title} accessibilityState={{ disabled: busy || disabled, busy }} disabled={busy || disabled} onPress={onPress} hitSlop={small ? 4 : 0}
    style={({ pressed }) => [styles.button, { backgroundColor: background }, outline && { borderWidth: 1, borderColor: danger ? colors.red : colors.border }, small && { minHeight: 38, paddingHorizontal: 12, borderRadius: 10 }, { opacity: busy || disabled ? 0.45 : pressed ? 0.8 : 1 }, style]}>
    {busy ? <ActivityIndicator color={tint} /> : <>{icon && <Icon name={icon} size={small ? 16 : 18} color={tint} />}<Text numberOfLines={1} style={[styles.buttonText, { color: tint }, small && { fontSize: 13.5 }]}>{title}</Text></>}
  </Pressable>;
}
export function TextButton({ title, onPress, danger = false, disabled = false }: { title: string; onPress: () => void; danger?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} hitSlop={8} style={({ pressed }) => ({ paddingVertical: 8, opacity: disabled ? 0.4 : pressed ? 0.6 : 1 })}><Text style={{ fontFamily: font.semibold, fontSize: 14.5, color: danger ? colors.red : colors.green }}>{title}</Text></Pressable>;
}
export function IconButton({ icon, onPress, label, color = colors.ink, background = colors.white, size = 40, disabled = false }: { icon: IconName; onPress: () => void; label: string; color?: string; background?: string; size?: number; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} hitSlop={6} style={({ pressed }) => ({ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: background, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 })}><Icon name={icon} size={Math.round(size * 0.48)} color={color} /></Pressable>;
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  const [focused, setFocused] = useState(false); const [hidden, setHidden] = useState(!!props.secureTextEntry);
  const secure = !!props.secureTextEntry;
  return <View style={{ gap: 6 }}>
    <Text style={styles.label}>{label}</Text>
    <View>
      <TextInput accessibilityLabel={label} placeholderTextColor={colors.faint} autoCapitalize="sentences" {...props} secureTextEntry={secure && hidden}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }} onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={[styles.input, focused && { borderColor: colors.green }, props.multiline && { minHeight: 100, paddingTop: 12, textAlignVertical: 'top' }, secure && { paddingRight: 64 }, props.editable === false && { backgroundColor: colors.field, color: colors.muted }, props.style]} />
      {secure && <Pressable accessibilityRole="button" accessibilityLabel={hidden ? 'Show password' : 'Hide password'} onPress={() => setHidden(!hidden)} hitSlop={8} style={{ position: 'absolute', right: 6, top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: 8 }}><Text style={{ fontFamily: font.semibold, color: colors.green, fontSize: 13 }}>{hidden ? 'Show' : 'Hide'}</Text></Pressable>}
    </View>
    {!!hint && <Text style={[styles.muted, { fontSize: 12 }]}>{hint}</Text>}
  </View>;
}
export function SearchBar({ value, onChangeText, placeholder = 'Search' }: { value: string; onChangeText: (value: string) => void; placeholder?: string }) {
  return <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 0 }]}>
    <Icon name="search" size={18} color={colors.faint} />
    <TextInput accessibilityLabel={placeholder} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.faint} returnKeyType="search" autoCorrect={false} style={{ flex: 1, fontFamily: font.regular, fontSize: 16, color: colors.ink, minHeight: 46, paddingVertical: 0 }} />
    {!!value && <IconButton icon="close" label="Clear search" size={28} background={colors.field} color={colors.muted} onPress={() => onChangeText('')} />}
  </View>;
}

/** Chip selector. `scroll` keeps long option lists on one swipeable line. */
export function Choices({ values, value, onChange, scroll = false }: { values: { value: string; label: string }[]; value: string; onChange: (value: string) => void; scroll?: boolean }) {
  const chips = values.map(option => {
    const selected = value === option.value;
    return <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={option.value} onPress={() => onChange(option.value)} style={({ pressed }) => [styles.chip, selected && { backgroundColor: colors.green, borderColor: colors.green }, pressed && { opacity: 0.75 }]}>
      <Text style={{ fontFamily: selected ? font.semibold : font.regular, fontSize: 14, color: selected ? colors.white : colors.ink }}>{option.label}</Text>
    </Pressable>;
  });
  if (scroll) return <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ marginHorizontal: -16, flexGrow: 0 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>{chips}</ScrollView>;
  return <View style={[styles.row, { gap: 8 }]}>{chips}</View>;
}
export function ErrorBox({ message }: { message?: string }) {
  if (!message) return null;
  return <View accessibilityRole="alert" style={styles.error}><Icon name="info" size={18} color={colors.red} /><Text style={[styles.text, { color: colors.red, flex: 1, fontSize: 14 }]}>{message}</Text></View>;
}
export function Loading({ label }: { label?: string }) {
  return <View style={{ padding: 32, alignItems: 'center', gap: 10 }}><ActivityIndicator color={colors.green} size="large" />{!!label && <Text style={styles.muted}>{label}</Text>}</View>;
}
export function Empty({ text, title, icon = 'leaf', action }: { text: string; title?: string; icon?: IconName; action?: React.ReactNode }) {
  return <View style={[styles.card, { alignItems: 'center', paddingVertical: 28 }]}>
    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={26} color={colors.green} /></View>
    {!!title && <Text style={[styles.subtitle, { textAlign: 'center' }]}>{title}</Text>}
    <Text style={[styles.muted, { textAlign: 'center', maxWidth: 320 }]}>{text}</Text>
    {action}
  </View>;
}
const tones: Record<string, [string, string]> = {
  green: ['#e3f4e9', '#176f3c'], blue: ['#e6effc', '#2556a6'], amber: ['#fdf1dc', '#9a5b07'], red: ['#fde8e7', '#aa3030'], grey: ['#eef0ec', '#55645b'], purple: ['#efe9fb', '#6440a8'],
};
const statusTone: Record<string, string> = {
  delivered: 'green', paid: 'green', approved: 'green', fulfilled: 'green', active: 'green', new: 'green',
  processing: 'blue', quoted: 'blue', staff: 'blue', admin: 'purple', packed: 'purple', wholesale: 'purple',
  out_for_delivery: 'amber', pending: 'amber', quote_requested: 'amber', partial: 'amber', driver: 'amber',
  cancelled: 'red', rejected: 'red', failed: 'red', refunded: 'red', inactive: 'red',
};
export function Badge({ value, tone }: { value: string; tone?: keyof typeof tones }) {
  const [background, color] = tones[tone || statusTone[String(value).toLowerCase()] || 'grey'];
  return <View style={{ alignSelf: 'flex-start', backgroundColor: background, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={[styles.badge, { color }]}>{readable(value)}</Text></View>;
}
/** Label / value line, used for order totals and report data. */
export function InfoRow({ label, value, strong = false }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return <View style={[styles.between, { alignItems: 'flex-start' }]}><Text style={[strong ? styles.subtitle : styles.muted, { flexShrink: 1 }]}>{label}</Text>{typeof value === 'string' || typeof value === 'number' ? <Text style={[strong ? styles.subtitle : styles.text, { textAlign: 'right', flexShrink: 1 }]}>{value}</Text> : value}</View>;
}
/** Tappable menu row with icon, used for account and workspace navigation. */
export function ListRow({ icon, title, description, onPress, danger = false, right, last = false }: { icon?: IconName; title: string; description?: string; onPress: () => void; danger?: boolean; right?: React.ReactNode; last?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, paddingHorizontal: 16, backgroundColor: pressed ? colors.field : colors.white }, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
    {icon && <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: danger ? colors.redSoft : colors.lime, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={19} color={danger ? colors.red : colors.green} /></View>}
    <View style={{ flex: 1, gap: 2 }}><Text style={[styles.text, { fontFamily: font.semibold, color: danger ? colors.red : colors.ink }]}>{title}</Text>{!!description && <Text style={[styles.muted, { fontSize: 12.5, lineHeight: 17 }]}>{description}</Text>}</View>
    {right}{!danger && <Icon name="chevron" size={18} color={colors.faint} />}
  </Pressable>;
}
export function ListGroup({ children }: React.PropsWithChildren) {
  return <View style={{ borderRadius: 18, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth * 2, borderColor: colors.border, backgroundColor: colors.white }}>{children}</View>;
}
/** Quantity stepper. */
export function Stepper({ value, onChange, min = 0, max, unit, compact = false, stretch = false }: { value: number; onChange: (value: number) => void; min?: number; max?: number; unit?: string; compact?: boolean; stretch?: boolean }) {
  const size = compact ? 32 : 38;
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.lime, borderRadius: 999, padding: 3, alignSelf: 'flex-start' }, stretch && { alignSelf: 'stretch', justifyContent: 'space-between' }]}>
    <IconButton icon={value - 1 <= 0 && min <= 0 ? 'trash' : 'minus'} label="Decrease quantity" size={size} color={colors.green} disabled={value <= min} onPress={() => onChange(value - 1)} />
    <Text accessibilityLabel={`Quantity ${value}`} style={{ minWidth: compact ? 28 : 44, textAlign: 'center', fontFamily: font.bold, fontSize: compact ? 14 : 15, color: colors.ink }}>{value}{unit && !compact ? ' ' + unit : ''}</Text>
    <IconButton icon="plus" label="Increase quantity" size={size} color={colors.green} disabled={max !== undefined && value >= max} onPress={() => onChange(value + 1)} />
  </View>;
}
/** Two-column grid measured from its real width so cards line up exactly on every screen size. */
export function Grid<T>({ items, render, columns = 2, gap = 12, keyOf }: { items: T[]; render: (item: T) => React.ReactNode; columns?: number; gap?: number; keyOf: (item: T) => string }) {
  const [width, setWidth] = useState(0);
  const cell = width ? (width - gap * (columns - 1)) / columns : 0;
  return <View onLayout={e => setWidth(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
    {!!cell && items.map(item => <View key={keyOf(item)} style={{ width: cell }}>{render(item)}</View>)}
  </View>;
}
/** Bottom sheet style modal for edit forms, so the form is always on screen when opened from a long list. */
export function Sheet({ visible, title, onClose, children, footer }: React.PropsWithChildren<{ visible: boolean; title: string; onClose: () => void; footer?: React.ReactNode }>) {
  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top', 'bottom']}>
      <View style={[styles.between, { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, backgroundColor: colors.white }]}>
        <Text accessibilityRole="header" style={[styles.subtitle, { flex: 1, fontSize: 18 }]} numberOfLines={1}>{title}</Text>
        <IconButton icon="close" label="Close" background={colors.field} onPress={onClose} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>{children}</ScrollView>
        {!!footer && <View style={{ padding: 16, gap: 10, backgroundColor: colors.white, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>{footer}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}
export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  if (pages <= 1) return null;
  return <View style={[styles.between, { marginTop: 4 }]}>
    <Button secondary small title="Previous" style={{ flex: 1 }} disabled={page <= 1} onPress={() => onChange(page - 1)} />
    <Text style={[styles.label, { minWidth: 64, textAlign: 'center' }]}>{page} of {pages}</Text>
    <Button secondary small title="Next" style={{ flex: 1 }} disabled={page >= pages} onPress={() => onChange(page + 1)} />
  </View>;
}
export function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const timer = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(timer); }, [value, delay]);
  return debounced;
}
export function useAction() {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const gate = useRef(false);
  async function run(action: () => Promise<unknown>, success?: string) {
    if (gate.current) return;
    gate.current = true; setBusy(true); setError('');
    try { await action(); if (success) notify(success); }
    catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.'); }
    finally { gate.current = false; setBusy(false); }
  }
  return { busy, error, run, clear: () => setError('') };
}
