import React from 'react';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Button, Empty, Loading, Screen } from './ui';
import type { Role } from '../lib/types';
export function RequireRole({ roles, children }: React.PropsWithChildren<{ roles?: Role[] }>) {
  const { user, loading } = useAuth();
  if (loading) return <Screen><Loading /></Screen>;
  if (!user) return <Screen contentStyle={{ flexGrow: 1, justifyContent: 'center' }}><Empty icon="user" title="Sign in to continue" text="This page is available once you sign in to your KBR account." action={<Button title="Sign in" style={{ alignSelf: 'stretch' }} onPress={() => router.push('/login')} />} /></Screen>;
  if (roles && !roles.includes(user.role)) return <Screen contentStyle={{ flexGrow: 1, justifyContent: 'center' }}><Empty icon="info" title="Access restricted" text="Your account does not have access to this screen." action={<Button title="Go home" style={{ alignSelf: 'stretch' }} onPress={() => router.replace('/')} />} /></Screen>;
  return children;
}
