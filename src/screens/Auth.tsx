import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { Button, Card, Choices, Empty, ErrorBox, Field, Screen, TextButton, styles, useAction } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/services';
import { siteImage } from '../lib/site-assets';
import type { Role } from '../lib/types';
const validEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email.trim());
function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <View style={{ alignItems: 'center', gap: 8, paddingTop: 8, paddingBottom: 4 }}>
    <Image source={siteImage('/kbr-logo.png')} accessibilityLabel="KBR Fresh Foods logo" style={{ width: 72, height: 72 }} />
    <Text accessibilityRole="header" style={[styles.title, { textAlign: 'center' }]}>{title}</Text>
    <Text style={[styles.muted, { textAlign: 'center', maxWidth: 320 }]}>{subtitle}</Text>
  </View>;
}
export function LoginScreen() {
  const { signIn } = useAuth(); const action = useAction(); const resend = useAction(); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const submit = () => { void action.run(async () => { if (!validEmail(email) || !password) throw new Error('Enter your email address and password.'); await signIn(email, password); router.replace('/'); }); };
  return <Screen>
    <AuthHeader title="Welcome back" subtitle="Sign in with your KBR Fresh Foods account." />
    <Card>
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" returnKeyType="next" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="current-password" textContentType="password" returnKeyType="go" onSubmitEditing={submit} />
      <View style={{ alignItems: 'flex-end', marginTop: -6 }}><TextButton title="Forgot password?" onPress={() => router.push('/forgot-password')} /></View>
      <ErrorBox message={action.error} />
      <Button title="Sign in" busy={action.busy} onPress={submit} />
    </Card>
    <View style={[styles.row, { justifyContent: 'center', gap: 4 }]}><Text style={styles.muted}>New to KBR?</Text><TextButton title="Create an account" onPress={() => router.push('/register')} /></View>
    <Card style={{ gap: 8 }}>
      <Text style={styles.muted}>Didn&apos;t get your verification email? Enter your email above, then resend it.</Text>
      <ErrorBox message={resend.error} />
      <Button secondary small title="Resend verification email" busy={resend.busy} disabled={!validEmail(email)} onPress={() => { void resend.run(() => authApi.resendVerification(email.trim()), 'If your email is unverified, a new link has been sent.'); }} />
    </Card>
  </Screen>;
}
const registerFields: { key: 'name' | 'email' | 'phone' | 'password' | 'businessName' | 'businessRegNo'; label: string; wholesaleOnly?: boolean }[] = [
  { key: 'name', label: 'Full name' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone number' }, { key: 'password', label: 'Password' },
  { key: 'businessName', label: 'Business name', wholesaleOnly: true }, { key: 'businessRegNo', label: 'Business registration number', wholesaleOnly: true },
];
export function RegisterScreen() {
  const action = useAction(); const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', businessName: '', businessRegNo: '' }); const [role, setRole] = useState<Role>('customer');
  const submit = () => { void action.run(async () => {
    if (!form.name.trim() || !validEmail(form.email)) throw new Error('Enter your name and a valid email address.');
    if (form.password.length < 6) throw new Error('Use a password of at least 6 characters.');
    if (role === 'wholesale' && !form.businessName.trim()) throw new Error('Enter your business name.');
    await authApi.register({ ...form, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), role });
    router.replace('/login');
  }, role === 'wholesale' ? 'Check your email to verify your account. Wholesale accounts are activated after our team approves them.' : 'Check your email to verify your account before signing in.'); };
  return <Screen>
    <AuthHeader title="Join KBR Fresh Foods" subtitle="Fresh produce from Negombo, delivered to your door." />
    <Choices values={[{ value: 'customer', label: 'Customer' }, { value: 'wholesale', label: 'Wholesale buyer' }]} value={role} onChange={value => setRole(value as Role)} />
    <Card>
      {registerFields.filter(field => role === 'wholesale' || !field.wholesaleOnly).map(({ key, label }) => <Field key={key} label={label} value={form[key]} onChangeText={text => setForm(previous => ({ ...previous, [key]: text }))}
        secureTextEntry={key === 'password'} hint={key === 'password' ? 'At least 6 characters.' : undefined} autoCorrect={key !== 'email' && key !== 'password'}
        autoCapitalize={key === 'email' || key === 'password' ? 'none' : key === 'businessRegNo' ? 'characters' : 'words'} keyboardType={key === 'email' ? 'email-address' : key === 'phone' ? 'phone-pad' : 'default'}
        autoComplete={key === 'email' ? 'email' : key === 'password' ? 'new-password' : key === 'name' ? 'name' : key === 'phone' ? 'tel' : 'off'} />)}
      <ErrorBox message={action.error} />
      <Button title="Create account" busy={action.busy} onPress={submit} />
    </Card>
    <View style={[styles.row, { justifyContent: 'center', gap: 4 }]}><Text style={styles.muted}>Already have an account?</Text><TextButton title="Sign in" onPress={() => router.replace('/login')} /></View>
  </Screen>;
}
export function ForgotPasswordScreen() {
  const [email, setEmail] = useState(''); const action = useAction();
  return <Screen>
    <AuthHeader title="Reset your password" subtitle="Enter your account email and we'll send you a reset link." />
    <Card>
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" />
      <ErrorBox message={action.error} />
      <Button title="Send reset link" busy={action.busy} disabled={!validEmail(email)} onPress={() => { void action.run(() => authApi.forgotPassword(email.trim()), 'If your email is registered, a password reset link has been sent.'); }} />
    </Card>
  </Screen>;
}
export function TokenScreen({ verify = false }: { verify?: boolean }) {
  const { token } = useLocalSearchParams<{ token: string }>(); const [password, setPassword] = useState(''); const [completedToken, setCompletedToken] = useState<string | null>(null); const action = useAction();
  const done = !!token && completedToken === token;
  if (done) return <Screen contentStyle={{ flexGrow: 1, justifyContent: 'center' }}><Empty icon="check" title={verify ? 'Email verified' : 'Password updated'} text={verify ? 'Your email is verified. You can now sign in.' : 'Your password has been reset. Sign in with your new password.'} action={<Button title="Sign in" onPress={() => router.replace('/login')} />} /></Screen>;
  return <Screen>
    <AuthHeader title={verify ? 'Verify your email' : 'Choose a new password'} subtitle={verify ? 'Confirm your email address to activate your account.' : 'Pick a password you have not used before.'} />
    <Card>
      {!verify && <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="new-password" hint="At least 6 characters." />}
      <ErrorBox message={action.error} />
      <Button title={verify ? 'Verify email' : 'Reset password'} busy={action.busy} onPress={() => { void action.run(async () => { if (!token) throw new Error('This link is missing a token.'); if (!verify && password.length < 6) throw new Error('Use at least 6 characters.'); await (verify ? authApi.verifyEmail(token) : authApi.resetPassword(token, password)); setCompletedToken(token); }); }} />
    </Card>
  </Screen>;
}
