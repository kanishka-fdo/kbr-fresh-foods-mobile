import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { RequireRole } from '../components/RequireRole';
import { Button, Screen } from '../components/ui';
import { canAccess } from '../lib/domain.mjs';
import { CartScreen, CatalogScreen, CheckoutScreen, WishlistScreen } from '../screens/Shop';
import { OrderListScreen } from '../screens/Orders';
import { EntityScreen, ReportsScreen, UsersScreen } from '../screens/Management';
import ProfileScreen from '../screens/Profile';
import { AboutScreen, ContactScreen, NotificationsScreen, StoresScreen } from '../screens/Public';
const publicSections = ['wishlist', 'stores', 'about', 'contact'];
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
  if (!screens[section]) return <Screen title="Page not found"><Button title="Go home" onPress={() => router.replace('/')} /></Screen>;
  if (publicSections.includes(section)) return screens[section];
  return <RequireRole roles={user && canAccess(user.role, canonical) ? [user.role] : []}>{screens[section]}</RequireRole>;
}
