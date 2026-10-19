import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import { Badge, Button, Card, Choices, ErrorBox, Field, IconButton, Screen, SectionTitle, Sheet, colors, confirm, font, styles, useAction } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { authApi, userApi } from '../lib/services';
import { currentCoordinates } from '../lib/location';
import type { Address } from '../lib/types';

function AddressSheet({ address, onClose, onSaved }: { address: Address | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [draft, setDraft] = useState<Address | null>(address); const action = useAction(); const locating = useAction();
  const [prev, setPrev] = useState(address);
  if (prev !== address) { setPrev(address); setDraft(address); action.clear(); locating.clear(); }
  if (!draft) return null;
  const located = Number.isFinite(draft.lat) && Number.isFinite(draft.lng);
  const set = (patch: Partial<Address>) => setDraft(previous => previous && { ...previous, ...patch });
  return <Sheet visible={!!address} title={draft._id ? 'Edit address' : 'New address'} onClose={onClose} footer={<>
    <ErrorBox message={action.error} />
    <Button title="Save address" busy={action.busy} disabled={!draft.line1.trim() || !draft.city.trim()} onPress={() => { void action.run(async () => { const body = { ...draft, label: draft.label?.trim() || 'Home', line1: draft.line1.trim(), line2: draft.line2?.trim(), city: draft.city.trim() }; await (draft._id ? userApi.updateAddress(draft._id, body) : userApi.addAddress(body)); await onSaved(); onClose(); }); }} />
  </>}>
    <Choices values={['Home', 'Work', 'Other'].map(value => ({ value, label: value }))} value={draft.label || ''} onChange={label => set({ label })} />
    <Field label="Label" value={draft.label || ''} onChangeText={label => set({ label })} />
    <Field label="Street address" value={draft.line1} onChangeText={line1 => set({ line1 })} autoComplete="street-address" />
    <Field label="Apartment, landmark (optional)" value={draft.line2 || ''} onChangeText={line2 => set({ line2 })} />
    <Field label="City" value={draft.city} onChangeText={city => set({ city })} />
    <Card style={{ backgroundColor: located ? colors.lime : colors.white }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Icon name={located ? 'check' : 'pin'} size={20} color={located ? colors.green : colors.muted} /><Text style={[styles.text, { flex: 1 }]}>{located ? `Location set · ${draft.lat!.toFixed(4)}, ${draft.lng!.toFixed(4)}` : 'Add a map location so deliveries can be routed and priced.'}</Text></View>
      <ErrorBox message={locating.error} />
      <Button secondary icon="locate" title="Use my current location" busy={locating.busy} onPress={() => { void locating.run(async () => set(await currentCoordinates())); }} />
      <View style={{ flexDirection: 'row', gap: 10 }}>{(['lat', 'lng'] as const).map(key => <View key={key} style={{ flex: 1 }}><Field label={key === 'lat' ? 'Latitude' : 'Longitude'} value={draft[key] === undefined ? '' : String(draft[key])} keyboardType="numbers-and-punctuation" onChangeText={text => set({ [key]: text.trim() && Number.isFinite(Number(text)) ? Number(text) : undefined })} /></View>)}</View>
    </Card>
    <Choices values={[{ value: 'true', label: 'Default address' }, { value: 'false', label: 'Other address' }]} value={String(!!draft.isDefault)} onChange={value => set({ isDefault: value === 'true' })} />
  </Sheet>;
}

export default function ProfileScreen() {
  const { user, refresh } = useAuth(); const details = useAction(); const photo = useAction(); const addresses = useAction(); const emailAction = useAction(); const passwordAction = useAction();
  const [name, setName] = useState(user?.name || ''); const [phone, setPhone] = useState(user?.phone || ''); const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [avatar, setAvatar] = useState(user?.avatar || ''); const [email, setEmail] = useState(''); const [otp, setOtp] = useState(''); const [requested, setRequested] = useState(false);
  const [oldPassword, setOldPassword] = useState(''); const [password, setPassword] = useState(''); const [address, setAddress] = useState<Address | null>(null);
  if (!user) return null;
  const changed = name.trim() !== user.name || phone !== (user.phone || '') || businessName !== (user.businessName || '');
  return <Screen>
    <Card style={{ alignItems: 'center' }}>
      <Avatar name={user.name} uri={user.avatar} size={84} />
      <View style={{ alignItems: 'center', gap: 4 }}><Text style={[styles.subtitle, { fontSize: 19 }]}>{user.name}</Text><Text style={styles.muted}>{user.email}</Text><Badge value={user.role} /></View>
    </Card>

    <SectionTitle title="Personal details" />
    <Card>
      <Field label="Name" value={name} onChangeText={setName} autoComplete="name" />
      <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
      {user.role === 'wholesale' && <Field label="Business name" value={businessName} onChangeText={setBusinessName} />}
      <ErrorBox message={details.error} />
      <Button title="Save details" busy={details.busy} disabled={!name.trim() || !changed} onPress={() => { void details.run(async () => { await userApi.updateProfile({ name: name.trim(), phone: phone.trim(), businessName: businessName.trim() }); await refresh(); }, 'Your details have been saved.'); }} />
    </Card>
    <Card>
      <Field label="Profile photo URL" value={avatar} onChangeText={setAvatar} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://…" />
      <ErrorBox message={photo.error} />
      <Button secondary title="Update photo" busy={photo.busy} disabled={avatar.trim() === (user.avatar || '') || (!!avatar.trim() && !/^https?:\/\//i.test(avatar.trim()))} onPress={() => { void photo.run(async () => { await userApi.uploadAvatar(avatar.trim()); await refresh(); }, 'Profile photo updated.'); }} />
    </Card>

    <SectionTitle title="Delivery addresses" action={<IconButton icon="plus" label="Add an address" background={colors.lime} color={colors.green} size={36} onPress={() => setAddress({ label: 'Home', line1: '', city: 'Negombo', isDefault: !user.addresses.length })} />} />
    <ErrorBox message={addresses.error} />
    {user.addresses.length ? user.addresses.map(a => <Card key={a._id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' }}><Icon name="pin" size={20} color={colors.green} /></View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.row}><Text style={[styles.text, { fontFamily: font.semibold }]}>{a.label || 'Address'}</Text>{a.isDefault && <Badge value="Default" tone="green" />}</View>
        <Text style={styles.muted}>{[a.line1, a.line2, a.city].filter(Boolean).join(', ')}</Text>
        {!(Number.isFinite(a.lat) && Number.isFinite(a.lng)) && <Text style={[styles.muted, { color: '#9a5b07', fontSize: 12 }]}>No map location — edit to add one</Text>}
      </View>
      <IconButton icon="edit" label={'Edit ' + (a.label || 'address')} background={colors.field} size={36} onPress={() => setAddress({ ...a })} />
      <IconButton icon="trash" label={'Remove ' + (a.label || 'address')} background={colors.redSoft} color={colors.red} size={36} disabled={addresses.busy} onPress={() => confirm('Remove this address?', () => { void addresses.run(async () => { await userApi.deleteAddress(a._id); await refresh(); }); }, { confirmText: 'Remove' })} />
    </Card>) : <Card><Text style={styles.muted}>No saved addresses yet. Add one to check out faster.</Text></Card>}

    <SectionTitle title="Change email" />
    <Card>
      <Field label="New email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      {requested && <Field label="Verification code" value={otp} onChangeText={setOtp} keyboardType="number-pad" autoComplete="one-time-code" hint={'Sent to ' + email.trim()} />}
      <ErrorBox message={emailAction.error} />
      {requested ? <Button title="Confirm new email" busy={emailAction.busy} disabled={!otp.trim()} onPress={() => { void emailAction.run(async () => { await userApi.confirmEmailChange(otp.trim()); await refresh(); setRequested(false); setOtp(''); setEmail(''); }, 'Your email has been updated.'); }} />
        : <Button secondary title="Send verification code" busy={emailAction.busy} disabled={!/^\S+@\S+\.\S+$/.test(email.trim())} onPress={() => { void emailAction.run(async () => { await userApi.requestEmailChange(email.trim()); setRequested(true); }, 'Check your new email address for the verification code.'); }} />}
    </Card>

    <SectionTitle title="Change password" />
    <Card>
      <Field label="Current password" value={oldPassword} onChangeText={setOldPassword} secureTextEntry autoCapitalize="none" autoComplete="current-password" />
      <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="new-password" hint="At least 6 characters." />
      <ErrorBox message={passwordAction.error} />
      <Button title="Update password" busy={passwordAction.busy} disabled={!oldPassword || password.length < 6} onPress={() => { void passwordAction.run(async () => { await authApi.changePassword(oldPassword, password); setOldPassword(''); setPassword(''); }, 'Password changed.'); }} />
    </Card>
    <AddressSheet address={address} onClose={() => setAddress(null)} onSaved={refresh} />
  </Screen>;
}
