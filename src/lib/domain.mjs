export const roles = ['customer', 'wholesale', 'driver', 'staff', 'admin'];
export const isManager = (role) => role === 'staff' || role === 'admin';
export function canAccess(role, section) {
  if (['inventory', 'staff-orders', 'staff-wholesale', 'categories'].includes(section)) return isManager(role);
  if (['dashboard', 'reports', 'users', 'suppliers', 'purchases', 'inventory-intelligence'].includes(section)) return role === 'admin';
  if (section === 'deliveries') return role === 'driver';
  if (section === 'orders' || section === 'checkout') return role === 'customer';
  if (section === 'wholesale' || section === 'wholesale-orders') return ['customer', 'wholesale', 'staff', 'admin'].includes(role);
  return ['shop', 'cart', 'wishlist', 'profile', 'notifications', 'stores', 'about', 'contact'].includes(section);
}
export function mergeCart(account, guest) {
  const merged = account.map((item) => ({ ...item }));
  for (const item of guest) {
    const existing = merged.find((entry) => entry.product === item.product);
    if (existing) existing.quantity = Math.min(existing.stockQuantity, existing.quantity + item.quantity);
    else merged.push({ ...item, quantity: Math.min(item.stockQuantity, item.quantity) });
  }
  return merged.filter((item) => item.quantity > 0);
}
export function validQuantity(quantity, stock, minimum = 1) {
  return Number.isFinite(quantity) && quantity >= minimum && quantity <= stock;
}
export function money(value) { return `Rs. ${Number(value || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
export function readable(value) { return String(value ?? '').replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' '); }
