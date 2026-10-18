import Workspace from '../../components/Workspace';
import { router } from 'expo-router';
import { Text } from 'react-native';
import { Badge, Button, Card, Screen, styles, useAction, ErrorBox } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
export default function Account() {
  const { user, signOut } = useAuth(); const action = useAction();
  return <Screen title={user ? user.name : 'Welcome to KBR'}><ErrorBox message={action.error} />
    {user ? <Card><Badge value={user.role} /><Text style={styles.muted}>{user.email}</Text><Button title="Edit profile and addresses" onPress={() => router.push('/profile')} /><Button secondary title="Notifications" onPress={() => router.push('/notifications')} /><Button secondary title="Sign out" busy={action.busy} onPress={() => { void action.run(signOut); }} /></Card> : <Card><Text style={styles.text}>Sign in to place orders and access your workspace.</Text><Button title="Sign in" onPress={() => router.push('/login')} /><Button secondary title="Create account" onPress={() => router.push('/register')} /></Card>}
    {['wishlist', 'stores', 'about', 'contact'].map(section => <Button key={section} secondary title={section === 'stores' ? 'Find a store' : section[0].toUpperCase() + section.slice(1)} onPress={() => router.push(`/${section}`)} />)}
  <Workspace /></Screen>;
}
