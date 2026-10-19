import { router } from 'expo-router';
import { ListGroup, ListRow, SectionTitle } from './ui';
import type { IconName } from './Icon';
import { useAuth } from '../context/AuthContext';
import { canAccess } from '../lib/domain.mjs';
const modules: [string, string, string, IconName][] = [
  ['orders', 'My orders', 'Track purchases and delivery confirmations.', 'package'], ['wholesale', 'Wholesale shop', 'Order in bulk at wholesale prices.', 'store'],
  ['wholesale-orders', 'Wholesale orders', 'View quotes, payments and approvals.', 'clipboard'], ['deliveries', 'My deliveries', 'Your assigned routes and QR confirmations.', 'truck'],
  ['staff-orders', 'Manage orders', 'Process orders and assign drivers.', 'clipboard'], ['inventory', 'Inventory', 'Products, prices, stock and expiry alerts.', 'box'],
  ['staff-wholesale', 'Wholesale management', 'Approve and fulfil bulk orders.', 'store'], ['dashboard', 'Business dashboard', 'Revenue, orders and business performance.', 'chart'],
  ['users', 'Users', 'Manage accounts and role permissions.', 'users'], ['suppliers', 'Suppliers', 'Manage your supply partners.', 'truck'], ['purchases', 'Purchases', 'Incoming stock and supplier payments.', 'package'],
  ['reports', 'Reports', 'Sales, customers and inventory forecasts.', 'chart'], ['inventory-intelligence', 'Inventory intelligence', 'Freshness, pricing, allocation and reorder insights.', 'leaf'],
];
export default function Workspace() {
  const { user } = useAuth(); if (!user) return null;
  const visible = modules.filter(([key]) => canAccess(user.role, key));
  if (!visible.length) return null;
  return <><SectionTitle title="Your workspace" /><ListGroup>{visible.map(([key, title, description, icon], index) => <ListRow key={key} icon={icon} title={title} description={description} last={index === visible.length - 1} onPress={() => router.push('/' + key)} />)}</ListGroup></>;
}
