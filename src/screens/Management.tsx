import React, { useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Badge, Button, Card, Choices, Empty, ErrorBox, Field, Loading, Screen, styles, useAction, confirm } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useResource } from '../hooks/useResource';
import { categoryApi, dashboardApi, inventoryApi, productApi, purchaseApi, supplierApi, userApi, wholesaleApi } from '../lib/services';
import { money, readable, roles } from '../lib/domain.mjs';
import { shareCsv } from '../lib/exports';
import type { Category, User } from '../lib/types';
type Entity = Record<string, unknown> & { _id: string; name?: string };
type FieldDef = { key: string; label: string; numeric?: boolean; required?: boolean; options?: string[]; date?: boolean; boolean?: boolean; multiline?: boolean };
const productFields: FieldDef[] = [
  { key: 'name', label: 'Product name', required: true }, { key: 'itemCode', label: 'Item code' }, { key: 'brand', label: 'Brand' }, { key: 'category', label: 'Category', required: true },
  { key: 'description', label: 'Description', multiline: true }, { key: 'images', label: 'Photo URLs (one per line)', multiline: true },
  { key: 'unit', label: 'Unit', options: ['kg', 'g', 'unit', 'bunch', 'crate', 'l', 'ml', 'pack', 'dozen', 'pieces'] },
  ...['stockQuantity', 'minimumQty', 'lowStockThreshold', 'purchasePrice', 'retailPrice', 'wholesalePrice', 'tax', 'minWholesaleQty', 'storageTemp'].map(key => ({ key, label: readable(key), numeric: true, required: ['stockQuantity', 'retailPrice', 'wholesalePrice'].includes(key) })),
  { key: 'supplierName', label: 'Supplier name' }, { key: 'warehouseZone', label: 'Warehouse zone' }, { key: 'batchNumber', label: 'Batch number' },
  ...['harvestDate', 'arrivalDate', 'expiryDate'].map(key => ({ key, label: readable(key) + ' (YYYY-MM-DD)', date: true })),
  { key: 'isPerishable', label: 'Perishable', boolean: true },
];
const supplierFields: FieldDef[] = [
  { key: 'supplierId', label: 'Supplier code', required: true }, { key: 'name', label: 'Name', required: true }, { key: 'mobile', label: 'Phone' },
  { key: 'email', label: 'Email' }, { key: 'address', label: 'Address' }, { key: 'purchaseDue', label: 'Purchase due', numeric: true }, { key: 'purchaseReturnDue', label: 'Return due', numeric: true },
  { key: 'status', label: 'Status', options: ['Active', 'Inactive'] },
];
const categoryFields: FieldDef[] = [{ key: 'name', label: 'Name', required: true }, { key: 'type', label: 'Type', options: ['fruit', 'vegetable', 'dairy', 'grain', 'spice', 'bakery', 'beverage', 'seafood', 'other'] }, { key: 'description', label: 'Description', multiline: true }];
function fieldValue(row: Record<string, unknown>, key: string) {
  const value = row[key];
  if (key === 'category' && typeof value === 'object' && value) return String((value as Category)._id);
  if (key === 'images' && Array.isArray(value)) return value.join('\n');
  if (key.endsWith('Date') && value) return String(value).slice(0, 10);
  return value === undefined || value === null ? '' : String(value);
}
export function EntityScreen({ kind }: { kind: 'inventory' | 'suppliers' | 'categories' | 'purchases' }) {
  const { user } = useAuth(); const action = useAction(); const [query, setQuery] = useState(''); const [filter, setFilter] = useState('all'); const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Entity | null>(null); const [form, setForm] = useState<Record<string, string>>({});
  const fields = kind === 'inventory' ? productFields : kind === 'suppliers' ? supplierFields : categoryFields;
  const service = kind === 'inventory' ? productApi : kind === 'suppliers' ? supplierApi : categoryApi;
  const resource = useResource<{ rows: Entity[]; pages: number }>(async () => {
    const res = kind === 'inventory' ? filter === 'low' ? await productApi.lowStock() : filter === 'expiry' ? await productApi.expiring() : await productApi.getAll({ search: query, page, limit: 50 }) : kind === 'purchases' ? await purchaseApi.getAll() : await service.getAll();
    return { rows: res.data[kind === 'inventory' ? 'products' : kind] || [], pages: res.data.pages || 1 };
  }, kind + query + filter + page);
  const categories = useResource<Category[]>(async () => kind === 'inventory' ? (await categoryApi.getAll()).data.categories : [], kind);
  const rows = resource.data?.rows.filter(row => [row.name, row.supplierName, row.purchaseCode, row.supplierId].join(' ').toLowerCase().includes(query.toLowerCase())) || [];
  function edit(row: Entity) {
    setEditing(row);
    setForm(Object.fromEntries(fields.map(field => [field.key, fieldValue(row, field.key) || (field.boolean ? 'true' : field.options?.[0] || '')])));
  }
  async function save() {
    const body: Record<string, unknown> = {};
    for (const field of fields) {
      const value = form[field.key] || '';
      if (field.required && !value.trim()) throw new Error(field.label + ' is required.');
      if (field.numeric) {
        if (value && !Number.isFinite(Number(value))) throw new Error(field.label + ' must be a number.');
        if (value && field.key !== 'storageTemp' && Number(value) < 0) throw new Error(field.label + ' cannot be negative.');
        if (value) body[field.key] = Number(value);
      } else if (field.boolean) body[field.key] = value === 'true';
      else if (field.date) {
        if (value && Number.isNaN(Date.parse(value))) throw new Error('Enter a valid date for ' + field.label);
        if (value) body[field.key] = value;
        else if (editing?._id) body[field.key] = null;
      } else body[field.key] = field.key === 'images' ? value.split('\n').map(url => url.trim()).filter(Boolean) : value.trim();
    }
    if (editing?._id) await service.update(editing._id, body); else await service.create(body);
    setEditing(null); await resource.refresh();
  }
  return <Screen title={kind === 'inventory' ? 'Product inventory' : readable(kind)} refreshing={resource.loading && !!resource.data} onRefresh={() => { void resource.refresh(); }}><ErrorBox message={action.error || resource.error || categories.error} />
    <Field label="Search" value={query} onChangeText={value => { setQuery(value); setPage(1); }} />
    {kind === 'inventory' && <><Choices values={[{ value: 'all', label: 'All products' }, { value: 'low', label: 'Low stock' }, { value: 'expiry', label: 'Expiring soon' }]} value={filter} onChange={value => { setFilter(value); setPage(1); }} /><Button secondary title="Manage categories" onPress={() => router.push('/categories')} /></>}
    <View style={styles.row}>{kind !== 'purchases' && <Button title="Add new" onPress={() => edit({ _id: '', stockQuantity: 0, retailPrice: 0, wholesalePrice: 0, lowStockThreshold: 10, minWholesaleQty: 20, isPerishable: true })} />}<Button secondary title="Export visible rows" busy={action.busy} disabled={!rows.length} onPress={() => { void action.run(() => shareCsv('KBR_' + kind, rows)); }} /></View>
    {editing && <Card><Text style={styles.subtitle}>{editing._id ? 'Edit details' : 'Create new'}</Text>{fields.map(field => <View key={field.key}>{field.key === 'category' ? <><Text style={styles.muted}>Category</Text><Choices values={(categories.data || []).map(c => ({ value: c._id, label: c.name }))} value={form.category || ''} onChange={value => setForm({ ...form, category: value })} /></> : field.options || field.boolean ? <><Text style={styles.muted}>{field.label}</Text><Choices values={(field.boolean ? ['true', 'false'] : field.options!).map(value => ({ value, label: field.boolean ? value === 'true' ? 'Yes' : 'No' : readable(value) }))} value={form[field.key] || ''} onChange={value => setForm({ ...form, [field.key]: value })} /></> : <Field label={field.label} value={form[field.key] || ''} onChangeText={value => setForm({ ...form, [field.key]: value })} multiline={field.multiline} keyboardType={field.numeric ? 'numbers-and-punctuation' : 'default'} />}</View>)}<Button title="Save changes" busy={action.busy} onPress={() => { void action.run(save, 'Changes saved.'); }} /><Button secondary title="Discard changes" onPress={() => setEditing(null)} /></Card>}
    {resource.loading && !resource.data && <Loading />}{rows.map(row => <Card key={row._id}><Text style={styles.subtitle}>{String(row.name || row.purchaseCode || 'Record')}</Text>{kind === 'inventory' ? <><Text style={styles.text}>{String(row.stockQuantity)} {String(row.unit)} · {money(row.retailPrice)}</Text><Text style={styles.muted}>Wholesale {money(row.wholesalePrice)}{row.expiryDate ? ' · Expires ' + String(row.expiryDate).slice(0, 10) : ''}</Text></> : kind === 'purchases' ? <><Text style={styles.text}>{String(row.supplierName)} · {money(row.total)}</Text><Text style={styles.muted}>{String(row.purchaseDate).slice(0, 10)} · Paid {money(row.paidPayment)} · Due {money(row.due)}</Text><Badge value={String(row.paymentStatus)} /></> : <Text style={styles.muted}>{String(row.description || row.email || row.type || row.supplierId || '')}</Text>}
      {kind !== 'purchases' && <Button secondary title="Edit" onPress={() => edit(row)} />}{kind !== 'purchases' && user?.role === 'admin' && <Button secondary title={kind === 'inventory' ? 'Deactivate product' : 'Delete'} busy={action.busy} onPress={() => confirm('Remove ' + (row.name || 'this record') + '?', () => { void action.run(async () => { await service.remove(row._id); await resource.refresh(); }); })} />}</Card>)}
    {resource.data && !rows.length && <Empty text="No matching records." />}{resource.data && resource.data.pages > 1 && <View style={styles.row}><Button secondary title="Previous" disabled={page === 1} onPress={() => setPage(page - 1)} /><Text style={styles.muted}>{page} / {resource.data.pages}</Text><Button secondary title="Next" disabled={page >= resource.data.pages} onPress={() => setPage(page + 1)} /></View>}
  </Screen>;
}
export function UsersScreen() {
  const { user: currentUser, refresh: refreshSession } = useAuth(); const action = useAction(); const [role, setRole] = useState(''); const [search, setSearch] = useState(''); const [editing, setEditing] = useState<User | null>(null); const [form, setForm] = useState<Record<string, string>>({});
  const resource = useResource<User[]>(async () => (await userApi.getAll(role || undefined)).data.users, 'users:' + role);
  const pending = useResource<User[]>(async () => (await wholesaleApi.pendingBuyers()).data.buyers, 'buyers');
  const mutate = (fn: () => Promise<unknown>) => { void action.run(async () => { await fn(); await resource.refresh(); await pending.refresh(); await refreshSession(); }, 'Account updated.'); };
  const fields = editing?._id ? ['name', 'phone', 'vehicleNumber', 'businessName', 'businessRegNo'] : ['name', 'email', 'password', 'phone', 'vehicleNumber', 'businessName', 'businessRegNo'];
  function edit(user?: User) { setEditing(user || { _id: '', name: '', email: '', role: 'staff', addresses: [] }); setForm(Object.fromEntries(['name', 'email', 'phone', 'vehicleNumber', 'businessName', 'businessRegNo'].map(key => [key, String((user as unknown as Record<string, unknown>)?.[key] || '')]))); }
  return <Screen title="User management" refreshing={resource.loading && !!resource.data} onRefresh={() => { void resource.refresh(); }}><ErrorBox message={action.error || resource.error || pending.error} /><Field label="Search users" value={search} onChangeText={setSearch} /><Choices values={[{ value: '', label: 'All roles' }, ...roles.map(value => ({ value, label: readable(value) }))]} value={role} onChange={setRole} /><Button title="Create account" onPress={() => edit()} /><Button secondary title="Export users" busy={action.busy} disabled={!resource.data?.length} onPress={() => { void action.run(() => shareCsv('KBR_users', (resource.data || []).map(u => ({ name: u.name, email: u.email, role: u.role, phone: u.phone, active: u.isActive })))); }} />
    {editing && <Card><Text style={styles.subtitle}>{editing._id ? 'Edit user' : 'Create account'}</Text>{fields.map(key => <Field key={key} label={readable(key)} value={form[key] || ''} onChangeText={value => setForm({ ...form, [key]: value })} secureTextEntry={key === 'password'} autoCapitalize={key === 'email' || key === 'password' ? 'none' : 'words'} />)}{!editing._id && <Choices values={roles.filter(r => r !== 'customer').map(value => ({ value, label: readable(value) }))} value={editing.role} onChange={value => setEditing({ ...editing, role: value as User['role'] })} />}<Button title="Save account" busy={action.busy} onPress={() => { void action.run(async () => { if (!form.name?.trim()) throw new Error('Name is required.'); if (editing._id) await userApi.updateDetails(editing._id, form); else { if (!form.email?.trim() || (form.password || '').length < 6) throw new Error('Email and a password of at least 6 characters are required.'); await userApi.createStaff({ ...form, role: editing.role }); } setEditing(null); await resource.refresh(); await refreshSession(); }, 'Account saved.'); }} /><Button secondary title="Discard changes" onPress={() => setEditing(null)} /></Card>}
    {!!pending.data?.length && <Card><Text style={styles.subtitle}>Pending wholesale buyers</Text>{pending.data.map(u => <View key={u._id} style={{ gap: 8 }}><Text style={styles.text}>{u.businessName || u.name}</Text><Button secondary title="Approve buyer" busy={action.busy} onPress={() => mutate(() => wholesaleApi.approveBuyer(u._id))} /></View>)}</Card>}
    {resource.loading && !resource.data && <Loading />}{resource.data?.filter(u => (u.name + u.email + u.businessName).toLowerCase().includes(search.toLowerCase())).map(u => <Card key={u._id}><Badge value={u.role} /><Text style={styles.subtitle}>{u.name}</Text><Text style={styles.muted}>{u.email} · {u.isActive ? 'Active' : 'Inactive'}</Text><Button secondary title="Edit account details" onPress={() => edit(u)} /><Choices values={roles.map(value => ({ value, label: readable(value) }))} value={u.role} onChange={value => confirm('Change ' + u.name + "'s role?", () => mutate(() => userApi.updateRole(u._id, value)))} /><Button secondary title={u.isActive ? 'Deactivate account' : 'Reactivate account'} disabled={u._id === currentUser?._id} busy={action.busy} onPress={() => confirm('Change account access?', () => mutate(() => userApi.deactivate(u._id)))} /></Card>)}
  </Screen>;
}
const reports = {
  summary: { label: 'Overview', load: () => dashboardApi.summary() }, sales: { label: 'Sales trend', load: () => dashboardApi.salesTrend(30) },
  products: { label: 'Top products', load: () => dashboardApi.topProducts() }, customers: { label: 'Customers', load: () => dashboardApi.customerReport() },
  categories: { label: 'Category breakdown', load: () => dashboardApi.categoryBreakdown() }, forecast: { label: 'Stock forecast', load: () => dashboardApi.inventoryForecast() },
};
const intelligence = {
  health: { label: 'Inventory health', load: () => inventoryApi.health() }, freshness: { label: 'Freshness', load: () => inventoryApi.freshness() },
  pricing: { label: 'Dynamic pricing', load: () => inventoryApi.dynamicPricing() }, forecast: { label: 'Demand forecast', load: () => inventoryApi.forecast() },
  allocation: { label: 'Allocation', load: () => inventoryApi.allocation() }, warehouse: { label: 'Warehouse', load: () => inventoryApi.warehouseMap() },
  suppliers: { label: 'Supplier performance', load: () => inventoryApi.supplierPerformance() }, reorder: { label: 'Reorder suggestions', load: () => inventoryApi.reorder() },
};
function DataTree({ value, label }: { value: unknown; label?: string }) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object') return <Text style={styles.text}>{label ? readable(label) + ': ' : ''}{typeof value === 'number' ? value.toLocaleString('en-LK') : readable(value)}</Text>;
  return <View style={{ gap: 10 }}>{label && <Text style={styles.subtitle}>{readable(label)}</Text>}{Array.isArray(value) ? value.length ? value.map((item, i) => <Card key={i}><DataTree value={item} /></Card>) : <Text style={styles.muted}>No records available.</Text> : Object.entries(value).filter(([key]) => !['_id', '__v', 'productId'].includes(key)).map(([key, item]) => <DataTree key={key} value={item} label={key} />)}</View>;
}
export function ReportsScreen({ advanced = false, dashboard = false }: { advanced?: boolean; dashboard?: boolean }) {
  const definitions: Record<string, { label: string; load: () => Promise<{ data: unknown }> }> = advanced ? intelligence : reports;
  const [selected, setSelected] = useState(advanced ? 'health' : 'summary'); const action = useAction();
  const resource = useResource<unknown>(async () => (await definitions[selected].load()).data, selected + advanced);
  return <Screen title={advanced ? 'Inventory intelligence' : dashboard ? 'Business dashboard' : 'Business reports'} refreshing={resource.loading && !!resource.data} onRefresh={() => { void resource.refresh(); }}><Choices values={Object.entries(definitions).map(([value, def]) => ({ value, label: def.label }))} value={selected} onChange={setSelected} /><ErrorBox message={resource.error || action.error} /><Button secondary title="Export report" busy={action.busy} disabled={!resource.data} onPress={() => { void action.run(() => { const data = resource.data as Record<string, unknown>; const array = Object.values(data).find(Array.isArray); return shareCsv('KBR_' + selected, Array.isArray(array) ? array.map(row => typeof row === 'object' && row ? row : { value: row }) : [data]); }); }} />{resource.loading && !resource.data && <Loading />}{resource.data != null && <Card><DataTree value={resource.data} /></Card>}</Screen>;
}
