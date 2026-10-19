import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { RequireRole } from '../components/RequireRole';
import { Button, Empty, Screen } from '../components/ui';
import { canAccess } from '../lib/domain.mjs';
import { CartScreen, CatalogScreen, CheckoutScreen, WishlistScreen } from '../screens/Shop';
import { OrderListScreen } from '../screens/Orders';
import { EntityScreen, ReportsScreen, UsersScreen } from '../screens/Management';
import ProfileScreen from '../screens/Profile';
import { AboutScreen, ContactScreen, NotificationsScreen, StoresScreen } from '../screens/Public';
const publicSections = ['wishlist', 'stores', 'about', 'contact'];
const titles: Record<string, string> = {
  wishlist: 'Wishlist', stores: 'Stores', about: 'About us', contact: 'Contact', checkout: 'Checkout', wholesale: 'Wholesale shop', 'wholesale-checkout': 'Bulk order', 'bulk-submit': 'Request quote',
  orders: 'My orders', 'staff-orders': 'Manage orders', deliveries: 'My deliveries', 'wholesale-orders': 'Wholesale orders', 'staff-wholesale': 'Wholesale management',
  inventory: 'Inventory', categories: 'Categories', suppliers: 'Suppliers', purchases: 'Purchases', users: 'Users', dashboard: 'Dashboard', reports: 'Reports', 'inventory-intelligence': 'Inventory intelligence',
  profile: 'Profile', notifications: 'Notifications',
};
export default function Section() {
  const { section } = useLocalSearchParams<{ section: string }>(); const { user } = useAuth();
  const canonical = section === 'bulk-submit' || section === 'wholesale-checkout' ? 'wholesale' : section;
  const screens: Record<string, React.ReactNode> = {
    wishlist: <WishlistScreen />, stores: <StoresScreen />, about: <AboutScreen />, contact: <ContactScreen />,
    checkout: <CheckoutScreen />, wholesale: <CatalogScreen wholesale />, 'wholesale-checkout': <CartScreen wholesale />, 'bulk-submit': <CheckoutScreen wholesale />,
    orders: <OrderListScreen />, 'staff-orders': <OrderListScreen mode="staff" />, deliveries: <OrderListScreen mode="driver" />,
    'wholesale-orders': <OrderListScreen mode="wholesale" />, 'staff-wholesale': <OrderListScreen mode="staff-wholesale" />,
    inventory: <EntityScreen kind="inventory" />, categories: <EntityScreen kind="categories" />, suppliers: <EntityScreen kind="suppliers" />, purchases: <EntityScreen kind="purchases" />,
    users: <UsersScreen />, dashboard: <ReportsScreen dashboard />, reports: <ReportsScreen />, 'inventory-intelligence': <ReportsScreen advanced />,
    profile: <ProfileScreen />, notifications: <NotificationsScreen />,
  };
  const header = <Stack.Screen options={{ title: titles[section] || 'Not found' }} />;
  if (!screens[section]) return <>{header}<Screen contentStyle={{ flexGrow: 1, justifyContent: 'center' }}><Empty icon="info" title="Page not found" text="This page doesn't exist or has moved." action={<Button title="Go home" onPress={() => router.replace('/')} />} /></Screen></>;
  if (publicSections.includes(section)) return <>{header}{screens[section]}</>;
  return <>{header}<RequireRole roles={user && canAccess(user.role, canonical) ? [user.role] : []}>{screens[section]}</RequireRole></>;
}
