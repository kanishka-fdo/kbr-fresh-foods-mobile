import { AppFonts } from '../components/Brand';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ShoppingProvider } from '../context/ShoppingContext';
import { Button, ErrorBox, Loading, Screen, colors } from '../components/ui';

function Navigation() {
  const auth = useAuth();
  if (auth.loading) return <Screen><Loading /></Screen>;
  if (auth.error) return <Screen title="Reconnect"><ErrorBox message={auth.error} /><Button title="Try again" onPress={() => { void auth.retry(); }} /><Button secondary title="Sign out" onPress={() => { void auth.signOut(); }} /></Screen>;
  return <ShoppingProvider><Stack key={auth.user?._id || 'guest'} screenOptions={{ headerTintColor: colors.green, headerStyle: { backgroundColor: colors.cream }, headerShadowVisible: false, contentStyle: { backgroundColor: colors.cream } }}>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="login" options={{ title: 'Sign in' }} />
    <Stack.Screen name="register" options={{ title: 'Create an account' }} />
    <Stack.Screen name="forgot-password" options={{ title: 'Recover your account' }} />
    <Stack.Screen name="verify-email/[token]" options={{ title: 'Verify email' }} />
    <Stack.Screen name="reset-password/[token]" options={{ title: 'Reset password' }} />
    <Stack.Screen name="products/[id]" options={{ title: 'Product details' }} />
    <Stack.Screen name="[section]" options={{ title: 'KBR Fresh Foods' }} />
    <Stack.Screen name="orders/[id]" options={{ title: 'Order details' }} />
    <Stack.Screen name="wholesale/orders/[id]" options={{ title: 'Wholesale order' }} />
    <Stack.Screen name="scan/[id]" options={{ title: 'Confirm delivery' }} />
  </Stack></ShoppingProvider>;
}
export default function RootLayout() { return <SafeAreaProvider><AppFonts><AuthProvider><StatusBar style="dark" /><Navigation /></AuthProvider></AppFonts></SafeAreaProvider>; }
