import { Text } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, styles } from './ui';
import { useAuth } from '../context/AuthContext';
import { canAccess } from '../lib/domain.mjs';
const modules = [
  ['orders', 'My orders', 'Track purchases and delivery confirmations.'], ['wholesale', 'Wholesale shop', 'Order in bulk at wholesale prices.'],
  ['wholesale-orders', 'Wholesale orders', 'View quotes, payments and approvals.'], ['deliveries', 'My deliveries', 'Your assigned routes and QR confirmations.'],
  ['staff-orders', 'Manage orders', 'Process orders and assign drivers.'], ['inventory', 'Inventory', 'Products, prices, stock and expiry alerts.'],
  ['staff-wholesale', 'Wholesale management', 'Approve and fulfil bulk orders.'], ['dashboard', 'Business dashboard', 'Revenue, orders and business performance.'],
  ['users', 'Users', 'Manage accounts and role permissions.'], ['suppliers', 'Suppliers', 'Manage your supply partners.'], ['purchases', 'Purchases', 'Record and manage incoming stock.'],
  ['reports', 'Reports', 'Sales, customers and inventory forecasts.'], ['inventory-intelligence', 'Inventory intelligence', 'Freshness, pricing, allocation and reorder insights.'],
];
export default function Workspace() { const { user } = useAuth(); if (!user) return null; return <><Text style={styles.subtitle}>Your workspace</Text>{modules.filter(([key]) => canAccess(user.role, key)).map(([key, title, description]) => <Card key={key}><Text style={styles.subtitle}>{title}</Text><Text style={styles.muted}>{description}</Text><Button secondary title={'Open ' + title.toLowerCase()} onPress={() => router.push('/' + key)} /></Card>)}</>; }
