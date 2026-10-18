import React from 'react';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Button, ErrorBox, Loading, Screen } from './ui';
import type { Role } from '../lib/types';
export function RequireRole({ roles, children }: React.PropsWithChildren<{ roles?: Role[] }>) {
  const { user, loading } = useAuth();
  if (loading) return <Screen><Loading /></Screen>;
  if (!user) return <Screen title="Sign in to continue"><Button title="Sign in" onPress={() => router.push('/login')} /></Screen>;
  if (roles && !roles.includes(user.role)) return <Screen title="Access restricted"><ErrorBox message="Your account does not have access to this screen." /><Button title="Go home" onPress={() => router.replace('/')} /></Screen>;
  return children;
}
