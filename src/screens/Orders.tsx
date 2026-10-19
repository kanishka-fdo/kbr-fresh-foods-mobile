import React, { useRef, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import Icon from '../components/Icon';
import { Badge, Button, Card, Choices, Empty, ErrorBox, Field, InfoRow, Loading, Screen, colors, confirm, font, styles, useAction, titled } from '../components/ui';
import DeliveryMap from '../components/DeliveryMap';
import { useAuth } from '../context/AuthContext';
import { useResource } from '../hooks/useResource';
import { orderApi, wholesaleApi } from '../lib/services';
import { money, readable, isManager } from '../lib/domain.mjs';
import { downloadInvoice, shareOrderSummary } from '../lib/exports';
import type { Order, User } from '../lib/types';
const statuses = ['pending', 'processing', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];
const wholesaleStatuses = ['quote_requested', 'quoted', 'approved', 'fulfilled', 'cancelled', 'rejected'];
const steps = ['pending', 'processing', 'packed', 'out_for_delivery', 'delivered'];
const stepLabels: Record<string, string> = { pending: 'Order placed', processing: 'Processing', packed: 'Packed', out_for_delivery: 'Out for delivery', delivered: 'Delivered' };
const nextStatus: Record<string, string> = { pending: 'processing', processing: 'packed', packed: 'out_for_delivery' };
const driverActions: Record<string, string> = { pending: 'Mark as processing', processing: 'Mark as packed', packed: 'Start delivery' };
const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';

function OrderCard({ order, bulk }: { order: Order; bulk: boolean }) {
  const person = order.customer || order.buyer;
  return <Pressable accessibilityRole="button" accessibilityLabel={'View order ' + order.orderNumber} onPress={() => router.push(bulk ? '/wholesale/orders/' + order._id : '/orders/' + order._id)} style={({ pressed }) => [styles.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }, pressed && { backgroundColor: colors.field }]}>
    <View style={{ flex: 1, gap: 6 }}>
      <View style={styles.between}><Text style={styles.subtitle} numberOfLines={1}>{order.orderNumber}</Text><Badge value={order.status} /></View>
      <Text style={styles.muted} numberOfLines={1}>{formatDate(order.createdAt)} · {order.items.length} product{order.items.length === 1 ? '' : 's'}{person ? ' · ' + (person.businessName || person.name) : ''}</Text>
      <Text style={styles.price}>{money(order.totalAmount ?? order.itemsTotal)}</Text>
    </View>
    <Icon name="chevron" size={18} color={colors.faint} />
  </Pressable>;
}
export function OrderListScreen({ mode = 'customer' }: { mode?: 'customer' | 'staff' | 'driver' | 'wholesale' | 'staff-wholesale' }) {
  const bulk = mode.includes('wholesale'); const [filter, setFilter] = useState('');
  const serverFilter = mode === 'staff' || mode === 'staff-wholesale' ? filter : '';
  const resource = useResource<Order[]>(async () => {
    const response = mode === 'customer' ? await orderApi.myOrders() : mode === 'driver' ? await orderApi.myDeliveries() : mode === 'staff' ? await orderApi.getAll(serverFilter || undefined) : mode === 'staff-wholesale' ? await wholesaleApi.getAll(serverFilter || undefined) : await wholesaleApi.myOrders();
    return response.data.orders;
  }, mode + ':' + serverFilter, 15000);
  const visible = resource.data?.filter(order => !filter || order.status === filter) || [];
  return <Screen onRefresh={() => { void resource.refresh(); }} refreshing={resource.refreshing}>
    <Choices scroll values={[{ value: '', label: 'All' }, ...(bulk ? wholesaleStatuses : mode === 'driver' ? steps.slice(0, 5) : statuses).map(value => ({ value, label: titled(value) }))]} value={filter} onChange={setFilter} />
    <ErrorBox message={resource.error} />{resource.loading && <Loading />}
    {visible.map(order => <OrderCard key={order._id} order={order} bulk={bulk} />)}
    {resource.data && !visible.length && <Empty icon={mode === 'driver' ? 'truck' : 'package'} title={filter ? 'Nothing here' : mode === 'driver' ? 'No deliveries assigned' : 'No orders yet'} text={filter ? 'No orders have this status.' : mode === 'customer' ? 'When you place an order it will appear here.' : 'New orders will appear here automatically.'}
      action={mode === 'customer' && !filter ? <Button title="Start shopping" onPress={() => router.push('/shop')} /> : undefined} />}
  </Screen>;
}

