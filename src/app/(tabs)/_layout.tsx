import { BrandHeader } from '../../components/Brand';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import Icon, { type IconName } from '../../components/Icon';
import { colors, font } from '../../components/ui';
import { useShopping } from '../../context/ShoppingContext';
const icon = (name: IconName) => function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) { return <Icon name={name} size={23} color={String(color)} strokeWidth={focused ? 2.2 : 1.8} />; };
export default function TabLayout() {
  const { cart } = useShopping(); const count = cart.length;
  return <Tabs screenOptions={{
    headerStyle: { backgroundColor: colors.white }, headerTintColor: colors.ink, headerShadowVisible: false, headerTitleStyle: { fontFamily: font.bold, fontSize: 17 },
    tabBarActiveTintColor: colors.green, tabBarInactiveTintColor: colors.faint, tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border },
    tabBarLabelStyle: { fontFamily: font.semibold, fontSize: 11 }, tabBarBadgeStyle: { backgroundColor: colors.gold, fontFamily: font.bold, fontSize: 10 },
  }}>
    <Tabs.Screen name="index" options={{ title: 'KBR Fresh Foods', headerTitle: () => <BrandHeader />, tabBarLabel: 'Home', tabBarIcon: icon('home') }} />
    <Tabs.Screen name="shop" options={{ title: 'Shop', tabBarIcon: icon('bag') }} />
    <Tabs.Screen name="cart" options={{ title: 'Your cart', tabBarLabel: 'Cart', tabBarIcon: icon('cart'), tabBarBadge: count ? (count > 9 ? '9+' : count) : undefined }} />
    <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: icon('user') }} />
  </Tabs>;
}
