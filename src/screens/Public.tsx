import React, { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Icon from '../components/Icon';
import { Badge, Button, Card, Choices, Empty, ErrorBox, Field, Loading, Screen, SearchBar, TextButton, colors, font, styles, useAction } from '../components/ui';
import DeliveryMap from '../components/DeliveryMap';
import { useResource } from '../hooks/useResource';
import { useAuth } from '../context/AuthContext';
import { contactApi, notificationApi, storeApi } from '../lib/services';
import type { Notice, Store } from '../lib/types';
const timeAgo = (value: string) => {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return 'Just now'; if (minutes < 60) return minutes + ' min ago';
  const hours = Math.round(minutes / 60); if (hours < 24) return hours + ' h ago';
  const days = Math.round(hours / 24); return days < 7 ? days + ' d ago' : new Date(value).toLocaleDateString();
};
const orderId = (n: Notice) => { const related = n.relatedOrder as unknown; return typeof related === 'object' && related ? String((related as { _id?: string })._id || '') : related ? String(related) : ''; };
export function NotificationsScreen() {
  const { user } = useAuth();
  const action = useAction(); const [unread, setUnread] = useState(false);
  const resource = useResource<{ notifications: Notice[]; unreadCount: number }>(async () => (await notificationApi.getAll()).data, 'notifications', 60000);
  const visible = resource.data?.notifications.filter(n => !unread || !n.isRead) || [];
  const count = resource.data?.unreadCount || 0;
  const markRead = (n: Notice) => { if (!n.isRead) void action.run(async () => { await notificationApi.markRead(n._id); await resource.refresh(); }); };
  return <Screen refreshing={resource.refreshing} onRefresh={() => { void resource.refresh(); }}>
    <View style={styles.between}>
      <Choices values={[{ value: 'all', label: 'All' }, { value: 'unread', label: count ? `Unread (${count})` : 'Unread' }]} value={unread ? 'unread' : 'all'} onChange={value => setUnread(value === 'unread')} />
      {count > 0 && <TextButton title="Mark all read" disabled={action.busy} onPress={() => { void action.run(async () => { await notificationApi.markAllRead(); await resource.refresh(); }); }} />}
    </View>
    <ErrorBox message={resource.error || action.error} />{resource.loading && <Loading />}
    {visible.map(n => <Pressable key={n._id} accessibilityRole="button" accessibilityHint={n.relatedOrder ? 'Opens the related order' : 'Marks as read'} onPress={() => { markRead(n); const order = orderId(n); if (order) router.push((user?.role === 'wholesale' ? '/wholesale/orders/' : '/orders/') + order); }}
      style={({ pressed }) => [styles.card, { flexDirection: 'row', gap: 12 }, !n.isRead && { borderColor: '#bfe0cb', backgroundColor: '#f8fcf9' }, pressed && { opacity: 0.8 }]}>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: n.isRead ? colors.field : colors.lime, alignItems: 'center', justifyContent: 'center' }}><Icon name={n.relatedOrder ? 'package' : 'bell'} size={18} color={n.isRead ? colors.muted : colors.green} /></View>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={[styles.between, { alignItems: 'flex-start' }]}><Text style={[styles.text, { flex: 1, fontFamily: n.isRead ? font.semibold : font.bold }]}>{n.title}</Text>{!n.isRead && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.green, marginTop: 7 }} />}</View>
        <Text style={styles.muted}>{n.message}</Text>
        <Text style={[styles.muted, { fontSize: 12 }]}>{timeAgo(n.createdAt)}</Text>
      </View>
    </Pressable>)}
    {resource.data && !visible.length && <Empty icon="bell" title="You're all caught up" text={unread ? 'No unread notifications.' : 'Order updates and messages will appear here.'} />}
  </Screen>;
}
function StoreCard({ store, onError }: { store: Store; onError: (action: () => Promise<unknown>) => void }) {
  const [showMap, setShowMap] = useState(false);
  const stocked = store.inventory.filter(i => i.product && i.stock > 0);
  const located = !!store.location && Number.isFinite(store.location.lat) && Number.isFinite(store.location.lng);
  return <Card>
    <View style={[styles.between, { alignItems: 'flex-start' }]}><Text style={[styles.subtitle, { flex: 1 }]}>{store.name}</Text><Badge value={store.type} tone="green" /></View>
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}><Icon name="pin" size={16} color={colors.muted} /><Text style={[styles.text, { flex: 1 }]}>{store.address}</Text></View>
      {!!store.openHours && <View style={{ flexDirection: 'row', gap: 8 }}><Icon name="info" size={16} color={colors.muted} /><Text style={[styles.muted, { flex: 1 }]}>Open {store.openHours}</Text></View>}
    </View>
    {!!store.description && <Text style={styles.muted}>{store.description}</Text>}
    {located && showMap && <DeliveryMap lat={store.location.lat} lng={store.location.lng} title={store.name} />}
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {located && <Button small secondary icon="pin" title="Directions" style={{ flex: 1 }} onPress={() => onError(() => Linking.openURL('https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(store.location.lat + ',' + store.location.lng)))} />}
      {!!store.phone && <Button small secondary icon="phone" title="Call" style={{ flex: 1 }} onPress={() => onError(() => Linking.openURL('tel:' + store.phone.replace(/\s/g, '')))} />}
    </View>
    {located && <TextButton title={showMap ? 'Hide map' : 'Show map'} onPress={() => setShowMap(!showMap)} />}
    {!!stocked.length && <><View style={styles.divider} /><Text style={styles.label}>Available at this store</Text>{stocked.map((item, index) => <Text key={index} style={styles.text}>{item.product?.name} · {item.stock} {item.product?.unit}</Text>)}</>}
  </Card>;
}
export function StoresScreen() {
  const [filter, setFilter] = useState(''); const action = useAction(); const resource = useResource<Store[]>(async () => (await storeApi.getAll()).data.stores, 'stores');
  const visible = resource.data?.filter(s => (s.name + s.address + s.type).toLowerCase().includes(filter.trim().toLowerCase())) || [];
  return <Screen subtitle="KBR Fresh Foods produce at our own stores and partner supermarkets." refreshing={resource.refreshing} onRefresh={() => { void resource.refresh(); }}>
    <SearchBar value={filter} onChangeText={setFilter} placeholder="Search by name or area" />
    <ErrorBox message={resource.error || action.error} />{resource.loading && <Loading />}
    {visible.map(s => <StoreCard key={s._id} store={s} onError={fn => { void action.run(fn); }} />)}
    {resource.data && !visible.length && <Empty icon="store" title="No stores found" text={filter ? 'Try a different search.' : 'No stores are available yet.'} />}
  </Screen>;
}
const contactFields: { key: 'name' | 'email' | 'phone' | 'subject' | 'message'; label: string }[] = [{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone (optional)' }, { key: 'subject', label: 'Subject' }, { key: 'message', label: 'Message' }];
export function ContactScreen() {
  const { user } = useAuth(); const action = useAction(); const link = useAction(); const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', subject: '', message: '' });
  return <Screen subtitle="Questions about an order or your account? Send our team a message.">
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Button small secondary icon="phone" title="Call us" style={{ flex: 1 }} onPress={() => { void link.run(() => Linking.openURL('tel:+94779779316')); }} />
      <Button small secondary icon="mail" title="Email" style={{ flex: 1 }} onPress={() => { void link.run(() => Linking.openURL('mailto:info@kbrfreshfoods.lk')); }} />
    </View>
    <ErrorBox message={link.error} />
    <Card>
      {contactFields.map(({ key, label }) => <Field key={key} label={label} value={form[key]} onChangeText={text => setForm(previous => ({ ...previous, [key]: text }))} multiline={key === 'message'} autoCapitalize={key === 'email' ? 'none' : key === 'name' ? 'words' : 'sentences'} keyboardType={key === 'email' ? 'email-address' : key === 'phone' ? 'phone-pad' : 'default'} />)}
      <ErrorBox message={action.error} />
      <Button title="Send message" busy={action.busy} disabled={!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email.trim()) || !form.message.trim()} onPress={() => { void action.run(async () => { await contactApi.send({ ...form, name: form.name.trim(), email: form.email.trim() }); setForm(previous => ({ ...previous, subject: '', message: '' })); }, 'Your message has been sent. Our team will get back to you soon.'); }} />
    </Card>
  </Screen>;
}
export { default as AboutScreen } from './About';
