import { AppFonts } from '../components/Brand';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ShoppingProvider } from '../context/ShoppingContext';
import { Button, Empty, Loading, Screen, colors, font } from '../components/ui';

function Navigation() {
  const auth = useAuth();
  if (auth.loading) return <Screen><Loading label="Loading your account…" /></Screen>;
  if (auth.error) return <Screen contentStyle={{ flexGrow: 1, justifyContent: 'center' }}><Empty icon="info" title="We couldn't reach KBR Fresh Foods" text={auth.error} /><Button title="Try again" onPress={() => { void auth.retry(); }} /><Button secondary title="Sign out" onPress={() => { void auth.signOut(); }} /></Screen>;
  return <ShoppingProvider><Stack key={auth.user?._id || 'guest'} screenOptions={{ headerTintColor: colors.green, headerTitleStyle: { fontFamily: font.bold, fontSize: 17, color: colors.ink }, headerStyle: { backgroundColor: colors.white }, headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal', contentStyle: { backgroundColor: colors.cream } }}>
    <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
    <Stack.Screen name="login" options={{ title: 'Sign in' }} />
    <Stack.Screen name="register" options={{ title: 'Create account' }} />
    <Stack.Screen name="forgot-password" options={{ title: 'Forgot password' }} />
    <Stack.Screen name="verify-email/[token]" options={{ title: 'Verify email' }} />
    <Stack.Screen name="reset-password/[token]" options={{ title: 'Reset password' }} />
    <Stack.Screen name="products/[id]" options={{ title: 'Product' }} />
    <Stack.Screen name="[section]" options={{ title: '' }} />
    <Stack.Screen name="orders/[id]" options={{ title: 'Order details' }} />
    <Stack.Screen name="wholesale/orders/[id]" options={{ title: 'Wholesale order' }} />
    <Stack.Screen name="scan/[id]" options={{ title: 'Confirm delivery' }} />
  </Stack></ShoppingProvider>;
}
export default function RootLayout() { return <SafeAreaProvider><AppFonts><AuthProvider><StatusBar style="dark" /><Navigation /></AuthProvider></AppFonts></SafeAreaProvider>; }
