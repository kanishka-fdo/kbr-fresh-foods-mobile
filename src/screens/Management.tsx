import React, { useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Avatar from '../components/Avatar';
import { ProductThumb } from '../components/ProductTile';
import { Badge, Button, Card, Choices, Empty, ErrorBox, Field, IconButton, InfoRow, Loading, Pagination, Screen, SearchBar, SectionTitle, Sheet, colors, confirm, font, styles, titled, useAction, useDebounced } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useResource } from '../hooks/useResource';
import { categoryApi, dashboardApi, inventoryApi, productApi, purchaseApi, supplierApi, userApi, wholesaleApi } from '../lib/services';
import { money, roles } from '../lib/domain.mjs';
import { shareCsv } from '../lib/exports';
import type { Category, User } from '../lib/types';
type Entity = Record<string, unknown> & { _id: string; name?: string };
type FieldDef = { key: string; label: string; numeric?: boolean; required?: boolean; options?: string[]; date?: boolean; boolean?: boolean; multiline?: boolean };
const productFields: FieldDef[] = [
  { key: 'name', label: 'Product name', required: true }, { key: 'itemCode', label: 'Item code' }, { key: 'brand', label: 'Brand' }, { key: 'category', label: 'Category', required: true },
  { key: 'description', label: 'Description', multiline: true }, { key: 'images', label: 'Photo URLs (one per line)', multiline: true },
  { key: 'unit', label: 'Unit', options: ['kg', 'g', 'unit', 'bunch', 'crate', 'l', 'ml', 'pack', 'dozen', 'pieces'] },
  ...['stockQuantity', 'minimumQty', 'lowStockThreshold', 'purchasePrice', 'retailPrice', 'wholesalePrice', 'tax', 'minWholesaleQty', 'storageTemp'].map(key => ({ key, label: titled(key), numeric: true, required: ['stockQuantity', 'retailPrice', 'wholesalePrice'].includes(key) })),
  { key: 'supplierName', label: 'Supplier name' }, { key: 'warehouseZone', label: 'Warehouse zone' }, { key: 'batchNumber', label: 'Batch number' },
  ...['harvestDate', 'arrivalDate', 'expiryDate'].map(key => ({ key, label: titled(key) + ' (YYYY-MM-DD)', date: true })),
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
const kindTitles = { inventory: 'product', suppliers: 'supplier', categories: 'category', purchases: 'purchase' };

export function EntityScreen({ kind }: { kind: 'inventory' | 'suppliers' | 'categories' | 'purchases' }) {
  const { user } = useAuth(); const action = useAction(); const remove = useAction(); const exporter = useAction();
  const [search, setSearch] = useState(''); const query = useDebounced(search.trim()); const [filter, setFilter] = useState('all'); const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Entity | null>(null); const [form, setForm] = useState<Record<string, string>>({});
  const fields = kind === 'inventory' ? productFields : kind === 'suppliers' ? supplierFields : categoryFields;
  const service = kind === 'inventory' ? productApi : kind === 'suppliers' ? supplierApi : categoryApi;
  const serverQuery = kind === 'inventory' && filter === 'all' ? query : '';
  const resource = useResource<{ rows: Entity[]; pages: number }>(async () => {
    const res = kind === 'inventory' ? filter === 'low' ? await productApi.lowStock() : filter === 'expiry' ? await productApi.expiring() : await productApi.getAll({ search: serverQuery, page, limit: 50 }) : kind === 'purchases' ? await purchaseApi.getAll() : await service.getAll();
    return { rows: res.data[kind === 'inventory' ? 'products' : kind] || [], pages: res.data.pages || 1 };
  }, [kind, serverQuery, filter, page].join(':'));
  const categories = useResource<Category[]>(async () => kind === 'inventory' ? (await categoryApi.getAll()).data.categories : [], 'entity-categories:' + kind);
  const needle = search.trim().toLowerCase();
  const rows = resource.data?.rows.filter(row => [row.name, row.supplierName, row.purchaseCode, row.supplierId, row.itemCode].join(' ').toLowerCase().includes(needle)) || [];
  function edit(row: Entity) {
    action.clear(); setEditing(row);
    setForm(Object.fromEntries(fields.map(field => [field.key, fieldValue(row, field.key) || (field.boolean ? 'true' : field.options?.[0] || '')])));
  }
  async function save() {
    const body: Record<string, unknown> = {};
    for (const field of fields) {
      const value = (form[field.key] || '').trim();
      if (field.required && !value) throw new Error(field.label + ' is required.');
      if (field.numeric) {
        if (value && !Number.isFinite(Number(value))) throw new Error(field.label + ' must be a number.');
        if (value && field.key !== 'storageTemp' && Number(value) < 0) throw new Error(field.label + ' cannot be negative.');
        if (value) body[field.key] = Number(value);
      } else if (field.boolean) body[field.key] = value === 'true';
      else if (field.date) {
        if (value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)))) throw new Error('Enter ' + field.label.replace(' (YYYY-MM-DD)', '').toLowerCase() + ' as YYYY-MM-DD.');
        if (value) body[field.key] = value;
        else if (editing?._id) body[field.key] = null;
      } else body[field.key] = field.key === 'images' ? value.split('\n').map(url => url.trim()).filter(Boolean) : value;
    }
    if (editing?._id) await service.update(editing._id, body); else await service.create(body);
    setEditing(null); await resource.refresh();
  }
  const set = (key: string, value: string) => setForm(previous => ({ ...previous, [key]: value }));
  const lowStock = (row: Entity) => Number(row.stockQuantity) <= Number(row.lowStockThreshold ?? 0);
  return <Screen refreshing={resource.refreshing} onRefresh={() => { void resource.refresh(); }}
    footer={kind !== 'purchases' ? <Button icon="plus" title={'Add ' + kindTitles[kind]} onPress={() => edit({ _id: '', stockQuantity: 0, retailPrice: 0, wholesalePrice: 0, lowStockThreshold: 10, minWholesaleQty: 20, isPerishable: true })} /> : undefined}>
    <ErrorBox message={resource.error || categories.error || remove.error || exporter.error} />
    <SearchBar value={search} onChangeText={value => { setSearch(value); setPage(1); }} placeholder={'Search ' + (kind === 'inventory' ? 'products' : kind)} />
    {kind === 'inventory' && <Choices scroll values={[{ value: 'all', label: 'All products' }, { value: 'low', label: 'Low stock' }, { value: 'expiry', label: 'Expiring soon' }]} value={filter} onChange={value => { setFilter(value); setPage(1); }} />}
    <View style={styles.between}>
      <Text style={styles.label}>{resource.data ? `${rows.length} ${rows.length === 1 ? kindTitles[kind] : kind === 'inventory' ? 'products' : kind}` : ' '}</Text>
      <View style={[styles.row, { gap: 8 }]}>
        {kind === 'inventory' && <Button small secondary title="Categories" onPress={() => router.push('/categories')} />}
        <Button small secondary title="Export" busy={exporter.busy} disabled={!rows.length} onPress={() => { void exporter.run(() => shareCsv('KBR_' + kind, rows)); }} />
      </View>
    </View>
    {resource.loading && <Loading />}
    {rows.map(row => <Card key={row._id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      {kind === 'inventory' && <ProductThumb item={{ name: String(row.name || ''), images: (row.images as string[]) || [] }} size={52} />}
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.text, { fontFamily: font.semibold }]} numberOfLines={2}>{String(row.name || row.purchaseCode || 'Record')}</Text>
        {kind === 'inventory' ? <>
          <Text style={styles.muted}>{money(row.retailPrice)} · Wholesale {money(row.wholesalePrice)}</Text>
          <View style={styles.row}><Badge value={`${String(row.stockQuantity)} ${String(row.unit)}`} tone={Number(row.stockQuantity) <= 0 ? 'red' : lowStock(row) ? 'amber' : 'green'} />{!!row.expiryDate && <Text style={[styles.muted, { fontSize: 12 }]}>Expires {String(row.expiryDate).slice(0, 10)}</Text>}</View>
        </> : kind === 'purchases' ? <>
          <Text style={styles.muted}>{String(row.supplierName || '')} · {String(row.purchaseDate || '').slice(0, 10)}</Text>
          <Text style={styles.muted}>Total {money(row.total)} · Paid {money(row.paidPayment)} · Due {money(row.due)}</Text>
          {!!row.paymentStatus && <Badge value={String(row.paymentStatus)} />}
        </> : <Text style={styles.muted} numberOfLines={2}>{[row.supplierId, row.type && titled(String(row.type)), row.email || row.mobile, row.description].filter(Boolean).map(String).join(' · ')}</Text>}
      </View>
      {kind !== 'purchases' && <View style={{ gap: 8 }}>
        <IconButton icon="edit" label={'Edit ' + (row.name || 'record')} size={36} background={colors.field} onPress={() => edit(row)} />
        {user?.role === 'admin' && <IconButton icon="trash" label={(kind === 'inventory' ? 'Deactivate ' : 'Delete ') + (row.name || 'record')} size={36} background={colors.redSoft} color={colors.red} disabled={remove.busy} onPress={() => confirm((kind === 'inventory' ? 'Deactivate ' : 'Delete ') + (row.name || 'this record') + '?', () => { void remove.run(async () => { await service.remove(row._id); await resource.refresh(); }); }, { confirmText: kind === 'inventory' ? 'Deactivate' : 'Delete' })} />}
      </View>}
    </Card>)}
    {resource.data && !rows.length && <Empty icon={kind === 'inventory' ? 'box' : 'clipboard'} title="Nothing found" text={search ? 'No records match your search.' : 'No records yet.'} />}
    {resource.data && kind === 'inventory' && filter === 'all' && <Pagination page={page} pages={resource.data.pages} onChange={setPage} />}
    <Sheet visible={!!editing} title={editing?._id ? 'Edit ' + kindTitles[kind] : 'New ' + kindTitles[kind]} onClose={() => setEditing(null)} footer={<><ErrorBox message={action.error} /><Button title="Save" busy={action.busy} onPress={() => { void action.run(save, 'Changes saved.'); }} /></>}>
      {fields.map(field => <View key={field.key}>
        {field.key === 'category' ? <View style={{ gap: 6 }}><Text style={styles.label}>Category</Text>{categories.loading ? <Loading /> : <Choices values={(categories.data || []).map(c => ({ value: c._id, label: c.name }))} value={form.category || ''} onChange={value => set('category', value)} />}</View>
          : field.options || field.boolean ? <View style={{ gap: 6 }}><Text style={styles.label}>{field.label}</Text><Choices values={(field.boolean ? ['true', 'false'] : field.options!).map(value => ({ value, label: field.boolean ? value === 'true' ? 'Yes' : 'No' : titled(value) }))} value={form[field.key] || ''} onChange={value => set(field.key, value)} /></View>
          : <Field label={field.label + (field.required ? ' *' : '')} value={form[field.key] || ''} onChangeText={value => set(field.key, value)} multiline={field.multiline} autoCapitalize={field.key === 'images' || field.key === 'email' ? 'none' : 'sentences'} keyboardType={field.numeric ? 'decimal-pad' : field.date ? 'numbers-and-punctuation' : field.key === 'email' ? 'email-address' : 'default'} />}
      </View>)}
    </Sheet>
  </Screen>;
}

