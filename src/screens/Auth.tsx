import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { Button, Card, Choices, ErrorBox, Field, Screen, styles, useAction } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/services';
import type { Role } from '../lib/types';
export function LoginScreen() {
  const { signIn } = useAuth(); const action = useAction(); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  return <Screen title="Welcome back" subtitle="Sign in with your existing KBR account."><Card><Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" /><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" /><ErrorBox message={action.error} /><Button title="Sign in" busy={action.busy} onPress={() => { void action.run(async () => { await signIn(email, password); router.replace('/'); }); }} /></Card><Button secondary title="Forgot password?" onPress={() => router.push('/forgot-password')} /><Button secondary title="Resend verification email" busy={action.busy} disabled={!email.trim()} onPress={() => { void action.run(() => authApi.resendVerification(email.trim()), 'If your email is unverified, a new link has been sent.'); }} /><Button secondary title="Create an account" onPress={() => router.push('/register')} /></Screen>;
}
export function RegisterScreen() {
  const action = useAction(); const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', businessName: '', businessRegNo: '' }); const [role, setRole] = useState<Role>('customer');
  return <Screen title="Join KBR Fresh Foods"><Choices values={[{ value: 'customer', label: 'Customer' }, { value: 'wholesale', label: 'Wholesale buyer' }]} value={role} onChange={value => setRole(value as Role)} /><Card>{Object.entries(form).filter(([key]) => role === 'wholesale' || !key.startsWith('business')).map(([key, value]) => <Field key={key} label={key === 'businessRegNo' ? 'Business registration number' : key.replace(/([A-Z])/g, ' $1')} value={value} onChangeText={text => setForm({ ...form, [key]: text })} secureTextEntry={key === 'password'} autoCapitalize={['email', 'password'].includes(key) ? 'none' : 'words'} keyboardType={key === 'email' ? 'email-address' : key === 'phone' ? 'phone-pad' : 'default'} />)}<ErrorBox message={action.error} /><Button title="Create account" busy={action.busy} onPress={() => { void action.run(async () => { if (!form.name.trim() || !form.email.trim() || form.password.length < 6) throw new Error('Enter your name, email and a password of at least 6 characters.'); const res = await authApi.register({ ...form, email: form.email.trim(), role }); router.replace('/login'); return res; }, 'Check your email to verify your account before signing in.'); }} /></Card></Screen>;
}
export function ForgotPasswordScreen() {
  const [email, setEmail] = useState(''); const action = useAction();
  return <Screen title="Reset your password"><Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" /><ErrorBox message={action.error} /><Button title="Send reset link" busy={action.busy} disabled={!email.trim()} onPress={() => { void action.run(() => authApi.forgotPassword(email.trim()), 'If your email is registered, a password reset link has been sent.'); }} /></Screen>;
}
export function TokenScreen({ verify = false }: { verify?: boolean }) {
  const { token } = useLocalSearchParams<{ token: string }>(); const [password, setPassword] = useState(''); const [completedToken, setCompletedToken] = useState<string | null>(null); const action = useAction();
  const done = !!token && completedToken === token;
  return <Screen title={verify ? 'Verify your email' : 'Choose a new password'}>{done ? <><Text style={styles.text}>{verify ? 'Your email is verified.' : 'Your password has been reset.'}</Text><Button title="Sign in" onPress={() => router.replace('/login')} /></> : <>{!verify && <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />}<ErrorBox message={action.error} /><Button title={verify ? 'Verify email' : 'Reset password'} busy={action.busy} onPress={() => { void action.run(async () => { if (!token) throw new Error('This link is missing a token.'); if (!verify && password.length < 6) throw new Error('Use at least 6 characters.'); await (verify ? authApi.verifyEmail(token) : authApi.resetPassword(token, password)); setCompletedToken(token); }); }} /></>}</Screen>;
}
