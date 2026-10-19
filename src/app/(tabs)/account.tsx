import Workspace from '../../components/Workspace';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Avatar from '../../components/Avatar';
import { Badge, Button, Card, ErrorBox, ListGroup, ListRow, Screen, SectionTitle, confirm, styles, useAction } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
export default function Account() {
  const { user, signOut } = useAuth(); const action = useAction();
  return <Screen><ErrorBox message={action.error} />
    {user ? <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <Avatar name={user.name} uri={user.avatar} />
      <View style={{ flex: 1, gap: 4 }}><Text style={styles.subtitle} numberOfLines={1}>{user.name}</Text><Text style={styles.muted} numberOfLines={1}>{user.email}</Text><Badge value={user.role} /></View>
    </Card> : <Card>
      <Text style={styles.title}>Welcome to KBR</Text>
      <Text style={styles.muted}>Sign in to place orders, track deliveries and access your workspace.</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}><Button title="Sign in" style={{ flex: 1 }} onPress={() => router.push('/login')} /><Button secondary title="Create account" style={{ flex: 1 }} onPress={() => router.push('/register')} /></View>
    </Card>}
    {user && <ListGroup>
      <ListRow icon="user" title="Profile & addresses" description="Personal details, delivery addresses and password" onPress={() => router.push('/profile')} />
      <ListRow icon="bell" title="Notifications" last onPress={() => router.push('/notifications')} />
    </ListGroup>}
    <Workspace />
    <SectionTitle title="Explore" />
    <ListGroup>
      <ListRow icon="heart" title="Wishlist" onPress={() => router.push('/wishlist')} />
      <ListRow icon="pin" title="Find a store" onPress={() => router.push('/stores')} />
      <ListRow icon="info" title="About KBR Fresh Foods" onPress={() => router.push('/about')} />
      <ListRow icon="mail" title="Contact us" last onPress={() => router.push('/contact')} />
    </ListGroup>
    {user && <ListGroup><ListRow icon="logout" title={action.busy ? 'Signing out…' : 'Sign out'} danger last onPress={() => confirm('Sign out?', () => { void action.run(signOut); }, { message: 'Your cart stays saved on this device.', confirmText: 'Sign out' })} /></ListGroup>}
  </Screen>;
}