export function UsersScreen() {
  const { user: currentUser, refresh: refreshSession } = useAuth(); const action = useAction(); const list = useAction(); const exporter = useAction();
  const [role, setRole] = useState(''); const [search, setSearch] = useState(''); const [editing, setEditing] = useState<User | null>(null); const [form, setForm] = useState<Record<string, string>>({});
  const resource = useResource<User[]>(async () => (await userApi.getAll(role || undefined)).data.users, 'users:' + role);
  const pending = useResource<User[]>(async () => (await wholesaleApi.pendingBuyers()).data.buyers, 'buyers');
  const reload = async () => { await resource.refresh(); await pending.refresh(); await refreshSession(); };
  const creating = !!editing && !editing._id;
  const fields = creating ? ['name', 'email', 'password', 'phone', 'vehicleNumber', 'businessName', 'businessRegNo'] : ['name', 'phone', 'vehicleNumber', 'businessName', 'businessRegNo'];
  const live = editing?._id ? resource.data?.find(u => u._id === editing._id) || editing : editing;
  function edit(user?: User) { action.clear(); setEditing(user || { _id: '', name: '', email: '', role: 'staff', addresses: [] }); setForm(Object.fromEntries(['name', 'email', 'phone', 'vehicleNumber', 'businessName', 'businessRegNo'].map(key => [key, String((user as unknown as Record<string, unknown>)?.[key] || '')]))); }
  const needle = search.trim().toLowerCase();
  const visible = resource.data?.filter(u => [u.name, u.email, u.businessName].join(' ').toLowerCase().includes(needle)) || [];
  return <Screen refreshing={resource.refreshing} onRefresh={() => { void reload(); }} footer={<Button icon="plus" title="Create staff account" onPress={() => edit()} />}>
    <ErrorBox message={list.error || resource.error || pending.error || exporter.error} />
    {!!pending.data?.length && <Card style={{ borderColor: '#f1d9a8', backgroundColor: '#fffaf0' }}>
      <Text style={styles.subtitle}>Wholesale buyers awaiting approval</Text>
      {pending.data.map(u => <View key={u._id} style={[styles.between]}><View style={{ flex: 1 }}><Text style={[styles.text, { fontFamily: font.semibold }]}>{u.businessName || u.name}</Text><Text style={styles.muted}>{u.email}</Text></View><Button small title="Approve" busy={list.busy} onPress={() => confirm('Approve ' + (u.businessName || u.name) + '?', () => { void list.run(async () => { await wholesaleApi.approveBuyer(u._id); await reload(); }, 'Buyer approved.'); }, { confirmText: 'Approve', destructive: false })} /></View>)}
    </Card>}
    <SearchBar value={search} onChangeText={setSearch} placeholder="Search name, email or business" />
    <Choices scroll values={[{ value: '', label: 'All roles' }, ...roles.map(value => ({ value, label: titled(value) }))]} value={role} onChange={setRole} />
    <View style={styles.between}><Text style={styles.label}>{resource.data ? `${visible.length} account${visible.length === 1 ? '' : 's'}` : ' '}</Text><Button small secondary title="Export" busy={exporter.busy} disabled={!visible.length} onPress={() => { void exporter.run(() => shareCsv('KBR_users', visible.map(u => ({ name: u.name, email: u.email, role: u.role, phone: u.phone, active: u.isActive })))); }} /></View>
    {resource.loading && <Loading />}
    {visible.map(u => <Card key={u._id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Avatar name={u.name} uri={u.avatar} size={44} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.text, { fontFamily: font.semibold }]} numberOfLines={1}>{u.name}{u._id === currentUser?._id ? ' (you)' : ''}</Text>
        <Text style={styles.muted} numberOfLines={1}>{u.email}</Text>
        <View style={styles.row}><Badge value={u.role} />{u.isActive === false && <Badge value="Inactive" />}</View>
      </View>
      <IconButton icon="edit" label={'Manage ' + u.name} size={36} background={colors.field} onPress={() => edit(u)} />
    </Card>)}
    {resource.data && !visible.length && <Empty icon="users" title="No accounts found" text="Try a different search or role." />}
    <Sheet visible={!!editing} title={creating ? 'Create account' : 'Manage ' + (live?.name || 'account')} onClose={() => setEditing(null)} footer={<><ErrorBox message={action.error} />
      <Button title="Save details" busy={action.busy} onPress={() => { void action.run(async () => {
        if (!form.name?.trim()) throw new Error('Name is required.');
        if (editing?._id) await userApi.updateDetails(editing._id, form);
        else { if (!form.email?.trim() || (form.password || '').length < 6) throw new Error('Email and a password of at least 6 characters are required.'); await userApi.createStaff({ ...form, email: form.email.trim(), role: editing!.role }); }
        setEditing(null); await reload();
      }, 'Account saved.'); }} /></>}>
      {fields.map(key => <Field key={key} label={key === 'businessRegNo' ? 'Business registration number' : titled(key)} value={form[key] || ''} onChangeText={value => setForm(previous => ({ ...previous, [key]: value }))} secureTextEntry={key === 'password'} autoCapitalize={key === 'email' || key === 'password' ? 'none' : key === 'vehicleNumber' || key === 'businessRegNo' ? 'characters' : 'words'} keyboardType={key === 'email' ? 'email-address' : key === 'phone' ? 'phone-pad' : 'default'} />)}
      {creating ? <View style={{ gap: 6 }}><Text style={styles.label}>Role</Text><Choices values={roles.filter(r => r !== 'customer').map(value => ({ value, label: titled(value) }))} value={editing!.role} onChange={value => setEditing({ ...editing!, role: value as User['role'] })} /></View> : live && <>
        <SectionTitle title="Role" />
        <Choices values={roles.map(value => ({ value, label: titled(value) }))} value={live.role} onChange={value => { if (value !== live.role) confirm(`Make ${live.name} ${titled(value).toLowerCase()}?`, () => { void action.run(async () => { await userApi.updateRole(live._id, value); await reload(); }, 'Role updated.'); }, { confirmText: 'Change role', destructive: false }); }} />
        <SectionTitle title="Account access" />
        <InfoRow label="Status" value={<Badge value={live.isActive === false ? 'Inactive' : 'Active'} />} />
        <Button outline danger={live.isActive !== false} title={live.isActive === false ? 'Activate account' : 'Deactivate account'} disabled={live._id === currentUser?._id} busy={action.busy} onPress={() => confirm(live.isActive === false ? 'Activate this account?' : 'Deactivate this account?', () => { void action.run(async () => { await userApi.deactivate(live._id); await reload(); }, 'Account access updated.'); }, { confirmText: live.isActive === false ? 'Activate' : 'Deactivate', destructive: live.isActive !== false })} />
        {live._id === currentUser?._id && <Text style={styles.muted}>You can&apos;t deactivate your own account.</Text>}
      </>}
    </Sheet>
  </Screen>;
}

