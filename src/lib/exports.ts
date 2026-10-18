import { Platform, Share } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';
import { API_URL, session } from './api';
import type { Order } from './types';
import { money } from './domain.mjs';
const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);
export async function shareCsv(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) throw new Error('There are no rows to export.');
  const keys = [...new Set(rows.flatMap(row => Object.keys(row)))];
  const cell = (value: unknown) => {
    let text = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '');
    if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const csv = '\uFEFF' + [keys.map(cell).join(','), ...rows.map(row => keys.map(key => cell(row[key])).join(','))].join('\r\n');
  if (Platform.OS === 'web') { await Share.share({ message: csv, title: name }); return; }
  if (!(await Sharing.isAvailableAsync())) throw new Error('File sharing is unavailable on this device.');
  const file = new File(Paths.cache, name.replace(/[^a-zA-Z0-9_-]/g, '_') + '-' + Date.now() + '.csv');
  file.create(); await file.write(csv);
  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: name });
}
export async function downloadInvoice(order: Order) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('File sharing is unavailable on this device.');
  const token = session.getToken();
  const response = await expoFetch(API_URL.replace(/\/$/, '') + '/orders/' + order._id + '/invoice', { headers: { Authorization: 'Bearer ' + token } });
  if (!response.ok) throw new Error('Could not download this invoice. Please try again.');
  if (session.getToken() !== token) throw new Error('Your session changed. Please reopen the order.');
  const file = new File(Paths.cache, 'Invoice_' + order.orderNumber.replace(/[^a-zA-Z0-9_-]/g, '_') + '-' + Date.now() + '.pdf');
  file.create(); await file.write(await response.bytes());
  await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Order invoice' });
}
export async function shareOrderSummary(order: Order) {
  const html = '<html><head><meta charset="utf-8"><style>body{font:15px Arial;padding:32px;color:#18382b}h1{color:#176b42}table{width:100%;border-collapse:collapse}td,th{padding:12px;text-align:left;border-bottom:1px solid #ddd}</style></head><body><h1>KBR Fresh Foods</h1><h2>Order ' + escape(order.orderNumber) + '</h2><p>' + escape(order.status) + ' · ' + escape(order.paymentStatus) + '</p><table><tr><th>Product</th><th>Quantity</th><th>Subtotal</th></tr>' + order.items.map(item => '<tr><td>' + escape(item.name) + '</td><td>' + escape(item.quantity) + '</td><td>' + escape(money(item.subtotal)) + '</td></tr>').join('') + '</table><h2>Total ' + escape(money(order.totalAmount ?? order.itemsTotal)) + '</h2></body></html>';
  if (Platform.OS === 'web') { await Print.printAsync({ html }); return; }
  const file = await Print.printToFileAsync({ html });
  if (!(await Sharing.isAvailableAsync())) throw new Error('File sharing is unavailable on this device.');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Order summary' });
}