function Progress({ status }: { status: string }) {
  if (status === 'cancelled') return null;
  const current = steps.indexOf(status);
  return <Card>
    <Text style={styles.subtitle}>Delivery progress</Text>
    {steps.map((step, index) => {
      const done = index <= current; const last = index === steps.length - 1;
      return <View key={step} style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ alignItems: 'center', width: 24 }}>
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: done ? colors.green : colors.white, borderWidth: 2, borderColor: done ? colors.green : colors.border, alignItems: 'center', justifyContent: 'center' }}>{done && <Icon name="check" size={14} color={colors.white} strokeWidth={3} />}</View>
          {!last && <View style={{ width: 2, flex: 1, minHeight: 14, backgroundColor: index < current ? colors.green : colors.border }} />}
        </View>
        <Text style={[styles.text, { paddingBottom: last ? 0 : 14, fontFamily: index === current ? font.bold : font.regular, color: done ? colors.ink : colors.faint }]}>{stepLabels[step]}</Text>
      </View>;
    })}
  </Card>;
}

export function OrderDetailScreen({ wholesale = false }: { wholesale?: boolean }) {
  const { id } = useLocalSearchParams<{ id: string }>(); const { user } = useAuth(); const action = useAction(); const share = useAction();
  const manager = isManager(user?.role); const [status, setStatus] = useState(''); const [note, setNote] = useState('');
  const [payment, setPayment] = useState(''); const [reference, setReference] = useState(''); const [amount, setAmount] = useState(''); const [method, setMethod] = useState('bank_transfer'); const [driver, setDriver] = useState('');
  const resource = useResource<Order>(async () => (await (wholesale ? wholesaleApi.getById(id) : orderApi.getById(id))).data.order, id + wholesale, 15000);
  const drivers = useResource<User[]>(async () => manager && !wholesale ? (await orderApi.availableDrivers()).data.drivers : [], 'drivers:' + manager + wholesale);
  const order = resource.data;
  const mutate = (fn: () => Promise<unknown>, success = 'Order updated.', after?: () => void) => { void action.run(async () => { await fn(); after?.(); await resource.refresh(); }, success); };
  if (resource.loading) return <Screen><Loading /></Screen>;
  if (!order) return <Screen><ErrorBox message={resource.error || 'This order could not be found.'} /><Button title="Try again" onPress={() => { void resource.refresh(); }} /></Screen>;
  const total = order.totalAmount ?? order.itemsTotal;
  const address = order.deliveryAddress;
  const located = !!address && Number.isFinite(address.lat) && Number.isFinite(address.lng);
  const canCancel = wholesale ? ['quoted', 'quote_requested'].includes(order.status) && (order.buyer?._id === user?._id || manager) : user?.role === 'customer' && ['pending', 'processing'].includes(order.status);
  const due = Math.max(0, order.itemsTotal - (order.amountPaid || 0));
  return <Screen onRefresh={() => { void resource.refresh(); }} refreshing={resource.refreshing}>
    <ErrorBox message={resource.error || action.error} />
    <View style={{ gap: 6 }}>
      <View style={styles.between}><Text accessibilityRole="header" style={[styles.title, { flex: 1 }]} numberOfLines={1}>{order.orderNumber}</Text><Badge value={order.status} /></View>
      <Text style={styles.muted}>Placed {formatDateTime(order.createdAt)}{(order.customer || order.buyer) && manager ? ' · ' + ((order.customer || order.buyer)!.businessName || (order.customer || order.buyer)!.name) : ''}</Text>
    </View>
    {!wholesale && <Progress status={order.status} />}
    {!wholesale && !!order.qrCodeToken && user?.role === 'customer' && !['cancelled', 'delivered'].includes(order.status) && <Card style={{ alignItems: 'center' }}>
      <Text style={styles.subtitle}>Delivery confirmation</Text>
      <Text style={[styles.muted, { textAlign: 'center' }]}>Show this code to your driver when you receive your order.</Text>
      <View style={{ padding: 14, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}><QRCode value={order.qrCodeToken} size={180} /></View>
    </Card>}
    {!wholesale && user?.role === 'driver' && !['delivered', 'cancelled'].includes(order.status) && <Button icon={order.status === 'out_for_delivery' ? 'scan' : 'truck'} title={order.status === 'out_for_delivery' ? 'Scan QR to confirm delivery' : driverActions[order.status] || 'Update status'} busy={action.busy}
      onPress={() => order.status === 'out_for_delivery' ? router.push('/scan/' + id) : nextStatus[order.status] && mutate(() => orderApi.updateStatus(id, nextStatus[order.status], undefined))} />}
    <Card>
      <Text style={styles.subtitle}>Items</Text>
      {order.items.map((item, i) => <View key={i} style={[styles.between, { alignItems: 'flex-start' }]}><View style={{ flex: 1 }}><Text style={styles.text}>{item.name}</Text><Text style={styles.muted}>{item.quantity} × {money(item.unitPrice)}</Text></View><Text style={[styles.text, { fontFamily: font.semibold }]}>{money(item.subtotal)}</Text></View>)}
      <View style={styles.divider} />
      {order.totalAmount !== undefined && order.totalAmount !== order.itemsTotal && <InfoRow label="Items" value={money(order.itemsTotal)} />}
      {!!order.deliveryFee && <InfoRow label="Delivery" value={money(order.deliveryFee)} />}
      <InfoRow strong label="Total" value={money(total)} />
      <InfoRow label="Payment" value={<Badge value={order.paymentStatus || 'pending'} />} />
      {!!order.paymentMethod && <InfoRow label="Method" value={titled(order.paymentMethod)} />}
      {!!order.requestedDeliveryDate && <InfoRow label="Requested delivery" value={formatDate(order.requestedDeliveryDate)} />}
      {!!order.notes && <Text style={[styles.muted, { fontStyle: 'italic' }]}>“{order.notes}”</Text>}
      <ErrorBox message={share.error} />
      <Button secondary icon="clipboard" title={wholesale ? 'Share order summary' : 'Download invoice'} busy={share.busy} onPress={() => { void share.run(() => wholesale ? shareOrderSummary(order) : downloadInvoice(order)); }} />
    </Card>
    {!!address && <Card>
      <Text style={styles.subtitle}>Delivery address</Text>
      <Text style={styles.text}>{[address.line1, address.line2, address.city].filter(Boolean).join(', ')}</Text>
      {located && <DeliveryMap key={address.lat + ':' + address.lng} lat={address.lat!} lng={address.lng!} />}
      <Button secondary icon="pin" title="Open directions" onPress={() => { void action.run(() => Linking.openURL('https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(located ? address.lat + ',' + address.lng : address.line1 + ', ' + address.city))); }} />
    </Card>}
    {!!order.driver && <Card>
      <Text style={styles.subtitle}>{user?.role === 'customer' ? 'Your driver' : 'Assigned driver'}</Text>
      <InfoRow label="Name" value={order.driver.name} />
      {!!order.driver.vehicleNumber && <InfoRow label="Vehicle" value={order.driver.vehicleNumber} />}
      {!!order.driver.phone && user?._id !== order.driver._id && <Button secondary icon="phone" title={'Call ' + order.driver.name.split(' ')[0]} onPress={() => { void action.run(() => Linking.openURL('tel:' + order.driver!.phone)); }} />}
    </Card>}
    {manager && !!order.customer?.phone && !wholesale && <Button secondary icon="phone" title={'Call customer · ' + order.customer.phone} onPress={() => { void action.run(() => Linking.openURL('tel:' + order.customer!.phone)); }} />}
    {!!order.statusHistory?.length && <Card>
      <Text style={styles.subtitle}>Timeline</Text>
      {[...order.statusHistory].reverse().map((entry, i) => <View key={i} style={{ gap: 2, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: i === 0 ? colors.green : colors.border }}>
        <Text style={[styles.text, { fontFamily: font.semibold }]}>{stepLabels[entry.status] || titled(entry.status)}</Text>
        <Text style={styles.muted}>{formatDateTime(entry.changedAt)}</Text>
        {!!entry.note && <Text style={styles.muted}>{entry.note}</Text>}
      </View>)}
    </Card>}
    {manager && (wholesale ? <>
      <Card>
        <Text style={styles.subtitle}>Manage quote</Text>
        <Field label="Reason / note" value={note} onChangeText={setNote} multiline />
        {['quoted', 'quote_requested'].includes(order.status) && <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button style={{ flex: 1 }} title="Approve" busy={action.busy} onPress={() => confirm('Approve this quote?', () => mutate(() => wholesaleApi.approve(id), 'Quote approved.'), { message: 'Stock will be deducted for these items.', confirmText: 'Approve', destructive: false })} />
          <Button style={{ flex: 1 }} danger title="Reject" busy={action.busy} onPress={() => confirm('Reject this quote?', () => mutate(() => wholesaleApi.reject(id, note), 'Quote rejected.'), { confirmText: 'Reject' })} />
        </View>}
        {order.status === 'approved' && <Button title="Mark fulfilled" busy={action.busy} onPress={() => confirm('Mark as fulfilled?', () => mutate(() => wholesaleApi.fulfil(id), 'Order fulfilled.'), { confirmText: 'Fulfil', destructive: false })} />}
      </Card>
      <Card>
        <Text style={styles.subtitle}>Record payment</Text>
        <InfoRow label="Paid" value={money(order.amountPaid)} /><InfoRow strong label="Balance due" value={money(due)} />
        <Field label="Amount (Rs.)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
        <Field label="Reference" value={reference} onChangeText={setReference} />
        <Choices values={['bank_transfer', 'cash', 'card'].map(value => ({ value, label: titled(value) }))} value={method} onChange={setMethod} />
        <Button title="Record payment" busy={action.busy} disabled={!(Number(amount) > 0)} onPress={() => confirm(`Record ${money(Number(amount))}?`, () => mutate(() => wholesaleApi.recordTransaction(id, { amount: Number(amount), reference: reference.trim(), method, note }), 'Payment recorded.', () => { setAmount(''); setReference(''); }), { confirmText: 'Record', destructive: false })} />
        {order.transactionHistory?.map((entry, i) => <InfoRow key={i} label={formatDate(entry.recordedAt) + (entry.reference ? ' · ' + entry.reference : '')} value={money(entry.amount)} />)}
      </Card>
    </> : <>
      <Card>
        <Text style={styles.subtitle}>Update status</Text>
        <Choices values={statuses.map(value => ({ value, label: titled(value) }))} value={status || order.status} onChange={setStatus} />
        <Field label="Status note (optional)" value={note} onChangeText={setNote} />
        <Button title="Save status" busy={action.busy} disabled={!status || status === order.status} onPress={() => confirm(`Change status to ${readable(status)}?`, () => mutate(() => orderApi.updateStatus(id, status, note), 'Status updated.', () => { setStatus(''); setNote(''); }), { confirmText: 'Update', destructive: status === 'cancelled' })} />
      </Card>
      <Card>
        <Text style={styles.subtitle}>Assign driver</Text>
        <ErrorBox message={drivers.error} />
        {drivers.loading ? <Loading /> : drivers.data?.length ? <Choices values={drivers.data.map(d => ({ value: d._id, label: d.name }))} value={driver || order.driver?._id || ''} onChange={setDriver} /> : <Text style={styles.muted}>No drivers are available right now.</Text>}
        <Button title="Assign selected driver" disabled={!driver || driver === order.driver?._id} busy={action.busy} onPress={() => mutate(() => orderApi.assignDriver(id, driver), 'Driver assigned.', () => setDriver(''))} />
      </Card>
      <Card>
        <Text style={styles.subtitle}>Payment status</Text>
        <Choices values={['pending', 'paid', 'failed', 'refunded'].map(value => ({ value, label: titled(value) }))} value={payment || order.paymentStatus || 'pending'} onChange={setPayment} />
        <Field label="Payment reference (optional)" value={reference} onChangeText={setReference} />
        <Button title="Save payment status" busy={action.busy} disabled={!payment || payment === order.paymentStatus} onPress={() => confirm(`Mark payment as ${readable(payment)}?`, () => mutate(() => orderApi.updatePaymentStatus(id, payment, reference), 'Payment status updated.', () => setPayment('')), { confirmText: 'Update', destructive: false })} />
      </Card>
    </>)}
    {canCancel && <Button outline danger title="Cancel order" busy={action.busy} onPress={() => confirm('Cancel this order?', () => mutate(() => wholesale ? wholesaleApi.cancelOrder(id) : orderApi.cancelOrder(id), 'Order cancelled.'), { message: 'This cannot be undone.', confirmText: 'Cancel order' })} />}
  </Screen>;
}

export function ScannerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { user } = useAuth(); const [permission, requestPermission] = useCameraPermissions(); const action = useAction(); const gate = useRef(false); const [paused, setPaused] = useState(false);
  if (!user || !['driver', 'admin'].includes(user.role)) return <Screen contentStyle={{ flexGrow: 1, justifyContent: 'center' }}><Empty icon="info" title="Access restricted" text="Sign in as a driver to confirm deliveries." /></Screen>;
  return <Screen subtitle="Hand over the delivery, then scan the QR code shown on the customer's order screen.">
    <ErrorBox message={action.error} />
    {!permission ? <Loading /> : !permission.granted ? <Empty icon="scan" title="Camera access needed" text="Allow camera access to scan the customer's confirmation code."
      action={<Button title={permission.canAskAgain ? 'Allow camera' : 'Open settings'} onPress={() => { void action.run(() => permission.canAskAgain ? requestPermission() : Linking.openSettings()); }} />} />
      : <View style={{ aspectRatio: 1, width: '100%', overflow: 'hidden', borderRadius: 20, backgroundColor: '#000' }}>
        <CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={paused ? undefined : ({ data }) => {
          if (gate.current) return;
          gate.current = true; setPaused(true);
          void action.run(async () => { await orderApi.verifyQrCode(id, data); router.replace('/orders/' + id); }, 'Delivery confirmed.');
        }} />
        <View pointerEvents="none" style={{ position: 'absolute', top: '18%', left: '18%', right: '18%', bottom: '18%', borderWidth: 3, borderColor: paused ? colors.gold : '#ffffffd0', borderRadius: 22 }} />
        {paused && <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 16, alignItems: 'center' }}><Text style={{ color: colors.white, fontFamily: font.semibold, backgroundColor: '#000000a0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, overflow: 'hidden' }}>{action.busy ? 'Verifying…' : 'Scan paused'}</Text></View>}
      </View>}
    {paused && !action.busy && <Button secondary icon="scan" title="Scan again" onPress={() => { gate.current = false; setPaused(false); action.clear(); }} />}
  </Screen>;
}
