import { Redirect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Loading, Screen } from '../../components/ui';
import StorefrontScreen from '../../screens/Storefront';

export default function Home() {
  const auth = useAuth();
  if (auth.loading) return <Screen><Loading label="Loading your account…" /></Screen>;
  if (!auth.user) return <Redirect href="/welcome" />;
  return <StorefrontScreen />;
}