const reports = {
  summary: { label: 'Overview', load: () => dashboardApi.summary() }, sales: { label: 'Sales trend', load: () => dashboardApi.salesTrend(30) },
  products: { label: 'Top products', load: () => dashboardApi.topProducts() }, customers: { label: 'Customers', load: () => dashboardApi.customerReport() },
  categories: { label: 'Categories', load: () => dashboardApi.categoryBreakdown() }, forecast: { label: 'Stock forecast', load: () => dashboardApi.inventoryForecast() },
};
const intelligence = {
  health: { label: 'Health', load: () => inventoryApi.health() }, freshness: { label: 'Freshness', load: () => inventoryApi.freshness() },
  pricing: { label: 'Dynamic pricing', load: () => inventoryApi.dynamicPricing() }, forecast: { label: 'Demand forecast', load: () => inventoryApi.forecast() },
  allocation: { label: 'Allocation', load: () => inventoryApi.allocation() }, warehouse: { label: 'Warehouse', load: () => inventoryApi.warehouseMap() },
  suppliers: { label: 'Suppliers', load: () => inventoryApi.supplierPerformance() }, reorder: { label: 'Reorder', load: () => inventoryApi.reorder() },
};
const moneyKey = /(revenue|amount|price|sales|spent|spend|cost|due|paid|value)/i; const countKey = /(count|qty|quantity|orders|units|stock|days|score|percent|rate|%)/i;
function formatValue(key: string, value: unknown) {
  if (typeof value === 'number') return moneyKey.test(key) && !countKey.test(key) ? money(value) : value.toLocaleString('en-LK', { maximumFractionDigits: 2 });
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return new Date(value).toLocaleDateString();
  return String(value);
}
const hidden = ['_id', '__v', 'productId', 'id', 'createdAt', 'updatedAt'];
function DataTree({ value, label, depth = 0 }: { value: unknown; label?: string; depth?: number }) {
  if (value === null || value === undefined || (label && hidden.includes(label))) return null;
  if (typeof value !== 'object') return <InfoRow label={label ? titled(label) : ''} value={formatValue(label || '', value)} />;
  if (Array.isArray(value)) {
    const body = !value.length ? <Text style={styles.muted}>No records available.</Text>
      : value.every(item => typeof item !== 'object' || item === null) ? <Text style={styles.text}>{value.map(String).join(', ')}</Text>
      : value.map((item, i) => <View key={i} style={{ gap: 6, padding: 12, borderRadius: 12, backgroundColor: colors.field }}><DataTree value={item} depth={depth + 1} /></View>);
    return <View style={{ gap: 8 }}>{!!label && <Text style={[styles.subtitle, { marginTop: 4 }]}>{titled(label)}{value.length ? ` (${value.length})` : ''}</Text>}{body}</View>;
  }
  const entries = Object.entries(value).filter(([key]) => !hidden.includes(key));
  const named = entries.find(([key]) => key === 'name' || key === 'productName' || key === 'title');
  return <View style={{ gap: 6 }}>
    {!!label && <Text style={[styles.subtitle, { marginTop: 4 }]}>{titled(label)}</Text>}
    {named && typeof named[1] === 'string' && <Text style={[styles.text, { fontFamily: font.bold }]}>{named[1]}</Text>}
    {entries.filter(entry => entry !== named).map(([key, item]) => <DataTree key={key} value={item} label={key} depth={depth + 1} />)}
  </View>;
}
export function ReportsScreen({ advanced = false, dashboard = false }: { advanced?: boolean; dashboard?: boolean }) {
  const definitions: Record<string, { label: string; load: () => Promise<{ data: unknown }> }> = advanced ? intelligence : reports;
  const [selected, setSelected] = useState(advanced ? 'health' : 'summary'); const action = useAction();
  const resource = useResource<unknown>(async () => (await definitions[selected].load()).data, selected + advanced);
  return <Screen refreshing={resource.refreshing} onRefresh={() => { void resource.refresh(); }}>
    {dashboard && <Text style={styles.muted}>Live figures from the KBR Fresh Foods database.</Text>}
    <Choices scroll values={Object.entries(definitions).map(([value, def]) => ({ value, label: def.label }))} value={selected} onChange={setSelected} />
    <ErrorBox message={resource.error || action.error} />
    <View style={styles.between}><Text style={styles.subtitle}>{definitions[selected].label}</Text>
      <Button small secondary title="Export" busy={action.busy} disabled={!resource.data} onPress={() => { void action.run(() => { const data = resource.data as Record<string, unknown>; const array = Array.isArray(data) ? data : Object.values(data).find(Array.isArray); return shareCsv('KBR_' + selected, Array.isArray(array) ? array.map(row => typeof row === 'object' && row ? row : { value: row }) : [data]); }); }} />
    </View>
    {resource.loading && <Loading />}
    {resource.data != null && <Card><DataTree value={resource.data} /></Card>}
  </Screen>;
}
