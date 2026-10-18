import { BrandHeader } from '../../components/Brand';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../components/ui';
export default function TabLayout() {
  return <Tabs screenOptions={{ headerStyle: { backgroundColor: '#fff' }, headerTintColor: colors.green, headerShadowVisible: false, tabBarActiveTintColor: colors.green, tabBarStyle: { backgroundColor: '#fff' } }}>
    <Tabs.Screen name="index" options={{ title: 'KBR Fresh Foods', headerTitle: () => <BrandHeader />, tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>⌂</Text> }} />
    <Tabs.Screen name="shop" options={{ title: 'Shop', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>▦</Text> }} />
    <Tabs.Screen name="cart" options={{ title: 'Your cart', tabBarLabel: 'Cart', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>▤</Text> }} />
    <Tabs.Screen name="account" options={{ title: 'Your account', tabBarLabel: 'Account', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>◎</Text> }} />
  </Tabs>;
}
